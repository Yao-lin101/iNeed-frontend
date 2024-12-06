import React from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

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
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold mr-8">
            iNeed
          </Link>
          <Menu mode="horizontal" defaultSelectedKeys={['home']} items={navItems} />
        </div>
        <div>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="cursor-pointer flex items-center">
                <Avatar src={user?.avatar} icon={<UserOutlined />} />
                <span className="ml-2">{user?.username}</span>
              </div>
            </Dropdown>
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
      <Content className="p-6">
        <div className="bg-white p-6 min-h-[280px]">
          <Outlet />
        </div>
      </Content>
      <Footer className="text-center">iNeed ©2024</Footer>
    </Layout>
  );
};

export default MainLayout; 