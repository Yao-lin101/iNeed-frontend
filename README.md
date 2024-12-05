# iNeed Frontend

基于 React 和 Ant Design 的需求平台前端应用。

## 技术栈

- React 18
- TypeScript 5
- Ant Design 5
- Vite 5
- Zustand
- Axios
- React Router 6
- Tailwind CSS

## 功能特性

- 用户认证（注册、登录、注销）
- 用户资料管理
- 响应式设计
- 状态管理
- 路由保护
- 文件上传

## 安装

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量：
创建 .env 文件并设置以下变量：
```
VITE_API_URL=http://localhost:8000/api
```

## 开发

```bash
npm run dev
```

应用将在 http://localhost:3000 运行。

## 构建

```bash
npm run build
```

## 页面说明

- `/` - 首页
- `/login` - 登录页面
- `/register` - 注册页面
- `/profile` - 个人资料页面（需要登录）

## 项目结构

```
src/
  ├── components/     # 可复用组件
  ├── pages/         # 页面组件
  ├── services/      # API 服务
  ├── store/         # 状态管理
  ├── utils/         # 工具函数
  ├── layouts/       # 布局组件
  ├── assets/        # 静态资源
  └── hooks/         # 自定义 Hooks
```
