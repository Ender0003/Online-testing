import React, { useState } from 'react';
import './TeacherDashboard.css';
import Modal from './Modal';

const TeacherDashboard = ({
  tests,
  testsLoading = false,
  testsError = '',
  analytics = [],
  getQuestionCount = (test) => test.questions?.length || test.questionCount || 0,
  onDelete,
  onEdit,
  onCreateNew,
  onExit,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const [modal, setModal] = useState({
    isOpen: false,
    testId: null,
  });

  const closeModal = () => setModal({ isOpen: false, testId: null });

  const handleDeleteClick = (testId) => {
    setModal({ isOpen: true, testId });
  };

  const handleDeleteConfirm = () => {
    onDelete(modal.testId);
    closeModal();
  };


  const teacherTestTitles = new Set(
    tests.map((test) => test.title).filter(Boolean)
  );

  const filteredAnalytics = analytics.filter((result) =>
    teacherTestTitles.has(result.test_title)
  );

  const avgScore = filteredAnalytics.length
    ? Math.round(
        filteredAnalytics.reduce((acc, curr) => acc + curr.percentage, 0) /
          filteredAnalytics.length
      )
    : 0;

  return (
    <div className="teacher-page">
      <Modal
        isOpen={modal.isOpen}
        message="Видалити цей тест? Цю дію не можна скасувати."
        type="confirm"
        onConfirm={handleDeleteConfirm}
        onCancel={closeModal}
      />

      <header className="teacher-hero">
        <div className="header-content">
          <div className="brand-group">
            <h1 className="brand-title">Панель викладача</h1>
            <p className="brand-tagline">Керуйте навчальним процесом та аналізуйте успішність</p>
          </div>
          <div className="header-actions">
            <button onClick={onToggleTheme} className="action-btn theme-switch-btn">
              {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
            </button>
            <button onClick={onCreateNew} className="action-btn create-btn">
              ⚡ Створити тест
            </button>
            <button onClick={onExit} className="action-btn logout-btn">
              Вийти
            </button>
          </div>
        </div>
      </header>

      <div className="stats-overview">
        <div className="stat-item">
          <span className="stat-value">{tests.length}</span>
          <span className="stat-label">Всього тестів</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{filteredAnalytics.length}</span>
          <span className="stat-label">Проходжень</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{avgScore}%</span>
          <span className="stat-label">Сер. успішність</span>
        </div>
      </div>

      <main className="dashboard-content">
        <section className="dashboard-section">
          <h3 className="section-title">📊 Останні результати студентів</h3>
          <div className="data-card analytics-card">
            {filteredAnalytics.length > 0 ? (
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th>Назва тесту</th>
                      <th>Результат</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalytics.map((res) => (
                      <tr key={res.id}>
                        <td>
                          <div className="student-info">
                            <div className="student-avatar">{res.student_name?.[0] || 'S'}</div>
                            <span>{res.student_name}</span>
                          </div>
                        </td>
                        <td>{res.test_title}</td>
                        <td>
                          <span className={`percentage-pill ${res.percentage >= 60 ? 'pass' : 'fail'}`}>
                            {res.percentage}%
                          </span>
                        </td>
                        <td>{new Date(res.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-data">
                Тут з'являться результати, коли студенти пройдуть ваші тести.
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <h3 className="section-title">📂 Ваші опубліковані тести</h3>
          {testsError ? (
            <div className="empty-tests-state">
              <span className="empty-icon">⚠️</span>
              <h4>Не вдалося завантажити тести</h4>
              <p>{testsError}</p>
            </div>
          ) : testsLoading ? (
            <div className="empty-tests-state">
              <span className="empty-icon">⏳</span>
              <h4>Завантаження тестів...</h4>
              <p>Синхронізуємо дані з базою.</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="empty-tests-state">
              <span className="empty-icon">📃</span>
              <h4>У вас ще немає створених тестів</h4>
              <p>Натисніть кнопку "Створити тест", щоб розпочати.</p>
            </div>
          ) : (
            <div className="tests-grid-modern">
              {tests.map((test) => (
                <div key={test.id} className="modern-test-card">
                  <div className="card-top">
                    <span className="q-count-badge">{getQuestionCount(test)} питань</span>
                    <h4 className="card-test-title">{test.title || 'Без назви'}</h4>
                  </div>
                  <div className="card-bottom">
                    <div className="card-actions">
                      <button onClick={() => onEdit(test)} className="btn-icon edit">
                        ✏️ Редагувати
                      </button>
                      <button
                        onClick={() => handleDeleteClick(test.id)}
                        className="btn-icon delete"
                      >
                        🗑️ Видалити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
