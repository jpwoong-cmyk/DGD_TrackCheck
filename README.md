# DG Checker · Personal starter (v0.1)

A private Next.js proof of concept for DGD-to-NOTOC field checks. **It does not establish aviation regulatory compliance or independently verify every PDF DG line.**

## Run locally

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `APP_ACCESS_TOKEN` to a random secret at least 24 characters long.
4. Run `npm run dev`, then visit `http://localhost:3000`.
5. Enter the access code, upload a text-based DGD PDF and a flattened `.xlsx` NOTOC with recognizable headings.

## Deploy using GitHub and Vercel

1. Create a **private** GitHub repository and push this folder (exclude `.env.local` and real DG documents).
2. Import the repository into Vercel as a Next.js project.
3. Add `APP_ACCESS_TOKEN` in Vercel Environment Variables for Production (and Preview if needed).
4. Deploy and verify that unauthenticated `/api/compare` returns HTTP 401.
5. Protect preview deployments as well, and review deployment retention/logging for sensitive DG content.

## ChatGPT login / plan usage limitation

This starter does **not** pretend to offer ChatGPT login. OpenAI's Sign in with ChatGPT eligibility differs by deployment type. See https://developers.openai.com/siwc/quickstart and https://developers.openai.com/siwc/token-sharing-open-source. Locally run open-source tools may use eligible plan-backed flows; a remotely hosted Vercel deployment requires the appropriate hosted-app eligibility/approval. Do not insert a ChatGPT session cookie or access token into this app. The current access code is a temporary single-user gate, not a full identity provider.

## Known limitations

- DGD text extraction is conservative: AWB, singular UN number, packing group, overpack, CAO, and a single unmistakable quantity may be extracted. **No guessed PSN, technical names, or package counts.**
- Scanned PDFs, multiple DG lines under one AWB, merged NOTOC cells, inconsistent layouts, cross-page tables, and technical names require human verification. **A missing extracted field is UNVERIFIED, not correct.**
- Quantity gross/net indicator is checked where available. This is not a complete DG grammar/parser.
- NOTOC header mapping is basic; unmatched headers stay unverified. Source values are authoritative.
- Missing NOTOC AWBs are flagged; operational fields absent from the DGD are unverified.
- The CSV is an assessment report, not a certified NOTOC.
- No database or persistent document storage. Files are processed in server memory; platform logs/retention policies must be reviewed separately.
- The access cookie is 8-hour HMAC-based and the access code requires a long secret. For production use, add rate limiting, a real identity provider, CSRF defenses where relevant, security monitoring, and formal data-handling review.

## Next implementation milestones

1. Verified DGD line-item extractor (including OCR/vision with side-by-side evidence), AWB + DG-line matching, source page references and manual correction flow.
2. Layout-specific NOTOC mapping templates and accurate number/unit/overpack validators with regression tests.
3. Official ChatGPT sign-in if approved for hosted use, or a locally hosted OSS companion as an eligible alternative.
4. Human review/acknowledgement, export, and audit trail before any operational use.
