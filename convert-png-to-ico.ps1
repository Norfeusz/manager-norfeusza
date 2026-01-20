# Skrypt PowerShell do konwersji PNG na ICO
param(
    [string]$SourcePng = "logo.png",
    [string]$TargetIco = "logo.ico"
)

Add-Type -AssemblyName System.Drawing

$png = [System.Drawing.Image]::FromFile((Resolve-Path $SourcePng))

# Stwórz ikonę w różnych rozmiarach (16x16, 32x32, 48x48, 256x256)
$icon = [System.Drawing.Icon]::FromHandle(
    (New-Object System.Drawing.Bitmap($png, 256, 256)).GetHicon()
)

# Zapisz jako ICO
$iconStream = [System.IO.File]::Create((Join-Path (Get-Location) $TargetIco))
$icon.Save($iconStream)
$iconStream.Close()

Write-Host "Przekonwertowano $SourcePng na $TargetIco" -ForegroundColor Green

# Zwolnij zasoby
$png.Dispose()
