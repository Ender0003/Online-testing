import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const hasTestOwner = (test) => {
  const authorEmail = (test?.authorEmail || '').trim();
  const author = (test?.author || '').trim();
  return Boolean(authorEmail || author);
};

const normalizeText = (value) => (value || '').trim().toLowerCase();

const isTeacherProfile = (profile) => {
  const role = normalizeText(profile?.role);
  return role === 'teacher' || role === 'викладач';
};

const getProfileName = (profile) => profile?.name || profile?.full_name || profile?.email || '';

export function useTestData() {
  const [publishedTests, setPublishedTests] = useState(() => {
    try {
      const saved = localStorage.getItem('published_tests');
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(hasTestOwner);
    } catch { return []; }
  });

  const [testHistory, setTestHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('test_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [registeredTeachers, setRegisteredTeachers] = useState([]);

  useEffect(() => {
    localStorage.setItem('published_tests', JSON.stringify(publishedTests));
  }, [publishedTests]);

  useEffect(() => {
    localStorage.setItem('test_history', JSON.stringify(testHistory));
  }, [testHistory]);

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


  const publishTest = ({ title, questions, authorName, authorEmail }) => {
    const newTest = {
      id: Date.now(),
      title,
      questions,
      author: authorName,
      authorEmail,
      createdAt: new Date().toISOString(),
    };
    setPublishedTests((prev) => [...prev, newTest]);
    return newTest;
  };

  const updateTest = (id, { title, questions }) => {
    setPublishedTests((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title, questions, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const deleteTest = (id) => {
    setPublishedTests((prev) => prev.filter((t) => t.id !== id));
  };

  const saveResult = async ({ testTitle, score, total, userEmail, userName }) => {
    const percentage = Math.round((score / total) * 100);
    const { error } = await supabase
      .from('test_results')
      .insert([{
        test_title: testTitle,
        student_name: userName,
        student_email: userEmail,
        score: score,
        total: total,
        percentage: percentage
      }]);

    if (error) console.error("Помилка БД:", error.message);

    const entry = {
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
      console.error("Помилка завантаження аналітики:", error.message);
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
    testHistory,
    getHistoryForUser: (email) => testHistory.filter(h => h.userEmail === email)
  };
}
