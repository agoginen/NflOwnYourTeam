# MongoDB Setup Script for Windows
Write-Host "🏈 NFL Own Your Team - MongoDB Setup" -ForegroundColor Green

# Check if MongoDB is already installed
$mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue

if ($mongoInstalled) {
    Write-Host "✅ MongoDB is already installed!" -ForegroundColor Green
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    
    # Try to start MongoDB service
    try {
        Start-Service MongoDB -ErrorAction Stop
        Write-Host "✅ MongoDB service started successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  MongoDB service not found. Starting manually..." -ForegroundColor Yellow
        Start-Process "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Hidden
    }
} else {
    Write-Host "❌ MongoDB not found. Please install MongoDB:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1 - Install MongoDB Community Server:" -ForegroundColor Cyan
    Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Run the installer and follow the setup wizard" -ForegroundColor White
    Write-Host "3. Choose 'Complete' installation" -ForegroundColor White
    Write-Host "4. Install MongoDB as a Service" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2 - Use Docker (if Docker is installed):" -ForegroundColor Cyan
    Write-Host "1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "2. Run: docker run -d -p 27017:27017 --name mongodb mongo:7.0" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3 - Use Chocolatey (if Chocolatey is installed):" -ForegroundColor Cyan
    Write-Host "1. Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "2. Run: choco install mongodb" -ForegroundColor White
    Write-Host ""
}

# Create data directory if it doesn't exist
$dataDir = "C:\data\db"
if (!(Test-Path $dataDir)) {
    Write-Host "Creating MongoDB data directory: $dataDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

Write-Host ""
Write-Host "🔗 Useful MongoDB Commands:" -ForegroundColor Cyan
Write-Host "  Start MongoDB: mongod --dbpath C:\data\db" -ForegroundColor White
Write-Host "  Connect to MongoDB: mongosh" -ForegroundColor White
Write-Host "  Check MongoDB status: mongo --eval 'db.runCommand({ping: 1})'" -ForegroundColor White
Write-Host ""
Write-Host "After MongoDB is running, execute:" -ForegroundColor Green
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run seed" -ForegroundColor White
