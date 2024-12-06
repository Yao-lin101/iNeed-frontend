import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state，下次渲染时显示错误 UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以在这里记录错误日志
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // 如果是扩展程序相关的错误，直接返回子组件
      if (this.state.error?.message.includes('Extension context invalidated')) {
        return this.props.children;
      }

      // 其他错误显示错误 UI
      return (
        <Result
          status="error"
          title="页面出现错误"
          subTitle="抱歉，页面加载时发生了错误。"
          extra={[
            <Button type="primary" key="reload" onClick={this.handleReload}>
              刷新页面
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 