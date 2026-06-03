import React, { useEffect, useState } from 'react';
import { SCREENS } from './constants/Screens';
import { useAuth } from './hooks/useAuth';
import { useTestData } from './hooks/useTestData.js';

import Constructor from './components/Constructor';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TestRunner from './components/TestRunner';
import AuthPage from './components/AuthPage';

import './components/Auth.css';
import './components/StudentDashboard.css';
import './components/TeacherDashboard.css';
import './components/TestRunner.css';

// Визначаємо початковий екран з localStorage ще до рендеру
const getSavedScreen = () => {
  try {
    const savedScreen = localStorage.getItem('app_screen');
    if (savedScreen && savedScreen !== SCREENS.TEST_RUNNER) return savedScreen;

    const saved = localStorage.getItem('current_user');
    if (!saved) return SCREENS.AUTH;
    const user = JSON.parse(saved);
    return user.role === 'teacher' ? SCREENS.TEACHER_DASHBOARD : SCREENS.STUDENT_DASHBOARD;
  } catch {
    return SCREENS.AUTH;
  }
};

const getSavedTheme = () => {
  try {
    return localStorage.getItem('ui_theme') || 'dark';
  } catch {
    return 'dark';
  }
};

const getSavedConstructorDraft = () => {
  try {
    const saved = localStorage.getItem('constructor_draft');
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      editingTest: parsed.editingTest || null,
    };
  } catch {
    return null;
  }
};

const normalizeText = (value) => (value || '').trim().toLowerCase();

const hasTestOwner = (test) => Boolean(normalizeText(test.authorEmail) || normalizeText(test.author));

const isTeacherTest = (test, currentUser) => {
  if (!currentUser?.email) return false;

  const testAuthorEmail = normalizeText(test.authorEmail);
  const currentUserEmail = normalizeText(currentUser.email);
  if (testAuthorEmail) return testAuthorEmail === currentUserEmail;

  const testAuthorName = normalizeText(test.author);
  const currentUserName = normalizeText(currentUser.name);
  if (testAuthorName) return testAuthorName === currentUserName;

  return false;
};

function App() {
  const [screen, setScreen] = useState(getSavedScreen);
  const [activeTest, setActiveTest] = useState(null);
  const [draftTitle, setDraftTitle] = useState(() => getSavedConstructorDraft()?.title || '');
  const [draftQuestions, setDraftQuestions] = useState(() => getSavedConstructorDraft()?.questions || []);
  const [editingTest, setEditingTest] = useState(() => getSavedConstructorDraft()?.editingTest || null);
  const [themeMode, setThemeMode] = useState(getSavedTheme);

  const { currentUser, authenticate, logout } = useAuth();
  const {
    publishedTests,
    publishTest,
    updateTest,
    deleteTest,
    saveResult,
    registeredTeachers,
    testsLoading,
    testsError,
    getHistoryForUser,
  } = useTestData(currentUser);

  const teacherTests = publishedTests.filter((test) => isTeacherTest(test, currentUser));
  const studentTests = publishedTests.filter(hasTestOwner);

  const goToConstructor = () => {
    setEditingTest(null);
    setDraftTitle('');
    setDraftQuestions([]);
    setScreen(SCREENS.CONSTRUCTOR);
  };

  const goToEdit = (test) => {
    setEditingTest(test);
    setDraftTitle(test.title || '');
    setDraftQuestions(test.questions);
    setScreen(SCREENS.CONSTRUCTOR);
  };

  const goToDashboard = () => {
    setScreen(
      currentUser?.role === 'teacher'
        ? SCREENS.TEACHER_DASHBOARD
        : SCREENS.STUDENT_DASHBOARD
    );
  };

  const handleAuthSuccess = (user) => {
    setScreen(
      user.role === 'teacher'
        ? SCREENS.TEACHER_DASHBOARD
        : SCREENS.STUDENT_DASHBOARD
    );
  };

  const handleLogout = () => {
    logout();
    setDraftTitle('');
    setDraftQuestions([]);
    setEditingTest(null);
    setScreen(SCREENS.AUTH);
  };

  const handleStartTest = (test) => {
    setActiveTest(test);
    setScreen(SCREENS.TEST_RUNNER);
  };

  const handleTestFinish = (result) => {
    if (result) {
      saveResult({
        ...result,
        userEmail: currentUser?.email,
        userName: currentUser?.name,
      });
    }
    setScreen(SCREENS.STUDENT_DASHBOARD);
  };

  const handlePublish = async () => {
    let savedTest = null;

    if (editingTest) {
      savedTest = await updateTest(editingTest.id, { title: draftTitle, questions: draftQuestions });
    } else {
      savedTest = await publishTest({
        title: draftTitle,
        questions: draftQuestions,
        authorName: currentUser?.name,
        authorEmail: currentUser?.email,
      });
    }

    if (!savedTest) return;

    setDraftTitle('');
    setDraftQuestions([]);
    setEditingTest(null);
    setScreen(SCREENS.TEACHER_DASHBOARD);
  };

  useEffect(() => {
    try {
      localStorage.setItem('ui_theme', themeMode);
    } catch {}
  }, [themeMode]);

  useEffect(() => {
    if (!currentUser && screen !== SCREENS.AUTH) {
      setActiveTest(null);
      setScreen(SCREENS.AUTH);
    }
  }, [currentUser, screen]);

  useEffect(() => {
    try {
      localStorage.setItem('app_screen', screen);
    } catch {}
  }, [screen]);

  useEffect(() => {
    try {
      const hasDraft = draftTitle.trim() || draftQuestions.length > 0 || editingTest;

      if (hasDraft) {
        localStorage.setItem(
          'constructor_draft',
          JSON.stringify({
            title: draftTitle,
            questions: draftQuestions,
            editingTest,
          })
        );
      } else {
        localStorage.removeItem('constructor_draft');
      }
    } catch {}
  }, [draftTitle, draftQuestions, editingTest]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = currentUser?.role === 'teacher' ? 'teacher-theme' : 'student-theme';
  const uiThemeClass = themeMode === 'light' ? 'light-theme' : 'dark-theme';

  return (
    <div className={`app-container ${uiThemeClass} ${screen === SCREENS.AUTH ? '' : theme}`}>

      {screen === SCREENS.AUTH && (
        <AuthPage
          onSuccess={handleAuthSuccess}
          authenticate={authenticate}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === SCREENS.CONSTRUCTOR && (
        <Constructor
          testTitle={draftTitle}
          setTestTitle={setDraftTitle}
          questions={draftQuestions}
          setQuestions={setDraftQuestions}
          editingTest={editingTest}
          onExit={goToDashboard}
          onPublish={handlePublish}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === SCREENS.STUDENT_DASHBOARD && (
        <StudentDashboard
          user={currentUser}
          tests={studentTests}
          teachers={registeredTeachers}
          testsLoading={testsLoading}
          testsError={testsError}
          history={getHistoryForUser(currentUser?.email)}
          onStartTest={handleStartTest}
          onExit={handleLogout}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === SCREENS.TEACHER_DASHBOARD && (
        <TeacherDashboard
          user={currentUser}
          tests={teacherTests}
          testsLoading={testsLoading}
          testsError={testsError}
          onDelete={deleteTest}
          onEdit={goToEdit}
          onCreateNew={goToConstructor}
          onExit={handleLogout}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />
      )}

      {screen === SCREENS.TEST_RUNNER && activeTest && (
        <TestRunner
          test={activeTest}
          onFinish={handleTestFinish}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;
