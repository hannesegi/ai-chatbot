#!/bin/bash

echo "🔍 Running security check..."

# Check for malware files
MALWARE_FILES=("config.js" "proc.js" "utils.js" "watcher.js" "main.js" "network.js")
for file in "${MALWARE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "❌ ALERT: Malware file detected: $file"
        exit 1
    fi
done

# Check for mining directories
if [ -d "xmrig-6.24.0" ] || [ -f "kal.tar.gz" ]; then
    echo "❌ ALERT: Mining software detected!"
    exit 1
fi

# Check for suspicious processes
if pgrep -x "xmrig" > /dev/null; then
    echo "❌ ALERT: xmrig process is running!"
    pkill -9 xmrig
    exit 1
fi

# Search for suspicious code
if grep -r "xmrig\|c3pool\|mining" --include="*.js" --include="*.ts" . 2>/dev/null | grep -v node_modules; then
    echo "❌ ALERT: Suspicious mining code found!"
    exit 1
fi

echo "✅ Security check passed! System is clean."
exit 0