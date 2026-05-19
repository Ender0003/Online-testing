import React, { useState } from 'react';
import './Auth.css';

const AuthPage = ({ onSuccess, authenticate, themeMode = 'dark', onToggleTheme }) => {
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');

  const handleRoleChange = (teacher) => {
    setIsTeacher(teacher);
    setError('');
  };

  const handleModeSwitch = () => {
    setIsLoginMode((prev) => !prev);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.target);
    const result = await authenticate(
      {
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
        role: isTeacher ? 'teacher' : 'student',
      },
      isLoginMode
    );

    if (result.success) {
      onSuccess(result.user);
    } else {
      setError(result.error);
    }
  };

  const theme = isTeacher ? 'teacher-theme' : 'student-theme';

  return (
    <div className={`landing-page ${theme}`}>
      <header className="hero-header">
        <button type="button" className="theme-toggle-floating" onClick={onToggleTheme}>
          {themeMode === 'light' ? 'Темна тема' : 'Біла тема'}
        </button>
        <div className="main-logo-container">
          <img src="/logo192.png" alt="Логотип" className="hero-logo" />
          <h1>Е-Оцінка</h1>
        </div>
        <p>{isLoginMode ? 'Вхід у систему' : 'Створення акаунту'}</p>
      </header>

      <main className="auth-container">
        <div className="card selection-card">
          <h3>Вітаємо на порталі!</h3>
          <p>Оберіть свій статус:</p>
          <div className="status-toggle-container">
            <button
              type="button"
              className={`status-card ${!isTeacher ? 'active student' : ''}`}
              onClick={() => handleRoleChange(false)}
            >
              <div className="status-icon">🎓</div>
              <span>Я студент</span>
            </button>
            <button
              type="button"
              className={`status-card ${isTeacher ? 'active teacher' : ''}`}
              onClick={() => handleRoleChange(true)}
            >
              <div className="status-icon">👨‍🏫</div>
              <span>Я викладач</span>
            </button>
          </div>
        </div>

        <div className="card registration-card">
          <h3 className="auth-card-title">
            {isLoginMode ? 'Авторизація' : 'Реєстрація'}{' '}
            {isTeacher ? 'викладача' : 'студента'}
          </h3>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLoginMode && (
              <input name="name" placeholder="Повне ім'я" required />
            )}
            <input
              name="email"
              type="email"
              placeholder="Електронна пошта"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Пароль"
              required
            />
            <button type="submit" className="main-submit-btn">
              {isLoginMode ? 'Увійти' : 'Зареєструватися'}
            </button>
          </form>

          <button className="auth-mode-switch" onClick={handleModeSwitch}>
            {isLoginMode
              ? 'Ще не зареєстровані? Створити акаунт'
              : 'Вже маєте акаунт? Увійти'}
          </button>
        </div>
      </main>

      <footer className="main-footer">
        <p>© {new Date().getFullYear()} Е-Оцінка. Всі права застережено.</p>
      </footer>
    </div>
  );
};

export default AuthPage;
