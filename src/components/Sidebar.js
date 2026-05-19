import React from 'react';

const Sidebar = ({ questions = [], onAdd, onExit, onClose, isOpen }) => {
  
  const scrollToQuestion = (id) => {
    const element = document.getElementById(`q-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.innerWidth <= 850 && typeof onClose === 'function') {
        onClose(); 
      }
    }
  };

  return (
    <aside className={`sidebar-nav ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title-block">
          <p>Питань у тесті: {questions.length}</p>
        </div>
        <button
          type="button"
          className="close-menu-btn"
          onClick={onClose}
          aria-label="Закрити панель"
        >
          ×
        </button>
      </div>

      <div className="q-list">
        {questions.map((q, idx) => (
          <button 
            key={q.id} 
            className="q-nav-button" 
            onClick={() => scrollToQuestion(q.id)}
          >
            <span className="q-nav-num">{idx + 1}</span>
            <span className="q-nav-label">Питання</span>
          </button>
        ))}
      </div>

      <div className="sidebar-actions">
        <button className="exit-btn" onClick={onExit}>Вийти з редактора</button>
      </div>
    </aside>
  );
};

export default Sidebar;
