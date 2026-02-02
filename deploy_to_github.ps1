$ErrorActionPreference = "Continue"

# 1. Setup Node.js environment variables
$NodePath = "D:\project2\website-main\tools\node-v24.13.0-win-x64"
if (Test-Path $NodePath) {
    Write-Host ">>> Detected local Node.js, configuring environment..."
    $env:Path = "$NodePath;$env:Path"
    Write-Host "Node Version: $(node --version)"
    Write-Host "NPM Version: $(npm --version)"
} else {
    Write-Warning "Local Node.js directory not found: $NodePath"
}

Write-Host "`n>>> 1. Building project (npm run build)..."
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
} catch {
    Write-Error "Error during build: $_"
    exit 1
}

if (!(Test-Path "dist")) {
    Write-Error "Error: dist directory was not generated"
    exit 1
}

# Ensure anti-debug.js exists in dist
$AntiDebugSource = "shared\anti-debug.js"
$AntiDebugDist = "dist\anti-debug.js"
if (Test-Path $AntiDebugSource) {
    Copy-Item $AntiDebugSource $AntiDebugDist -Force
    Write-Host "Ensured anti-debug.js is copied to build directory"
}

Write-Host "`n>>> 2. Preparing for deployment..."
Set-Location dist

# Initialize Git
if (!(Test-Path ".git")) {
    git init
}

# Configure Git user
if (!(git config user.email)) {
    git config user.email "deploy@localhost"
    git config user.name "Deploy Bot"
}

# Switch branch
git checkout -B main

# Configure remote
$remoteUrl = "https://github.com/xianyumht-cmd/website"
if ((git remote) -contains "origin") {
    git remote set-url origin $remoteUrl
} else {
    git remote add origin $remoteUrl
}

# Commit
git add -A
git commit -m "Deploy: Update site content" --allow-empty

# Push
Write-Host "`n>>> 3. Pushing to GitHub..."
git push -f origin main

Write-Host "`n----------------------------------------"
Write-Host "Deployment Successful!"
