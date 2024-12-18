import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, MessageOutlined } from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { totalUnread } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();

  // 设置页面类型
  useEffect(() => {
    if (location.pathname.startsWith('/mc')) {
      document.body.setAttribute('data-page', 'message-center');
    } else {
      document.body.removeAttribute('data-page');
    }
    
    // 清理函数
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMessageCenterClick = () => {
    navigate('/mc/chat');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人资料</Link>,
    },
    {
      key: 'account',
      icon: <SettingOutlined />,
      label: <Link to="/account">账号管理</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    // 在消息中心时返回空数组，而不是空字符串
    if (pathname.startsWith('/mc')) return [];
    
    if (pathname === '/') return ['home'];
    if (pathname.startsWith('/tasks')) return ['tasks'];
    if (pathname.startsWith('/my-tasks')) return ['my-tasks'];
    return [];
  };

  const navItems: MenuProps['items'] = [
    {
      key: 'home',
      label: <Link to="/">首页</Link>,
    },
    {
      key: 'tasks',
      label: <Link to="/tasks">任务中心</Link>,
    },
    {
      key: 'my-tasks',
      label: <Link to="/my-tasks">我的任务</Link>,
    },
  ];

  // 判断是否显示页脚
  const shouldShowFooter = !location.pathname.startsWith('/mc');

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white">
        <div className="flex items-center flex-1">
          <Link to="/" className="text-xl font-bold mr-8 flex-none">
            iNeed
          </Link>
          <Menu 
            mode="horizontal" 
            selectedKeys={getSelectedKeys()}
            items={navItems} 
            className="flex-1 min-w-[300px]"
          />
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div 
                onClick={handleMessageCenterClick} 
                className="text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <Badge 
                  count={totalUnread} 
                  offset={[0, 0]}
                  className="unread-badge"
                >
                  <MessageOutlined style={{ fontSize: '20px' }} />
                </Badge>
              </div>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="cursor-pointer">
                  <Avatar src={user?.avatar} icon={<UserOutlined />} />
                </div>
              </Dropdown>
            </>
          ) : (
            <div>
              <Link to="/login" className="mr-4">
                登录
              </Link>
              <Link to="/register">注册</Link>
            </div>
          )}
        </div>
      </Header>
      <Content className={location.pathname.startsWith('/mc') ? 'h-full' : 'p-6 overflow-y-auto'}>
        <div className={location.pathname.startsWith('/mc') ? 'h-full' : 'bg-white p-6 min-h-[280px]'}>
          <Outlet />
        </div>
      </Content>
      {shouldShowFooter && (
        <Footer className="text-center">iNeed ©2024</Footer>
      )}
    </Layout>
  );
};

export default MainLayout; 