#!/bin/bash
# GooseArt 飞书登录 - 一键部署脚本
# 在服务器 1.14.107.50 上执行此脚本
#
# 使用方法：
#   1. 将 gooseArtLogin 文件夹上传到服务器（如 /opt/gooseart-feishu-login/）
#   2. cd /opt/gooseart-feishu-login
#   3. chmod +x deploy.sh
#   4. ./deploy.sh

set -e

APP_NAME="gooseart-feishu-login"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "====================================="
echo " GooseArt 飞书登录 - 部署"
echo "====================================="
echo ""
echo "应用目录: $APP_DIR"
echo ""

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi
echo "[✓] Node.js $(node -v)"

# 2. 检查/安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "[i] 正在安装 PM2..."
    npm install -g pm2
fi
echo "[✓] PM2 $(pm2 -v)"

# 3. 安装依赖
echo ""
echo "[i] 安装 npm 依赖..."
cd "$APP_DIR"
npm install --production

# 4. 检查 .env 文件
if [ ! -f .env ]; then
    echo ""
    echo "[错误] 缺少 .env 文件！请创建："
    echo "  cp .env.example .env"
    echo "  vim .env"
    exit 1
fi
echo "[✓] .env 配置文件存在"

# 5. 启动/重启服务
echo ""
echo "[i] 启动服务..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 6. 设置开机自启
pm2 startup 2>/dev/null || true

# 7. 健康检查
echo ""
echo "[i] 等待服务启动..."
sleep 2

HEALTH=$(curl -s http://127.0.0.1:3001/health 2>/dev/null || echo "failed")
if echo "$HEALTH" | grep -q '"ok"'; then
    echo "[✓] 服务健康检查通过！"
else
    echo "[!] 健康检查未通过，查看日志："
    echo "  pm2 logs $APP_NAME"
fi

echo ""
echo "====================================="
echo " 部署完成！"
echo "====================================="
echo ""
echo "下一步 - 配置 Nginx："
echo "  1. 将 nginx/feishu-login.conf 中的 location 块"
echo "     添加到你服务器 1.14.107.50 的 nginx server 配置中"
echo "  2. sudo nginx -t"
echo "  3. sudo nginx -s reload"
echo ""
echo "常用命令："
echo "  pm2 logs $APP_NAME     # 查看日志"
echo "  pm2 restart $APP_NAME  # 重启服务"
echo "  pm2 status             # 查看状态"
echo ""
