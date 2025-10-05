# === check-env.ps1 ===
# Проверяет заполненность всех ключей в .env файле

$envFile = ".\.env"

if (-Not (Test-Path $envFile)) {
    Write-Host "❌ Файл .env не найден в текущей папке: $PWD" -ForegroundColor Red
    exit
}

Write-Host "🔍 Проверяю .env в $PWD`n" -ForegroundColor Cyan

# Список ключей, которые должны быть в .env
$requiredKeys = @(
    "OPENAI_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_NUMBER",
    "PUBLIC_BASE_URL",
    "DATABASE_URL",
    "REDIS_URL",
    "ENCRYPTION_KEY",
    "ELEVENLABS_API_KEY",
    "WHATSAPP_VERIFY_TOKEN"
)

# Читаем .env файл
$content = Get-Content $envFile | Where-Object {$_ -match "="}

foreach ($key in $requiredKeys) {
    $line = $content | Where-Object { $_ -match "^$key=" }
    if ($line) {
        $value = ($line -split "=",2)[1].Trim()
        if ([string]::IsNullOrWhiteSpace($value)) {
            Write-Host "🔴 $key — НЕ заполнен" -ForegroundColor Red
        } else {
            Write-Host "🟢 $key — OK" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  $key — отсутствует в .env" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Проверка завершена." -ForegroundColor Cyan
