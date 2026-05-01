-- =========================================================
-- BigQuery Views for Recipe App
-- Run these in the BigQuery Console (https://console.cloud.google.com/bigquery)
-- =========================================================

-- ---------------------------------------------------------
-- 1. survey_responses view
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW `recipe-app-1bbdc.firestore_export.survey_responses` AS
SELECT
  document_id,
  JSON_VALUE(data, '$.userId') AS user_id,
  CAST(JSON_VALUE(data, '$.wouldPay') AS BOOL) AS would_pay,
  JSON_VALUE(data, '$.wouldPayWhyNot') AS would_pay_why_not,
  JSON_VALUE(data, '$.desiredFeature') AS desired_feature,
  CAST(JSON_VALUE(data, '$.rating') AS INT64) AS rating,
  JSON_VALUE(data, '$.ratingComment') AS rating_comment,
  JSON_VALUE(data, '$.whatsapp') AS whatsapp,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)) AS created_at,
  timestamp AS synced_at
FROM `recipe-app-1bbdc.firestore_export.survey_responses_raw_latest`;

-- ---------------------------------------------------------
-- 2. events view
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW `recipe-app-1bbdc.firestore_export.events` AS
SELECT
  document_id,
  JSON_VALUE(data, '$.userId') AS user_id,
  JSON_VALUE(data, '$.userEmail') AS user_email,
  JSON_VALUE(data, '$.eventName') AS event_name,
  JSON_VALUE(data, '$.host') AS host,
  JSON_VALUE(data, '$.route') AS route,
  JSON_VALUE(data, '$.trafficSource') AS traffic_source,
  JSON_VALUE(data, '$.trafficMedium') AS traffic_medium,
  JSON_VALUE(data, '$.trafficDetails') AS traffic_details,
  JSON_VALUE(data, '$.userPlatform') AS user_platform,
  CAST(JSON_VALUE(data, '$.isPWA') AS BOOL) AS is_pwa,
  JSON_VALUE(data, '$.metadata') AS metadata,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)) AS created_at,
  timestamp AS synced_at
FROM `recipe-app-1bbdc.firestore_export.events_raw_latest`;

-- ---------------------------------------------------------
-- 3. users view (latest state per user)
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW `recipe-app-1bbdc.firestore_export.users` AS
SELECT
  document_id AS user_id,
  JSON_VALUE(data, '$.email') AS email,
  JSON_VALUE(data, '$.name') AS name,
  CAST(JSON_VALUE(data, '$.plan.planId') AS INT64) AS plan_id,
  JSON_VALUE(data, '$.plan.name') AS plan_name,
  CAST(JSON_VALUE(data, '$.plan.cost') AS FLOAT64) AS plan_cost,
  CAST(JSON_VALUE(data, '$.plan.recipeCount') AS INT64) AS recipe_count,
  CAST(JSON_VALUE(data, '$.plan.toBeCanceled') AS BOOL) AS to_be_canceled,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.plan.startedAt._seconds') AS INT64)) AS plan_started_at,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.plan.expiresAt._seconds') AS INT64)) AS plan_expires_at,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)) AS created_at,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.surveyCompletedAt._seconds') AS INT64)) AS survey_completed_at,
  timestamp AS synced_at
FROM `recipe-app-1bbdc.firestore_export.users_raw_latest`;

-- ---------------------------------------------------------
-- 4. recipes view
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW `recipe-app-1bbdc.firestore_export.recipes` AS
SELECT
  document_id,
  JSON_VALUE(data, '$.userId') AS user_id,
  JSON_VALUE(data, '$.title') AS title,
  JSON_VALUE(data, '$.introduction') AS introduction,
  JSON_VALUE(data, '$.preparationMethod') AS preparation_method,
  JSON_VALUE(data, '$.observations') AS observations,
  JSON_VALUE(data, '$.nutritionalInfo') AS nutritional_info,
  JSON_VALUE(data, '$.imageUrl') AS image_url,
  TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.createdAt._seconds') AS INT64)) AS created_at,
  timestamp AS synced_at
FROM `recipe-app-1bbdc.firestore_export.recipes_raw_latest`;

-- ---------------------------------------------------------
-- 5. recipe_feedback view
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW `recipe-app-1bbdc.firestore_export.recipe_feedback` AS
SELECT
  r.document_id AS recipe_id,
  JSON_VALUE(r.data, '$.title') AS recipe_title,
  JSON_VALUE(r.data, '$.userId') AS recipe_owner_id,
  JSON_VALUE(fb, '$.type') AS feedback_type,
  JSON_VALUE(fb, '$.userId') AS feedback_user_id,
  SAFE_CAST(JSON_VALUE(fb, '$.timestamp') AS TIMESTAMP) AS feedback_timestamp,
  JSON_VALUE(fb, '$.reason') AS feedback_reason,
  r.timestamp AS synced_at
FROM `recipe-app-1bbdc.firestore_export.recipes_raw_latest` r,
UNNEST(JSON_QUERY_ARRAY(r.data, '$.feedback')) AS fb;
