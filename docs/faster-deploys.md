# Faster Cloud Run deploys for Chefinho IA

Investigation of 2026-11-25. Project `recipe-app-1bbdc`, region `us-central1`. Nothing was deployed or reconfigured. The numbers come from Cloud Build, Cloud Logging, Cloud Run revision status and local `docker build` runs.

## TL;DR

- A web deploy takes **8m40s–11m20s** from build start to serving traffic. The backend takes **57s**.
- Three things account for ~80% of the web time, and the first fix is one line:
  1. **`npm audit` runs inside `npm install`: about 2.5 min.** The install itself takes ~50s. The other ~2.5 min is npm auditing 1,072 packages after the install. Adding `--no-audit` cut it from 3m25s to 50s locally (7 runs).
  2. **A 504 MB image: about 3 min.** Pushing it takes 1m25s. Cloud Run then needs another 1m40s to *import* it before the new revision can start. A Next.js `standalone` image is **65 MB** (measured), the same size class as the backend's 81 MB image, which imports in 5s.
  3. **`next build`: 1.5 min** on the default 2-vCPU build machine. The same build takes 23s on this Mac.
- **Recommended first, as one PR with no infra change and the same `gcloud run deploy --source .` command:** `npm ci --no-audit`, a two-stage `standalone` Dockerfile with `sharp`, and dropping the redundant local `next build` from `npm run deploy`. Projected web deploy: **~8m40s → ~4–4.5 min**.
- **For releases that change both backend and web, regardless of speed:** create the web revision with `--no-traffic` *before* deploying the backend, then switch traffic. Today checkout ran ~14 min with the new backend and the old frontend. With this order that drops to a few seconds.

## Where the minutes go today

### Web, deploy 1 (revision `my-recipe-app-00081-kq7`, build `f7906246`)

| Phase | UTC | Duration |
|---|---|---|
| Cloud Build start, fetch 2.5 MB source | 20:28:40 → 20:28:44 | 4s |
| Pull `node:20-alpine` | 20:28:44 → 20:28:51 | 7s |
| `RUN npm install`: fetch and resolve (deprecation warnings end at 20:29:13) | 20:28:51 → 20:29:13 | 22s |
| `RUN npm install`: silent until "added 1071 packages, and audited 1072 packages in 3m" | 20:29:13 → 20:32:03 | **2m50s** |
| Commit the `node_modules` layer (1.16 GB, including a 327 MB npm cache) | 20:32:03 → 20:32:45 | 42s |
| `RUN npm run build` (`next build`) | 20:32:45 → 20:34:20 | **1m35s** |
| `RUN npm prune --production` | 20:34:20 → 20:34:36 | 16s |
| Push the 504 MB image to Artifact Registry | 20:34:36 → 20:36:01 | **1m25s** |
| gcloud waits before creating the revision | 20:36:01 → 20:38:12 | 2m11s (see note) |
| Cloud Run imports the image | 20:38:12 → 20:39:53 | **1m40s** ("Container image import completed in 1m40.02s") |
| Container start until healthy | → 20:39:56 | 1.6s |
| Revision Ready at 100% | 20:40:00 | |
| **Total** | | **11m20s** |

### Web, deploy 2 (revision `my-recipe-app-00082-fsd`, build `d506e586`)

Build created 20:43:30, revision serving 20:52:10: **8m40s**. That was `npm install` + layer commit 3m32s, `next build` 1m24s, prune 14s, push 1m25s, a gcloud gap of about 4s, and rollout 1m48s (image import 1m39.86s, healthy in 1.7s).

The last four web builds are consistent: the build step took 5m04s–5m31s, the push 66–85s, and the whole build 6m18s–6m48s. In both builds I checked line by line (`f7906246`, `d506e586`), the log goes silent for ~2m50s after `npm install` finishes fetching.

### Backend (revision `server-my-recipe-app-00012-qtf`, build `3d38a994`)

Build created 20:25:13, serving 20:26:10: **57s** in total. The docker build took 24s (it copies a prebuilt `dist/`), the push 10s, the image import 4.75s, and the rollout 11.6s. Nothing worth optimising here.

### Note on the gcloud gap

The time from build end to gcloud calling `ReplaceService` was 2m11s on deploy 1, 4s on deploy 2 and 39s on 2026-11-24. The audit log shows it happens inside the same `gcloud run deploy` invocation, so it's on the client side. The local gcloud is 488.0.0 (August 2024). Updating it is cheap, but I can't show it fixes this.

### What this meant for checkout today

Backend `00012` was serving from **20:26:10**, and web `00081` from **20:40:00**. That's ~14 min with the new backend behind the old frontend.

### What does *not* cost time

- Source upload: 2.5 MB, because `.gcloudignore` already drops `node_modules` and `.next`.
- Container startup: healthy in 1.6s, and the startup probe is fine.
- Base image pull: 7s.

## Why each piece is slow

1. **npm audit runs on every deploy.** `npm install` and `npm ci` both audit by default. Here that takes about 2.5 min and reports "63 vulnerabilities (2 low, 31 moderate, 27 high, 3 critical)" into a build log that nobody reads.
2. **No layer cache.** The step that `gcloud run deploy --source` creates is literally `docker build --network cloudbuild --no-cache …` on a fresh VM. Dockerfile ordering therefore can't save anything while we use `--source`.
3. **The runtime image carries everything.** All of `node_modules` goes in: 991 MB, including `firebase-admin`, which only `scripts/` uses. So do the npm cache (327 MB), `.next` (213 MB) and the full source. `npm prune --production` saves **nothing**: it adds a 1.6 MB layer on top of the 1.16 GB `npm install` layer, and the deleted files stay in the image underneath.
4. **`next build` is CPU-bound,** and the default Cloud Build machine (`e2-standard-2`) has only 2 vCPUs.
5. **The local `next build` in `npm run deploy` is wasted.** `.gcloudignore` includes `.gitignore`, which ignores `/.next/`, so its output is never uploaded. It costs 23s on this Mac before the upload starts.

## Local experiment

This Mac (arm64) built `linux/amd64` images under emulation, with `--no-cache`, from the same source. The experiment Dockerfiles live in the session's scratchpad and were not committed.

- **baseline**: today's `Dockerfile`.
- **standalone**: `npm ci --no-audit --no-fund` + `sharp`, then `next build` with `output: 'standalone'` (patched in at build time). The runtime image is `node:20-alpine` plus `.next/standalone`, `.next/static` and `public/`, started with `node server.js`.

| | baseline (today) | standalone |
|---|---|---|
| Image, uncompressed | 1.53 GB | **192 MB** |
| Image, gzip (≈ what gets pushed) | 499 MB (Artifact Registry says 504 MB) | **65 MB** |
| Whole local build | 6m47s | 3m17s |
| Dependency step | `npm install` 4m36s | `npm ci --no-audit` 48s, + 5s for `sharp` |
| `next build` step | 1m26s | 1m44s (adds file tracing) |
| First response after `docker run` | 3.9s | 1.5s |
| Memory after the smoke test | 397 MiB (the Cloud Run limit is 512 MiB) | 125 MiB |

**npm audit isolated.** These were clean `--no-cache` builds of just the dependency step:

| Command | Runs | Time |
|---|---|---|
| `npm ci` | 2 | 3m26s, 3m27s |
| `npm install` | 2 | 3m22s, 3m28s |
| `npm ci --no-audit --no-fund` | 2 | 51s, 58s |
| `npm install --no-audit --no-fund` | 1 | 57s |

So `npm ci` vs `npm install` makes no difference here. The audit is what costs the time.

**Smoke test, both images, same results.** I requested `/`, `/?lp=control`, `/?lp=redesign`, `/plans`, `/login`, `/signup`, `/checkout/2`, `/plans-public`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/twitter-image`, `/sw.js`, `/manifest.json`, `/_next/image?url=/images/avocado-toast.jpg` and a 404. Both images returned the same status codes. Both landing variants, `sw.js`, `manifest.json` and `robots.txt` were byte-identical. The middleware set the same A/B cookies.

Two differences:

1. The baseline logs a warning that `sharp` is missing, so today's production uses the slow WASM fallback for `next/image`.
2. My experiment runner couldn't write `.next/cache` (EACCES), because it ran as `node` without `--chown`. Images still served, but the real Dockerfile must copy `.next` with `--chown=node:node`.

**Size on Cloud Run.** The backend's 81 MB image pushed in 10s and imported in 4.75s. So for a 65 MB web image, expect the push to drop from ~1m25s to ~10s and the import from ~1m40s to ~5s.

## Options, ranked

Savings are per web deploy, measured against the 8m40s clean run (deploy 2).

| # | Option | Saving | Effort | Risk | Infra change? |
|---|---|---|---|---|---|
| 0 | **Stage, then switch traffic** for backend + web releases | Checkout gap ~14 min → seconds. Deploy time unchanged. | Commands only | Low | No |
| 1 | **`npm ci --no-audit --no-fund`** in the Dockerfile | **~2–2.5 min** | One line | Very low | No |
| 2 | **Two-stage `standalone` image + `sharp` + `.dockerignore`** | **~3 min** (push, import and prune) | Small: `Dockerfile`, `next.config.mjs`, `package.json`, `.dockerignore` | Low–medium | No |
| 3 | Drop the local `next build` from `npm run deploy` | ~25s of laptop time | Trivial | Low | No |
| 4 | Bigger build machine (`e2-highcpu-8`) | Est. 30–60s, mostly `next build` (not measured) | Small, but only via `gcloud builds submit` | Low | Billing only |
| 5 | `cloudbuild.yaml` with a registry layer cache, then `gcloud run deploy --image` | ~1 min more after 1+2 (deps step), only when `package-lock.json` is unchanged | Medium: new build config and deploy script | Low–medium | New deploy path |
| 6 | Build on push (GitHub Actions or a Cloud Build trigger), deploy prebuilt images with `--image` | The deploy becomes just the rollout, ~20s with a small image | Medium–high: needs Workload Identity Federation or a repo connection | Medium | **Yes (IAM)** |
| 7 | Build the image locally on the Mac and push | None: 6m47s / 3m17s under emulation, plus upload over a home connection | Small | Medium | No |

**After 1 + 2 + 3**, the projection from the measured pieces is: fetch and base image ~10s, `npm ci` ~50s + layer commit ~40s, `next build` ~1m40s, runtime stage ~5s, push ~10s, rollout ~15s. That's **~4–4.5 min**, against 8m40s today, with the deploy command unchanged. These are projections; the first real deploy will confirm them.

### 0. Stage, then switch (any release that changes both services)

Today's outage came from the deploy order, not only from speed. Do the slow part first, without traffic:

```bash
# 1. Web: build and create the revision, but keep traffic on the current one (no user impact)
gcloud run deploy my-recipe-app --source . --no-traffic --tag next
#    optional: smoke-test the tagged URL that gcloud prints (https://next---my-recipe-app-….run.app)
# 2. Backend: normal deploy (~1 min)
gcloud run deploy server-my-recipe-app --source .
# 3. Web: send all traffic to the staged revision (seconds)
gcloud run services update-traffic my-recipe-app --to-latest
```

For an even tighter cut-over, stage both services with `--no-traffic`, then run both `update-traffic --to-latest` commands back to back.

Gotcha: after a `--no-traffic` deploy, traffic stays pinned to a fixed revision until `update-traffic --to-latest` runs. Later deploys would also get 0% traffic until then, so step 3 must not be skipped.

### 1 + 2 + 3. The recommended PR

- `Dockerfile` has two stages and keeps the layer-cache-friendly order, so option 5 can be added later:
  - **builder**: `COPY package*.json`, `npm ci --no-audit --no-fund`, `COPY . .` (which still brings `.env`, so `NEXT_PUBLIC_*` are inlined), then `npm run build`.
  - **runner**: `node:20-alpine` plus `public/` (including the `sw.js` that next-pwa generates in the build), `.next/standalone` and `.next/static`, all copied with `--chown=node:node`. It sets `HOSTNAME=0.0.0.0`, runs as `USER node`, and starts with `node server.js`. Cloud Run injects `PORT=8080`.
  - Only features the classic builder supports: Cloud Build runs `docker build` without BuildKit, as the log's "Step 1/9" lines show. So no `RUN --mount`.
- `next.config.mjs`: add `output: 'standalone'`.
- `package.json`:
  - Add `sharp`. In standalone mode, Next 14.2 returns a **500** for `/_next/image` without it (`next/dist/server/image-optimizer.js`). `next/image` is used in `app/recipe/[id]/page.tsx`, `MobileMenuOpen`, `Input` and `LegacyLanding`.
  - Change `"deploy"` to `gcloud run deploy --source .`.
- `.dockerignore`: mirror `.gcloudignore` but keep `.env`. This only affects local builds, because Cloud Build already receives a filtered upload.
- Risks: the runtime changes from `next start` to `node server.js`, and the standalone file tracer could miss a file that is loaded dynamically. The smoke test above covered every top-level route, the OG images, the service worker, the image optimizer and the middleware. Rollback is `gcloud run services update-traffic my-recipe-app --to-revisions <previous>=100`.
- Side benefits: the instance uses about a third of the memory (125 vs 397 MiB, against a 512 MiB limit), starts faster, and `next/image` uses `sharp` instead of WASM.

### 4. Bigger machine

Set `options.machineType: E2_HIGHCPU_8` in `cloudbuild.yaml`, or pass `gcloud builds submit --machine-type=e2-highcpu-8`. `gcloud run deploy --source` has no machine-type flag. `next build` takes 23s on an 8-core Mac and 95s on Cloud Build's 2 vCPUs, so most of the gain is there. Not measured on Cloud Build.

### 5. Layer cache in Cloud Build

`gcloud run deploy --source` always passes `--no-cache`, so caching needs a split deploy:

```bash
gcloud builds submit --config cloudbuild.yaml   # buildx with --cache-from/--cache-to type=registry,mode=max to Artifact Registry
gcloud run deploy my-recipe-app --image us-central1-docker.pkg.dev/recipe-app-1bbdc/cloud-run-source-deploy/my-recipe-app:$SHA
```

After option 1, `npm ci` takes ~50s, so this only saves ~1 min, and only when dependencies didn't change. Use BuildKit's registry cache rather than Kaniko, which Google archived on 2025-06-03; only community forks remain. Worth doing together with option 4, because both need the same `cloudbuild.yaml`.

### 6. Build on push

This gives the biggest win: the image already exists when you deploy, and the deploy is just the rollout. It needs a GitHub → GCP identity (Workload Identity Federation plus a deploy service account) or a Cloud Build GitHub connection. Both are IAM/infra changes, so this is a later step. If CI only *builds* and you deploy with `--image`, you still control the order.

### 7. Build locally

Not recommended. Cloud Run needs `linux/amd64`, and this Mac is arm64. Under emulation the builds took 6m47s (baseline) and 3m17s (standalone), no faster than Cloud Build. They would then also have to upload over a home connection. It would also tie deploys to one laptop.

## Cost

- **Today:** ~6.5 build-minutes per web deploy on `e2-standard-2` at $0.006/min. That's inside the 2,500 free build-minutes per month, so $0. Options 1–3 make builds shorter, so they cost nothing.
- **`e2-highcpu-8`:** $0.0156/min, and the free tier doesn't cover it. At ~3.5 min that's about $0.05 per deploy.
- **Artifact Registry:** $0.10/GB-month above 0.5 GB. The `cloud-run-source-deploy` repo holds **34 GB** today (84 web images of ~500 MB each), about $3.40/month. With 65 MB images and a cleanup policy (for example "keep the last 10 versions"), it drops to cents. The cleanup policy is a registry setting and was not changed.

## Other findings (not deploy speed)

- `npm audit` reports **63 vulnerabilities (3 critical, 27 high)**. Turning audit off in the build hides nothing anyone reads, but it deserves a separate `npm audit` pass. Most come from the `next-pwa` / workbox chain.
- The current web container uses ~400 MiB at idle against a 512 MiB limit. The standalone image removes that headroom risk.

## Recommendation

1. **Now, no code:** use the stage-then-switch order (option 0) for any release that touches both services.
2. **First PR:** options 1 + 2 + 3. Same deploy command, no infra change. Projected web deploy ~8m40s → ~4–4.5 min, and Cloud Run rollout ~1m48s → ~15s.
3. **Then, if you want it faster:** options 4 + 5 together in one `cloudbuild.yaml` (~1–2 min more).
4. **Later:** option 6, so a deploy is only the rollout.

## Evidence commands

```bash
gcloud builds describe f7906246-3f34-4e7d-be5e-32dc851a4833 --project recipe-app-1bbdc --format=json   # timing, step args (--no-cache)
gcloud logging read 'resource.type="build" AND resource.labels.build_id="f7906246-3f34-4e7d-be5e-32dc851a4833"' --order=asc --format="value(timestamp,textPayload)"
gcloud run revisions describe my-recipe-app-00082-fsd --region us-central1 --format="yaml(status.conditions)"   # image import 1m39.86s
gcloud run revisions describe server-my-recipe-app-00012-qtf --region us-central1 --format="yaml(status.conditions)"   # image import 4.75s
gcloud artifacts docker images list us-central1-docker.pkg.dev/recipe-app-1bbdc/cloud-run-source-deploy/my-recipe-app --include-tags   # 504 MB
```

Sources: [Cloud Build pricing](https://cloud.google.com/build/pricing), [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing), [Cloud Run rollouts and traffic migration](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration), [Kaniko archived, Chainguard fork](https://www.chainguard.dev/unchained/fork-yeah-were-bringing-kaniko-back).
