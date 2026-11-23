# VNTS 服务端 Docker 部署指南

## 快速开始

### 1. 构建 Docker 镜像

```bash
cd /root/ee2x/ee2x-vnts
docker build -t vnts-server:latest .
```

### 2. 使用 Docker Compose 启动

```bash
docker-compose up -d
```

### 3. 访问管理界面

- Web管理界面: http://服务器IP:8888/admin.html
- vnts Web UI: http://服务器IP:29870/
- 默认账号: admin / password

## 端口说明

- **8888**: Web管理界面端口
- **1666**: vnts服务端口（UDP/TCP）
- **29870**: vnts Web UI端口

## 配置持久化

配置文件和日志通过 volume 映射到宿主机：
- `./server_config.json`: 配置文件
- `./vnts.log`: 运行日志

## 手动运行（不使用 Docker Compose）

```bash
docker run -d \
  --name vnts-server \
  -p 8888:8888 \
  -p 1666:1666 \
  -p 29870:29870 \
  -v $(pwd)/server_config.json:/app/server_config.json \
  -v $(pwd)/vnts.log:/app/vnts.log \
  vnts-server:latest
```

## 管理命令

### 查看日志
```bash
docker logs -f vnts-server
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新镜像
```bash
docker-compose down
docker build -t vnts-server:latest .
docker-compose up -d
```

## 新服务器快速部署

1. 复制以下文件到新服务器：
   - Dockerfile
   - docker-compose.yml
   - web_server.py
   - vnts（Linux可执行文件）
   - static/（完整目录）
   - key/（完整目录）
   - log/（完整目录）

2. 构建并启动：
```bash
docker-compose up -d
```

3. 首次访问后立即修改默认密码

## 安全建议

1. 修改默认账号密码（通过Web管理界面的设置按钮）
2. 配置防火墙规则，仅开放必要端口
3. 生产环境建议使用 Nginx + SSL 反向代理
4. 定期备份 server_config.json 配置文件
