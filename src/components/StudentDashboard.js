import React, { useState } from 'react';
import './StudentDashboard.css';

const StudentDashboard = ({ tests, history, onStartTest, onExit }) => {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <div className="student-page">
      <header className="dashboard-hero">
        <div className="header-content flex-container">
          <div className="logo-section">
            <img src="/logo192.png" alt="Logo" className="app-logo" />
            <div className="logo-text">
              <span className="brand-name">Е-Оцінка</span>
              <span className="sub-brand"> Кабінет студента</span>
            </div>
          </div>

          <nav className="user-nav">
            <button className={`nav-item ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
              <span className="icon">📚</span>
              <span className="btn-text">Мої тести</span>
            </button>
            <button className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
              <span className="icon">📊</span>
              <span className="btn-text">Результати</span>
            </button>
            <button className="exit-btn compact" onClick={onExit}>Вихід</button>
          </nav>
        </div>
      </header>

      <main className="dashboard-body">
        {activeTab === 'tests' ? (
          <div className="section-card">
            <header className="section-header">
              <h2>Доступні випробування</h2>
            </header>
            <div className="tests-grid">
              {tests.length > 0 ? (
                tests.map((test) => (
                  <div key={test.id} className="test-card shadow-sm">
                    <div className="test-icon">📝</div>
                    <h3>{test.title}</h3>
                    <p>{test.questions.length} питань</p>
                    <button className="start-test-btn" onClick={() => onStartTest(test)}>
                      Почати тест
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-tests"><p>Наразі активних тестів немає.</p></div>
              )}
            </div>
          </div>
        ) : (
          <div className="section-card">
            <header className="section-header">
              <h2>Ваші результати</h2>
            </header>
            <div className="results-list">
              {history && history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="result-item-card">
                    <div className="result-info">
                      <span className="result-date">{item.date}</span>
                      <h4 className="result-test-title">{item.testTitle}</h4>
                    </div>
                    <div className="result-score">
                      <span className="score-val">{item.score} / {item.total}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-tests">
                  <p>Ви ще не пройшли жодного тесту. 🚀</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;