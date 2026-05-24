# VNT服务端 Linux版本部署指南

## 系统要求

- Linux操作系统（Ubuntu/Debian/CentOS/RHEL等）
- Python 3.6+
- pip3

## 快速开始

### 1. 下载vnts可执行文件

从 [vnt releases](https://github.com/vnt-dev/vnt/releases) 下载Linux版本的vnts可执行文件，放到项目根目录。

```bash
# 下载vnts Linux版本
curl -L https://github.com/vnt-dev/vnt/releases/download/1.2.12/vnts-x86_64-unknown-linux-musl -o vnts
chmod +x vnts
```

### 2. 一键启动

```bash
./start.sh
```

脚本会自动：
- 检测Python3和pip3
- 安装必要的Python依赖（flask, requests）
- 创建默认配置文件
- 启动Web管理界面

### 3. 访问管理界面

浏览器打开：`http://服务器IP:8888/admin.html`

默认账号：`admin`
默认密码：`password`

## 功能特性

### Web管理界面

- **基础配置**：监听端口、虚拟网关、子网掩码、Web端口等
- **组网配置**：支持多个组网编号和密码
- **服务控制**：启动/停止vnts服务
- **实时日志**：查看服务运行日志
- **黑名单管理**：禁止特定用户连接

### 配置说明

配置文件：`server_config.json`

```json
{
    "listen_port": "1666",           // vnts监听端口
    "virtual_gateway": "192.168.188.1",  // 虚拟网关IP
    "subnet_mask": "255.255.255.0",  // 子网掩码
    "web_ui_port": "29870",          // vnts API端口
    "api_username": "admin",         // Web管理账号
    "api_password": "password",      // Web管理密码
    "network_groups": [              // 组网配置
        {"id": "group1", "password": "pass1"}
    ],
    "blacklist": []                  // 黑名单
}
```

## 手动部署

如果不使用一键启动脚本，可以手动执行：

```bash
# 1. 安装依赖
pip3 install flask requests

# 2. 启动Web服务器
python3 web_server.py --port 8888

# 3. 在Web界面中启动vnts服务
```

## 后台运行

### 使用nohup

```bash
nohup ./start.sh > vnts.log 2>&1 &
```

### 使用systemd

创建服务文件 `/etc/systemd/system/vnts-web.service`：

```ini
[Unit]
Description=VNT Server Web Manager
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/vnts-1.2.12
ExecStart=/usr/bin/python3 /path/to/vnts-1.2.12/web_server.py --port 8888
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
systemctl daemon-reload
systemctl enable vnts-web
systemctl start vnts-web
systemctl status vnts-web
```

## 防火墙配置

需要开放以下端口：

- `8888`：Web管理界面端口
- `1666`：vnts服务端口（UDP）
- `29870`：vnts API端口

```bash
# Ubuntu/Debian (ufw)
ufw allow 8888/tcp
ufw allow 1666/udp
ufw allow 29870/tcp

# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-port=8888/tcp
firewall-cmd --permanent --add-port=1666/udp
firewall-cmd --permanent --add-port=29870/tcp
firewall-cmd --reload
```

## 常见问题

### 1. 权限不足

```bash
chmod +x start.sh vnts
```

### 2. 端口被占用

修改 `server_config.json` 中的端口配置。

### 3. Python依赖安装失败

```bash
# 使用国内镜像源
pip3 install -i https://pypi.tuna.tsinghua.edu.cn/simple flask requests
```

### 4. vnts启动失败

检查日志输出，确保：
- vnts文件有执行权限
- 端口未被占用
- 配置参数正确

## 安全建议

1. **修改默认密码**：首次登录后立即修改Web管理密码
2. **使用防火墙**：仅开放必要端口
3. **HTTPS访问**：生产环境建议使用Nginx反向代理并配置SSL
4. **定期更新**：及时更新vnts到最新版本

## 技术支持

- VNT项目：https://github.com/lbl8603/vnt
- 问题反馈：提交Issue到项目仓库
