import React, { useState, useEffect } from 'react';
import Constructor from './components/Constructor';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TestRunner from './components/TestRunner';
import './components/Auth.css';
import './components/StudentDashboard.css'; 
import './components/TeacherDashboard.css'; 
import './components/TestRunner.css';

function App() {
  const [screen, setScreen] = useState(0); 
  const [isTeacher, setIsTeacher] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  
  // Завантаження тестів
  const [publishedTests, setPublishedTests] = useState(() => {
    const saved = localStorage.getItem('published_tests');
    return saved ? JSON.parse(saved) : [];
  });

  // ВІДНОВЛЕНО: Завантаження історії результатів
  const [testHistory, setTestHistory] = useState(() => {
    const saved = localStorage.getItem('test_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [questions, setQuestions] = useState([]);

  // Збереження всього в пам'ять браузера
  useEffect(() => {
    localStorage.setItem('published_tests', JSON.stringify(publishedTests));
    localStorage.setItem('test_history', JSON.stringify(testHistory));
  }, [publishedTests, testHistory]);

  const handleRegister = (e) => {
    e.preventDefault();
    isTeacher ? setScreen(3) : setScreen(2);
  };

  return (
    <div className={`app-container ${isTeacher ? 'teacher-theme' : 'student-theme'}`}>
      
      {screen === 0 && (
        <div className="landing-page">
          <header className="hero-header">
            <div className="main-logo-container">
              <img src="/logo192.png" alt="Логотип" className="hero-logo" />
              <h1>Е-Оцінка</h1>
            </div>
            <p>Система онлайн-тестування</p>
          </header>

          <main className="auth-container">
            <div className="card selection-card">
              <h3>Вітаємо на порталі!</h3>
              <p>Оберіть свій статус:</p>
              <div className="status-toggle-container">
                <button 
                  type="button"
                  className={`status-card ${!isTeacher ? 'active student' : ''}`} 
                  onClick={() => setIsTeacher(false)}
                >
                  <div className="status-icon">🎓</div>
                  <span>Я студент</span>
                </button>
                <button 
                  type="button"
                  className={`status-card ${isTeacher ? 'active teacher' : ''}`} 
                  onClick={() => setIsTeacher(true)}
                >
                  <div className="status-icon">👨‍🏫</div>
                  <span>Я викладач</span>
                </button>
              </div>
            </div>

            <div className="card registration-card">
              <h3>Реєстрація {isTeacher ? 'викладача' : 'студента'}</h3>
              <form onSubmit={handleRegister} className="auth-form">
                <input name="name" placeholder="Повне ім'я" required />
                <input name="email" type="email" placeholder="Електронна пошта" required />
                <input name="password" type="password" placeholder="Пароль" required />
                <button type="submit" className="main-submit-btn">Зареєструватися</button>
              </form>
            </div>
          </main>

          <footer className="main-footer">
            <p>© {new Date().getFullYear()} Е-Оцінка. Всі права захищені.</p>
          </footer>
        </div>
      )}

      {screen === 1 && (
        <Constructor 
          questions={questions} 
          setQuestions={setQuestions} 
          onExit={() => setScreen(3)} 
          onPublish={(t) => { 
            setPublishedTests([...publishedTests, {id: Date.now(), title: t, questions}]); 
            setScreen(3); 
          }} 
        />
      )}

      {screen === 2 && (
        <StudentDashboard 
          tests={publishedTests} 
          history={testHistory} // Передаємо історію
          onStartTest={(t) => { setActiveTest(t); setScreen(4); }} 
          onExit={() => setScreen(0)} 
        />
      )}

      {screen === 3 && (
        <TeacherDashboard 
          tests={publishedTests} 
          onDelete={(id) => setPublishedTests(publishedTests.filter(t => t.id !== id))} 
          onCreateNew={() => { setQuestions([]); setScreen(1); }} 
          onExit={() => setScreen(0)} 
        />
      )}

      {screen === 4 && activeTest && (
        <TestRunner 
          test={activeTest} 
          onFinish={(result) => {
            // Зберігаємо новий результат з датою
            if (result) {
              const newEntry = {
                ...result,
                id: Date.now(),
                date: new Date().toLocaleString()
              };
              setTestHistory([newEntry, ...testHistory]);
            }
            setScreen(2);
          }} 
        />
      )}
    </div>
  );
}

export default App;