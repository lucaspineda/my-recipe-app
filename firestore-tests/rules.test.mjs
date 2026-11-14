// Tests for firestore.rules, run against the Firestore emulator.
//
//   npm run test:rules
//
// Needs the Firebase CLI (`firebase`) and Java. The emulator uses a demo project, so nothing here
// touches production. Each test sends the same writes as the app code it names, with the app's
// own Firebase web SDK, so rules see what production sees (serverTimestamp, dotted field paths,
// batches). Documents are seeded with the Admin SDK, which skips the rules like the backend does.

import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  terminate,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// The SDK logs every denied request; the assertions below are the output that matters.
setLogLevel('silent');

const PROJECT = 'demo-chefinho-rules';
const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST;
if (!EMULATOR) {
  throw new Error('FIRESTORE_EMULATOR_HOST is not set. Run this with `npm run test:rules`.');
}
const [EMULATOR_HOST, EMULATOR_PORT] = EMULATOR.split(':');

const adminApp = initializeAdminApp({ projectId: PROJECT }, 'admin');
const adminDb = getAdminFirestore(adminApp);

const clientApps = [];
const clientDbs = [];

// A browser client signed in as `uid`, or logged out when uid is null.
function client(uid) {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'test-api-key' }, `client-${clientApps.length}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(
    db,
    EMULATOR_HOST,
    Number(EMULATOR_PORT),
    uid ? { mockUserToken: { user_id: uid, sub: uid, email: `${uid}@example.com` } } : {},
  );
  clientApps.push(app);
  clientDbs.push(db);
  return db;
}

let alice; // the user under test
let bob; // another signed-in user (the attacker, or a viewer of alice's shared recipe)
let anon; // logged-out visitor

before(() => {
  alice = client('alice');
  bob = client('bob');
  anon = client(null);
});

beforeEach(async () => {
  const res = await fetch(
    `http://${EMULATOR}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  assert.equal(res.status, 200, 'could not clear the emulator');
});

after(async () => {
  await Promise.all(clientDbs.map((db) => terminate(db)));
  await Promise.all(clientApps.map((app) => deleteApp(app)));
  await deleteAdminApp(adminApp);
});

async function allowed(promise) {
  return promise;
}

async function denied(promise) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, 'permission-denied', `expected permission-denied, got ${error.code}: ${error.message}`);
    return true;
  });
}

function firstSnapshot(ref) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        unsubscribe();
        resolve(snapshot);
      },
      reject,
    );
  });
}

// ---- seed data, shaped like production ------------------------------------------------------

// FreePlan in app/hooks/userAuth.ts
const appFreePlan = () => ({
  recipeCount: 3,
  planId: 1,
  startedAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  name: 'Básico',
  cost: 0,
});

const seededFreePlan = (recipeCount = 3) => ({
  recipeCount,
  planId: 1,
  startedAt: new Date('2026-10-01T12:00:00Z'),
  updatedAt: new Date('2026-10-01T12:00:00Z'),
  name: 'Básico',
  cost: 0,
});

// What the Stripe webhook (recipe-app-server src/webhook/webhook.controller.ts) writes.
const seededPaidPlan = ({ planId = 2, recipeCount = 40 } = {}) => ({
  planId,
  startedAt: new Date('2026-10-05T12:00:00Z'),
  expiresAt: new Date('2026-11-05T12:00:00Z'),
  cost: planId === 3 ? 29.9 : 19.9,
  name: planId === 3 ? 'Premium' : 'Pro',
  recipeCount,
});

async function seedUser(uid, { plan = seededFreePlan(), ...fields } = {}) {
  await adminDb.doc(`users/${uid}`).set({
    email: `${uid}@example.com`,
    createdAt: new Date('2026-10-01T12:00:00Z'),
    plan,
    ...fields,
  });
}

// saveRecipe in app/components/MealForm/MealForm.tsx
const appRecipe = (userId) => ({
  title: 'Frango com batata',
  introduction: 'Uma receita simples.',
  ingredients: [{ nome: 'frango', quantidade: '500 g' }],
  preparationMethod: ['Tempere o frango.', 'Asse por 40 minutos.'],
  observations: 'Sirva quente.',
  nutritionalInfo: null,
  imageUrl: null,
  userId,
  createdAt: serverTimestamp(),
});

async function seedRecipe(id, userId, extra = {}) {
  await adminDb.doc(`recipes/${id}`).set({
    title: 'Bolo de cenoura',
    introduction: 'Clássico.',
    ingredients: [{ nome: 'cenoura', quantidade: '3' }],
    preparationMethod: ['Bata tudo.'],
    observations: '',
    nutritionalInfo: null,
    imageUrl: null,
    userId,
    createdAt: new Date(),
    ...extra,
  });
}

async function seedList(id, userId, itemCount = 0) {
  await adminDb.doc(`shoppingLists/${id}`).set({
    userId,
    name: 'Mercado',
    status: 'active',
    itemCount,
    pendingItemCount: itemCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  for (let i = 0; i < itemCount; i += 1) {
    await adminDb.doc(`shoppingLists/${id}/items/item${i}`).set({
      name: `item ${i}`,
      quantityText: '1',
      checked: false,
      sourceType: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

const appListItem = (i) => ({
  name: `ingrediente ${i}`,
  quantityText: '200 g',
  checked: false,
  sourceType: 'recipe',
  sourceRecipeId: 'recipe1',
  sourceRecipeTitle: 'Frango com batata',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

// buildEmptyWeekSlots in app/planejamento/shared.ts, shortened to two days
const emptySlots = () => ({
  '2026-11-09': { breakfast: null, lunch: null, dinner: null },
  '2026-11-10': { breakfast: null, lunch: null, dinner: null },
});

// trackEvent in app/lib/analytics.ts
const appEvent = (userId, eventName = 'page_visit') => ({
  userId,
  userEmail: userId === 'unknown' ? 'unknown' : `${userId}@example.com`,
  eventName,
  host: 'chefinhoia.com.br',
  route: '/',
  trafficSource: 'organic',
  trafficMedium: 'none',
  trafficDetails: null,
  userPlatform: 'ios',
  isPWA: false,
  landingVariant: 'redesign',
  landingVisitorId: 'v_123',
  createdAt: serverTimestamp(),
  metadata: { pageName: 'landing' },
});

// =============================================================================================
describe('users: signup and login', () => {
  test('email signup creates the user doc with the free plan (createUserInDB)', async () => {
    await allowed(setDoc(doc(alice, 'users', 'alice'), {
      email: 'alice@example.com',
      createdAt: serverTimestamp(),
      plan: appFreePlan(),
    }));
    const snap = await getDoc(doc(alice, 'users', 'alice'));
    assert.equal(snap.data().plan.recipeCount, 3);
  });

  test('signup and ProtectedRoute getUser() both creating the doc: the second setDoc is allowed', async () => {
    const payload = () => ({ email: 'alice@example.com', createdAt: serverTimestamp(), plan: appFreePlan() });
    await allowed(setDoc(doc(alice, 'users', 'alice'), payload()));
    await allowed(setDoc(doc(alice, 'users', 'alice'), payload()));
  });

  test('Facebook signup without an email (createUserInDBByUid)', async () => {
    await allowed(setDoc(doc(alice, 'users', 'alice'), { email: null, createdAt: serverTimestamp(), plan: appFreePlan() }));
  });

  test('getUser() reads its own doc, and its own missing doc', async () => {
    await allowed(getDoc(doc(alice, 'users', 'alice')));
    await seedUser('alice');
    const snap = await allowed(getDoc(doc(alice, 'users', 'alice')));
    assert.equal(snap.data().email, 'alice@example.com');
  });

  test('registerLoginInDB updates email and lastLoginAt', async () => {
    await seedUser('alice');
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { email: 'alice@example.com', lastLoginAt: serverTimestamp() }));
  });

  test('profile page edits the name (EditProfileField)', async () => {
    await seedUser('alice');
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { name: 'Alice' }));
  });
});

describe('users: plan and recipe credits', () => {
  test('MealForm decrements plan.recipeCount after a recipe', async () => {
    await seedUser('alice', { plan: seededFreePlan(3) });
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.recipeCount': 2 }));
  });

  test('recipe page writes Math.max(count - 1, 0) when the count is already 0', async () => {
    await seedUser('alice', { plan: seededFreePlan(0) });
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.recipeCount': 0 }));
  });

  test('a second tab with a stale count writes the same value again', async () => {
    await seedUser('alice', { plan: seededFreePlan(2) });
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.recipeCount': 2 }));
  });

  test('unlimited plan with recipeCount null: MealForm writes null - 1 = -1, then -2', async () => {
    await seedUser('alice', { plan: seededPaidPlan({ planId: 3, recipeCount: null }) });
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.recipeCount': -1 }));
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.recipeCount': -2 }));
  });

  test('paid plan decrements too', async () => {
    await seedUser('alice', { plan: seededPaidPlan({ planId: 2, recipeCount: 40 }) });
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.recipeCount': 39 }));
  });

  test('survey reward: surveyCompletedAt and +5 credits in one write (SurveyRewardModal)', async () => {
    await seedUser('alice', { plan: seededFreePlan(0) });
    await allowed(addDoc(collection(alice, 'survey_responses'), {
      userId: 'alice',
      wouldPay: true,
      wouldPayWhyNot: null,
      desiredFeature: 'Lista de compras',
      rating: 5,
      ratingComment: 'Ótimo',
      whatsapp: null,
      createdAt: serverTimestamp(),
    }));
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { surveyCompletedAt: serverTimestamp(), 'plan.recipeCount': 5 }));
  });

  test('plans page cancels by rewriting the plan it read with toBeCanceled: true', async () => {
    await seedUser('alice', { plan: seededPaidPlan() });
    const user = (await getDoc(doc(alice, 'users', 'alice'))).data();
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { plan: { ...user.plan, toBeCanceled: true } }));
  });

  test('cancel as a dotted field update', async () => {
    await seedUser('alice', { plan: seededPaidPlan() });
    await allowed(updateDoc(doc(alice, 'users', 'alice'), { 'plan.toBeCanceled': true }));
  });
});

describe('users: attacks', () => {
  test("cannot read another user's doc", async () => {
    await seedUser('alice');
    await denied(getDoc(doc(bob, 'users', 'alice')));
    await denied(getDoc(doc(anon, 'users', 'alice')));
  });

  test('cannot list the users collection', async () => {
    await seedUser('alice');
    await seedUser('bob');
    await denied(getDocs(collection(bob, 'users')));
    await denied(getDocs(query(collection(bob, 'users'), where('email', '==', 'alice@example.com'))));
  });

  test("cannot write another user's doc", async () => {
    await seedUser('alice');
    await denied(updateDoc(doc(bob, 'users', 'alice'), { name: 'hacked' }));
    await denied(updateDoc(doc(bob, 'users', 'alice'), { 'plan.recipeCount': 0 }));
    await denied(setDoc(doc(bob, 'users', 'carol'), { email: 'x', createdAt: serverTimestamp(), plan: appFreePlan() }));
    await denied(deleteDoc(doc(bob, 'users', 'alice')));
  });

  test('cannot give yourself a paid plan', async () => {
    await seedUser('bob');
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.planId': 3 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.planId': 2, 'plan.name': 'Pro', 'plan.cost': 19.9, 'plan.recipeCount': 40 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { plan: { ...seededPaidPlan({ planId: 3, recipeCount: null }) } }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.expiresAt': new Date('2030-01-01') }));
  });

  test('cannot sign up with a paid plan or extra credits', async () => {
    await denied(setDoc(doc(bob, 'users', 'bob'), { email: 'bob@example.com', createdAt: serverTimestamp(), plan: { ...appFreePlan(), planId: 3 } }));
    await denied(setDoc(doc(bob, 'users', 'bob'), { email: 'bob@example.com', createdAt: serverTimestamp(), plan: { ...appFreePlan(), recipeCount: 1000 } }));
    await denied(setDoc(doc(bob, 'users', 'bob'), { email: 'bob@example.com', createdAt: serverTimestamp(), plan: { ...appFreePlan(), expiresAt: new Date('2030-01-01') } }));
  });

  test('cannot add recipe credits', async () => {
    await seedUser('bob', { plan: seededFreePlan(0) });
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.recipeCount': 1 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.recipeCount': 1000 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.recipeCount': null }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.recipeCount': deleteField() }));
  });

  test('cannot reset credits by re-creating the doc with a fresh free plan', async () => {
    await seedUser('bob', { plan: seededFreePlan(0) });
    await denied(setDoc(doc(bob, 'users', 'bob'), { email: 'bob@example.com', createdAt: serverTimestamp(), plan: appFreePlan() }));
    await denied(deleteDoc(doc(bob, 'users', 'bob')));
  });

  test('unlimited plan (recipeCount null) cannot switch to a positive count', async () => {
    await seedUser('bob', { plan: seededPaidPlan({ planId: 3, recipeCount: null }) });
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.recipeCount': 1000 }));
  });

  test('survey bonus: at most +5, only once, and surveyCompletedAt cannot be removed or backdated', async () => {
    await seedUser('bob', { plan: seededFreePlan(0) });
    await denied(updateDoc(doc(bob, 'users', 'bob'), { surveyCompletedAt: serverTimestamp(), 'plan.recipeCount': 6 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { surveyCompletedAt: new Date('2026-01-01'), 'plan.recipeCount': 5 }));
    await allowed(updateDoc(doc(bob, 'users', 'bob'), { surveyCompletedAt: serverTimestamp(), 'plan.recipeCount': 5 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { surveyCompletedAt: serverTimestamp(), 'plan.recipeCount': 10 }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { surveyCompletedAt: deleteField() }));
  });

  test('cannot un-cancel, or push back the monthly reset date', async () => {
    await seedUser('bob', { plan: { ...seededPaidPlan(), toBeCanceled: true } });
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.toBeCanceled': false }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.updatedAt': new Date('2026-01-01') }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { 'plan.startedAt': serverTimestamp() }));
  });

  test('cannot drop the plan or add unknown fields', async () => {
    await seedUser('bob');
    await denied(updateDoc(doc(bob, 'users', 'bob'), { plan: deleteField() }));
    await denied(updateDoc(doc(bob, 'users', 'bob'), { isAdmin: true }));
  });
});

// =============================================================================================
describe('recipes', () => {
  test('anyone, logged out included, can read a shared recipe (getRecipe.ts, recipe page)', async () => {
    await seedRecipe('r1', 'alice');
    await allowed(getDoc(doc(anon, 'recipes', 'r1')));
    await allowed(firstSnapshot(doc(bob, 'recipes', 'r1')));
  });

  test('MealForm saves a generated recipe, then the image URL (generateRecipeImage)', async () => {
    const ref = await allowed(addDoc(collection(alice, 'recipes'), appRecipe('alice')));
    await allowed(updateDoc(doc(alice, 'recipes', ref.id), { imageUrl: 'https://storage.googleapis.com/x.png' }));
  });

  test('owner refines a recipe (handleRefineRecipe)', async () => {
    await seedRecipe('r1', 'alice');
    await allowed(updateDoc(doc(alice, 'recipes', 'r1'), {
      title: 'Bolo de cenoura fit',
      introduction: 'Versão leve.',
      ingredients: [{ nome: 'cenoura', quantidade: '3' }],
      preparationMethod: ['Bata tudo.'],
      observations: '',
      nutritionalInfo: null,
      imageUrl: null,
    }));
  });

  test("home and minhas-receitas list the user's recipes", async () => {
    await seedRecipe('r1', 'alice');
    await seedRecipe('r2', 'bob');
    const snap = await allowed(getDocs(query(collection(alice, 'recipes'), where('userId', '==', 'alice'), orderBy('createdAt', 'desc'), limit(3))));
    assert.equal(snap.size, 1);
  });

  test('a signed-in viewer gives feedback on a shared recipe, changes it, and adds a reason', async () => {
    await seedRecipe('r1', 'alice', { feedback: [{ type: 'up', userId: 'carol', timestamp: '2026-11-01T00:00:00Z' }] });
    // handleFeedback: filter out own entry, push the new one
    let feedback = (await getDoc(doc(bob, 'recipes', 'r1'))).data().feedback;
    feedback = [...feedback.filter((f) => f.userId !== 'bob'), { type: 'up', userId: 'bob', timestamp: new Date().toISOString() }];
    await allowed(updateDoc(doc(bob, 'recipes', 'r1'), { feedback }));
    feedback = [...feedback.filter((f) => f.userId !== 'bob'), { type: 'down', userId: 'bob', timestamp: new Date().toISOString() }];
    await allowed(updateDoc(doc(bob, 'recipes', 'r1'), { feedback }));
    // handleSubmitReason
    feedback = feedback.map((f) => (f.userId === 'bob' && f.type === 'down' ? { ...f, reason: 'Muito difícil' } : f));
    await allowed(updateDoc(doc(bob, 'recipes', 'r1'), { feedback }));
  });

  test('first feedback on a recipe with no feedback field', async () => {
    await seedRecipe('r1', 'alice');
    await allowed(updateDoc(doc(bob, 'recipes', 'r1'), { feedback: [{ type: 'up', userId: 'bob', timestamp: new Date().toISOString() }] }));
  });

  test("cannot edit, take over or delete someone else's recipe", async () => {
    await seedRecipe('r1', 'alice', { feedback: [{ type: 'up', userId: 'carol', timestamp: 't' }] });
    await denied(updateDoc(doc(bob, 'recipes', 'r1'), { title: 'hacked' }));
    await denied(updateDoc(doc(bob, 'recipes', 'r1'), { imageUrl: 'https://evil.example/x.png' }));
    await denied(updateDoc(doc(bob, 'recipes', 'r1'), { userId: 'bob' }));
    await denied(updateDoc(doc(bob, 'recipes', 'r1'), { feedback: [] }));
    await denied(updateDoc(doc(bob, 'recipes', 'r1'), { feedback: [1, 2, 3] }));
    await denied(updateDoc(doc(bob, 'recipes', 'r1'), { feedback: [{ type: 'up', userId: 'bob' }], title: 'hacked' }));
    await denied(setDoc(doc(bob, 'recipes', 'r1'), appRecipe('bob')));
    await denied(deleteDoc(doc(bob, 'recipes', 'r1')));
    await denied(updateDoc(doc(anon, 'recipes', 'r1'), { feedback: [{ type: 'up', userId: 'carol', timestamp: 't' }, { type: 'up', userId: 'x' }] }));
  });

  test('cannot create a recipe for someone else or while logged out; owner cannot give it away', async () => {
    await denied(addDoc(collection(bob, 'recipes'), appRecipe('alice')));
    await denied(addDoc(collection(anon, 'recipes'), appRecipe('unknown')));
    await seedRecipe('r1', 'alice');
    await denied(updateDoc(doc(alice, 'recipes', 'r1'), { userId: 'bob' }));
    await allowed(deleteDoc(doc(alice, 'recipes', 'r1')));
  });
});

// =============================================================================================
describe('shopping lists', () => {
  test('create a list, list them, open one (lista-de-compras pages, ShoppingListsWidget)', async () => {
    const ref = await allowed(addDoc(collection(alice, 'shoppingLists'), {
      userId: 'alice',
      name: 'Mercado',
      status: 'active',
      itemCount: 0,
      pendingItemCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await seedList('bobs', 'bob');
    const lists = await allowed(getDocs(query(collection(alice, 'shoppingLists'), where('userId', '==', 'alice'))));
    assert.equal(lists.size, 1);
    await allowed(firstSnapshot(query(collection(alice, 'shoppingLists'), where('userId', '==', 'alice'))));
    await allowed(firstSnapshot(doc(alice, 'shoppingLists', ref.id)));
    await allowed(firstSnapshot(collection(alice, 'shoppingLists', ref.id, 'items')));
  });

  test('meal planner creates a week list with 60 items in one batch (planejamento)', async () => {
    const listRef = doc(collection(alice, 'shoppingLists'));
    const batch = writeBatch(alice);
    batch.set(listRef, {
      userId: 'alice',
      name: 'Lista da semana 9 a 15 nov',
      status: 'active',
      itemCount: 60,
      pendingItemCount: 60,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    for (let i = 0; i < 60; i += 1) {
      batch.set(doc(collection(alice, 'shoppingLists', listRef.id, 'items')), appListItem(i));
    }
    await allowed(batch.commit());
    const items = await getDocs(collection(alice, 'shoppingLists', listRef.id, 'items'));
    assert.equal(items.size, 60);
  });

  test("recipe page adds a recipe's ingredients to an existing list in one batch (useRecipeShoppingListFlow)", async () => {
    await seedList('l1', 'alice', 2);
    await allowed(getDocs(collection(alice, 'shoppingLists', 'l1', 'items')));
    const batch = writeBatch(alice);
    for (let i = 0; i < 30; i += 1) {
      batch.set(doc(collection(alice, 'shoppingLists', 'l1', 'items')), appListItem(i));
    }
    batch.update(doc(alice, 'shoppingLists', 'l1'), { itemCount: 32, pendingItemCount: 32, updatedAt: serverTimestamp() });
    await allowed(batch.commit());
  });

  test('add, check, remove items and delete the list (lista-de-compras/[id])', async () => {
    await seedList('l1', 'alice', 3);
    const itemRef = await allowed(addDoc(collection(alice, 'shoppingLists', 'l1', 'items'), {
      name: 'arroz',
      quantityText: '1 kg',
      checked: false,
      sourceType: 'manual',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await allowed(updateDoc(doc(alice, 'shoppingLists', 'l1'), { itemCount: 4, pendingItemCount: 4, updatedAt: serverTimestamp() }));
    await allowed(updateDoc(doc(alice, 'shoppingLists', 'l1', 'items', itemRef.id), { checked: true, updatedAt: serverTimestamp() }));
    await allowed(deleteDoc(doc(alice, 'shoppingLists', 'l1', 'items', itemRef.id)));
    await allowed(updateDoc(doc(alice, 'shoppingLists', 'l1'), { status: 'completed', updatedAt: serverTimestamp() }));

    // Delete the list while the page listens to it and its items, like the list page does.
    const listenerErrors = [];
    const unsubscribeList = onSnapshot(doc(alice, 'shoppingLists', 'l1'), () => {}, (e) => listenerErrors.push(e));
    const unsubscribeItems = onSnapshot(collection(alice, 'shoppingLists', 'l1', 'items'), () => {}, (e) => listenerErrors.push(e));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const items = await allowed(getDocs(collection(alice, 'shoppingLists', 'l1', 'items')));
    await allowed(Promise.all(items.docs.map((d) => deleteDoc(d.ref))));
    await allowed(deleteDoc(doc(alice, 'shoppingLists', 'l1')));
    await new Promise((resolve) => setTimeout(resolve, 500));
    unsubscribeList();
    unsubscribeItems();
    assert.deepEqual(listenerErrors.map((e) => e.code), []);

    // The list page may still listen to a list it just deleted.
    await allowed(getDoc(doc(alice, 'shoppingLists', 'l1')));
  });

  test("cannot read or change someone else's list or items", async () => {
    await seedList('l1', 'alice', 2);
    await denied(getDoc(doc(bob, 'shoppingLists', 'l1')));
    await denied(getDocs(collection(bob, 'shoppingLists')));
    await denied(getDocs(query(collection(bob, 'shoppingLists'), where('userId', '==', 'alice'))));
    await denied(getDocs(collection(bob, 'shoppingLists', 'l1', 'items')));
    await denied(getDoc(doc(bob, 'shoppingLists', 'l1', 'items', 'item0')));
    await denied(updateDoc(doc(bob, 'shoppingLists', 'l1'), { name: 'hacked' }));
    await denied(updateDoc(doc(bob, 'shoppingLists', 'l1'), { userId: 'bob' }));
    await denied(deleteDoc(doc(bob, 'shoppingLists', 'l1')));
    await denied(addDoc(collection(bob, 'shoppingLists', 'l1', 'items'), appListItem(1)));
    await denied(updateDoc(doc(bob, 'shoppingLists', 'l1', 'items', 'item0'), { checked: true }));
    await denied(deleteDoc(doc(bob, 'shoppingLists', 'l1', 'items', 'item0')));
    await denied(addDoc(collection(bob, 'shoppingLists'), { userId: 'alice', name: 'x' }));
    await denied(getDocs(collection(anon, 'shoppingLists', 'l1', 'items')));
  });

  test("cannot slip items into someone else's list inside a batch", async () => {
    await seedList('l1', 'alice');
    const batch = writeBatch(bob);
    batch.update(doc(bob, 'shoppingLists', 'l1'), { userId: 'bob' });
    batch.set(doc(collection(bob, 'shoppingLists', 'l1', 'items')), appListItem(1));
    await denied(batch.commit());
  });

  test('owner cannot hand a list to someone else', async () => {
    await seedList('l1', 'alice');
    await denied(updateDoc(doc(alice, 'shoppingLists', 'l1'), { userId: 'bob' }));
  });
});

// =============================================================================================
describe('meal planner', () => {
  const planId = 'alice_2026-11-09';

  test("reads this week's missing plan, creates it, adds and removes a meal (useRecipeMealPlannerFlow, planejamento)", async () => {
    const ref = doc(alice, 'mealPlans', planId);
    const missing = await allowed(getDoc(ref));
    assert.equal(missing.exists(), false);
    await allowed(firstSnapshot(ref));
    await allowed(setDoc(ref, {
      userId: 'alice',
      weekStartDate: '2026-11-09',
      weekEndDate: '2026-11-15',
      slots: emptySlots(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await allowed(updateDoc(ref, {
      'slots.2026-11-10.lunch': {
        recipeId: 'r1',
        recipeTitle: 'Frango com batata',
        servings: 2,
        note: null,
        addedFrom: 'recipe-page',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    }));
    await allowed(updateDoc(ref, { 'slots.2026-11-10.lunch': null, updatedAt: serverTimestamp() }));
    await allowed(firstSnapshot(ref));
  });

  test("cannot read or write someone else's plan", async () => {
    await adminDb.doc(`mealPlans/${planId}`).set({ userId: 'alice', weekStartDate: '2026-11-09', slots: {} });
    await denied(getDoc(doc(bob, 'mealPlans', planId)));
    await denied(getDoc(doc(bob, 'mealPlans', 'alice_2026-11-16')));
    await denied(updateDoc(doc(bob, 'mealPlans', planId), { 'slots.2026-11-10.lunch': null }));
    await denied(deleteDoc(doc(bob, 'mealPlans', planId)));
    await denied(setDoc(doc(bob, 'mealPlans', 'alice_2026-11-16'), { userId: 'alice', slots: {} }));
    await denied(setDoc(doc(bob, 'mealPlans', 'alice_2026-11-16'), { userId: 'bob', slots: {} }));
    await denied(getDoc(doc(anon, 'mealPlans', planId)));
  });
});

// =============================================================================================
describe('survey responses, events, plans, everything else', () => {
  test('survey responses: users write their own, nobody reads them', async () => {
    const ref = await allowed(addDoc(collection(alice, 'survey_responses'), { userId: 'alice', rating: 5, createdAt: serverTimestamp() }));
    await denied(getDoc(doc(alice, 'survey_responses', ref.id)));
    await denied(getDocs(collection(alice, 'survey_responses')));
    await denied(addDoc(collection(bob, 'survey_responses'), { userId: 'alice', rating: 1 }));
    await denied(addDoc(collection(anon, 'survey_responses'), { userId: 'unknown', rating: 1 }));
  });

  test('events: logged-out visitors and signed-in users create events (trackEvent)', async () => {
    await allowed(addDoc(collection(anon, 'events'), appEvent('unknown')));
    await allowed(addDoc(collection(alice, 'events'), appEvent('alice', 'signup')));
    await allowed(addDoc(collection(alice, 'events'), appEvent('unknown')));
  });

  test('events: nobody reads, edits or deletes them, or writes them for another user', async () => {
    const ref = await allowed(addDoc(collection(alice, 'events'), appEvent('alice')));
    await denied(getDoc(doc(alice, 'events', ref.id)));
    await denied(getDocs(collection(alice, 'events')));
    await denied(updateDoc(doc(alice, 'events', ref.id), { eventName: 'x' }));
    await denied(deleteDoc(doc(alice, 'events', ref.id)));
    await denied(addDoc(collection(bob, 'events'), appEvent('alice')));
    await denied(addDoc(collection(anon, 'events'), appEvent('alice')));
  });

  test('plans: anyone reads the catalog, nobody writes it', async () => {
    await adminDb.doc('plans/1').set({ id: 1, name: 'Básico', cost: 0, recipeCount: 3 });
    await allowed(getDocs(collection(anon, 'plans')));
    await allowed(getDocs(collection(alice, 'plans')));
    await denied(setDoc(doc(alice, 'plans', '1'), { id: 1, name: 'Básico', cost: 0, recipeCount: 1000 }));
    await denied(addDoc(collection(alice, 'plans'), { id: 9 }));
  });

  test('collections without a rule are closed', async () => {
    await denied(setDoc(doc(alice, 'anything', 'x'), { a: 1 }));
    await denied(getDoc(doc(alice, 'anything', 'x')));
    await denied(setDoc(doc(alice, 'users', 'alice', 'private', 'x'), { a: 1 }));
  });
});
