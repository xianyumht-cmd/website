# 强制设置控制台编码为 UTF-8，防止乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 配置
$SiteDomain = "https://xn--8pv109c.top"
$BaiduApi = "http://data.zz.baidu.com/urls?site=https://xn--8pv109c.top&token=OCFwmra3ihOcjGFA"

try {
    # 获取当前脚本所在目录的上一级（项目根目录）
    $RootDir = (Get-Item $PSScriptRoot).Parent.FullName
    Write-Host "扫描项目目录: $RootDir" -ForegroundColor Cyan

    # 扫描 HTML 文件，排除 node_modules 和 .git
    $Files = Get-ChildItem -Path $RootDir -Recurse -Filter "*.html" | Where-Object { 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "dist" -and
        $_.Name -ne "404.html"
    }

    $Urls = @()

    foreach ($File in $Files) {
        # 获取相对路径
        $RelativePath = $File.FullName.Substring($RootDir.Length + 1).Replace("\", "/")
        
        # 转换 URL 规则
        if ($RelativePath.EndsWith("index.html")) {
            # 如果是 index.html，取其目录名作为 URL
            $DirPath = [System.IO.Path]::GetDirectoryName($RelativePath).Replace("\", "/")
            if ($DirPath -eq "") {
                $Url = "$SiteDomain/"
            } else {
                $Url = "$SiteDomain/$DirPath/"
            }
        } else {
            # 其他文件直接拼接
            $Url = "$SiteDomain/$RelativePath"
        }
        
        $Urls += $Url
    }

    # 输出将要推送的 URL
    if ($Urls.Count -eq 0) {
        Write-Host "没有找到需要推送的 HTML 文件。" -ForegroundColor Yellow
        exit
    }

    Write-Host "`n准备推送以下 $($Urls.Count) 个链接:" -ForegroundColor Green
    $Urls | ForEach-Object { Write-Host "- $_" }

    # 发送 POST 请求
    $Body = $Urls -join "`n"
    
    # 强制使用 UTF8 编码
    $Response = Invoke-RestMethod -Uri $BaiduApi -Method Post -Body $Body -ContentType "text/plain"
    
    Write-Host "`n百度 API 响应:" -ForegroundColor Cyan
    
    if ($Response.success) {
        Write-Host "✅ 推送成功！" -ForegroundColor Green
        Write-Host "  - 成功条数: $($Response.success)"
        Write-Host "  - 今日剩余: $($Response.remain)"
    } else {
        Write-Host "❌ 推送可能存在问题，请检查响应内容。" -ForegroundColor Yellow
        $Response | Format-List
    }
} catch {
    Write-Host "❌ 执行过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
}
