import React, { useEffect, useMemo, useState } from 'react';
import './StudentDashboard.css';

const normalizeText = (value) => (value || '').trim().toLowerCase();

const getTeacherName = (teacher) =>
  teacher?.name || teacher?.full_name || teacher?.email || 'Викладач';

const getTeacherKey = (teacher) =>
  normalizeText(teacher?.email) || normalizeText(getTeacherName(teacher));

const isTeacherTest = (test, teacher) => {
  const teacherEmail = normalizeText(teacher?.email);
  const teacherName = normalizeText(getTeacherName(teacher));
  const testAuthorEmail = normalizeText(test?.authorEmail);
  const testAuthorName = normalizeText(test?.author);

  if (teacherEmail && testAuthorEmail) return teacherEmail === testAuthorEmail;
  return Boolean(teacherName && testAuthorName && teacherName === testAuthorName);
};

const StudentDashboard = ({
  tests = [],
  teachers = [],
  history = [],
  onStartTest,
  onExit,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState('tests');
  const [selectedTeacherKey, setSelectedTeacherKey] = useState('');

  const sortedTeachers = useMemo(
    () =>
      [...teachers]
        .filter((teacher) => getTeacherKey(teacher))
        .sort((a, b) => getTeacherName(a).localeCompare(getTeacherName(b), 'uk')),
    [teachers]
  );

  const selectedTeacher = sortedTeachers.find(
    (teacher) => getTeacherKey(teacher) === selectedTeacherKey
  );

  const selectedTeacherTests = selectedTeacher
    ? tests.filter((test) => isTeacherTest(test, selectedTeacher))
    : [];

  useEffect(() => {
    const selectedTeacherExists = sortedTeachers.some(
      (teacher) => getTeacherKey(teacher) === selectedTeacherKey
    );

    if (selectedTeacherKey && !selectedTeacherExists) {
      setSelectedTeacherKey('');
    }
  }, [selectedTeacherKey, sortedTeachers]);

  const getStatusClass = (score, total) => {
    if (!total) return 'status-error';
    const percentage = (score / total) * 100;
    return percentage >= 60 ? 'status-success' : 'status-error';
  };

  return (
    <div className="student-page">
      <header className="dashboard-hero">
        <div className="header-glass-content">
          <div className="logo-group">
            <div className="logo-badge">🎓</div>
            <div className="brand-info">
              <h1 className="brand-title">Е-Оцінка</h1>
              <p className="brand-subtitle">Кабінет студента</p>
            </div>
          </div>

          <nav className="main-nav">
            <button
              className={`nav-link ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              Доступні тести
            </button>
            <button
              className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              Мої успіхи
            </button>
            <button onClick={onToggleTheme} className="theme-toggle-btn">
              {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
            </button>
            <button onClick={onExit} className="exit-button">Вихід</button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {activeTab === 'tests' ? (
            <div className="fade-in">
              <h2 className="section-title">Оберіть викладача</h2>
              {sortedTeachers.length > 0 ? (
                <div className="teachers-grid">
                  {sortedTeachers.map((teacher) => {
                    const teacherKey = getTeacherKey(teacher);
                    const testsCount = tests.filter((test) => isTeacherTest(test, teacher)).length;

                    return (
                      <button
                        key={teacherKey}
                        className={`teacher-filter-card ${teacherKey === selectedTeacherKey ? 'active' : ''}`}
                        onClick={() => setSelectedTeacherKey(teacherKey)}
                      >
                        <span className="teacher-avatar">
                          {getTeacherName(teacher).charAt(0).toUpperCase()}
                        </span>
                        <span className="teacher-info">
                          <strong>{getTeacherName(teacher)}</strong>
                          <small>{testsCount} тестів</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">Зареєстрованих викладачів поки немає.</div>
              )}

              {selectedTeacher && (
                <>
                  <h2 className="section-title tests-by-teacher-title">
                    Тести викладача: {getTeacherName(selectedTeacher)}
                  </h2>
                  <div className="tests-grid">
                    {selectedTeacherTests.length > 0 ? (
                      selectedTeacherTests.map((test) => (
                        <div key={test.id} className="modern-test-card">
                          <div className="card-icon">📝</div>
                          <div className="card-body">
                            <h3>{test.title}</h3>
                            <span className="q-badge">{test.questions?.length || 0} запитань</span>
                          </div>
                          <button
                            className="start-test-btn"
                            onClick={() => onStartTest(test)}
                          >
                            Почати тест
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">У цього викладача поки немає доступних тестів.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="fade-in">
              <h2 className="section-title">Історія результатів</h2>
              <div className="results-list">
                {history.length > 0 ? (
                  history.map((item) => {
                    const percent = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
                    return (
                      <div key={item.id} className="modern-result-item">
                        <div className="res-info">
                          <span className="res-date">{item.date}</span>
                          <h4>{item.testTitle}</h4>
                        </div>
                        <div className="res-score-group">
                          <div className="res-score-box">
                            <span className="current">{item.score}</span>
                            <span className="total">/{item.total}</span>
                          </div>
                          <div className={`status-tag ${getStatusClass(item.score, item.total)}`}>
                            {percent}% — {percent >= 60 ? 'Складено' : 'Провалено'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">Ви ще не проходили тестів.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
