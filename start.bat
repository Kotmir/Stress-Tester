@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: Инициализация ANSI-кодов для красивых цветов (как на скрине)
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RED=%ESC%[38;2;235;75;85m"
set "WHITE=%ESC%[38;2;255;255;255m"
set "GRAY=%ESC%[38;2;120;120;120m"
set "RESET=%ESC%[0m"

:: Настройки окна консоли
title KotMiks Stresser v1.0
mode con: cols=86 lines=25

:menu
cls
echo %RED%
echo        ██╗  ██╗ ██████╗ ████████╗███╗   ███╗██╗██╗  ██╗███████╗
echo        ██║ ██╔╝██╔═══██╗╚══██╔══╝████╗ ████║██║██║ ██╔╝██╔════╝
echo        █████╔╝ ██║   ██║   ██║   ██╔████╔██║██║█████╔╝ ███████╗
echo        ██╔═██╗ ██║   ██║   ██║   ██║╚██╔╝██║██║██╔═██╗ ╚════██║
echo        ██║  ██╗╚██████╔╝   ██║   ██║ ╚═╝ ██║██║██║  ██╗███████║
echo        ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚══════╝
echo %GRAY% ----------------------------------------------------------------------------------
echo                            %WHITE%v 1.0.0 %GRAY%^| %WHITE%https://discord.gg/kotmiks
echo                     %RED%[%WHITE%i%RED%] %WHITE%Модуль k6: Готов %GRAY%^| %RED%[%WHITE%i%RED%] %WHITE%Система: Активна
echo %GRAY% ----------------------------------------------------------------------------------
echo.
echo              %RED%[%WHITE%01%RED%] %WHITE%Start Stress Test       %RED%[%WHITE%04%RED%] %WHITE%Open Logs Folder
echo              %RED%[%WHITE%02%RED%] %WHITE%Check k6 Version        %RED%[%WHITE%05%RED%] %WHITE%Clear Logs
echo              %RED%[%WHITE%03%RED%] %WHITE%System Info             %RED%[%WHITE%00%RED%] %WHITE%Exit
echo.
set /p choice="%WHITE% Выбор: %RESET%"

if "%choice%"=="1" goto start
if "%choice%"=="01" goto start
if "%choice%"=="2" goto check
if "%choice%"=="02" goto check
if "%choice%"=="3" goto sys
if "%choice%"=="03" goto sys
if "%choice%"=="4" goto logs
if "%choice%"=="04" goto logs
if "%choice%"=="5" goto clear
if "%choice%"=="05" goto clear
if "%choice%"=="0" exit
if "%choice%"=="00" exit

goto menu

:start
cls
echo %RESET%
node run.js
echo.
echo %GRAY%[ Нажмите любую клавишу для возврата в меню ]%RESET%
pause >nul
goto menu

:check
cls
echo %WHITE%Проверка версии k6...%RESET%
k6 version
echo.
echo %GRAY%[ Нажмите любую клавишу для возврата в меню ]%RESET%
pause >nul
goto menu

:sys
cls
echo %WHITE%[System Information]%RESET%
echo Node.js Version:
node -v
echo.
echo %GRAY%[ Нажмите любую клавишу для возврата в меню ]%RESET%
pause >nul
goto menu

:logs
if exist "%~dp0logs" (
    explorer "%~dp0logs"
) else (
    mkdir "%~dp0logs"
    explorer "%~dp0logs"
)
goto menu

:clear
cls
echo %RED%Очистка старых логов...%RESET%
if exist "%~dp0logs\*.json" del /q "%~dp0logs\*.json"
if exist "%~dp0logs\*.html" del /q "%~dp0logs\*.html"
echo %WHITE%Папка логов успешно очищена.%RESET%
echo.
echo %GRAY%[ Нажмите любую клавишу для возврата в меню ]%RESET%
pause >nul
goto menu