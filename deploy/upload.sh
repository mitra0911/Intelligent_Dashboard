#!/usr/bin/env bash
# Upload dist/ to private S3 + optional CloudFront invalidation
# export BUCKET=ey-intelligent-dashboard-demo-123456789
# export DISTRIBUTION_ID=E1234567890ABC   # optional
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

: "${BUCKET:?Set BUCKET to your private S3 bucket name}"

if [[ ! -f dist/index.html ]]; then
  echo "dist/ missing — running npm run build..."
  npm run build
fi

echo "Syncing assets to s3://${BUCKET}/ ..."
aws s3 sync dist/ "s3://${BUCKET}/" --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

echo "Uploading index.html (no long cache)..."
aws s3 cp dist/index.html "s3://${BUCKET}/index.html" \
  --cache-control "public,max-age=0,must-revalidate" \
  --content-type "text/html"

if [[ -n "${DISTRIBUTION_ID:-}" ]]; then
  echo "Invalidating CloudFront ${DISTRIBUTION_ID}..."
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*"
fi

echo "Done."
