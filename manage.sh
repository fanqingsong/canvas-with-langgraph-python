#!/bin/bash

# 一键运行脚本 - Canvas with LangGraph Python 项目
# 使用 Docker Compose 启动前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "错误: Docker 未安装，请先安装 Docker" $RED
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_message "错误: Docker Compose 未安装，请先安装 Docker Compose" $RED
        exit 1
    fi
}

# 检查环境变量文件
check_env() {
    if [ ! -f ".env" ]; then
        print_message "警告: .env 文件不存在，正在从 .env.example 创建..." $YELLOW
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_message "已创建 .env 文件，请编辑其中的配置" $GREEN
        else
            print_message "错误: .env.example 文件不存在" $RED
            exit 1
        fi
    fi
}

# 显示帮助信息
show_help() {
    echo "Canvas with LangGraph Python - 服务管理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start     启动所有服务 (默认)"
    echo "  quick     快速启动（使用缓存）"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  build     构建镜像"
    echo "  logs      查看日志"
    echo "  clean     清理容器和镜像"
    echo "  status    查看服务状态"
    echo "  help      显示此帮助信息"
    echo ""
    echo "其他启动脚本:"
    echo "  ./start-prod.sh    # 生产环境启动"
    echo "  ./start-dev.sh     # 开发环境启动（热加载）"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 logs     # 查看日志"
    echo "  $0 clean    # 清理环境"
}

# 启动服务
start_services() {
    print_message "正在启动 Canvas with LangGraph Python 服务..." $BLUE
    
    # 检查环境
    check_docker
    check_env
    
    # 构建并启动服务
    print_message "构建 Docker 镜像..." $YELLOW
    docker compose build
    
    print_message "启动服务..." $YELLOW
    docker compose up -d
    
    # 等待服务启动
    print_message "等待服务启动..." $YELLOW
    sleep 10
    
    # 检查服务状态
    if docker compose ps | grep -q "Up"; then
        print_message "✅ 服务启动成功！" $GREEN
        print_message "前端地址: http://localhost:3000" $GREEN
        print_message "后端地址: http://localhost:8123" $GREEN
        print_message "使用 '$0 logs' 查看日志" $BLUE
    else
        print_message "❌ 服务启动失败，请检查日志" $RED
        docker compose logs
        exit 1
    fi
}

# 快速启动（使用缓存）
quick_start() {
    print_message "快速启动服务（使用缓存）..." $BLUE
    
    # 检查环境
    check_docker
    check_env
    
    # 启动服务（不重新构建）
    print_message "启动服务..." $YELLOW
    docker compose up -d
    
    # 等待服务启动
    print_message "等待服务启动..." $YELLOW
    sleep 5
    
    # 检查服务状态
    print_message "检查服务状态..." $YELLOW
    docker compose ps
    
    if docker compose ps | grep -q "Up"; then
        print_message "✅ 服务启动成功！" $GREEN
        print_message "前端地址: http://localhost:3000" $GREEN
        print_message "后端地址: http://localhost:8123" $GREEN
        print_message "使用 '$0 logs' 查看日志" $BLUE
    else
        print_message "❌ 服务启动失败，请检查日志" $RED
        docker compose logs
        exit 1
    fi
}

# 停止服务
stop_services() {
    print_message "正在停止服务并清理..." $YELLOW
    docker compose down --remove-orphans
    print_message "✅ 服务已停止并清理完成" $GREEN
}

# 重启服务
restart_services() {
    print_message "正在重启服务..." $YELLOW
    docker compose restart
    print_message "✅ 服务已重启" $GREEN
}

# 构建镜像
build_images() {
    print_message "正在构建 Docker 镜像..." $YELLOW
    docker compose build --no-cache
    print_message "✅ 镜像构建完成" $GREEN
}

# 查看日志
show_logs() {
    print_message "显示服务日志 (按 Ctrl+C 退出)..." $BLUE
    docker compose logs -f
}

# 清理环境
clean_environment() {
    print_message "正在清理 Docker 环境..." $YELLOW
    
    # 停止并删除容器
    docker compose down -v --remove-orphans
    
    # 删除镜像
    docker compose down --rmi all
    
    # 清理未使用的资源
    docker system prune -f
    
    print_message "✅ 环境清理完成" $GREEN
}

# 查看服务状态
show_status() {
    print_message "服务状态:" $BLUE
    docker compose ps
}

# 主函数
main() {
    case "${1:-start}" in
        start)
            start_services
            ;;
        quick)
            quick_start
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_images
            ;;
        logs)
            show_logs
            ;;
        clean)
            clean_environment
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_message "未知选项: $1" $RED
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
