#!/bin/bash

# 定义变量
APP_NAME="app.jar"
LOG_FILE="app.log"
PID_FILE="app.pid"

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 停止旧进程
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null; then
        echo "Stopping existing process $PID..."
        kill $PID
        # 等待进程结束
        for i in {1..10}; do
            if ! ps -p $PID > /dev/null; then
                break
            fi
            sleep 1
        done
        # 强制杀死
        if ps -p $PID > /dev/null; then
            echo "Force killing process $PID..."
            kill -9 $PID
        fi
    else
        echo "Process $PID not found."
    fi
    rm "$PID_FILE"
fi

# 再次检查是否有残留的同名 jar 进程（防止 PID 文件丢失的情况）
EXISTING_PID=$(ps -ef | grep "$APP_NAME" | grep -v grep | awk '{print $2}')
if [ -n "$EXISTING_PID" ]; then
    echo "Killing found process $EXISTING_PID..."
    kill -9 $EXISTING_PID
fi

# 启动新进程
echo "Starting new process..."

# 加载环境变量（优先加载 .env 文件，如果存在）
if [ -f ".env" ]; then
    echo "Loading environment variables from .env..."
    # 过滤掉注释和空行，并确保每一行都是合法的 export 格式
    while IFS= read -r line || [[ -n "$line" ]]; do
        # 忽略注释和空行
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "$line" ]] && continue
        # 导出变量
        export "$line"
    done < .env
fi

# 启动命令：
# 1. 指定 prod 配置文件（如果有）或者通过命令行参数覆盖
# 2. 内存限制（根据服务器配置调整，这里默认给 512M）
# 3. 后台运行
nohup java -Xms256m -Xmx512m -jar $APP_NAME > $LOG_FILE 2>&1 &

# 记录 PID
echo $! > "$PID_FILE"
echo "Application started with PID $(cat $PID_FILE). Logs are in $LOG_FILE"
