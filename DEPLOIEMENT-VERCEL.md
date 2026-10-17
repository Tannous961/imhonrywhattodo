# Vercel — Firebase and OpenRouter

The active API now uses Firestore; no DATA_DIR or SQLite volume is needed.

1. Authenticate: `vercel login --global-config .vercel-auth` and approve the exact device request in your browser.
2. Run `node scripts/vercel-configure.mjs` locally. It reads the ignored .env and uploads Firebase/OpenRouter server credentials to Preview and Production without printing them.
3. Deploy a preview: `vercel --yes --global-config .vercel-auth --scope tannous961s-projects`.
4. Test the preview with `QA_URL=https://your-preview-url` and `node --env-file=.env scripts/firebase-qa.mjs`. Deployment protection may require Vercel authentication. QA_LIVE=true performs one paid AI call.
5. Deploy production: `vercel --prod --yes --global-config .vercel-auth --scope tannous961s-projects`.
6. In Firebase Authentication, keep the final domain in Authorized domains. Configure Firestore TTL on ihw_limits.expiresAt and ihw_shares.expiresAt. Expired shares are already inaccessible immediately, even before cleanup.

Free live Wingman: 5 attempts/day per authenticated account. Premium-ready limit: 50. Global budget: 100 attempts/day. Failures after reservation consume an attempt; at most 240 output tokens per call. Provider failures never silently switch to demo. Demo templates remain available.

Counters include only UTC day and aggregate event counts. No email, raw IP, chat or input text is stored in metrics. Abuse/quota documents use hashed identifiers and TTL, separate from metrics. The authenticated admin-only GET /api/admin/metrics returns today's totals; the Firebase account must have an admin custom claim assigned by an authorized administrator. No admin link appears in the member dashboard.

Old SQLite data is retained locally but is no longer used by the active API. New shares use Firestore. Older SQLite share links are not automatically imported.
