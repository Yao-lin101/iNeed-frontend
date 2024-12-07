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

- 用户认证
  - 注册（邮箱验证）
  - 登录
  - 注销
  - 验证码校验
- 用户资料管理
  - 个人信息编辑
  - 头像上传
  - 资料展示
  - 用户 UID 系统
- 账号管理
  - 账号删除（软删除）
  - 个人资料设置
  - 安全设置
- 任务管理
  - 任务发布
  - 任务接取
  - 任务提交
  - 任务审核
  - 任务搜索
  - 任务状态追踪
  - 任务附件管理
- 响应式设计
- 状态管理
- 路由保护
- 文件上传
- 错误处理
  - 全局错误边界
  - API 错误处理
  - 状态恢复机制

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
- `/register` - 注册页面（包含邮箱验证）
- `/profile` - 个人资料页面（需要登录）
- `/account` - 账号管理页面（需要登录）
  - 个人资料设置
  - 账号删除功能
  - 安全设置
- `/task-center` - 任务中心（需要登录）
  - 浏览所有可接取的任务
  - 任务搜索功能
- `/my-tasks` - 我的任务（需要登录）
  - 已发布的任务管理
  - 已接取的任务管理
- `/task/new` - 发布新任务（需要登录）
- `/task/:id` - 任务详情页面（需要登录）
  - 任务信息展示
  - 任务状态管理
  - 附件查看

## 项目结构

```
src/
  ├── components/     # 可复用组件
  │   ├── ErrorBoundary/  # 错误边界组件
  │   └── ...
  ├── pages/         # 页面组件
  │   ├── Login/     # 登录页面
  │   ├── Register/  # 注册页面
  │   ├── Profile/   # 个人资料页面
  │   └── Account/   # 账号管理页面
  ├── services/      # API 服务
  │   ├── api.ts     # API 配置
  │   ├── auth.ts    # 认证服务
  │   └── user.ts    # 用户服务
  ├── store/         # 状态管理
  │   └── useAuthStore.ts  # 认证状态管理
  ├── utils/         # 工具函数
  ├── layouts/       # 布局组件
  ├── assets/        # 静态资源
  └── hooks/         # 自定义 Hooks
```

## 开发规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件和 Hooks
- 使用 Tailwind CSS 进行样式管理
- 遵循 Ant Design 设计规范

## 安全性

- 使用 Token 认证
- 路由保护
- 敏感信息加密
- XSS 防护
- 用户数据保护
  - 账号删除时数据安全处理
  - 敏感信息加密存储

## 性能优化

- 路由懒加载
- 组件按需加载
- 图片优化处理
- 缓存策略
- API 请求优化
