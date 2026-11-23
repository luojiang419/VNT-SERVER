FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# 复制必要的文件
COPY web_server.py /app/
COPY vnts /app/
COPY static /app/static
COPY key /app/key
COPY log /app/log

# 设置vnts可执行权限
RUN chmod +x /app/vnts

# 安装Python依赖
RUN pip install --no-cache-dir flask

# 暴露端口
EXPOSE 8888 1666 29870

# 启动命令
CMD ["python", "web_server.py", "--host", "0.0.0.0", "--port", "8888"]
