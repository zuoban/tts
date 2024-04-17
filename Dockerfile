# 使用官方 Golang 镜像作为构建环境
FROM golang:1.22-alpine as builder
ENV CGO_ENABLED 0
ENV GOPROXY https://goproxy.cn,direct

# 设置工作目录
WORKDIR /app

# 将 go.mod 和 go.sum 文件复制到工作目录
COPY go.mod go.sum ./

# 下载所有依赖项
RUN go mod download

# 将源代码复制到工作目录
COPY . .

# 构建 Go 应用程序
RUN go build -o main . && ls


# 使用 scratch 作为基础镜像
FROM alpine

# 从 builder 阶段复制可执行文件到当前阶段
COPY --from=builder /app/main .
COPY --from=builder /app/templates ./templates
RUN apk update --no-cache && apk add --no-cache ca-certificates
ENV TZ Asia/Shanghai

# 暴露端口
EXPOSE 8080

# 运行应用程序
CMD ["./main"]