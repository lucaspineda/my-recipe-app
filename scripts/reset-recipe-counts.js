/**
 * Reset monthly recipe counts for all users.
 *
 * Setup:
 *   1. Install firebase-admin if not already: npm install firebase-admin
 *   2. Login with your Google account:
 *        gcloud auth application-default login
 *   3. Make sure GCLOUD_PROJECT is set to your Firebase project ID,
 *      or pass it inline when running the script.
 *
 * Usage:
 *   # Preview what would be reset (no writes)
 *   GCLOUD_PROJECT=recipe-app-1bbdc node scripts/reset-recipe-counts.js --dry-run
 *
 *   # Actually reset
 *   GCLOUD_PROJECT=recipe-app-1bbdc node scripts/reset-recipe-counts.js
 */

const admin = require('firebase-admin');

const DRY_RUN = process.argv.includes('--dry-run');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'recipe-app-1bbdc',
});

const db = admin.firestore();

const PLAN_LIMITS = {
  1: 3,
  2: 40,
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function resetRecipeCounts() {
  if (DRY_RUN) {
    console.log('🏃 DRY RUN — no changes will be written\n');
  }

  const usersSnapshot = await db.collection('users').get();
  const now = new Date();
  let resetCount = 0;
  let skippedCount = 0;
  let freePlanResetCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    const plan = data.plan;

    if (!plan || plan.planId === 3) {
      skippedCount++;
      continue;
    }

    const lastReset = (plan.updatedAt || plan.startedAt)?.toDate();

    if (!lastReset) {
      console.log(`⚠️  User ${userDoc.id} has no updatedAt or startedAt — skipping`);
      skippedCount++;
      continue;
    }

    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

    if (now - lastReset >= THIRTY_DAYS_MS) {
      const defaultCount = PLAN_LIMITS[plan.planId] ?? 3;

      if (plan.planId >= 2) {
        console.log(
          `${DRY_RUN ? '🔍' : '✅'} ${data.email} (plan ${plan.planId}): ${plan.recipeCount} → ${defaultCount} (${Math.floor(daysSinceReset)} days since last reset)`
        );
      } else {
        freePlanResetCount++;
      }

      if (!DRY_RUN) {
        batch.update(userDoc.ref, {
          'plan.recipeCount': defaultCount,
          'plan.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        });
        batchCount++;

        if (batchCount === 500) {
          await batch.commit();
          console.log(`📦 Committed batch of ${batchCount}`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      resetCount++;
    } else {
      skippedCount++;
    }
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`📦 Committed final batch of ${batchCount}`);
  }

  console.log(`\nDone. ${DRY_RUN ? 'Would reset' : 'Reset'}: ${resetCount} (free plan: ${freePlanResetCount}), Skipped: ${skippedCount}`);
}

resetRecipeCounts().catch(console.error);
