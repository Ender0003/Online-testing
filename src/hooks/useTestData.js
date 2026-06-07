import { useState, useEffect } from 'react';
import { apiClient } from '../apiClient';

const normalizeText = (value) => (value || '').trim().toLowerCase();

const hasTestOwner = (test) => {
  const authorEmail = normalizeText(test?.authorEmail);
  const author = normalizeText(test?.author);
  return Boolean(authorEmail || author);
};

const getQuestionCount = (test) =>
  Number.isFinite(test?.questionCount) ? test.questionCount : test?.questions?.length || 0;

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

const mapResultForAnalytics = (result) => ({
  id: result.id,
  test_title: result.testTitle,
  student_name: result.userName,
  student_email: result.userEmail,
  score: result.score,
  total: result.total,
  percentage: result.percentage,
  created_at: result.createdAt || new Date().toISOString(),
});

export function useTestData(currentUser) {
  const [publishedTests, setPublishedTests] = useState([]);
  const [registeredTeachers, setRegisteredTeachers] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsError, setTestsError] = useState('');
  const [testHistory, setTestHistory] = useState([]);
  const [allResults, setAllResults] = useState([]);

  useEffect(() => {
    const fetchTests = async () => {
      setTestsLoading(true);
      setTestsError('');

      try {
        const isTeacher = currentUser?.role === 'teacher';
        const endpoint = isTeacher && currentUser?.email
          ? '/api/teacher/tests'
          : '/api/tests';
        const { tests } = await apiClient.get(endpoint);
        let dbTests = (tests || []).filter(hasTestOwner);

        const localTestsAlreadyMigrated = localStorage.getItem('published_tests_migrated_to_server') === 'true';
        const localTests = localTestsAlreadyMigrated ? [] : getSavedLocalTests();
        const dbFingerprints = new Set(dbTests.map(getTestFingerprint));
        const testsToMigrate = localTests.filter((test) => !dbFingerprints.has(getTestFingerprint(test)));

        if (testsToMigrate.length > 0 && isTeacher) {
          const migratedTests = [];

          for (const test of testsToMigrate) {
            const { test: migratedTest } = await apiClient.post('/api/tests', {
              title: test.title,
              questions: test.questions,
              authorName: test.author,
              authorEmail: test.authorEmail,
            });
            migratedTests.push(migratedTest);
          }

          localStorage.setItem('published_tests_migrated_to_server', 'true');
          dbTests = [...migratedTests, ...dbTests];
        } else if (!localTestsAlreadyMigrated) {
          localStorage.setItem('published_tests_migrated_to_server', 'true');
        }

        setPublishedTests(dbTests);
      } catch (error) {
        console.error('Помилка завантаження тестів:', error.message);
        setPublishedTests([]);
        setTestsError(error.message || 'Не вдалося завантажити тести з бази.');
      } finally {
        setTestsLoading(false);
      }
    };

    fetchTests();
  }, [currentUser?.email, currentUser?.role]);

  useEffect(() => {
    const fetchRegisteredTeachers = async () => {
      try {
        const { teachers } = await apiClient.get('/api/teachers');
        setRegisteredTeachers(teachers || []);
      } catch (error) {
        console.error('Помилка завантаження викладачів:', error.message);
        setRegisteredTeachers([]);
      }
    };

    fetchRegisteredTeachers();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.email) {
        setTestHistory([]);
        return;
      }

      try {
        const { results } = await apiClient.get('/api/results');
        setTestHistory(results || []);
      } catch (error) {
        console.error('Помилка завантаження історії:', error.message);
        setTestHistory([]);
      }
    };

    fetchHistory();
  }, [currentUser?.email]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (currentUser?.role !== 'teacher') {
        setAllResults([]);
        return;
      }

      try {
        const { results } = await apiClient.get('/api/analytics/results');
        setAllResults(results || []);
      } catch (error) {
        console.error('Помилка завантаження аналітики:', error.message);
        setAllResults([]);
      }
    };

    fetchAnalytics();
  }, [currentUser?.role]);

  const startTest = async (id) => {
    const { test } = await apiClient.get(`/api/tests/${id}/run`);
    return test;
  };

  const fetchTeacherTest = async (id) => {
    const { test } = await apiClient.get(`/api/teacher/tests/${id}`);
    return test;
  };

  const submitTest = async ({ testId, answers, userEmail, userName }) => {
    const { result } = await apiClient.post(`/api/tests/${testId}/submit`, {
      answers,
      userEmail,
      userName,
    });

    setTestHistory((prev) => [result, ...prev]);
    setAllResults((prev) => [mapResultForAnalytics(result), ...prev]);
    return result;
  };

  const publishTest = async ({ title, questions, authorName, authorEmail }) => {
    setTestsError('');

    try {
      const { test } = await apiClient.post('/api/tests', {
        title,
        questions,
        authorName,
        authorEmail,
      });
      setPublishedTests((prev) => [test, ...prev]);
      return test;
    } catch (error) {
      console.error('Помилка публікації тесту:', error.message);
      setTestsError(error.message || 'Не вдалося опублікувати тест.');
      return null;
    }
  };

  const updateTest = async (id, { title, questions }) => {
    setTestsError('');

    try {
      const { test: updatedTest } = await apiClient.patch(`/api/tests/${id}`, {
        title,
        questions,
      });

      setPublishedTests((prev) =>
        prev.map((test) => (test.id === id ? updatedTest : test))
      );
      return updatedTest;
    } catch (error) {
      console.error('Помилка оновлення тесту:', error.message);
      setTestsError(error.message || 'Не вдалося зберегти зміни тесту.');
      return null;
    }
  };

  const deleteTest = async (id) => {
    setTestsError('');

    try {
      await apiClient.delete(`/api/tests/${id}`);
      setPublishedTests((prev) => prev.filter((test) => test.id !== id));
      return true;
    } catch (error) {
      console.error('Помилка видалення тесту:', error.message);
      setTestsError(error.message || 'Не вдалося видалити тест.');
      return false;
    }
  };

  const fetchAllResults = async () => {
    try {
      const { results } = await apiClient.get('/api/analytics/results');
      return results || [];
    } catch (error) {
      console.error('Помилка завантаження аналітики:', error.message);
      return [];
    }
  };

  return {
    publishedTests,
    publishTest,
    updateTest,
    deleteTest,
    startTest,
    fetchTeacherTest,
    submitTest,
    fetchAllResults,
    allResults,
    registeredTeachers,
    testsLoading,
    testsError,
    testHistory,
    getQuestionCount,
    getHistoryForUser: (email) => testHistory.filter(h => h.userEmail === email),
  };
}
