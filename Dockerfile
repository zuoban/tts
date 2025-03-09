# 使用官方 Golang 镜像作为构建环境
FROM golang:1.22-alpine AS builder
ENV CGO_ENABLED=0
ENV GOPROXY=https://goproxy.cn,direct

# 设置工作目录
WORKDIR /app

# 将 go.mod 和 go.sum 文件复制到工作目录
COPY go.mod go.sum ./

# 下载所有依赖项
RUN go mod download

# 将源代码复制到工作目录
COPY . .

# 构建 Go 应用程序
RUN go build -o main ./cmd/api/main.go


# 使用 alpine 作为基础镜像
FROM alpine

# 安装 ffmpeg 和 CA 证书
RUN apk update --no-cache && \
    apk add --no-cache ca-certificates ffmpeg tzdata && \
    rm -rf /var/cache/apk/*

# 从 builder 阶段复制可执行文件到当前阶段
COPY --from=builder /app/main .
COPY --from=builder /app/web ./web
COPY --from=builder /app/configs ./configs

# 设置时区
ENV TZ=Asia/Shanghai

# 暴露端口
EXPOSE 8080

# 运行应用程序
CMD ["./main"]