import React from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = ({ tests, onDelete, onCreateNew, onExit }) => {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-container">
        
        {/* Верхня панель */}
        <div className="dashboard-header-card">
          <div className="header-text">
            <h2 className="header-title">Панель викладача</h2>
            <p className="header-subtitle">Управління тестами ({tests.length})</p>
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

        {/* Стан, коли тестів немає */}
        {tests.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📂</div>
            <h3 className="empty-title">Список тестів порожній</h3>
            <p>Створіть свій перший тест, щоб студенти могли його пройти.</p>
            <button onClick={onCreateNew} className="add-btn-large">
              + Створити перший тест
            </button>
          </div>
        ) : (
          /* Сітка з тестами */
          <div className="tests-grid">
            {tests.map(test => (
              <div key={test.id} className="test-card">
                <div className="test-card-content">
                  <h3 className="test-card-title">
                    {/* Виводимо назву або текст за замовчуванням */}
                    {test.title || "Назва відсутня"}
                  </h3>
                  <p className="test-card-info">
                    📊 Запитань: <strong>{test.questions?.length || 0}</strong>
                  </p>
                </div>
                
                <div className="test-card-footer">
                  <button 
                    onClick={() => {
                      if(window.confirm('Ви впевнені, що хочете видалити цей тест?')) {
                        onDelete(test.id);
                      }
                    }} 
                    className="delete-test-btn"
                  >
                    🗑️ Видалити
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