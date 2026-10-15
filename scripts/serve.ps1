# Amaç: Oktos Workshop'u yerelde sunar (ES modülleri dosyadan açılamaz, sunucu gerekir).
# Girdi: -Port (varsayılan 8080)
# Çıktı: http://localhost:<Port> adresinde önbelleksiz statik sunucu. Hiçbir dosyayı değiştirmez.
param([int]$Port = 8080)
python "$PSScriptRoot\serve.py" $Port
