import React, { useState } from 'react';
import './Constructor.css';
import Sidebar from './Sidebar';
import QuestionCard from './QuestionCard';

const Constructor = ({ questions, setQuestions, onExit, onPublish }) => {
  const [testTitle, setTestTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      type: 'single',
      text: '', 
      answers: [
        { id: Date.now() + 1, text: '', isCorrect: false }, 
        { id: Date.now() + 2, text: '', isCorrect: false }
      ] 
    }]);
    setIsMenuOpen(false); 
  };

  const updateQuestion = (id, updatedData) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updatedData } : q));
  };

  return (
    <div className={`builder-layout ${isMenuOpen ? 'menu-open' : ''}`}>
      {/* Бургер для відкриття */}
      <button className="burger-btn" onClick={() => setIsMenuOpen(true)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* ПЕРЕДАЧА ОБОХ ПРОПСІВ: і стан, і функцію закриття */}
      <Sidebar 
        questions={questions} 
        onExit={onExit} 
        onAdd={addQuestion}
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      {isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)}></div>}

      <div className="editor-area">
        <div className="test-settings-card">
          <input 
            type="text" 
            className="test-main-title" 
            placeholder="Назва тесту..." 
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
          />
          <button className="publish-btn" onClick={() => onPublish(testTitle)}>
            Опублікувати
          </button>
        </div>

        {questions.map((q, index) => (
          <div id={`q-card-${q.id}`} key={q.id}>
            <QuestionCard 
              index={index} 
              data={q} 
              onDelete={() => setQuestions(questions.filter(item => item.id !== q.id))}
              onUpdate={(data) => updateQuestion(q.id, data)}
            />
          </div>
        ))}

        <button className="floating-add-btn" onClick={addQuestion}>
          <span className="plus-icon">+ </span>
          Додати питання
        </button>
      </div>
    </div>
  );
};

export default Constructor;