# ======================
# 前端构建阶段
# ======================
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# 复制前端 package 文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm ci

# 复制前端源代码
COPY frontend/ ./

# 构建前端应用（设置为生产环境，使用相对路径）
ENV VITE_API_BASE_URL=/
RUN npm run build

# ======================
# 后端构建阶段
# ======================
FROM golang:1.24-alpine AS backend-builder
ENV CGO_ENABLED=0
ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /app

# 复制 Go 依赖文件
COPY go.mod go.sum ./

# 下载 Go 依赖
RUN go mod download

# 复制后端源代码
COPY . .

# 构建 Go 应用程序
RUN go build -o main ./cmd/api/main.go

# ======================
# 生产运行阶段
# ======================
FROM alpine

# 安装运行时依赖
RUN apk update --no-cache && \
    apk add --no-cache ca-certificates ffmpeg tzdata curl && \
    rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=backend-builder /app/main .
COPY --from=backend-builder /app/configs ./configs
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# 设置文件权限
RUN chown -R appuser:appgroup /app/frontend/dist
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# 运行应用程序
CMD ["./main"]