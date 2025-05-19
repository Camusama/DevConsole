#!/bin/bash

# 设置变量
PROJECT_DIR="$(pwd)"
ARCHIVE_NAME="dev-console_archive.tar.gz"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "错误: 请在项目根目录下运行此脚本"
  exit 1
fi

echo "开始创建压缩包: ${ARCHIVE_NAME}"

# 使用 git 命令列出所有非忽略的文件
# 这会自动排除 .gitignore 中指定的文件
FILES_TO_ARCHIVE=$(git ls-files)

if [ -z "$FILES_TO_ARCHIVE" ]; then
  echo "错误: 没有找到要归档的文件，请确保这是一个 git 仓库"
  exit 1
fi

# 创建临时文件列表
TEMP_FILE_LIST=$(mktemp)
echo "$FILES_TO_ARCHIVE" > "$TEMP_FILE_LIST"

# 使用 tar 创建压缩包
tar -czf "$ARCHIVE_NAME" -T "$TEMP_FILE_LIST"

# 清理临时文件
rm "$TEMP_FILE_LIST"

# 显示结果
if [ $? -eq 0 ]; then
  echo "压缩包创建成功: ${PROJECT_DIR}/${ARCHIVE_NAME}"
  echo "压缩包大小: $(du -h "$ARCHIVE_NAME" | cut -f1)"
else
  echo "创建压缩包时出错"
  exit 1
fi