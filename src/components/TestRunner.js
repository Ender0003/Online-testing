import React, { useState } from 'react';
import './TestRunner.css';

const TestRunner = ({ test, onFinish, themeMode = 'dark', onToggleTheme }) => {
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const handleSingleSelect = (qId, ansId) => {
    setAnswers({ ...answers, [qId]: ansId });
  };

  const handleMultipleSelect = (qId, ansId, checked) => {
    const current = answers[qId] instanceof Set ? answers[qId] : new Set();
    const updated = new Set(current);
    if (checked) {
      updated.add(ansId);
    } else {
      updated.delete(ansId);
    }
    if (updated.size === 0) {
      const { [qId]: _, ...rest } = answers;
      setAnswers(rest);
    } else {
      setAnswers({ ...answers, [qId]: updated });
    }
  };

  const calculateResults = () => {
    let correct = 0;
    test.questions.forEach((q) => {
      if (q.type === 'multiple') {
        const correctIds = new Set(
          q.answers.filter((a) => a.isCorrect).map((a) => a.id)
        );
        const selectedIds = answers[q.id] instanceof Set ? answers[q.id] : new Set();
        const isCorrect =
          correctIds.size === selectedIds.size &&
          [...correctIds].every((id) => selectedIds.has(id));
        if (isCorrect) correct++;
      } else {
        const correctAns = q.answers.find((a) => a.isCorrect);
        if (answers[q.id] === correctAns?.id) correct++;
      }
    });
    return { score: correct, total: test.questions.length };
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / test.questions.length) * 100;
  const isEveryQuestionAnswered = answeredCount === test.questions.length;

  if (finished) {
    const res = calculateResults();
    const percentage = res.total > 0 ? Math.round((res.score / res.total) * 100) : 0;

    return (
      <div className="runner-layout result-screen">
        <div className="result-card shadow-lg">
          <button type="button" className="theme-toggle-compact result-theme-toggle" onClick={onToggleTheme}>
            {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
          </button>
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
        <div className="progress-top-row">
          <span className="progress-text">Виконано: {answeredCount} з {test.questions.length}</span>
          <button type="button" className="theme-toggle-compact" onClick={onToggleTheme}>
            {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
          </button>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="runner-container">
        <header className="test-run-header">
          <h1 className="test-run-title">{test.title}</h1>
        </header>

        {test.questions.map((q, idx) => {
          const isMultiple = q.type === 'multiple';
          return (
            <div key={q.id} className="run-question-card shadow-sm">
              <div className="q-badge">
                Питання {idx + 1}
                {isMultiple && <span className="multiple-hint"> · кілька відповідей</span>}
              </div>
              <h3 className="q-run-text">{q.text || 'Питання без тексту'}</h3>

              <div className="answers-run-grid">
                {q.answers.map((a) => {
                  const isSelected = isMultiple
                    ? answers[q.id] instanceof Set && answers[q.id].has(a.id)
                    : answers[q.id] === a.id;

                  return (
                    <label key={a.id} className={`run-answer-option ${isSelected ? 'selected' : ''}`}>
                      {isMultiple ? (
                        <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <span>✓</span>}
                        </div>
                      ) : (
                        <div className={`custom-radio ${isSelected ? 'checked' : ''}`}></div>
                      )}

                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={q.id}
                        className="hidden-radio"
                        checked={isSelected}
                        onChange={(e) => {
                          if (isMultiple) {
                            handleMultipleSelect(q.id, a.id, e.target.checked);
                          } else {
                            handleSingleSelect(q.id, a.id);
                          }
                        }}
                      />
                      <span className="answer-text">{a.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button
          className="finish-test-btn"
          disabled={!isEveryQuestionAnswered}
          title={!isEveryQuestionAnswered ? 'Дайте відповідь на всі питання' : 'Завершити тест'}
          onClick={() => setFinished(true)}
        >
          Завершити тест
        </button>
      </div>
    </div>
  );
};

export default TestRunner;
