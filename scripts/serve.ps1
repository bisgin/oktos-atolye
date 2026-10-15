# Amaç: Oktos Workshop'u yerelde sunar (ES modülleri dosyadan açılamaz, sunucu gerekir).
# Girdi: -Port (varsayılan 8080)
# Çıktı: http://localhost:<Port> adresinde statik sunucu. Hiçbir dosyayı değiştirmez.
param([int]$Port = 8080)
$root = Split-Path -Parent $PSScriptRoot
Write-Host "Oktos Workshop -> http://localhost:$Port  (durdurmak icin Ctrl+C)"
python -m http.server $Port --directory $root
