import React, { useState } from 'react';
import './App.css';

function App() {
  const [role, setRole] = useState('student');

  return (
    <div className={`app-wrapper ${role}`}>
      <header className="main-header">
        <h1>E-Оцінка</h1>
        <p>Система онлайн-тестування</p>
      </header>

      <div className="container">
        <div className="selection-card">
          <h2>Вітаємо на порталі!</h2>
          <p>Оберіть свій статус:</p>
          <div className="role-buttons">
            <button 
              className={`role-btn student-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => setRole('student')}
            >
              Я студент
            </button>
            <button 
              className={`role-btn teacher-btn ${role === 'teacher' ? 'active' : ''}`}
              onClick={() => setRole('teacher')}
            >
              Я викладач
            </button>
          </div>
        </div>

        <div className="form-card" key={role}>
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <h3>Реєстрація {role === 'student' ? 'студента' : 'викладача'}</h3>
            <div className="inputs">
              <input type="text" placeholder="Повне ім'я" />
              <input type="email" placeholder="Електронна пошта" />
              <input type="password" placeholder="Пароль" />
              {role === 'student' ? (
                <input type="text" placeholder="Навчальний заклад та група" />
              ) : (
                <input type="text" placeholder="Навчальний заклад"/>
              )}
            </div>
            <button type="submit" className="submit-action">
              Зареєструватися
            </button>
          </form>
        </div>
      </div>
      <footer className="footer">
        <p>&copy; 2026 Е-Оцінка. Освіта майбутнього.</p>
      </footer>
    </div>
  );
}

export default App;