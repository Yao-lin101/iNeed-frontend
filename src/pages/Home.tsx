import React from 'react';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';

const Home: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-[200px]">
        <NeonGradientCard>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2 gradient-text">欢迎来到 iNeed</h2>
            <p className="text-base text-neutral-600 dark:text-neutral-300">
              您的需求，我们的服务
            </p>
          </div>
        </NeonGradientCard>
      </div>
    </div>
  );
};

export default Home; 