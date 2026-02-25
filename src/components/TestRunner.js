import React, { useState } from 'react';
import './TestRunner.css';

const TestRunner = ({ test, onFinish }) => {
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const calculateResults = () => {
    let correct = 0;
    test.questions.forEach(q => {
      const correctAns = q.answers.find(a => a.isCorrect);
      if (answers[q.id] === correctAns?.id) correct++;
    });
    return { score: correct, total: test.questions.length };
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / test.questions.length) * 100;

  if (finished) {
    const res = calculateResults();
    const percentage = Math.round((res.score / res.total) * 100);

    return (
      <div className="runner-layout result-screen">
        <div className="result-card shadow-lg">
          <div className="result-icon">🏆</div>
          <h2 className="result-title">Тест завершено!</h2>
          <div className="score-display">
            <span className="score-num">{res.score}</span>
            <span className="score-total">/ {res.total}</span>
          </div>
          <div className="percentage-badge">{percentage}% успішно</div>
          <button 
            className="back-to-list-btn" 
            onClick={() => onFinish({ testTitle: test.title, score: res.score, total: res.total })}
          >
            До списку тестів
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="runner-layout">
      <div className="progress-container">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <span className="progress-text">Виконано: {answeredCount} з {test.questions.length}</span>
      </div>

      <div className="runner-container">
        <header className="test-run-header">
          <h1 className="test-run-title">{test.title}</h1>
        </header>

        {test.questions.map((q, idx) => (
          <div key={q.id} className="run-question-card shadow-sm">
            <div className="q-badge">Питання {idx + 1}</div>
            <h3 className="q-run-text">{q.text || "Питання без тексту"}</h3>
            <div className="answers-run-grid">
              {q.answers.map(a => {
                const isSelected = answers[q.id] === a.id;
                return (
                  <label key={a.id} className={`run-answer-option ${isSelected ? 'selected' : ''}`}>
                    <div className={`custom-radio ${isSelected ? 'checked' : ''}`}></div>
                    <input 
                      type="radio" 
                      name={q.id} 
                      className="hidden-radio"
                      checked={isSelected} 
                      onChange={() => setAnswers({...answers, [q.id]: a.id})} 
                    />
                    <span className="answer-text">{a.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <button 
          className="finish-test-btn" 
          disabled={answeredCount === 0}
          onClick={() => setFinished(true)}
        >
          Завершити тест
        </button>
      </div>
    </div>
  );
};

export default TestRunner;