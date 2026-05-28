# Upload dist/ to private S3 + optional CloudFront invalidation
# Usage:
#   $env:BUCKET = "ey-intelligent-dashboard-demo-123456789"
#   $env:DISTRIBUTION_ID = "E1234567890ABC"   # optional
#   .\deploy\upload.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $env:BUCKET) {
  Write-Error "Set env:BUCKET to your private S3 bucket name."
}

if (-not (Test-Path "dist\index.html")) {
  Write-Host "dist/ missing — running npm run build..."
  npm run build
}

Write-Host "Syncing assets to s3://$($env:BUCKET)/ ..."
aws s3 sync dist/ "s3://$($env:BUCKET)/" --delete `
  --cache-control "public,max-age=31536000,immutable" `
  --exclude "index.html" `
  --exclude "*.html"

Write-Host "Uploading index.html (no long cache)..."
aws s3 cp dist/index.html "s3://$($env:BUCKET)/index.html" `
  --cache-control "public,max-age=0,must-revalidate" `
  --content-type "text/html"

if ($env:DISTRIBUTION_ID) {
  Write-Host "Invalidating CloudFront $($env:DISTRIBUTION_ID)..."
  aws cloudfront create-invalidation `
    --distribution-id $env:DISTRIBUTION_ID `
    --paths "/*"
}

Write-Host "Done."
