import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const dbFile = process.env.DB_FILE || 'server/data/medi-cpx.sqlite';
const dbPath = path.resolve(rootDir, dbFile);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let internalDb = null;
let transactionDepth = 0;

function ensureOpen() {
  if (!internalDb) throw new Error('Database is not opened. Call openDatabase() first.');
}

function persist() {
  ensureOpen();
  const data = internalDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function normalizeParams(args) {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const original = args[0];
    const named = {};
    Object.entries(original).forEach(([key, value]) => {
      named[key] = value;
      named[`@${key}`] = value;
      named[`:${key}`] = value;
      named[`$${key}`] = value;
    });
    return named;
  }
  return args;
}

function withStatement(sql, params, callback) {
  ensureOpen();
  const stmt = internalDb.prepare(sql);
  try {
    const normalized = normalizeParams(params);
    if (Array.isArray(normalized) ? normalized.length > 0 : Object.keys(normalized).length > 0) {
      stmt.bind(normalized);
    }
    return callback(stmt);
  } finally {
    stmt.free();
  }
}

export async function openDatabase() {
  if (internalDb) return internalDb;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    internalDb = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    internalDb = new SQL.Database();
    persist();
  }
  return internalDb;
}

export const db = {
  pragma() {},
  exec(sql) {
    ensureOpen();
    internalDb.exec(sql);
    if (transactionDepth === 0) persist();
  },
  prepare(sql) {
    return {
      run: (...params) => withStatement(sql, params, (stmt) => {
        stmt.step();
        if (transactionDepth === 0) persist();
        return { changes: internalDb.getRowsModified() };
      }),
      get: (...params) => withStatement(sql, params, (stmt) => (stmt.step() ? stmt.getAsObject() : undefined)),
      all: (...params) => withStatement(sql, params, (stmt) => {
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      })
    };
  },
  transaction(fn) {
    return (...args) => {
      ensureOpen();
      internalDb.exec('BEGIN TRANSACTION');
      transactionDepth += 1;
      try {
        const result = fn(...args);
        internalDb.exec('COMMIT');
        transactionDepth -= 1;
        persist();
        return result;
      } catch (error) {
        try {
          internalDb.exec('ROLLBACK');
        } finally {
          transactionDepth = Math.max(0, transactionDepth - 1);
          persist();
        }
        throw error;
      }
    };
  }
};

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      date TEXT NOT NULL,
      duration TEXT NOT NULL,
      ratio TEXT NOT NULL,
      satisfaction INTEGER NOT NULL,
      ppi TEXT NOT NULL,
      score INTEGER NOT NULL,
      checked_rubrics TEXT NOT NULL,
      transcript TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

export function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
