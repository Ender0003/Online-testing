const path = require('path');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const sessionSecret = process.env.SESSION_SECRET || 'change-this-session-secret';
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const requireSupabase = (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({
      error: 'Supabase environment variables are not configured on the server.',
    });
  }

  next();
};

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const encodeTokenPart = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const signToken = (payload) =>
  crypto
    .createHmac('sha256', sessionSecret)
    .update(payload)
    .digest('base64url');

const createSessionToken = (user) => {
  const header = encodeTokenPart({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeTokenPart({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return `${header}.${payload}.${signToken(`${header}.${payload}`)}`;
};

const verifySessionToken = (token) => {
  if (!token) return null;

  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;

  const expectedSignature = signToken(`${header}.${payload}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

const requireUser = (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = verifySessionToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  req.user = user;
  next();
};

const requireTeacher = (req, res, next) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ error: 'Teacher access required.' });
  }

  next();
};

const mapProfileToUser = (profile) => ({
  id: profile.id,
  name: profile.name ?? profile.full_name ?? '',
  email: profile.email,
  role: profile.role,
});

const mapDbTest = (test) => ({
  id: test.id,
  title: test.title || '',
  questions: Array.isArray(test.questions) ? test.questions : [],
  author: test.author_name || '',
  authorEmail: test.author_email || '',
  createdAt: test.created_at,
  updatedAt: test.updated_at,
});

const mapTestSummary = (test) => ({
  id: test.id,
  title: test.title || '',
  questionCount: Array.isArray(test.questions) ? test.questions.length : 0,
  author: test.author_name || '',
  authorEmail: test.author_email || '',
  createdAt: test.created_at,
  updatedAt: test.updated_at,
});

const sanitizeQuestion = (question) => ({
  id: question.id,
  text: question.text || '',
  type: question.type || 'single',
  answers: Array.isArray(question.answers)
    ? question.answers.map((answer) => ({
        id: answer.id,
        text: answer.text || '',
      }))
    : [],
});

const sanitizeRunnableTest = (test) => ({
  ...mapTestSummary(test),
  questions: Array.isArray(test.questions)
    ? test.questions.map(sanitizeQuestion)
    : [],
});

const mapTestPayload = ({ title, questions, authorName, authorEmail }) => ({
  title,
  questions,
  author_name: authorName || '',
  author_email: authorEmail || '',
});

const mapDbResult = (result) => ({
  id: result.id,
  testTitle: result.test_title,
  score: result.score,
  total: result.total,
  userEmail: result.student_email,
  userName: result.student_name,
  date: result.created_at
    ? new Date(result.created_at).toLocaleString('uk-UA')
    : new Date().toLocaleString('uk-UA'),
  percentage: result.percentage,
  createdAt: result.created_at,
});

const normalizeSelectedAnswerIds = (value) => {
  if (Array.isArray(value)) return new Set(value.map(String));
  if (value === undefined || value === null) return new Set();
  return new Set([String(value)]);
};

const gradeTest = (questions, submittedAnswers) => {
  let score = 0;

  questions.forEach((question) => {
    const correctIds = new Set(
      (question.answers || [])
        .filter((answer) => answer.isCorrect)
        .map((answer) => String(answer.id))
    );
    const selectedIds = normalizeSelectedAnswerIds(submittedAnswers?.[question.id]);

    const isCorrect =
      correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));

    if (isCorrect) score++;
  });

  return {
    score,
    total: questions.length,
    percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0,
  };
};

app.post('/api/auth/login', requireSupabase, asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, password, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Не вдалося підключитися до бази профілів.' });
  }

  if (!data || data.password !== password) {
    return res.status(401).json({ error: 'Невірний email або пароль' });
  }

  if (data.role !== role) {
    const roleLabel = data.role === 'student' ? 'студент' : 'викладач';
    return res.status(403).json({
      error: `Цей акаунт зареєстрований як ${roleLabel}.`,
    });
  }

  const user = mapProfileToUser(data);
  return res.json({ user, token: createSessionToken(user) });
}));

app.post('/api/auth/register', requireSupabase, asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const { data: existingUser, error: existingError } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ error: 'Не вдалося перевірити email у базі.' });
  }

  if (existingUser) {
    const roleLabel = existingUser.role === 'student' ? 'студент' : 'викладач';
    return res.status(409).json({
      error: `Email вже зайнятий роллю: ${roleLabel}`,
    });
  }

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert([{
      name: name?.trim() || '',
      email: normalizedEmail,
      password,
      role,
    }])
    .select('id, name, email, role')
    .single();

  if (createError) {
    return res.status(500).json({ error: 'Не вдалося зберегти профіль у базі.' });
  }

  const user = mapProfileToUser(createdProfile);
  return res.status(201).json({ user, token: createSessionToken(user) });
}));

app.get('/api/tests', requireSupabase, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('tests')
    .select('id, title, questions, author_name, author_email, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Не вдалося завантажити тести з бази.' });
  }

  return res.json({ tests: (data || []).map(mapTestSummary) });
}));

app.get('/api/teacher/tests', requireSupabase, requireUser, requireTeacher, asyncHandler(async (req, res) => {
  const authorEmail = normalizeEmail(req.user.email);
  if (!authorEmail) return res.json({ tests: [] });

  const { data, error } = await supabase
    .from('tests')
    .select('id, title, questions, author_name, author_email, created_at, updated_at')
    .eq('author_email', authorEmail)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Не вдалося завантажити тести викладача.' });
  }

  return res.json({ tests: (data || []).map(mapTestSummary) });
}));

app.get('/api/teacher/tests/:id', requireSupabase, requireUser, requireTeacher, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('tests')
    .select('id, title, questions, author_name, author_email, created_at, updated_at')
    .eq('id', req.params.id)
    .eq('author_email', req.user.email)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Тест не знайдено.' });
  }

  return res.json({ test: mapDbTest(data) });
}));

app.get('/api/tests/:id/run', requireSupabase, requireUser, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('tests')
    .select('id, title, questions, author_name, author_email, created_at, updated_at')
    .eq('id', req.params.id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Тест не знайдено.' });
  }

  return res.json({ test: sanitizeRunnableTest(data) });
}));

app.post('/api/tests', requireSupabase, requireUser, requireTeacher, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('tests')
    .insert([mapTestPayload({
      ...req.body,
      authorName: req.user.name,
      authorEmail: req.user.email,
    })])
    .select('id, title, questions, author_name, author_email, created_at, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Не вдалося опублікувати тест.' });
  }

  return res.status(201).json({ test: mapDbTest(data) });
}));

app.patch('/api/tests/:id', requireSupabase, requireUser, requireTeacher, asyncHandler(async (req, res) => {
  const { title, questions } = req.body;
  const { data, error } = await supabase
    .from('tests')
    .update({
      title,
      questions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select('id, title, questions, author_name, author_email, created_at, updated_at')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Не вдалося зберегти зміни тесту.' });
  }

  return res.json({ test: mapDbTest(data) });
}));

app.delete('/api/tests/:id', requireSupabase, requireUser, requireTeacher, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ error: 'Не вдалося видалити тест.' });
  }

  return res.status(204).end();
}));

app.post('/api/tests/:id/submit', requireSupabase, requireUser, asyncHandler(async (req, res) => {
  const { answers } = req.body;

  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, title, questions')
    .eq('id', req.params.id)
    .single();

  if (testError) {
    return res.status(404).json({ error: 'Тест не знайдено.' });
  }

  const questions = Array.isArray(test.questions) ? test.questions : [];
  const graded = gradeTest(questions, answers || {});

  const { data: savedResult, error: saveError } = await supabase
    .from('test_results')
    .insert([{
      test_title: test.title,
      student_name: req.user.name,
      student_email: req.user.email,
      score: graded.score,
      total: graded.total,
      percentage: graded.percentage,
    }])
    .select('id, test_title, student_name, student_email, score, total, percentage, created_at')
    .single();

  if (saveError) {
    return res.status(500).json({ error: 'Не вдалося зберегти результат.' });
  }

  return res.status(201).json({ result: mapDbResult(savedResult) });
}));

app.get('/api/teachers', requireSupabase, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role');

  if (error) {
    return res.status(500).json({ error: 'Не вдалося завантажити викладачів.' });
  }

  const teachers = (data || [])
    .filter((profile) => {
      const role = String(profile.role || '').trim().toLowerCase();
      return role === 'teacher' || role === 'викладач';
    })
    .sort((a, b) =>
      (a.name || a.full_name || a.email || '').localeCompare(
        b.name || b.full_name || b.email || '',
        'uk'
      )
    );

  return res.json({ teachers });
}));

app.get('/api/results', requireSupabase, requireUser, asyncHandler(async (req, res) => {
  if (!req.user.email) {
    return res.json({ results: [] });
  }

  const { data, error } = await supabase
    .from('test_results')
    .select('id, test_title, student_name, student_email, score, total, percentage, created_at')
    .eq('student_email', req.user.email)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Не вдалося завантажити історію.' });
  }

  return res.json({ results: (data || []).map(mapDbResult) });
}));

app.post('/api/results', (req, res) => {
  res.status(410).json({
    error: 'Results must be submitted through /api/tests/:id/submit.',
  });
});

app.get('/api/analytics/results', requireSupabase, requireUser, requireTeacher, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('test_results')
    .select('id, test_title, student_name, student_email, score, total, percentage, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Не вдалося завантажити аналітику.' });
  }

  return res.json({ results: data || [] });
}));

const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Внутрішня помилка сервера.' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
