import React, { useState } from 'react';
import './Constructor.css';
import Sidebar from './Sidebar';
import QuestionCard from './QuestionCard';
import Modal from './Modal';

const Constructor = ({
  testTitle,
  setTestTitle,
  questions,
  setQuestions,
  editingTest,
  onExit,
  onPublish,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    message: '',
    type: 'alert',
    onConfirm: null,
  });

  const showAlert = (message) => {
    setModal({
      isOpen: true,
      message,
      type: 'alert',
      onConfirm: closeModal
    });
  };

  const showConfirm = (message, onConfirmAction) => {
    setModal({
      isOpen: true,
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirmAction();
        closeModal();
      }
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const isEditing = !!editingTest;

  const getValidationError = () => {
    if (!testTitle.trim()) {
      return 'Будь ласка, введіть назву тесту перед збереженням!';
    }

    if (questions.length === 0) {
      return 'Додайте хоча б одне питання!';
    }

    const invalidQuestionIndex = questions.findIndex((q) => !q.text.trim());
    if (invalidQuestionIndex !== -1) {
      return `Запитання №${invalidQuestionIndex + 1} повинно мати текст!`;
    }

    const invalidAnswersIndex = questions.findIndex((q) => {
      const filledAnswers = q.answers.filter((answer) => answer.text.trim());
      return filledAnswers.length < 2;
    });
    if (invalidAnswersIndex !== -1) {
      return `Запитання №${invalidAnswersIndex + 1} повинно мати щонайменше два варіанти відповіді!`;
    }

    const missingCorrectIndex = questions.findIndex((q) =>
      !q.answers.some((answer) => answer.text.trim() && answer.isCorrect)
    );
    if (missingCorrectIndex !== -1) {
      return `Позначте правильну відповідь у запитанні №${missingCorrectIndex + 1}!`;
    }

    return '';
  };

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

  const handlePublishClick = () => {
    const validationError = getValidationError();
    if (validationError) {
      showAlert(validationError);
      return;
    }

    const confirmMessage = isEditing
      ? 'Ви впевнені, що хочете зберегти зміни в цьому тесті?'
      : 'Опублікувати цей тест? Він стане доступним для студентів.';

    showConfirm(confirmMessage, () => {
      onPublish();
    });
  };

  const handleExit = () => {
    showConfirm('Ви впевнені, що хочете вийти? Незбережені зміни буде втрачено.', onExit);
  };

  return (
    <div className={`builder-layout ${isMenuOpen ? 'menu-open' : ''}`}>
      <Modal
        isOpen={modal.isOpen}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      <button className="burger-btn" onClick={() => setIsMenuOpen(true)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      <Sidebar
        questions={questions}
        onExit={handleExit}
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
          <button className="publish-btn theme-switch-inline" onClick={onToggleTheme} type="button">
            {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
          </button>
          <button className="publish-btn" onClick={handlePublishClick}>
            {isEditing ? 'Зберегти зміни' : 'Опублікувати'}
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
