#!/bin/bash

# 设置变量
DEV_DIR="/root/dev"
PROJECT_DIR="${DEV_DIR}/DevConsole"
ARCHIVE_URL="https://r2lobe.marquez.cc/deploy/dev-console/dev-console-archive.tar.gz"
ARCHIVE_FILE="dev-console-archive.tar.gz"
TIMESTAMP=$(date +"%Y-%m-%d_%H:%M:%S")

# 检查 /root/dev/DevConsole 是否存在
if [ ! -d "$PROJECT_DIR" ]; then
  echo "项目目录不存在，开始创建..."
  
  # 检查 /root/dev 是否存在，不存在则创建
  if [ ! -d "$DEV_DIR" ]; then
    echo "创建目录: $DEV_DIR"
    mkdir -p "$DEV_DIR"
  fi
  
  # 克隆仓库
  echo "克隆仓库到: $PROJECT_DIR"
  cd "$DEV_DIR"
  git clone git@github.com:Camusama/DevConsole.git
  
  if [ $? -ne 0 ]; then
    echo "克隆仓库失败，退出脚本"
    exit 1
  fi
else
  echo "项目目录已存在，更新代码..."
  
  # 进入项目目录并更新代码
  cd "$PROJECT_DIR"
  git checkout main
  git pull
  
  if [ $? -ne 0 ]; then
    echo "更新代码失败，退出脚本"
    exit 1
  fi
fi

# 确保当前在项目目录中
cd "$PROJECT_DIR"

# 下载压缩包
echo "下载压缩包: $ARCHIVE_URL"
curl -L -o "$ARCHIVE_FILE" "$ARCHIVE_URL"

if [ $? -ne 0 ]; then
  echo "下载压缩包失败，退出脚本"
  exit 1
fi

# 解压压缩包，覆盖当前文件
echo "解压压缩包并覆盖当前文件..."
tar -xzf "$ARCHIVE_FILE" --overwrite

if [ $? -ne 0 ]; then
  echo "解压压缩包失败，退出脚本"
  exit 1
fi

# 删除压缩包
rm "$ARCHIVE_FILE"

# 提交更改
echo "提交更改到 Git..."
git add .
git commit -m "chore: deploy ${TIMESTAMP}"
git push

if [ $? -ne 0 ]; then
  echo "推送更改失败"
  exit 1
fi

echo "部署完成！"