import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const normalizeText = (value) => (value || '').trim().toLowerCase();

const hasTestOwner = (test) => {
  const authorEmail = normalizeText(test?.authorEmail);
  const author = normalizeText(test?.author);
  return Boolean(authorEmail || author);
};

const isTeacherProfile = (profile) => {
  const role = normalizeText(profile?.role);
  return role === 'teacher' || role === 'викладач';
};

const getProfileName = (profile) => profile?.name || profile?.full_name || profile?.email || '';

const mapDbTest = (test) => ({
  id: test.id,
  title: test.title || '',
  questions: Array.isArray(test.questions) ? test.questions : [],
  author: test.author_name || '',
  authorEmail: test.author_email || '',
  createdAt: test.created_at,
  updatedAt: test.updated_at,
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
});

const getTestFingerprint = (test) =>
  [
    normalizeText(test.title),
    normalizeText(test.authorEmail),
    normalizeText(test.author),
    test.createdAt || '',
  ].join('|');

const getSavedLocalTests = () => {
  try {
    const saved = localStorage.getItem('published_tests');
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(hasTestOwner);
  } catch {
    return [];
  }
};

export function useTestData(currentUser) {
  const [publishedTests, setPublishedTests] = useState([]);
  const [registeredTeachers, setRegisteredTeachers] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsError, setTestsError] = useState('');
  const [testHistory, setTestHistory] = useState([]);

  useEffect(() => {
    const fetchTests = async () => {
      setTestsLoading(true);
      setTestsError('');

      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Помилка завантаження тестів:', error.message);
        setPublishedTests([]);
        setTestsError('Не вдалося завантажити тести з бази.');
        setTestsLoading(false);
        return;
      }

      let dbTests = (data || []).map(mapDbTest).filter(hasTestOwner);

      const localTestsAlreadyMigrated = localStorage.getItem('published_tests_migrated_to_supabase') === 'true';
      const localTests = localTestsAlreadyMigrated ? [] : getSavedLocalTests();
      const dbFingerprints = new Set(dbTests.map(getTestFingerprint));
      const testsToMigrate = localTests.filter((test) => !dbFingerprints.has(getTestFingerprint(test)));

      if (testsToMigrate.length > 0) {
        const { data: migratedTests, error: migrateError } = await supabase
          .from('tests')
          .insert(
            testsToMigrate.map((test) =>
              mapTestPayload({
                title: test.title,
                questions: test.questions,
                authorName: test.author,
                authorEmail: test.authorEmail,
              })
            )
          )
          .select();

        if (migrateError) {
          console.error('Помилка міграції локальних тестів:', migrateError.message);
        } else {
          localStorage.setItem('published_tests_migrated_to_supabase', 'true');
          dbTests = [...(migratedTests || []).map(mapDbTest), ...dbTests];
        }
      } else if (!localTestsAlreadyMigrated) {
        localStorage.setItem('published_tests_migrated_to_supabase', 'true');
      }

      setPublishedTests(dbTests);
      setTestsLoading(false);
    };

    fetchTests();
  }, []);

  useEffect(() => {
    const fetchRegisteredTeachers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Помилка завантаження викладачів:', error.message);
        setRegisteredTeachers([]);
        return;
      }

      const teachers = (data || [])
        .filter(isTeacherProfile)
        .sort((a, b) => getProfileName(a).localeCompare(getProfileName(b), 'uk'));

      setRegisteredTeachers(teachers);
    };

    fetchRegisteredTeachers();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.email) {
        setTestHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('student_email', currentUser.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Помилка завантаження історії:', error.message);
        setTestHistory([]);
        return;
      }

      setTestHistory((data || []).map(mapDbResult));
    };

    fetchHistory();
  }, [currentUser?.email]);

  const publishTest = async ({ title, questions, authorName, authorEmail }) => {
    setTestsError('');

    const { data, error } = await supabase
      .from('tests')
      .insert([mapTestPayload({ title, questions, authorName, authorEmail })])
      .select()
      .single();

    if (error) {
      console.error('Помилка публікації тесту:', error.message);
      setTestsError('Не вдалося опублікувати тест.');
      return null;
    }

    const newTest = mapDbTest(data);
    setPublishedTests((prev) => [newTest, ...prev]);
    return newTest;
  };

  const updateTest = async (id, { title, questions }) => {
    setTestsError('');

    const { data, error } = await supabase
      .from('tests')
      .update({
        title,
        questions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Помилка оновлення тесту:', error.message);
      setTestsError('Не вдалося зберегти зміни тесту.');
      return null;
    }

    const updatedTest = mapDbTest(data);
    setPublishedTests((prev) =>
      prev.map((test) => (test.id === id ? updatedTest : test))
    );
    return updatedTest;
  };

  const deleteTest = async (id) => {
    setTestsError('');

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Помилка видалення тесту:', error.message);
      setTestsError('Не вдалося видалити тест.');
      return false;
    }

    setPublishedTests((prev) => prev.filter((test) => test.id !== id));
    return true;
  };

  const saveResult = async ({ testTitle, score, total, userEmail, userName }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const { data, error } = await supabase
      .from('test_results')
      .insert([{
        test_title: testTitle,
        student_name: userName,
        student_email: userEmail,
        score: score,
        total: total,
        percentage: percentage
      }])
      .select()
      .single();

    if (error) console.error('Помилка БД:', error.message);

    const entry = data ? mapDbResult(data) : {
      id: Date.now(),
      testTitle,
      score,
      total,
      userEmail,
      userName,
      date: new Date().toLocaleString('uk-UA'),
      percentage
    };
    setTestHistory(prev => [entry, ...prev]);
  };

  const fetchAllResults = async () => {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Помилка завантаження аналітики:', error.message);
      return [];
    }
    return data;
  };

  return {
    publishedTests,
    publishTest,
    updateTest,
    deleteTest,
    saveResult,
    fetchAllResults,
    registeredTeachers,
    testsLoading,
    testsError,
    testHistory,
    getHistoryForUser: (email) => testHistory.filter(h => h.userEmail === email)
  };
}
