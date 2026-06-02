#!/bin/bash
# One-time setup: map studysummarizer to localhost
HOSTS_FILE="/etc/hosts"
ENTRY="127.0.0.1 studysummarizer"

if grep -qE "[[:space:]]studysummarizer([[:space:]]|$)" "$HOSTS_FILE" 2>/dev/null; then
  echo "✓ studysummarizer 已在 hosts 中配置"
  grep "studysummarizer" "$HOSTS_FILE"
  exit 0
fi

echo "需要管理员权限，将添加: $ENTRY"
echo "$ENTRY" | sudo tee -a "$HOSTS_FILE" > /dev/null
echo "✓ 已添加。现在可通过 http://studysummarizer 访问（需先启动 npm run dev）"
