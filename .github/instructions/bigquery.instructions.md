---
description: "Use when working with BigQuery, analytics, data queries, Firestore exports, backfills, survey data, events table, or any data/SQL related questions."
---
# BigQuery Knowledge Base

## Project & Dataset
- GCP Project: `recipe-app-1bbdc`
- BigQuery Dataset: `firestore_export`
- CLI: `bq --project_id=recipe-app-1bbdc query --use_legacy_sql=false '<sql>'`

## Views (preferred for queries)

These are clean views built on top of the raw changelog tables. Use them when they have the columns you need.
Column names differ between views (`events_view` is camelCase, the others snake_case).

| View | Description | Columns |
|------|-------------|---------|
| `firestore_export.events_view` | Analytics events (only `CREATE` rows, so the 463 backfilled `IMPORT` rows are left out) | `document_id`, `createdAt`, `eventName`, `userId`, `userEmail`, `host`, `route`, `trafficSource`, `trafficMedium`, `trafficDetails`, `userPlatform`, `isPWA`, `pageName`, `planId`, `planName`, `recipeId`, `recipeTitle`, `method`, `mealType`, `response`, `platform`, `state`, `metadata` |
| `firestore_export.users_view` | Users (latest state) | `user_id`, `email`, `created_at`, `plan_name`, `plan_id`, `plan_cost`, `recipe_count`, `plan_started_at`, `plan_updated_at` |
| `firestore_export.recipes_view` | Generated recipes | `recipe_id`, `title`, `introduction`, `image_url`, `user_id`, `created_at`, `ingredients_count`, `feedback_count` |
| `firestore_export.survey_responses_view` | Survey answers | `document_id`, `user_id`, `would_pay`, `would_pay_why_not`, `desired_feature`, `rating`, `rating_comment`, `whatsapp`, `created_at`, `synced_at` |
| `firestore_export.recipes_feedback_view` | One row per feedback entry on a recipe | `recipe_id`, `recipe_title`, `recipe_owner_id`, `feedback_type`, `feedback_user_id`, `feedback_timestamp`, `feedback_reason`, `synced_at` |
| `firestore_export.new_users_per_day` | Daily signups (from `users_view`) | `signup_date`, `new_users` |

`events_view` gaps:
- `createdAt` is the export time (`timestamp`), not the event's own `createdAt`. They're usually a second apart.
- It has no column for `landingVariant`, `landingVisitorId` or `metadata.redirectTo`.

For those, query `events_raw_latest` with `JSON_VALUE(data, '$.…')`, as the A/B test query below does.

> Read a view's live definition with `bq show --format=prettyjson firestore_export.events_view`.
> `scripts/create-bigquery-views.sql` does **not** match what is deployed. It defines views named `events`, `users`, … with
> other columns, and none of them exist in BigQuery.

## Raw Tables (underlying data)

The Firestore → BigQuery extension writes every change to a `_raw_changelog` table, and `_raw_latest` is a view of
each live document's latest state. Both have `timestamp`, `operation` (`CREATE`, `UPDATE`, `DELETE`, `IMPORT`),
`document_name`, `document_id`, `event_id`, `data` and `old_data` (JSON strings).

| Table / view | Firestore Collection |
|-------|---------------------|
| `firestore_export.events_raw_changelog` / `events_raw_latest` | `events` |
| `firestore_export.survey_responses_raw_changelog` / `survey_responses_raw_latest` | `survey_responses` |
| `firestore_export.users_raw_changelog` / `users_raw_latest` | `users` |
| `firestore_export.recipes_raw_changelog` / `recipes_raw_latest` | `recipes` |

New documents reach BigQuery within seconds of being written.

## Backfill Command
To import historical Firestore data into BigQuery:
```bash
npx @firebaseextensions/fs-bq-import-collection \
  --project recipe-app-1bbdc \
  --source-collection-path <collection_name> \
  --dataset firestore_export \
  --table-name-prefix <collection_name>
```

## Example Queries

### Survey responses summary
```sql
SELECT
  would_pay,
  desired_feature,
  rating,
  rating_comment,
  whatsapp,
  created_at
FROM `recipe-app-1bbdc.firestore_export.survey_responses_view`
ORDER BY created_at DESC
```

### Event counts by type
```sql
SELECT
  eventName AS event_name,
  COUNT(*) AS count
FROM `recipe-app-1bbdc.firestore_export.events_view`
GROUP BY event_name
ORDER BY count DESC
```

### Active users with plan info
```sql
SELECT
  email,
  plan_id,
  plan_name,
  recipe_count
FROM `recipe-app-1bbdc.firestore_export.users_view`
```

### Recipes per user
```sql
SELECT
  u.email,
  COUNT(r.recipe_id) AS total_recipes
FROM `recipe-app-1bbdc.firestore_export.recipes_view` r
JOIN `recipe-app-1bbdc.firestore_export.users_view` u ON r.user_id = u.user_id
GROUP BY u.email
ORDER BY total_recipes DESC
```

### Survey completion rate
```sql
SELECT
  COUNT(DISTINCT s.user_id) AS surveyed_users,
  COUNT(DISTINCT u.user_id) AS total_users,
  ROUND(COUNT(DISTINCT s.user_id) / COUNT(DISTINCT u.user_id) * 100, 1) AS completion_pct
FROM `recipe-app-1bbdc.firestore_export.users_view` u
LEFT JOIN `recipe-app-1bbdc.firestore_export.survey_responses_view` s ON u.user_id = s.user_id
```

### Traffic sources
```sql
SELECT
  trafficSource AS traffic_source,
  trafficMedium AS traffic_medium,
  COUNT(*) AS events,
  COUNT(DISTINCT userId) AS unique_users
FROM `recipe-app-1bbdc.firestore_export.events_view`
GROUP BY traffic_source, traffic_medium
ORDER BY events DESC
```

### Landing page A/B test
Since Nov 2, 2026, logged-out visitors to `/` get `control` (the previous landing page) or `redesign`, 50/50.
- Every event carries `landingVariant` and `landingVisitorId`. `landingVisitorId` is an anonymous cookie id that links
  a logged-out visit to the signup that follows. A visitor counts once, in the variant of their first visit.
- **Visitor-based rates are only valid from 2026-11-13 19:45 UTC (16:45 Brasília).** Before then, the Firestore rules
  rejected every write from a logged-out visitor, so landing visits and "Gerar Receita" clicks were never saved.
  The `events` rule that allows them went live at 19:44:54 UTC (ruleset `898582e3`).
- `signup` events are written while signed in, so signups per arm were recorded for the whole test.
- "Gerar Receita" while logged out goes to `/signup?redirectTo=/recipe`. The signup page records `redirectTo`, but the
  login page doesn't, so `form_submits` counts signup-page visits only.
- `host = 'chefinhoia.com.br'` drops local dev, which also writes to production Firestore. The excluded visitor id
  was a QA visit made to check the rule.
- **From 2026-11-24 04:08 UTC (revision `my-recipe-app-00080-dsz`) compare the arms from scratch.** Since then:
  - `middleware.ts` assigns the variant on the server, and "/" arrives with the landing page already rendered
    instead of a blank screen. Cloud Run also keeps one instance warm (`min-instances=1`), so visitors no longer
    wait 5+ seconds for a cold start. Both mean more visitors stay long enough to be recorded, so visitor counts
    and rates before and after aren't comparable.
  - The landing `page_visit` is logged once Firebase Auth has loaded, and only when nobody is signed in.
  - `trafficSource`/`trafficMedium` say where a session came from: Google Ads clicks (`gclid`, `gbraid` or
    `wbraid` in the URL) are `google`/`cpc`, with `trafficDetails.clickId` and `campaignId`; search referrers are
    `google`/`organic`, `bing`/`organic`, …; social ones `instagram`/`social`, `youtube`/`social`, …; other sites
    are `<host>`/`referral`. Direct visits are still `organic`/`none`. Before this, ad clicks were mostly logged
    as `organic`/`none` too.
  - Microsoft Clarity sessions carry a `landingVariant` tag, so recordings and heatmaps can be filtered by arm.

```sql
WITH params AS (
  SELECT TIMESTAMP('2026-11-13 19:45:00+00') AS since  -- logged-out events are only saved from here on
),
events AS (
  SELECT
    JSON_VALUE(data, '$.eventName') AS event_name,
    JSON_VALUE(data, '$.userId') AS user_id,
    JSON_VALUE(data, '$.metadata.pageName') AS page_name,
    JSON_VALUE(data, '$.metadata.redirectTo') AS redirect_to,
    JSON_VALUE(data, '$.landingVariant') AS landing_variant,
    JSON_VALUE(data, '$.landingVisitorId') AS landing_visitor_id,
    TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)) AS created_at
  FROM `recipe-app-1bbdc.firestore_export.events_raw_latest`
  WHERE JSON_VALUE(data, '$.host') = 'chefinhoia.com.br'
),
visitors AS (
  SELECT
    landing_visitor_id AS visitor_id,
    ARRAY_AGG(landing_variant ORDER BY created_at LIMIT 1)[OFFSET(0)] AS variant
  FROM events, params
  WHERE event_name = 'page_visit' AND page_name = 'landing' AND created_at >= params.since
    AND landing_variant IS NOT NULL AND landing_visitor_id IS NOT NULL
    AND landing_visitor_id NOT IN ('de26e469-0b80-43d5-9358-743a8202d8f0')  -- QA visits
  GROUP BY visitor_id
),
form_submits AS (  -- clicked "Gerar Receita" while logged out
  SELECT DISTINCT landing_visitor_id AS visitor_id
  FROM events, params
  WHERE event_name = 'page_visit' AND page_name = 'signup' AND redirect_to = '/recipe'
    AND created_at >= params.since
),
signups AS (
  SELECT landing_visitor_id AS visitor_id, ANY_VALUE(user_id) AS user_id
  FROM events, params
  WHERE event_name = 'signup' AND landing_visitor_id IS NOT NULL AND created_at >= params.since
  GROUP BY visitor_id
),
recipe_makers AS (
  SELECT DISTINCT user_id
  FROM events
  WHERE event_name = 'generate_recipes'
)
SELECT
  v.variant,
  COUNT(*) AS visitors,
  COUNT(f.visitor_id) AS form_submits,
  COUNT(s.visitor_id) AS signups,
  COUNT(r.user_id) AS signups_with_recipe,
  ROUND(100 * COUNT(f.visitor_id) / COUNT(*), 2) AS form_submit_rate_pct,
  ROUND(100 * COUNT(s.visitor_id) / COUNT(*), 2) AS signup_rate_pct
FROM visitors v
LEFT JOIN form_submits f ON f.visitor_id = v.visitor_id
LEFT JOIN signups s ON s.visitor_id = v.visitor_id
LEFT JOIN recipe_makers r ON r.user_id = s.user_id
GROUP BY v.variant
ORDER BY v.variant
```

Signups per arm over the whole test (no visitor denominator before Nov 13):
```sql
SELECT
  JSON_VALUE(data, '$.landingVariant') AS variant,
  COUNT(DISTINCT JSON_VALUE(data, '$.userId')) AS signups
FROM `recipe-app-1bbdc.firestore_export.events_raw_latest`
WHERE JSON_VALUE(data, '$.eventName') = 'signup'
  AND JSON_VALUE(data, '$.host') = 'chefinhoia.com.br'
  AND JSON_VALUE(data, '$.landingVariant') IS NOT NULL
  AND TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)) >= TIMESTAMP('2026-11-02')
GROUP BY variant
ORDER BY variant
```

## Notes
- Prefer the views above (`events_view`, `users_view`, `recipes_view`, `survey_responses_view`, …) over the raw tables,
  except when you need a field they don't expose.
- `users_view` reads `users_raw_latest`, so it already has one row per user (latest state)
- If you need raw data: use `JSON_VALUE(data, '$.field')` to extract fields, and filter by `operation = 'CREATE'` for
  documents created by the app (`IMPORT` rows come from the backfill)
- Firestore `serverTimestamp()` is stored as `{_seconds, _nanoseconds}`. Convert it with
  `TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.field._seconds') AS INT64))`
- Firestore rules: anyone, logged out included, may create an `events` document whose shape matches what `trackEvent`
  (`app/lib/analytics.ts`) writes. Nobody may read, update or delete one from a client. Adding a new top-level field to
  `trackEvent` means adding it to the rule's allowed keys too, or those events will be rejected.
