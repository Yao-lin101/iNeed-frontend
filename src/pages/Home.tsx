import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'antd';
import { SafetyOutlined, TeamOutlined, FileSearchOutlined, MailOutlined } from '@ant-design/icons';
import SparklesText from '@/components/ui/sparkles-text';
import { WarpBackground } from '@/components/ui/warp-background';
import FlipText from '@/components/ui/flip-text';
import ScrollProgress from '@/components/ui/scroll-progress';
import BoxReveal from '@/components/ui/box-reveal';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { useAuthStore } from '@/store/useAuthStore';
import ScratchToReveal from '@/components/ui/scratch-to-reveal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <ScrollProgress />
      
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-4xl">
          <SparklesText
            text="iNeed - 连接需求与服务"
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
          />
          <div className="mt-6">
            <FlipText
              word="并不怎么可靠的任务协作平台"
              className="text-xl md:text-2xl text-gray-600"
            />
          </div>
          <div className="flex justify-center gap-4 mt-8">
            {isAuthenticated ? (
              <RainbowButton onClick={() => navigate('/tasks')}>
                浏览任务
              </RainbowButton>
            ) : (
              <>
                <RainbowButton onClick={() => navigate('/tasks')}>
                  浏览任务
                </RainbowButton>
                <RainbowButton onClick={() => navigate('/register')}>
                  立即注册
                </RainbowButton>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <WarpBackground className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <BoxReveal>
            <h2 className="text-3xl font-bold text-center mb-16">
              平台核心功能
            </h2>
          </BoxReveal>

          <div className="flex justify-center">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="relative hover:shadow-lg transition-shadow duration-300"
                >
                  <BorderBeam delay={index} />
                  <div className="text-center space-y-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </WarpBackground>

      {/* Safety Notice */}
      <section className="bg-gradient-to-r from-red-50 to-red-100 py-12">
        <div className="max-w-6xl mx-auto px-4 flex justify-center">
          <ScratchToReveal
            width={window.innerWidth >= 768 ? 800 : 320}
            height={window.innerWidth >= 768 ? 280 : 400}
            className="rounded-lg overflow-hidden"
            gradientColors={["#ff6b6b", "#ff8787", "#ffa8a8"]}
          >
            <div className="flex flex-col items-center justify-center h-full bg-white text-center p-8">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <SafetyOutlined className="text-3xl text-red-500" />
                  <h3 className="text-2xl font-bold text-red-600 mt-3">
                    安全提醒
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="text-lg text-gray-800">
                    <p>本平台暂不支持支付功能</p>
                    <p>接取任务以及交付时请注意财产安全</p>
                    <p>希望各位重视自己的信用</p>
                  </div>
                  <div className="text-sm text-gray-500 italic mt-6">
                    免责声明：本平台仅提供信息对接服务，不对用户之间的交易行为承担任何责任。
                    <br />
                    如发生纠纷，平台会协助提供相关记录，但最终解释权归平台所有。
                  </div>
                </div>
              </div>
            </div>
          </ScratchToReveal>
        </div>
      </section>

      {/* ICP 备案信息 */}
      <footer className="py-4 text-center text-gray-500 text-sm">
        <a 
          href="https://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-700 transition-colors"
        >
          赣ICP备2024052124号
        </a>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: <TeamOutlined className="text-4xl text-blue-500" />,
    title: "任务发布与接取",
    description: "发布您的需求或浏览接取任务，轻松实现",
  },
  {
    icon: <FileSearchOutlined className="text-4xl text-green-500" />,
    title: "实时任务追踪",
    description: "随时查看任务进度，保持双方顺畅沟通",
  },
  {
    icon: <MailOutlined className="text-4xl text-purple-500" />,
    title: "邮件提醒",
    description: "任务状态发生变化时，将通过邮件通知",
  },
];

export default Home; 