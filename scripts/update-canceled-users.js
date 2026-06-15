/**
 * Mark a single user as canceled and downgrade to free plan by user id.
 *
 * Setup:
 *   1. Login with your Google account:
 *        gcloud auth application-default login
 *
 * Usage:
 *   # Preview changes only
 *   node scripts/update-canceled-users.js --uid USER_ID --dry-run
 *
 *   # Mark as canceled and downgrade to free plan
 *   node scripts/update-canceled-users.js --uid USER_ID
 *
 * Optional:
 *   --expires-at 2026-06-30T23:59:59Z
 *   --canceled-at 2026-05-28T12:34:56Z
 *   --project-id recipe-app-1bbdc
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);

function readArg(name, fallback = undefined) {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  const value = args[idx + 1];
  if (!value || value.startsWith('--')) return fallback;
  return value;
}

function hasFlag(name) {
  return args.includes(name);
}

const uid = readArg('--uid');
const projectId = readArg('--project-id', 'recipe-app-1bbdc');
const expiresAtArg = readArg('--expires-at');
const canceledAtArg = readArg('--canceled-at');
const dryRun = hasFlag('--dry-run');

if (!uid) {
  console.error('Missing --uid argument.');
  console.error('Example: node scripts/update-canceled-users.js --uid USER_ID --dry-run');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

const db = admin.firestore();

function toTimestamp(value) {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number') {
    // If it's in seconds, convert to ms.
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return admin.firestore.Timestamp.fromDate(d);
  }

  if (typeof value === 'string') {
    // Numeric string support.
    if (/^\d+(\.\d+)?$/.test(value.trim())) {
      return toTimestamp(Number(value.trim()));
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return admin.firestore.Timestamp.fromDate(d);
  }

  return null;
}

function buildPayload() {
  const payload = {
    'plan.planId': 1,
    'plan.cost': 0,
    'plan.name': 'Basico',
    'plan.recipeCount': 3,
    'plan.toBeCanceled': false,
    'plan.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    'plan.expiresAt': admin.firestore.FieldValue.delete(),
  };

  const expiresAtTs = toTimestamp(expiresAtArg);
  if (expiresAtTs) {
    payload['plan.expiresAt'] = expiresAtTs;
  }

  const canceledAtTs = toTimestamp(canceledAtArg);
  if (canceledAtTs) {
    payload['plan.canceledAt'] = canceledAtTs;
  }

  return payload;
}

async function run() {
  if (dryRun) {
    console.log('DRY RUN - no changes will be written\n');
  }

  console.log(`Project: ${projectId}`);
  console.log(`UID: ${uid}\n`);

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    console.log('User not found. No changes made.');
    process.exit(1);
  }

  const userEmail = userSnap.get('email') || '(no email)';
  const payload = buildPayload();

  if (dryRun) {
    console.log(`WOULD UPDATE uid=${uid} email=${userEmail}`);
    console.log('Fields: plan.planId=1, plan.cost=0, plan.name=Basico, plan.recipeCount=3');
    console.log('Fields: plan.toBeCanceled=false, plan.updatedAt=serverTimestamp, plan.expiresAt=delete');
    if (payload['plan.expiresAt']) {
      console.log('Field: plan.expiresAt');
    }
    if (payload['plan.canceledAt']) {
      console.log('Field: plan.canceledAt');
    }
  } else {
    await userRef.update(payload);
    console.log(`Updated uid=${uid} email=${userEmail}`);
  }

  console.log('\nDone.');
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
