# AWS internal hosting (minimal cost) — Intelligent Dashboard

Static React SPA (~**0.8 MB** build, ~**240 KB** gzipped JS). No backend required for the demo.

## Recommended architecture (optimized)

```
EY laptop (VPN / corp network)
    → Route 53 Private Hosted Zone record (your internal name)
    → CloudFront distribution (AWS resource DNS: dxxxx.cloudfront.net)
    → S3 private bucket (OAC only; no public bucket access)
```

| Component | Role | Typical cost (demo) |
|-----------|------|---------------------|
| **S3** | Store `dist/` only | Pennies / month |
| **CloudFront** | HTTPS, gzip/brotli, SPA fallback | Low traffic ≈ free tier |
| **ACM** | TLS cert for internal hostname | Free |
| **Route 53 Private Hosted Zone** | Internal DNS name → CloudFront | ~$0.50/zone/month |
| **WAF** (optional) | Restrict to EY corporate IP ranges | ~$5+/month if enabled |

**Do not** use a public S3 website endpoint or public bucket ACLs. Use **CloudFront + Origin Access Control (OAC)**.

### Why this fits “internal to EY network”

1. **Private DNS** — Create a record in a **Route 53 private hosted zone** associated with your EY VPC(s). Only resolvers that use that PHZ (corp DNS forwarders, VPN) return the name. Example: `obs-dashboard.ey.internal`.
2. **No custom public domain required** — You can start with the **CloudFront domain** (`https://d1234abcd.cloudfront.net`) for smoke tests, then add an **Alias** in the private zone to that distribution.
3. **Network restriction** — Add **AWS WAF** on the distribution with an **IP set** of EY egress/CIDR ranges (from NetOps). That blocks the open internet even though CloudFront is a public edge service.
4. **Stronger (optional)** — CloudFront **VPC Origins** / PrivateLink patterns if your security team requires no public origin; discuss with EY cloud architecture.

---

## DNS: “resource DNS” + your record

AWS gives each resource a DNS name. You **alias** your internal name to it.

| Resource | AWS DNS name (example) | Your DNS record |
|----------|------------------------|-----------------|
| CloudFront | `d111111abcdef8.cloudfront.net` | `obs-dashboard.ey.internal` → **Alias A/AAAA** to distribution |
| S3 (origin, not for browsers) | `bucket.s3.eu-west-1.amazonaws.com` | Do not expose to users; CloudFront talks to S3 |

### Route 53 (private hosted zone) — example

1. Hosted zone: `ey.internal` (or subdomain delegated from corp DNS).
2. Associate the zone with **VPCs** used by EY (office VPN landing, shared services VPC).
3. Record:

   - **Name:** `obs-dashboard.ey.internal`
   - **Type:** `A` (and `AAAA` if IPv6)
   - **Alias:** Yes → **CloudFront distribution**
   - **Target:** select the distribution (or paste `dxxxx.cloudfront.net`)

4. On the **CloudFront distribution**, add **Alternate domain name (CNAME):** `obs-dashboard.ey.internal` and attach an **ACM certificate** (must be in **us-east-1** for CloudFront) that covers that name.

Corp DNS: forward `*.ey.internal` to the Route 53 PHZ resolver or use **conditional forwarder** from Active Directory.

---

## Step-by-step deployment

### Prerequisites

- AWS CLI v2, profile with rights for S3, CloudFront, ACM, Route 53, WAF.
- Region for S3 bucket: pick one close to users (e.g. `eu-west-1`).
- Build locally: `npm ci && npm run build` → output in `dist/`.

### 1. S3 bucket (private)

```bash
export AWS_REGION=eu-west-1
export BUCKET=ey-intelligent-dashboard-demo-ACCOUNT_ID

aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"

aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Upload (see `deploy/upload.ps1` or `deploy/upload.sh`):

```bash
aws s3 sync dist/ "s3://$BUCKET/" --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "public,max-age=0,must-revalidate" \
  --content-type "text/html"
```

Long cache on hashed assets (`/assets/*`); short cache on `index.html` so SPA updates deploy cleanly.

### 2. CloudFront distribution

Create via console or IaC with:

- **Origin:** S3 bucket (REST API endpoint, not website endpoint).
- **OAC:** enabled; bucket policy allows `s3:GetObject` only for CloudFront ARN.
- **Default root object:** `index.html`
- **Compress objects:** Yes
- **Viewer protocol:** Redirect HTTP → HTTPS (or HTTPS only)
- **Custom error responses (SPA routing):**
  - HTTP 403 → `/index.html` → response 200
  - HTTP 404 → `/index.html` → response 200
- **Price class:** Use only North America/Europe (`PriceClass_100`) if acceptable — lower cost.
- **Alternate domain:** `obs-dashboard.ey.internal` (after ACM cert is ready)

Note the distribution domain: **`xxxxxxxx.cloudfront.net`** — use for testing before private DNS is wired.

### 3. ACM certificate (us-east-1)

```bash
aws acm request-certificate \
  --region us-east-1 \
  --domain-name obs-dashboard.ey.internal \
  --validation-method DNS
```

Complete DNS validation (private CA or DNS challenge in PHZ). Attach cert to CloudFront.

### 4. Route 53 private record

Create Alias `obs-dashboard.ey.internal` → CloudFront distribution (see table above).

### 5. Lock down access (EY internal)

**Option A — WAF IP allowlist (common for demos)**

- Web ACL on CloudFront.
- Rule: allow if source IP in **EY corporate CIDR** IP set; default block.

**Option B — VPN-only DNS**

- No public DNS for the hostname; only PHZ + VPN. Still add WAF if the CloudFront URL could leak.

**Option C — SSO front door (later)**

- CloudFront + Cognito / IAM Identity Center / corporate IdP — more setup, not needed for static demo.

---

## Artifact size (already small)

| File | Uncompressed | Gzip (transfer) |
|------|--------------|-----------------|
| `index-*.js` | ~788 KB | ~231 KB |
| `index-*.css` | ~46 KB | ~8 KB |
| `index.html` | &lt;1 KB | &lt;1 KB |

S3 storage &lt; **1 MB** → negligible. CloudFront egress dominates cost only if many users download repeatedly.

### Optional further shrink (if security asks)

1. **Lazy-load routes** — `React.lazy()` for `/trends`, `/traces` (splits Recharts out of first paint).
2. **Drop external Google Fonts** — use system fonts (done in `index.html` for internal builds).
3. **`npm run build`** — `sourcemap: false` (see `vite.config.ts`).

---

## Operations

| Action | Command |
|--------|---------|
| Deploy new build | `npm run build` then `deploy/upload.ps1` (set `$BUCKET`, `$DISTRIBUTION_ID`) |
| Invalidate CloudFront | `aws cloudfront create-invalidation --distribution-id ID --paths "/*"` |
| Rollback | Re-sync previous `dist` from CI artifact or git tag |

---

## What we explicitly avoid (cost / scope)

| Approach | Why skip for this demo |
|----------|-------------------------|
| EC2 / ECS always-on | Pay 24/7 for static files |
| API Gateway + Lambda | No API in prototype |
| RDS / DynamoDB | Mock data in browser |
| Public S3 website | Security; use CloudFront + OAC |
| New public Route 53 zone on internet | Use **private** PHZ for EY internal |

---

## Checklist before go-live

- [ ] Bucket: public access blocked; policy only CloudFront OAC
- [ ] CloudFront: SPA 403/404 → `index.html`
- [ ] ACM cert attached; HTTPS only
- [ ] Private PHZ associated with correct VPCs
- [ ] Alias record → CloudFront
- [ ] WAF or IP restriction per EY policy
- [ ] Test from VPN: `https://obs-dashboard.ey.internal`
- [ ] Test deep links: `/incidents`, `/services`, `/traces/...` (client-side routes)

---

## EY-specific follow-ups (ask your cloud team)

1. Which **VPC(s)** should the private hosted zone associate with?
2. Approved **internal DNS suffix** (e.g. `*.cloud.ey.com` vs `*.ey.internal`)?
3. Required **WAF IP ranges** or **PrivateLink** for CloudFront?
4. **CI/CD** account and OIDC role for `aws s3 sync` + invalidation?
