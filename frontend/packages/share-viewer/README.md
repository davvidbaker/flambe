# Flambe share viewer

Static client that renders a frozen timeline snapshot with `ChartHarness`. Deploy **once** from the `frontend` directory (ChartHarness lives in `packages/core`, so the Vercel root cannot be this package alone).

Phoenix uploads snapshot JSON to Vercel Blob; this app loads `/s/:id` from `VITE_SNAPSHOT_BASE_URL`.

## Vercel

- Root Directory: `frontend`
- Build Command: `npm run build:share-viewer` (also in `frontend/vercel.json`)
- Output Directory: `packages/share-viewer/dist`
- Environment: `VITE_SNAPSHOT_BASE_URL` — public blob prefix, no trailing slash, e.g. `https://<store>.public.blob.vercel-storage.com/snapshots`

Phoenix (Fly) needs:

- `FLAMBE_SHARE_VIEWER_URL` — this deployment origin
- `VERCEL_BLOB_READ_WRITE_TOKEN`

Do not point share links at the private Fly app.

```sh
cd frontend
npm run dev:share-viewer
```
