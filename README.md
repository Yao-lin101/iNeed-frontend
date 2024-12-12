# iNeed Frontend

基于 React 和 Ant Design 的需求平台前端应用。

## 技术栈

- React + TypeScript
- Ant Design
- Vite
- Zustand（状态管理）
- Axios（HTTP 请求）
- React Router（路由管理）
- Tailwind CSS（样式框架）
- Day.js（时间处理）

具体依赖版本请参考 `package.json`。

## 功能特性

- 用户认证
  - 注册（邮箱验证）
  - 登录
  - 注销
  - 验证码校验
  - 用户名实时检查
- 用户资料管理
  - 个人信息编辑
  - 头像上传
    - 图片裁剪功能
    - 圆形预览
    - 缩放调节
    - 实时预览
    - 自动压缩优化
  - 资料展示
  - 用户 UID 系统
  - 通知设置
    - 邮件通知开关
    - 任务过期提醒
- 账号管理
  - 账号删除（软删除）
  - 个人资料设置
  - 安全设置
  - 一键注销功能
  - 账号恢复提示
  - 账号重新激活
    - 邮箱验证
    - 历史任务关联恢复
    - 用户数据恢复
- 任务管理
  - 任务发布
    - 智能截止时间设置
    - 整点时间选择
  - 任务接取
  - 任务提交
  - 任务审核
  - 任务搜索
  - 任务状态追踪
  - 任务附件管理
    - 可选附件上传
    - 附件下载
    - 附件预览
  - 任务过期处理
    - 自动状态更新
    - 过期提醒通知
    - 过期时间显示
  - 任务详情模态框
    - 实时状态更新
    - 任务操作集成
    - 附件管理
    - 快速操作按钮
    - 响应式布局
- 聊天系统
  - 一对一实时聊天
    - WebSocket 实时通信
    - 消息实时发送与接收
    - 消息已读状态
    - 未读消息计数
  - 对话管理
    - 对话列表展示
    - 最新消息预览
    - 对话删除功能
    - 消息清理功能
  - 消息功能
    - 消息发送与接收
    - 消息时间显示
    - 消息状态追踪
    - 消息历史记录
  - 系统通知集成
    - 系统消息展示
    - 通知分类管理
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
  - 邮箱登录
  - 错误提示
  - 账号状态检查
- `/register` - 注册页面
  - 邮箱验证
  - 用户名实时检查
  - 密码强度验证
- `/profile` - 个人资料页面（需要登录）
- `/account` - 账号管理页面（需要登录）
  - 个人资料设置
  - 账号删除功能
    - 任务状态检查
    - 数据安全处理
    - 一键注销支持
  - 安全设置
  - 通知设置
    - 邮件通知开关
    - 任务过期提醒
- `/task-center` - 任务中心（需要登录）
  - 浏览所有可接取的任务
  - 任务搜索功能
  - 任务状态显示
    - 过期状态标记
    - 剩余时间显示
  - 任务详情模态框
    - 快速查看任务信息
    - 直接操作任务
    - 实时状态更新
    - 快速管理任务
    - 附件管理
- `/my-tasks` - 我的任务（需要登录）
  - 已发布的任务管理
  - 已接取的任务管理
  - 任务状态追踪
    - 过期状态监控
    - 截止时间提醒
- `/task/new` - 发布新任务（需要登录）
  - 智能截止时间设置
  - 整点时间选择
- `/task/:id` - 任务详情页面（需要登录）
  - 任务信息展示
  - 任务状态管理
  - 附件查看
  - 过期状态显示
  - 剩余时间计算
- `/mc` - 消息中心（需要登录）
  - 默认重定向到 `/mc/chat`
- `/mc/chat` - 我的消息（需要登录）
  - 对话列表
    - 最新消息预览
    - 未读消息提醒
    - 对话删除功能
  - 消息区域
    - 实时消息发送
    - 消息历史记录
    - 消息状态显示
  - 支持查询参数：`?conversation=123`
- `/mc/sm` - 系统消息（需要登录）
  - 系统通知
    - 通知消息展示
    - 通知分类管理

## 项目结构

```
src/
  ├── components/     # 可复用组件
  │   ├── ErrorBoundary/  # 错误边界组件
  │   ├── Chat/          # 聊天系统组件
  │   └── ...
  ├── pages/         # 页面组件
  │   ├── Login/     # 登录页面
  │   ├── Register/  # 注册页面
  │   ├── Profile/   # 个人资料页面
  │   ├── Chat/      # 聊天页面
  │   └── Account/   # 账号管理页面
  ├── services/      # API 服务
  │   ├── api.ts     # API 配置
  │   ├── auth.ts    # 认证服务
  │   └── user.ts    # 用户服务
  ├── store/         # 状态管理
  │   └── useAuthStore.ts  # 认证状态管理
  ├── styles/        # 样式文件
  │   ├── base/           # 基础样式
  │   │   └── variables.css  # CSS 变量
  │   ├── components/     # 组件样式
  │   │   └── chat/      # 聊天组件样式
  │   ├── animations.css  # 动画样式
  │   └── index.css      # 全局样式入口
  ├── utils/         # 工具函数
  │   ├── date.ts    # 日期时间工具
  │   └── ...
  ├── layouts/       # 布局组件
  ├── assets/        # 静态资源
  └── hooks/         # 自定义 Hooks
```

## 开发规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件和 Hooks
- CSS 架构规范
  - 使用 CSS 变量管理主题和样式配置
  - 组件样式模块化管理
  - 动画效果统一管理
  - 基于 Tailwind CSS 的原子类
  - 遵循 BEM 命名规范
- 遵循 Ant Design 设计规范
- 日期时间处理规范
  - 使用 Day.js 处理时间
  - 统一时间格式显示
  - 智能时间展示
- 路由规范
  - 使用语义化路由命名（如 /mc 代表消息中心）
  - 遵循 RESTful 风格
  - 查询参数用于过滤和状态（如 ?conversation=123）
  - 路由参数用于资源标识（如 /task/:id）

## 安全性

- 使用 Token 认证
- 路由保护
- 敏感信息加密
- XSS 防护
- 用户数据保护
  - 账号删除时数据安全处理
    - 清除个人信息
    - 保留必要数据
    - 支持账号恢复
  - 敏感信息加密存储

## 性能优化

- 路由懒加载
- 组件按需加载
- 图片优化处理
- 缓存策略
- API 请求优化
- 时间计算优化
  - 使用 Day.js 优化性能
  - 智能时间更新策略
```
