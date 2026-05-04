import { supabase } from '../../lib/supabase';

export const authApi = {
  /**
   * Get the current active session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get current user details including custom fields from 'users' table
   */
  async getCurrentUser() {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return null;

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return {
      ...authData.user,
      ...userProfile,
      isActive: userProfile.is_active,
    };
  },

  /**
   * Login with email OR username + password.
   *
   * Logic:
   *   1. Nếu identifier có dấu '@' → đây là email, dùng trực tiếp.
   *   2. Nếu không → đây là username, tra bảng public.users để lấy email thật,
   *      rồi mới gọi Supabase Auth.
   */
  async login(identifier, password) {
    const trimmed = identifier.trim().toLowerCase();
    const isEmail = trimmed.includes('@');
    let loginEmail = trimmed;

    if (!isEmail) {
      // Tra email từ username trong bảng public.users
      const { data: profileData, error: lookupError } = await supabase
        .from('users')
        .select('email, is_active')
        .eq('username', trimmed)
        .maybeSingle();

      if (lookupError || !profileData) {
        return { ok: false, error: 'Tên đăng nhập không tồn tại.' };
      }

      if (!profileData.is_active) {
        return { ok: false, error: 'Tài khoản này đã bị vô hiệu hóa. Liên hệ giáo viên để được hỗ trợ.' };
      }

      loginEmail = profileData.email;
    }

    // Gọi Supabase Auth với email đã xác định
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authError) {
      return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    }

    // Lấy thêm thông tin profile đầy đủ
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return { ok: false, error: 'Không thể lấy thông tin hồ sơ người dùng.' };
    }

    if (!userProfile.is_active) {
      await supabase.auth.signOut();
      return { ok: false, error: 'Tài khoản này đã bị vô hiệu hóa. Liên hệ giáo viên để được hỗ trợ.' };
    }

    return {
      ok: true,
      user: {
        ...authData.user,
        ...userProfile,
        isActive: userProfile.is_active,
      },
    };
  },

  /**
   * Logout the current user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
