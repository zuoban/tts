# 构建镜像
docker build --tag zuoban/zb-tts  ..

# 启动容器
docker run --rm -e TTS_API_KEY=123456 -p 8088:8080 zuoban/zb-tts