import React from 'react';
import { Layout, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUnreadStore } from '@/store/useUnreadStore';
import { useChatStore } from '@/store/useChatStore';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { IconHome, IconListCheck, IconUserCircle, IconSettings, IconLogout, IconMessage } from '@tabler/icons-react';

const { Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { totalUnread } = useUnreadStore();
  const { chatContext: { isInMessageCenter } } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  useUnreadMessages();

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 侧边栏导航链接
  const navLinks = [
    {
      label: "首页",
      href: "/",
      icon: <IconHome className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "任务中心",
      href: "/tasks",
      icon: <IconListCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "我的任务",
      href: "/my-tasks",
      icon: <IconUserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];

  // 用户相关链接
  const userLinks = [
    {
      label: "消息中心",
      href: "/mc/chat",
      icon: (
        <Badge count={isInMessageCenter ? 0 : totalUnread} offset={[0, 0]}>
          <IconMessage className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        </Badge>
      ),
    },
    {
      label: "账号设置",
      href: "/account",
      icon: <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "退出登录",
      href: "#",
      icon: <IconLogout className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: handleLogout,
    },
  ];

  // 头像导航项
  const profileLink = {
    label: user?.username || "未登录",
    href: "/profile",
    icon: user?.avatar ? (
      <img 
        src={user.avatar} 
        alt="avatar" 
        className="rounded-full object-cover flex-shrink-0 h-5 w-5"
      />
    ) : (
      <IconUserCircle className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
    ),
  };

  // 判断是否显示页脚
  const shouldShowFooter = !location.pathname.startsWith('/mc');

  return (
    <Layout className="min-h-screen flex flex-row">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between h-full py-4">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <SidebarLink link={profileLink} />
            
            <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700 my-2" />

            <div className="flex flex-col space-y-2">
              {/* 主导航组 */}
              <div className="flex flex-col space-y-1">
                {navLinks.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
              
              {/* 消息中心组 */}
              <div className="flex flex-col space-y-1">
                <SidebarLink link={userLinks[0]} />
              </div>
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="flex flex-col space-y-1 mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-700">
              {userLinks.slice(1).map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <SidebarLink
                link={{
                  label: "登录",
                  href: "/login",
                  icon: <IconUserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                }}
              />
            </div>
          )}
        </SidebarBody>
      </Sidebar>
      
      <Layout className="flex-1">
        <Content className={location.pathname.startsWith('/mc') ? 'h-full' : 'overflow-y-auto'}>
          <div className={location.pathname.startsWith('/mc') ? 'h-full' : 'bg-white min-h-[280px]'}>
            <Outlet />
          </div>
        </Content>
        {shouldShowFooter && (
          <Footer className="text-center">iNeed ©2024</Footer>
        )}
      </Layout>
    </Layout>
  );
};

export default MainLayout; 