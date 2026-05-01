---
description: "Use when working with BigQuery, analytics, data queries, Firestore exports, backfills, survey data, events table, or any data/SQL related questions."
---
# BigQuery Knowledge Base

## Project & Dataset
- GCP Project: `recipe-app-1bbdc`
- BigQuery Dataset: `firestore_export`

## Views (preferred for queries)

These are clean views built on top of the raw changelog tables. **Always use these views** instead of querying raw tables directly.

| View | Description | Key Columns |
|------|-------------|-------------|
| `firestore_export.survey_responses` | Survey answers | `user_id`, `would_pay`, `would_pay_why_not`, `desired_feature`, `rating`, `rating_comment`, `whatsapp`, `created_at` |
| `firestore_export.events` | Analytics events | `user_id`, `user_email`, `event_name`, `host`, `route`, `traffic_source`, `traffic_medium`, `traffic_details`, `user_platform`, `is_pwa`, `metadata`, `created_at` |
| `firestore_export.users` | Users (latest state) | `user_id`, `email`, `name`, `plan_id`, `plan_name`, `plan_cost`, `recipe_count`, `to_be_canceled`, `plan_started_at`, `plan_expires_at`, `created_at`, `survey_completed_at` |
| `firestore_export.recipes` | Generated recipes | `document_id`, `user_id`, `title`, `introduction`, `preparation_method`, `observations`, `nutritional_info`, `image_url`, `created_at` |

> View creation SQL: `scripts/create-bigquery-views.sql`

## Raw Tables (underlying data)

| Table | Firestore Collection | Description |
|-------|---------------------|-------------|
| `firestore_export.events_raw_latest` | `events` | Latest state per event document |
| `firestore_export.survey_responses_raw_latest` | `survey_responses` | Latest state per survey response |
| `firestore_export.users_raw_latest` | `users` | Latest state per user |
| `firestore_export.recipes_raw_latest` | `recipes` | Latest state per recipe |

## Backfill Command
To import historical Firestore data into BigQuery:
```bash
npx @firebaseextensions/fs-bq-import-collection \
  --project recipe-app-1bbdc \
  --source-collection-path <collection_name> \
  --dataset firestore_export \
  --table-name-prefix <collection_name>
```

## Example Queries (using views)

### Survey responses summary
```sql
SELECT
  would_pay,
  desired_feature,
  rating,
  rating_comment,
  whatsapp,
  created_at
FROM `recipe-app-1bbdc.firestore_export.survey_responses`
ORDER BY created_at DESC
```

### Event counts by type
```sql
SELECT
  event_name,
  COUNT(*) AS count
FROM `recipe-app-1bbdc.firestore_export.events`
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
FROM `recipe-app-1bbdc.firestore_export.users`
```

### Recipes per user
```sql
SELECT
  u.email,
  COUNT(r.document_id) AS total_recipes
FROM `recipe-app-1bbdc.firestore_export.recipes` r
JOIN `recipe-app-1bbdc.firestore_export.users` u ON r.user_id = u.user_id
GROUP BY u.email
ORDER BY total_recipes DESC
```

### Survey completion rate
```sql
SELECT
  COUNT(DISTINCT s.user_id) AS surveyed_users,
  COUNT(DISTINCT u.user_id) AS total_users,
  ROUND(COUNT(DISTINCT s.user_id) / COUNT(DISTINCT u.user_id) * 100, 1) AS completion_pct
FROM `recipe-app-1bbdc.firestore_export.users` u
LEFT JOIN `recipe-app-1bbdc.firestore_export.survey_responses` s ON u.user_id = s.user_id
```

### Traffic sources
```sql
SELECT
  traffic_source,
  traffic_medium,
  COUNT(*) AS events,
  COUNT(DISTINCT user_id) AS unique_users
FROM `recipe-app-1bbdc.firestore_export.events`
GROUP BY traffic_source, traffic_medium
ORDER BY events DESC
```

## Notes
- **Always query views** (`survey_responses`, `events`, `users`, `recipes`) instead of raw `_raw_changelog` tables
- Views are defined in `scripts/create-bigquery-views.sql` — run in BigQuery Console to create/update them
- The `users` view uses `ROW_NUMBER()` to return only the latest state per user
- The raw changelog tables have columns: `timestamp`, `operation`, `document_name`, `document_id`, `data` (JSON string)
- If you need raw data: use `JSON_VALUE(data, '$.field')` to extract fields, filter by `operation = 'CREATE'` for originals
- Firestore `serverTimestamp()` is stored as `{_seconds, _nanoseconds}` — views use `TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.field._seconds') AS INT64))` to convert
