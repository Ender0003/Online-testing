import React, { useState } from 'react';
import './StudentDashboard.css';

const StudentDashboard = ({ tests, history, onStartTest, onExit }) => {
  const [activeTab, setActiveTab] = useState('tests');

  // Функція для визначення класу статусу
  const getStatusClass = (score, total) => {
    const percentage = (score / total) * 100;
    return percentage >= 60 ? 'passed-border' : 'failed-border';
  };

  return (
    <div className="student-page">
      <header className="dashboard-hero">
        <div className="header-content flex-container">
          <div className="logo-section">
            <div className="logo-icon-wrapper">
               <img src="/logo192.png" alt="Logo" className="app-logo" />
            </div>
            <div className="logo-text">
              <span className="brand-name">Е-Оцінка</span>
              <span className="sub-brand">Кабінет студента</span>
            </div>
          </div>

          <nav className="user-nav">
            <button 
              className={`nav-item ${activeTab === 'tests' ? 'active' : ''}`} 
              onClick={() => setActiveTab('tests')}
            >
              <span className="icon">📚</span>
              <span className="btn-text">Мої тести</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} 
              onClick={() => setActiveTab('results')}
            >
              <span className="icon">📊</span>
              <span className="btn-text">Результати</span>
            </button>
            <button className="exit-btn-modern" onClick={onExit}>
              <span>Вихід</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-body">
        <div className="content-wrapper animate-up">
          {activeTab === 'tests' ? (
            <div className="section-card">
              <header className="section-header">
                <h2>Доступні випробування</h2>
                <span className="badge-count">{tests.length}</span>
              </header>
              
              <div className="tests-grid">
                {tests.length > 0 ? (
                  tests.map((test) => (
                    <div key={test.id} className="test-card-modern">
                      <div className="test-card-top">
                        <div className="test-icon-box">📝</div>
                        <div className="test-meta">
                          <h3>{test.title}</h3>
                          <p><span>📋</span> {test.questions.length} питань</p>
                        </div>
                      </div>
                      <button className="start-test-btn-modern" onClick={() => onStartTest(test)}>
                        Почати тестування
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-tests-placeholder">
                    <p>Наразі активних тестів немає.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="section-card">
              <header className="section-header">
                <h2>Історія успішності</h2>
              </header>
              <div className="results-list-modern">
                {history && history.length > 0 ? (
                  history.map((item) => {
                    const isPassed = (item.score / item.total) * 100 >= 60;
                    return (
                      <div key={item.id} className={`result-card-modern ${getStatusClass(item.score, item.total)}`}>
                        <div className="result-main-info">
                          <span className="result-date-tag">{item.date}</span>
                          <h4>{item.testTitle}</h4>
                        </div>
                        <div className="result-stats">
                          <div className="score-display">
                            <span className="score-number">{item.score}</span>
                            <span className="score-divider">/</span>
                            <span className="score-total">{item.total}</span>
                          </div>
                          <div className={`status-pill ${isPassed ? 'status-success' : 'status-error'}`}>
                            {isPassed ? 'Складено' : 'Не складено'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-tests-placeholder">
                    <p>Ви ще не пройшли жодного тесту. 🚀</p>
                  </div>
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