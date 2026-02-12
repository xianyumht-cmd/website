# Configuration
$SiteDomain = "https://xn--8pv109c.top"
$BaiduApi = "http://data.zz.baidu.com/urls?site=https://xn--8pv109c.top&token=OCFwmra3ihOcjGFA"

try {
    # Get project root directory
    $RootDir = (Get-Item $PSScriptRoot).Parent.FullName
    Write-Host "Scanning Project Directory: $RootDir" -ForegroundColor Cyan

    # Scan HTML files
    $Files = Get-ChildItem -Path $RootDir -Recurse -Filter "*.html" | Where-Object { 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "dist" -and
        $_.Name -ne "404.html"
    }

    $FileCount = $Files.Count
    Write-Host "Found $FileCount HTML files." -ForegroundColor Cyan

    $Urls = @()

    foreach ($File in $Files) {
        # Get relative path
        $RelativePath = $File.FullName.Substring($RootDir.Length + 1).Replace("\", "/")
        
        # URL transformation rules
        if ($RelativePath.EndsWith("index.html")) {
            # For index.html, use parent directory as URL
            $DirPath = [System.IO.Path]::GetDirectoryName($RelativePath).Replace("\", "/")
            if ($DirPath -eq "") {
                $Url = "$SiteDomain/"
            } else {
                $Url = "$SiteDomain/$DirPath/"
            }
        } else {
            # For other files, use relative path
            $Url = "$SiteDomain/$RelativePath"
        }
        
        $Urls += $Url
    }

    # Exit if no URLs found
    if ($Urls.Count -eq 0) {
        Write-Host "No URLs to push." -ForegroundColor Yellow
        exit
    }

    Write-Host "`nPreparing to push the following $($Urls.Count) URLs:" -ForegroundColor Green
    $Urls | ForEach-Object { Write-Host "- $_" }

    # Send POST request
    $Body = $Urls -join "`n"
    
    Write-Host "`nSending request to Baidu API..." -ForegroundColor Cyan
    $Response = Invoke-RestMethod -Uri $BaiduApi -Method Post -Body $Body -ContentType "text/plain"
    
    Write-Host "`nBaidu API Response:" -ForegroundColor Cyan
    
    if ($Response.success) {
        Write-Host "SUCCESS! Pushed $($Response.success) URLs." -ForegroundColor Green
        Write-Host "Remaining quota for today: $($Response.remain)"
    } else {
        Write-Host "FAILED. Please check the response below:" -ForegroundColor Yellow
        $Response | Format-List
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
