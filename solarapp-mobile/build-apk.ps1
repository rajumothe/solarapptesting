#!/usr/bin/env pwsh
$ErrorActionPreference = "Continue"

Write-Host "🚀 Starting Solar App APK Build..." -ForegroundColor Cyan
Write-Host ""

$projectDir = "D:\solar_app\solarapp-mobile"
$originalDir = Get-Location

try {
    Set-Location $projectDir
    Write-Host "✅ Changed to project directory: $(Get-Location)" -ForegroundColor Green
    Write-Host ""
    
    $env:EAS_NO_VCS = "1"
    Write-Host "⚙️  Building Android APK..." -ForegroundColor Yellow
    Write-Host ""
    
    & npx eas build --platform android --profile production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
finally {
    Set-Location $originalDir
    Write-Host ""
    Write-Host "Returned to original directory: $(Get-Location)" -ForegroundColor Gray
}
