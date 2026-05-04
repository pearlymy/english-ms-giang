import React from 'react';
import { Box } from '../../design-system/primitives/Box';
import { Text } from '../../design-system/primitives/Text';
import { Stack } from '../../design-system/primitives/Stack';
import { ColorPalette } from '../../design-system/components/ColorPalette/ColorPalette';
import { Button } from '../../design-system/components/Button/Button';
import { TextField } from '../../design-system/components/TextField/TextField';
import { Card } from '../../design-system/components/Card/Card';
import { Table } from '../../design-system/components/Table/Table';
import { Modal } from '../../design-system/components/Modal/Modal';
import { EmptyState } from '../../design-system/components/States/EmptyState';
import { ErrorState } from '../../design-system/components/States/ErrorState';
import { LoadingState } from '../../design-system/components/States/LoadingState';
import { Avatar } from '../../design-system/components/Avatar/Avatar';
import { AvatarGroup } from '../../design-system/components/Avatar/AvatarGroup';
import { Badge, NotificationBadge } from '../../design-system/components/Badge/Badge';
import { Tabs } from '../../design-system/components/Tabs/Tabs';
import { Dropdown } from '../../design-system/components/Dropdown/Dropdown';
import { Divider } from '../../design-system/components/Divider/Divider';
import { Tooltip } from '../../design-system/components/Tooltip/Tooltip';
import { Select } from '../../design-system/components/Select/Select';
import { useToast } from '../../hooks/useToast';
import { Inbox, ChevronDown, Settings, Book, Star } from 'lucide-react';
import '../../design-system/foundations/global.css';

const tableData = [
  { id: 1, name: 'Lê Văn Giang', course: 'React Masterclass', status: 'Active' },
  { id: 2, name: 'Nguyễn Thị B', course: 'Node.js Advanced', status: 'Completed' },
];

const tabItems = [
  { value: 'tab1', label: 'General Info', icon: <Settings size={16}/>, content: <Box style={{ padding: '16px' }}><Text>General information about the course goes here.</Text></Box> },
  { value: 'tab2', label: 'Curriculum', icon: <Book size={16}/>, content: <Box style={{ padding: '16px' }}><Text>List of lessons and modules.</Text></Box> },
  { value: 'tab3', label: 'Reviews', icon: <Star size={16}/>, content: <Box style={{ padding: '16px' }}><Text>Student reviews and ratings.</Text></Box> },
];

const dropdownItems = [
  { label: 'Profile Settings', onClick: () => console.log('Profile') },
  { 
    label: 'Preferences', 
    items: [
      { label: 'Theme', onClick: () => console.log('Theme') },
      { label: 'Notifications', onClick: () => console.log('Notifications') }
    ]
  },
  { label: 'Billing', onClick: () => console.log('Billing') },
  { type: 'separator' },
  { label: 'Log out', onClick: () => console.log('Logout') },
];

const gradeOptions = [
  {
    group: 'Cấp 1 (Tiểu học)',
    items: [1,2,3,4,5].map(l => ({ value: String(l), label: `Lớp ${l}` })),
  },
  {
    group: 'Cấp 2 (THCS)',
    items: [6,7,8,9].map(l => ({ value: String(l), label: `Lớp ${l}` })),
  },
];

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
];

export const DesignSystem = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [grade, setGrade] = React.useState('');
  const [fruit, setFruit] = React.useState('');

  return (
    <Box style={{ padding: 'var(--spacing-2xl)', minHeight: '100vh' }}>
      <Stack gap="3xl">
        <Stack gap="sm">
          <Text size="3xl" weight="bold" color="primary">
            LMS Design System Showcase
          </Text>
          <Text size="lg" color="textSecondary">
            Comprehensive overview of colors, primitives, and components based on UI References.
          </Text>
        </Stack>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">1. Color Palette</Text>
            <ColorPalette />
          </Stack>
        </Box>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">2. Button Variants</Text>
            <Stack direction="row" gap="md" align="center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">3. TextField States</Text>
            <Box style={{ maxWidth: '400px' }}>
              <Stack gap="lg">
                <TextField label="Default Input" placeholder="Enter some text..." />
                <TextField label="Error Input" variant="error" helperText="Invalid email." defaultValue="wrong@" />
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">4. Card & Table (Data Display)</Text>
            <Stack direction="row" gap="lg" align="start">
              <Card interactive style={{ width: '300px' }}>
                <Text size="lg" weight="semibold">Interactive Card</Text>
                <Text color="textSecondary" style={{ marginTop: '8px' }}>
                  Hover over this card to see the elevated shadow effect.
                </Text>
                <Button style={{ marginTop: '16px' }}>View Details</Button>
              </Card>

              <Card style={{ flex: 1 }}>
                <Table headers={['ID', 'Name', 'Course', 'Status']} data={tableData} />
              </Card>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">5. Modal (Headless UI)</Text>
            <div>
              <Modal
                open={modalOpen}
                onOpenChange={setModalOpen}
                trigger={<Button>Open Radix Modal</Button>}
                title="Delete Course?"
                description="Are you sure you want to delete this course? This action cannot be undone."
                primaryAction={{ label: 'Delete', danger: true, onClick: () => setModalOpen(false) }}
                secondaryAction={{ label: 'Cancel', onClick: () => setModalOpen(false) }}
              />
            </div>
          </Stack>
        </Box>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">6. Feedback States</Text>
            <Stack direction="row" gap="lg">
              <Card style={{ flex: 1 }}>
                <EmptyState 
                  icon={Inbox} 
                  title="No courses found" 
                  description="You haven't enrolled in any courses yet."
                  primaryAction={{ label: 'Browse Courses', onClick: () => {} }}
                />
              </Card>
              <Card style={{ flex: 1 }}>
                <ErrorState 
                  title="Connection failed" 
                  description="We couldn't connect to the server."
                  retryAction={{ label: 'Retry', onClick: () => {} }}
                />
              </Card>
              <Card style={{ flex: 1 }}>
                <LoadingState text="Loading dashboard..." />
              </Card>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">7. Navigation & Micro-components (Enhanced)</Text>
            <Card>
              <Stack gap="xl">
                <Stack gap="sm">
                  <Text weight="bold">Avatars & Notifications</Text>
                  <Stack direction="row" gap="xl" align="center">
                    <Tooltip content="Lê Văn Giang">
                      <button style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                        <Avatar fallback="LG" size="md" />
                      </button>
                    </Tooltip>

                    <NotificationBadge dot>
                      <Avatar fallback="N" size="md" />
                    </NotificationBadge>

                    <NotificationBadge count={5}>
                      <Avatar src="https://i.pravatar.cc/150?u=a04258" size="md" />
                    </NotificationBadge>

                    <AvatarGroup 
                      avatars={[
                        { fallback: 'A' },
                        { fallback: 'B' },
                        { fallback: 'C' },
                        { fallback: 'D' },
                        { fallback: 'E' },
                        { fallback: 'F' }
                      ]} 
                      max={4} 
                    />
                  </Stack>
                </Stack>
                
                <Divider />

                <Stack gap="sm">
                  <Text weight="bold">Badges</Text>
                  <Stack direction="row" gap="md">
                    <Badge variant="default">Draft</Badge>
                    <Badge variant="primary">In Progress</Badge>
                    <Badge variant="success">Published</Badge>
                    <Badge variant="warning">Review</Badge>
                    <Badge variant="error">Rejected</Badge>
                  </Stack>
                </Stack>

                <Divider />

                <Stack gap="sm">
                  <Text weight="bold">Tabs & Dropdown</Text>
                  <Stack direction="row" gap="3xl" align="start">
                    <Box style={{ flex: 1 }}>
                      <Tabs defaultValue="tab1" tabs={tabItems} />
                    </Box>
                    <Box style={{ width: '200px' }}>
                      <Dropdown 
                        trigger={
                          <Button variant="outline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            Options <ChevronDown size={16} />
                          </Button>
                        } 
                        items={dropdownItems} 
                      />
                    </Box>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Box>
        {/* ===== 8. Select (LOV) ===== */}
        <Box>
          <Stack gap="md">
            <Text size="2xl" weight="bold">8. Select (LOV — List of Values)</Text>
            <Text color="textSecondary" size="sm">
              Custom dropdown built with React state. Supports grouped options, controlled value,
              error/disabled states, keyboard (ESC, Enter), outside-click dismiss.
              Motion: panel <strong>fade + slide 180ms</strong> (MOTION_SYSTEM.md → normal/enter),
              item highlight <strong>120ms</strong> (fast/standard).
            </Text>
            <Card>
              <Stack gap="xl">
                <Stack gap="sm">
                  <Text weight="bold">Default — Single list</Text>
                  <Box style={{ maxWidth: '320px' }}>
                    <Select
                      label="Choose a fruit"
                      placeholder="— Select —"
                      options={fruitOptions}
                      value={fruit}
                      onChange={setFruit}
                    />
                  </Box>
                </Stack>

                <Divider />

                <Stack gap="sm">
                  <Text weight="bold">Grouped options</Text>
                  <Box style={{ maxWidth: '320px' }}>
                    <Select
                      label="Lớp của con"
                      placeholder="— Chọn lớp —"
                      options={gradeOptions}
                      value={grade}
                      onChange={setGrade}
                    />
                  </Box>
                </Stack>

                <Divider />

                <Stack direction="row" gap="lg" align="start">
                  <Box style={{ flex: 1 }}>
                    <Text weight="bold" style={{ marginBottom: 8 }}>Error state</Text>
                    <Select
                      label="Required field"
                      placeholder="— Select —"
                      options={fruitOptions}
                      errorText="Please select an option"
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text weight="bold" style={{ marginBottom: 8 }}>Disabled state</Text>
                    <Select
                      label="Disabled"
                      placeholder="Cannot interact"
                      options={fruitOptions}
                      disabled
                    />
                  </Box>
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Box>

        {/* ===== 9. Toast Notification ===== */}
        <ToastShowcase />

      </Stack>
    </Box>
  );
};

/* Isolated sub-component so useToast hook is inside ToastProvider scope */
function ToastShowcase() {
  const toast = useToast();

  return (
    <Box>
      <Stack gap="md">
        <Text size="2xl" weight="bold">9. Toast Notification</Text>
        <Text color="textSecondary" size="sm">
          Context-based notification system. Rendered in a fixed bottom-right stack.
          Motion: <strong>slide/fade from right 180ms</strong> enter (MOTION_SYSTEM.md → normal/enter),
          <strong> slide/fade to right 180ms</strong> exit (normal/exit). Auto-dismisses after 4s.
        </Text>
        <Card>
          <Stack gap="xl">
            {/* Variant buttons */}
            <Stack gap="sm">
              <Text weight="bold">Variants — click to trigger</Text>
              <Stack direction="row" gap="md" style={{ flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={() => toast.success('Đăng ký thành công! Cô Giang sẽ liên hệ sớm.')}
                >
                  ✅ Success
                </Button>
                <Button
                  variant="danger"
                  onClick={() => toast.error('Có lỗi xảy ra. Vui lòng thử lại.', { title: 'Lỗi kết nối' })}
                >
                  ❌ Error + Title
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.warning('Phiên đăng nhập sắp hết hạn.', { title: 'Cảnh báo' })}
                >
                  ⚠️ Warning
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toast.info('Lớp học mới sẽ khai giảng ngày 10/5.')}
                >
                  ℹ️ Info
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.success('Toast này không tự đóng.', { duration: 0, title: 'Persistent' })}
                >
                  📌 Persistent (no auto-dismiss)
                </Button>
              </Stack>
            </Stack>

            <Divider />

            <Stack gap="sm">
              <Text weight="bold">Stacking — click multiple times</Text>
              <Text color="textSecondary" size="sm">
                Toasts stack vertically. Each auto-dismisses independently after 4s.
              </Text>
              <Button
                variant="outline"
                onClick={() => {
                  toast.success('Bài tập đã được nộp!');
                  setTimeout(() => toast.info('Cô Giang sẽ chấm trong 24h.'), 300);
                  setTimeout(() => toast.warning('Còn 2 bài tập chưa hoàn thành.'), 600);
                }}
              >
                🔔 Trigger 3 toasts
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}
