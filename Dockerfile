# #set node_base
# FROM alpine:latest
# RUN apk add --no-cache --update nodejs npm

FROM shareven/node_base:latest

RUN apk add --no-cache libc6-compat

WORKDIR /teslashow
COPY package.json /teslashow/

# 安装依赖
RUN npm install --verbose

# 复制源代码
COPY . /teslashow/

# 设置时区环境变量
# ENV TZ=UTC
# 如果需要使用中国时区，可以改为：
ENV TZ=Asia/Shanghai

LABEL version="2.6"
LABEL description="TeslaShow"
# 暴露端口
EXPOSE 3000

# 运行时构建并启动应用
CMD ["npm","run","start"]
