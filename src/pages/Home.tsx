import React from 'react';
import { Typography } from 'antd';
const { Title } = Typography;

const Home: React.FC = () => {
  return (
    <div className="text-center">
      <Title>欢迎来到 iNeed</Title>
      <Title level={3}>您的需求，我们的服务</Title>
    </div>
  );
};

export default Home; 