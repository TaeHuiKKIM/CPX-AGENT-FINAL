import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';
import { db, initSchema, openDatabase, parseJson } from './db.js';
import { seedDatabase } from './seed.js';
import { createToken, requireAuth, sanitizeUser } from './auth.js';
import { getKeywordPatientResponse } from './patientFallback.js';

dotenv.config();
await openDatabase();
initSchema();
seedDatabase();

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));

function rowToScenario(row) {
  return parseJson(row.data, null);
}

function rowToHistory(row) {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    date: row.date,
    duration: row.duration,
    ratio: row.ratio,
    satisfaction: row.satisfaction,
    ppi: row.ppi,
    score: row.score,
    checkedRubrics: parseJson(row.checked_rubrics, []),
    transcript: parseJson(row.transcript, [])
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'medi-cpx-api' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: '이름, 이메일, 비밀번호를 모두 입력하세요.' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ message: '이미 가입된 이메일입니다.' });

  const user = {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    role: 'student',
    created_at: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (@id, @name, @email, @password_hash, @role, @created_at)
  `).run(user);

  res.status(201).json({ user: sanitizeUser(user), token: createToken(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  res.json({ user: sanitizeUser(user), token: createToken(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.get('/api/scenarios', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM scenarios ORDER BY id').all();
  res.json({ scenarios: rows.map(rowToScenario).filter(Boolean) });
});

app.patch('/api/scenarios/:id/stats', requireAuth, (req, res) => {
  const { id } = req.params;
  const { score } = req.body || {};
  const row = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ message: '시나리오를 찾을 수 없습니다.' });

  const scenario = rowToScenario(row);
  scenario.attempts = Number(scenario.attempts || 0) + 1;
  scenario.bestScore = Math.max(Number(scenario.bestScore || 0), Number(score || 0));

  db.prepare('UPDATE scenarios SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(scenario), new Date().toISOString(), id);
  res.json({ scenario });
});

app.put('/api/scenarios/:id/rubrics', requireAuth, (req, res) => {
  const { id } = req.params;
  const { rubrics } = req.body || {};
  if (!Array.isArray(rubrics)) return res.status(400).json({ message: 'rubrics 배열이 필요합니다.' });

  const row = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ message: '시나리오를 찾을 수 없습니다.' });

  const scenario = rowToScenario(row);
  scenario.rubrics = rubrics;
  db.prepare('UPDATE scenarios SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(scenario), new Date().toISOString(), id);
  res.json({ scenario });
});

app.get('/api/history', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ history: rows.map(rowToHistory) });
});

app.post('/api/history', requireAuth, (req, res) => {
  const body = req.body || {};
  const record = {
    id: body.id || `h${Date.now()}`,
    user_id: req.user.id,
    scenario_id: body.scenarioId,
    date: body.date,
    duration: body.duration,
    ratio: body.ratio || '48:52',
    satisfaction: Number(body.satisfaction || 0),
    ppi: body.ppi || '보통(B)',
    score: Number(body.score || 0),
    checked_rubrics: JSON.stringify(body.checkedRubrics || []),
    transcript: JSON.stringify(body.transcript || []),
    created_at: new Date().toISOString()
  };

  if (!record.scenario_id || !record.date || !record.duration) {
    return res.status(400).json({ message: '이력 저장에 필요한 값이 부족합니다.' });
  }

  db.prepare(`
    INSERT INTO history (
      id, user_id, scenario_id, date, duration, ratio, satisfaction, ppi, score,
      checked_rubrics, transcript, created_at
    ) VALUES (@id, @user_id, @scenario_id, @date, @duration, @ratio, @satisfaction, @ppi, @score,
      @checked_rubrics, @transcript, @created_at)
  `).run(record);

  res.status(201).json({ history: rowToHistory(record) });
});

app.delete('/api/history', requireAuth, (req, res) => {
  db.prepare('DELETE FROM history WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

app.post('/api/ai/patient-response', requireAuth, async (req, res) => {
  const { scenario, doctorText, conversation = [], emotion = {}, checkedRubrics = [] } = req.body || {};
  if (!scenario || !doctorText) return res.status(400).json({ message: 'scenario와 doctorText가 필요합니다.' });

  if (!openai) {
    return res.json({ patientText: getKeywordPatientResponse(scenario, doctorText), source: 'keyword-fallback' });
  }

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_output_tokens: 220,
      input: [
        {
          role: 'system',
          content: [
            '너는 의대 CPX 연습용 AI 표준환자다.',
            '반드시 환자 역할로만 한국어로 대답한다.',
            '의사에게 진단명이나 채점 결과를 직접 알려주지 않는다.',
            '아래 시나리오 정보와 환자 성격을 지키고, 답변은 1~3문장으로 자연스럽게 한다.',
            '의사가 묻지 않은 핵심 정보를 한꺼번에 모두 공개하지 말고, 질문에 맞는 정보만 말한다.'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            scenario: {
              patientName: scenario.patientName,
              age: scenario.age,
              gender: scenario.gender,
              tag: scenario.tag,
              cc: scenario.cc,
              vs: scenario.vs,
              notes: scenario.notes,
              goals: scenario.goals,
              script: scenario.script
            },
            emotion,
            checkedRubrics,
            recentConversation: conversation.slice(-8),
            doctorText
          })
        }
      ]
    });

    const patientText = response.output_text?.trim() || getKeywordPatientResponse(scenario, doctorText);
    res.json({ patientText, source: 'openai' });
  } catch (error) {
    console.error('[AI API ERROR]', error);
    res.json({ patientText: getKeywordPatientResponse(scenario, doctorText), source: 'ai-error-fallback' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'API 경로를 찾을 수 없습니다.' });
});

app.listen(port, () => {
  console.log(`Medi-CPX API server running on http://localhost:${port}`);
  console.log('Demo login: demo@medirole.kr / demo1234');
});
