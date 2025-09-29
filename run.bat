@echo off
setlocal enabledelayedexpansion

REM 一键运行脚本 - Canvas with LangGraph Python 项目 (Windows)
REM 使用 Docker Compose 启动前端和后端服务

set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 打印带颜色的消息
:print_message
echo %~2%~1%NC%
goto :eof

REM 检查 Docker 是否安装
:check_docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_message "错误: Docker 未安装，请先安装 Docker" %RED%
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    call :print_message "错误: Docker Compose 未安装，请先安装 Docker Compose" %RED%
    exit /b 1
)
goto :eof

REM 检查环境变量文件
:check_env
if not exist ".env" (
    call :print_message "警告: .env 文件不存在，正在从 .env.example 创建..." %YELLOW%
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        call :print_message "已创建 .env 文件，请编辑其中的配置" %GREEN%
    ) else (
        call :print_message "错误: .env.example 文件不存在" %RED%
        exit /b 1
    )
)
goto :eof

REM 显示帮助信息
:show_help
echo Canvas with LangGraph Python - 一键运行脚本
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   start     启动所有服务 (默认)
echo   stop      停止所有服务
echo   restart   重启所有服务
echo   build     构建镜像
echo   logs      查看日志
echo   clean     清理容器和镜像
echo   status    查看服务状态
echo   help      显示此帮助信息
echo.
echo 示例:
echo   %~nx0 start    # 启动服务
echo   %~nx0 logs     # 查看日志
echo   %~nx0 clean    # 清理环境
goto :eof

REM 启动服务
:start_services
call :print_message "正在启动 Canvas with LangGraph Python 服务..." %BLUE%

REM 检查环境
call :check_docker
if errorlevel 1 exit /b 1
call :check_env
if errorlevel 1 exit /b 1

REM 构建并启动服务
call :print_message "构建 Docker 镜像..." %YELLOW%
docker compose build
if errorlevel 1 (
    call :print_message "镜像构建失败" %RED%
    exit /b 1
)

call :print_message "启动服务..." %YELLOW%
docker compose up -d
if errorlevel 1 (
    call :print_message "服务启动失败" %RED%
    exit /b 1
)

REM 等待服务启动
call :print_message "等待服务启动..." %YELLOW%
timeout /t 10 /nobreak >nul

REM 检查服务状态
docker compose ps | findstr "Up" >nul
if errorlevel 1 (
    call :print_message "❌ 服务启动失败，请检查日志" %RED%
    docker compose logs
    exit /b 1
) else (
    call :print_message "✅ 服务启动成功！" %GREEN%
    call :print_message "前端地址: http://localhost:3000" %GREEN%
    call :print_message "后端地址: http://localhost:8123" %GREEN%
    call :print_message "使用 '%~nx0 logs' 查看日志" %BLUE%
)
goto :eof

REM 停止服务
:stop_services
call :print_message "正在停止服务..." %YELLOW%
docker compose down
call :print_message "✅ 服务已停止" %GREEN%
goto :eof

REM 重启服务
:restart_services
call :print_message "正在重启服务..." %YELLOW%
docker compose restart
call :print_message "✅ 服务已重启" %GREEN%
goto :eof

REM 构建镜像
:build_images
call :print_message "正在构建 Docker 镜像..." %YELLOW%
docker compose build --no-cache
if errorlevel 1 (
    call :print_message "镜像构建失败" %RED%
    exit /b 1
) else (
    call :print_message "✅ 镜像构建完成" %GREEN%
)
goto :eof

REM 查看日志
:show_logs
call :print_message "显示服务日志 (按 Ctrl+C 退出)..." %BLUE%
docker compose logs -f
goto :eof

REM 清理环境
:clean_environment
call :print_message "正在清理 Docker 环境..." %YELLOW%

REM 停止并删除容器
docker compose down -v --remove-orphans

REM 删除镜像
docker compose down --rmi all

REM 清理未使用的资源
docker system prune -f

call :print_message "✅ 环境清理完成" %GREEN%
goto :eof

REM 查看服务状态
:show_status
call :print_message "服务状态:" %BLUE%
docker compose ps
goto :eof

REM 主函数
:main
if "%1"=="" goto :start_services
if "%1"=="start" goto :start_services
if "%1"=="stop" goto :stop_services
if "%1"=="restart" goto :restart_services
if "%1"=="build" goto :build_images
if "%1"=="logs" goto :show_logs
if "%1"=="clean" goto :clean_environment
if "%1"=="status" goto :show_status
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

call :print_message "未知选项: %1" %RED%
call :show_help
exit /b 1

REM 执行主函数
call :main %*
