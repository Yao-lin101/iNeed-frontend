import React from 'react';
import { Layout, Badge } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUnreadStore } from '@/store/useUnreadStore';
import { useChatStore } from '@/store/useChatStore';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { IconHome, IconListCheck, IconUserCircle, IconSettings, IconLogout, IconMessage } from '@tabler/icons-react';

const { Content } = Layout;

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { totalUnread } = useUnreadStore();
  const { chatContext: { isInMessageCenter } } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  useUnreadMessages();

  const navigate = useNavigate();

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

  // 创建一个包装的链接处理函数（只用于移动端）
  const wrapMobileLink = (link: any) => ({
    ...link,
    onClick: async (e: React.MouseEvent) => {
      // 如果有原始的 onClick，先执行它
      if (link.onClick) {
        await link.onClick(e);
      }
      // 如果是链接（而不是按钮），导航到目标页面
      else if (link.href && link.href !== '#') {
        navigate(link.href);
      }
      // 关闭侧边栏
      setSidebarOpen(false);
    }
  });

  // 只为移动端包装链接
  const mobileNavLinks = navLinks.map(link => wrapMobileLink(link));
  const mobileUserLinks = userLinks.map(link => wrapMobileLink(link));
  const mobileProfileLink = wrapMobileLink(profileLink);

  return (
    <Layout className="h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <Layout className="flex flex-col md:flex-row">
          {/* 移动端侧边栏内容 - 使用包装后的链接 */}
          <div className="block md:hidden">
            <SidebarBody className="justify-between min-h-screen py-4">
              <div className="flex flex-col h-full pb-20">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                  <SidebarLink link={mobileProfileLink} />
                  
                  <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700 my-2" />

                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-1">
                      {mobileNavLinks.map((link, idx) => (
                        <SidebarLink key={idx} link={link} />
                      ))}
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <SidebarLink link={mobileUserLinks[0]} />
                    </div>
                  </div>
                </div>
                
                {isAuthenticated ? (
                  <div className="flex flex-col space-y-1 mt-auto pt-6 border-t border-neutral-200 dark:border-neutral-700">
                    {mobileUserLinks.slice(1).map((link, idx) => (
                      <SidebarLink key={idx} link={link} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SidebarLink
                      link={wrapMobileLink({
                        label: "登录",
                        href: "/login",
                        icon: <IconUserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                      })}
                    />
                  </div>
                )}
              </div>
            </SidebarBody>
          </div>

          {/* 桌面端侧边栏 - 使用原始链接 */}
          <div className="hidden md:block">
            <SidebarBody className="justify-between h-screen py-4">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <SidebarLink link={profileLink} />
                
                <div className="h-[1px] bg-neutral-200 dark:bg-neutral-700 my-2" />

                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col space-y-1">
                    {navLinks.map((link, idx) => (
                      <SidebarLink key={idx} link={link} />
                    ))}
                  </div>
                  
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
          </div>

          {/* 内容区域 */}
          <Content className="overflow-y-auto flex-1">
            <div className="bg-white h-full">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Sidebar>
    </Layout>
  );
};

export default MainLayout; 