import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'cricket_scorekeeper';

let cachedClient = null;
let cachedDb = null;
let isMongoAvailable = false;
let mongoChecked = false;

// Shared in-flight connection promise. This is the fix for the race
// condition: while a connection is being established, every concurrent
// caller awaits the SAME promise instead of each racing to read
// cachedClient/cachedDb before they're actually set.
let connectingPromise = null;

// Local JSON storage fallback for seamless instant local running and preview
const DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_STORE_FILE = path.join(DATA_DIR, 'local_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('[STORAGE] Could not create .data directory, will use memory');
    }
  }
}

function readLocalStore() {
  ensureDataDir();
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[STORAGE] Error reading local store file:', err.message);
  }
  return { users: [], sessions: [], accounts: [], matches: [] };
}

function writeLocalStore(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[STORAGE] Error writing local store file:', err.message);
  }
}

// Memory collections wrapper mimicking MongoDB Collection interface
class LocalCollection {
  constructor(collectionName) {
    this.name = collectionName;
  }

  async findOne(query) {
    const store = readLocalStore();
    const items = store[this.name] || [];
    return items.find(item => matchQuery(item, query)) || null;
  }

  async find(query = {}) {
    const store = readLocalStore();
    const items = (store[this.name] || []).filter(item => matchQuery(item, query));
    return {
      sort: (sortObj) => ({
        toArray: async () => {
          return sortItems([...items], sortObj);
        }
      }),
      toArray: async () => items
    };
  }

  async insertOne(doc) {
    const store = readLocalStore();
    if (!store[this.name]) store[this.name] = [];
    const newDoc = {
      ...doc,
      _id: doc._id || new ObjectId().toString(),
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date()
    };
    store[this.name].push(newDoc);
    writeLocalStore(store);
    return { insertedId: newDoc._id };
  }

  async updateOne(query, update) {
    const store = readLocalStore();
    const items = store[this.name] || [];
    const index = items.findIndex(item => matchQuery(item, query));
    if (index === -1) return { matchedCount: 0, modifiedCount: 0 };

    let current = { ...items[index] };
    if (update.$set) {
      current = { ...current, ...update.$set, updatedAt: new Date() };
    }
    if (update.$push) {
      for (const key of Object.keys(update.$push)) {
        if (!Array.isArray(current[key])) current[key] = [];
        current[key].push(update.$push[key]);
      }
    }
    items[index] = current;
    store[this.name] = items;
    writeLocalStore(store);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(query) {
    const store = readLocalStore();
    const items = store[this.name] || [];
    const initialLen = items.length;
    store[this.name] = items.filter(item => !matchQuery(item, query));
    writeLocalStore(store);
    return { deletedCount: initialLen - store[this.name].length };
  }

  async countDocuments(query = {}) {
    const store = readLocalStore();
    const items = (store[this.name] || []).filter(item => matchQuery(item, query));
    return items.length;
  }

  async createIndex(keys, options) {
    // No-op for local mock
    return 'ok';
  }
}

function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, val] of Object.entries(query)) {
    if (key === '_id') {
      const itemId = item._id ? item._id.toString() : '';
      const queryId = val ? val.toString() : '';
      if (itemId !== queryId) return false;
    } else if (val && typeof val === 'object' && val.$in) {
      if (!val.$in.includes(item[key])) return false;
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

function sortItems(items, sortObj) {
  if (!sortObj) return items;
  return items.sort((a, b) => {
    for (const [key, dir] of Object.entries(sortObj)) {
      const valA = a[key];
      const valB = b[key];
      if (valA < valB) return dir === 1 ? -1 : 1;
      if (valA > valB) return dir === 1 ? 1 : -1;
    }
    return 0;
  });
}

async function establishMongoConnection() {
  cachedClient = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 4000,
    serverSelectionTimeoutMS: 4000,
  });
  await cachedClient.connect();
  cachedDb = cachedClient.db(DATABASE_NAME);
  isMongoAvailable = true;
  console.log(`[DATABASE] Connected successfully to MongoDB: ${DATABASE_NAME}`);

  initIndexes(cachedDb).catch(err => {
    console.warn('[DATABASE] Notice on index creation:', err.message);
  });

  return { client: cachedClient, db: cachedDb, isMongo: true };
}

// Connect to MongoDB with automatic fallback and index setup.
// Safe for concurrent callers: only one connection attempt is ever in
// flight at a time — every concurrent caller awaits that same attempt
// instead of each independently racing cachedClient/cachedDb.
export async function connectToDatabase() {
  // Already fully connected — fast path, no locking needed.
  if (cachedClient && cachedDb && isMongoAvailable) {
    return { client: cachedClient, db: cachedDb, isMongo: true };
  }

  // A connection attempt is already in progress — wait for it instead of
  // starting a second one (this is what fixes the race condition).
  if (connectingPromise) {
    return connectingPromise;
  }

  if (MONGODB_URI && MONGODB_URI.startsWith('mongodb')) {
    connectingPromise = establishMongoConnection()
      .catch((err) => {
        console.warn(
          `[DATABASE WARNING] Could not connect to MongoDB: ${err.message}. Using safe local storage fallback.`
        );
        isMongoAvailable = false;
        cachedClient = null;
        cachedDb = null;
        const fallbackDb = { collection: (name) => new LocalCollection(name) };
        return { client: null, db: fallbackDb, isMongo: false };
      })
      .finally(() => {
        // Clear the in-flight marker once settled, whichever way it went,
        // so a *future* call (e.g. after a dropped connection) can retry.
        connectingPromise = null;
      });

    return connectingPromise;
  }

  if (!mongoChecked) {
    console.log('[DATABASE] No MONGODB_URI configured in .env. Running on local persistent data engine.');
    mongoChecked = true;
  }

  const fallbackDb = { collection: (name) => new LocalCollection(name) };
  return { client: null, db: fallbackDb, isMongo: false };
}

async function initIndexes(db) {
  try {
    await db.collection('matches').createIndex({ ownerId: 1 });
    await db.collection('matches').createIndex({ shareToken: 1 }, { unique: true, sparse: true });
    await db.collection('matches').createIndex({ shareEnabled: 1 });
    await db.collection('matches').createIndex({ status: 1 });
    await db.collection('matches').createIndex({ createdAt: -1 });

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('[DATABASE] Indexes verified.');
  } catch (err) {
    console.warn('[DATABASE] Index initialization notice:', err.message);
  }
}

export { ObjectId };