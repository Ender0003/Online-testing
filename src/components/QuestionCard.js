import React from 'react';

const QuestionCard = ({ index, data, onDelete, onUpdate }) => {
  const addAnswer = () => {
    const newAnswer = { id: Date.now(), text: '', isCorrect: false };
    onUpdate({ ...data, answers: [...data.answers, newAnswer] });
  };

  const updateAnswer = (ansId, field, value) => {
    const updatedAnswers = data.answers.map(a => 
      a.id === ansId ? { ...a, [field]: value } : a
    );
    onUpdate({ ...data, answers: updatedAnswers });
  };

  return (
    <div className="question-card shadow-sm">
      <div className="q-card-header">
        <div className="q-title-row">
          <span className="q-number">Запитання №{index + 1}</span>
          <div className="q-controls">
            <select 
              className="q-type-select"
              value={data.type} 
              onChange={(e) => onUpdate({ ...data, type: e.target.value })}
            >
              <option value="single">Одна відповідь</option>
              <option value="multiple">Кілька відповідей</option>
            </select>
            <button className="delete-q-btn" onClick={onDelete}>
              <span className="icon">🗑️</span> Видалити
            </button>
          </div>
        </div>
        
        <textarea 
          className="q-textarea"
          placeholder="Введіть текст запитання..."
          value={data.text}
          onChange={(e) => onUpdate({ ...data, text: e.target.value })}
        />
      </div>

      <div className="ans-section">
        <div className="ans-grid">
          {data.answers.map((ans) => (
            <div key={ans.id} className="ans-item">
              <input 
                type={data.type === 'single' ? 'radio' : 'checkbox'} 
                name={`q-${data.id}`}
                checked={ans.isCorrect}
                onChange={(e) => {
                   if(data.type === 'single') {
                     const resetAns = data.answers.map(a => ({...a, isCorrect: a.id === ans.id}));
                     onUpdate({...data, answers: resetAns});
                   } else {
                     updateAnswer(ans.id, 'isCorrect', e.target.checked);
                   }
                }}
              />
              <input 
                type="text" 
                className="ans-input"
                placeholder="Варіант відповіді"
                value={ans.text}
                onChange={(e) => updateAnswer(ans.id, 'text', e.target.value)}
              />
              <button 
                className="remove-ans-btn"
                onClick={() => onUpdate({ ...data, answers: data.answers.filter(a => a.id !== ans.id) })}
              >✕</button>
            </div>
          ))}
        </div>
        
        <button className="add-ans-dashed-btn" onClick={addAnswer}>
          + Додати варіант відповіді
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;