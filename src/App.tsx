import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import { useAuthStore } from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import { useUserWebSocket } from './hooks/useUserWebSocket';
import { MessageAreaProvider } from '@/contexts/MessageAreaContext';

// 懒加载页面组件
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Home = React.lazy(() => import('./pages/Home'));
const AccountSettings = React.lazy(() => import('./pages/AccountSettings'));
const TaskCenter = React.lazy(() => import('./pages/TaskCenter'));
const MyTasks = React.lazy(() => import('./pages/MyTasks'));
const Chat = React.lazy(() => import('./pages/Chat'));

// 加载中组件
const LoadingComponent = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <Spin size="large" />
  </div>
);

// 路由守卫组件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <LoadingComponent />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { loadUser, error } = useAuthStore();
  
  // 初始化全局 WebSocket 连接
  useUserWebSocket();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadUser();
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  return (
    <ErrorBoundary>
      <MessageAreaProvider>
        <ConfigProvider locale={zhCN}>
          <Router>
            <Suspense fallback={<LoadingComponent />}>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="tasks" element={<TaskCenter />} />
                  <Route
                    path="profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="account"
                    element={
                      <PrivateRoute>
                        <AccountSettings />
                      </PrivateRoute>
                    }
                  />
                  <Route path="my-tasks" element={<MyTasks />} />
                  <Route
                    path="mc"
                    element={
                      <PrivateRoute>
                        <Navigate to="/mc/chat" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="mc/chat"
                    element={
                      <PrivateRoute>
                        <Chat />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="mc/sm"
                    element={
                      <PrivateRoute>
                        <Chat initialTab="system" />
                      </PrivateRoute>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </ConfigProvider>
      </MessageAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
