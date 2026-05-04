// supabase/functions/manage-student/index.ts
// Edge Function: xử lý create / delete / update_password cho học sinh
// Dùng service_role để bypass RLS và gọi auth.admin API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Xác thực người gọi là admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Thiếu Authorization header.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client thường để kiểm tra quyền caller
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !callerUser) {
      return new Response(JSON.stringify({ error: 'Không xác thực được người dùng.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kiểm tra caller có phải admin không
    const { data: profile } = await callerClient
      .from('users')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Chỉ admin mới có quyền thực hiện thao tác này.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Admin client với service_role (toàn quyền)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;

    // ── CREATE ───────────────────────────────────────────────────────────
    if (action === 'create') {
      const { email, password, username, name, phone, class_id, role = 'student' } = body;

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: 'Thiếu email, password hoặc name.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Tạo auth user
      const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,      // Bỏ qua xác nhận email
        user_metadata: { username, name, role },
      });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Trigger handle_new_user() tự tạo profile, nhưng ta cần cập nhật thêm
      await adminClient
        .from('users')
        .update({ username, name, phone: phone ?? null, class_id: class_id ?? null, role })
        .eq('id', authData.user!.id);

      // Lấy profile đã hoàn chỉnh
      const { data: userProfile } = await adminClient
        .from('users')
        .select('*, classes ( course_id )')
        .eq('id', authData.user!.id)
        .single();

      return new Response(JSON.stringify({ user: userProfile }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE ───────────────────────────────────────────────────────────
    if (action === 'delete') {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Thiếu userId.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE PASSWORD ──────────────────────────────────────────────────
    if (action === 'update_password') {
      const { userId, newPassword } = body;
      if (!userId || !newPassword) {
        return new Response(JSON.stringify({ error: 'Thiếu userId hoặc newPassword.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: pwErr } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (pwErr) {
        return new Response(JSON.stringify({ error: pwErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Action không hợp lệ: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
