# start-ngrok.ps1 — запускает ngrok http 3000 (совместим с Windows PowerShell 5.1)
param([int]$Port = 3000)

$ngrok = $null

# 1) Пытаемся найти ngrok в PATH
$cmd = Get-Command ngrok -ErrorAction SilentlyContinue
if ($cmd) { $ngrok = $cmd.Source }

# 2) Стандартная установка (для MSIX/Standalone)
if (-not $ngrok) {
    $candidate1 = Join-Path $env:LOCALAPPDATA "Programs\ngrok\ngrok.exe"
    if (Test-Path $candidate1) { $ngrok = $candidate1 }
}

# 3) Program Files
if (-not $ngrok) {
    $candidate2 = "C:\Program Files\ngrok\ngrok.exe"
    if (Test-Path $candidate2) { $ngrok = $candidate2 }
}

# 4) Рядом со скриптом
if (-not $ngrok) {
    $candidate3 = Join-Path $PSScriptRoot "ngrok.exe"
    if (Test-Path $candidate3) { $ngrok = $candidate3 }
}

# 5) Если нигде не нашли — даём инструкцию
if (-not $ngrok) {
    Write-Host "ngrok.exe не найден."
    Write-Host "Варианты решения:"
    Write-Host "  1) Установить через winget:  winget install --id ngrok.ngrok -e"
    Write-Host "  2) Скачать ngrok.exe и положить рядом с этим скриптом: $PSScriptRoot"
    Write-Host "  3) Или добавить папку с ngrok.exe в PATH, затем открыть новое окно PowerShell"
    exit 1
}

Write-Host "Использую ngrok: $ngrok"
& $ngrok http $Port
