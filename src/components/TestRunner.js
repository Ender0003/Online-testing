import React, { useState } from 'react';
import './TestRunner.css';

const TestRunner = ({ test, onSubmit, onFinish, themeMode = 'dark', onToggleTheme }) => {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSingleSelect = (qId, ansId) => {
    setAnswers({ ...answers, [qId]: ansId });
  };

  const handleMultipleSelect = (qId, ansId, checked) => {
    const current = Array.isArray(answers[qId]) ? answers[qId] : [];
    const updated = checked
      ? [...current, ansId]
      : current.filter((id) => id !== ansId);

    if (updated.length === 0) {
      const { [qId]: _, ...rest } = answers;
      setAnswers(rest);
    } else {
      setAnswers({ ...answers, [qId]: updated });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const serverResult = await onSubmit({
        testId: test.id,
        answers,
      });
      setResult(serverResult);
    } catch (error) {
      setSubmitError(error.message || 'Не вдалося завершити тест.');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / test.questions.length) * 100;
  const isEveryQuestionAnswered = answeredCount === test.questions.length;

  if (result) {
    const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

    return (
      <div className="runner-layout result-screen">
        <div className="result-card shadow-lg">
          <button type="button" className="theme-toggle-compact result-theme-toggle" onClick={onToggleTheme}>
            {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
          </button>
          <div className="result-icon">🏆</div>
          <h2 className="result-title">Тест завершено!</h2>
          <div className="score-display">
            <span className="score-num">{result.score}</span>
            <span className="score-total">/ {result.total}</span>
          </div>
          <div className="percentage-badge">{percentage}% успішно</div>
          <button
            className="back-to-list-btn"
            onClick={onFinish}
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
                    ? Array.isArray(answers[q.id]) && answers[q.id].includes(a.id)
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

        {submitError && <div className="empty-data">{submitError}</div>}

        <button
          className="finish-test-btn"
          disabled={!isEveryQuestionAnswered || submitting}
          title={!isEveryQuestionAnswered ? 'Дайте відповідь на всі питання' : 'Завершити тест'}
          onClick={handleSubmit}
        >
          {submitting ? 'Перевірка...' : 'Завершити тест'}
        </button>
      </div>
    </div>
  );
};

export default TestRunner;
