<#
  音频源分离应用启动脚本
  同时启动后端 (FastAPI) 和前端 (Vite)
#>

Write-Host "Starting Audio Source Separator..." -ForegroundColor Cyan

# 启动后端
Write-Host "Starting backend (port 8000)..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/c", "python main.py" -WorkingDirectory "$PSScriptRoot\backend"

# 等待后端启动
Start-Sleep -Seconds 2

# 启动前端
Write-Host "Starting frontend (port 5173)..." -ForegroundColor Green
Start-Process -FilePath "cmd" -ArgumentList "/c", "pnpm dev" -WorkingDirectory "$PSScriptRoot\frontend"

Write-Host ""
Write-Host "Services started:" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Yellow

# 等待用户按键
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "Stopping services..." -ForegroundColor Red
# 停止相关进程
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*audio-source-separator*" } | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*audio-source-separator*" } | Stop-Process -Force

Write-Host "Done." -ForegroundColor Green