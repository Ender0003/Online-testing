import React from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = ({ tests, onDelete, onCreateNew, onExit }) => {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-container">
        
        {/* Верхня панель з інформацією та кнопками */}
        <div className="dashboard-header-card">
          <div className="header-text">
            <h2 className="header-title">Ваші тести</h2>
            <p className="header-subtitle">Всього опубліковано: {tests.length}</p>
          </div>
          <div className="header-actions">
            <button onClick={onCreateNew} className="publish-btn">
              + Створити тест
            </button>
            <button onClick={onExit} className="exit-btn-alt">
              Вийти
            </button>
          </div>
        </div>

        {/* Умова: якщо тестів немає, показуємо порожній стан */}
        {tests.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📁</div>
            <h3 className="empty-title">У вас поки немає створених тестів</h3>
            <button onClick={onCreateNew} className="add-btn-large">
              Створити перший тест
            </button>
          </div>
        ) : (
          /* Сітка з картками тестів */
          <div className="tests-grid">
            {tests.map(test => (
              <div key={test.id} className="test-card">
                <h3 className="test-card-title">{test.title}</h3>
                <p className="test-card-info">Кількість запитань: {test.questions.length}</p>
                <div className="test-card-footer">
                  <button 
                    onClick={() => onDelete(test.id)} 
                    className="delete-test-btn"
                  >
                    🗑️ Видалити тест
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;