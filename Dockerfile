# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /app/dist

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 