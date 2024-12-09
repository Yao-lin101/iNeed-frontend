import React from 'react';
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold mr-8">
            iNeed
          </Link>
          <Menu mode="horizontal" defaultSelectedKeys={['home']} items={navItems} />
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/mc/chat" className="text-gray-600 hover:text-gray-900">
                <Badge count={totalUnread} offset={[0, 0]}>
                  <MessageOutlined style={{ fontSize: '20px' }} />
                </Badge>
              </Link>
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
      <Content className={location.pathname.startsWith('/mc') ? '' : 'p-6'}>
        <div className={location.pathname.startsWith('/mc') ? '' : 'bg-white p-6 min-h-[280px]'}>
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