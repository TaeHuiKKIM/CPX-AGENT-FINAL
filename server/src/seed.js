import bcrypt from 'bcryptjs';
import { db, initSchema, openDatabase } from './db.js';
import { initialHistory, initialScenarios } from '../../src/data/initialData.js';

const now = new Date().toISOString();
const demoUserId = 'user-demo';

export function seedDatabase() {
  initSchema();

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at)
      VALUES (@id, @name, @email, @password_hash, @role, @created_at)
    `).run({
      id: demoUserId,
      name: '김하나',
      email: 'demo@medirole.kr',
      password_hash: bcrypt.hashSync('demo1234', 10),
      role: 'student',
      created_at: now
    });
  }

  const scenarioCount = db.prepare('SELECT COUNT(*) AS count FROM scenarios').get().count;
  if (scenarioCount === 0) {
    const insertScenario = db.prepare('INSERT INTO scenarios (id, data, updated_at) VALUES (?, ?, ?)');
    const tx = db.transaction((items) => {
      items.forEach((scenario) => insertScenario.run(scenario.id, JSON.stringify(scenario), now));
    });
    tx(initialScenarios);
  }

  const historyCount = db.prepare('SELECT COUNT(*) AS count FROM history').get().count;
  if (historyCount === 0) {
    const insertHistory = db.prepare(`
      INSERT INTO history (
        id, user_id, scenario_id, date, duration, ratio, satisfaction, ppi, score,
        checked_rubrics, transcript, created_at
      ) VALUES (@id, @user_id, @scenario_id, @date, @duration, @ratio, @satisfaction, @ppi, @score,
        @checked_rubrics, @transcript, @created_at)
    `);
    const tx = db.transaction((items) => {
      items.forEach((record) => insertHistory.run({
        id: record.id,
        user_id: demoUserId,
        scenario_id: record.scenarioId,
        date: record.date,
        duration: record.duration,
        ratio: record.ratio,
        satisfaction: record.satisfaction,
        ppi: record.ppi,
        score: record.score,
        checked_rubrics: JSON.stringify(record.checkedRubrics || []),
        transcript: JSON.stringify(record.transcript || []),
        created_at: now
      }));
    });
    tx(initialHistory);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await openDatabase();
  seedDatabase();
  console.log('Database seeded. Demo login: demo@medirole.kr / demo1234');
}
