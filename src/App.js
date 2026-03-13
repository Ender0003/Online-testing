import React, { useState, useEffect } from 'react';
import Constructor from './components/Constructor';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TestRunner from './components/TestRunner';
import './components/Auth.css';
import './components/StudentDashboard.css'; 
import './components/TeacherDashboard.css'; 
import './components/TestRunner.css';
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://lcvclvnmnmxchiyhmezu.supabase.co/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdmNsdm5tbm14Y2hpeWhtZXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTA4NTAsImV4cCI6MjA4ODk2Njg1MH0.X7vpxmC4VpwNTJ9Miu34pE8W5o4uB2aiJbyRfgnqYJ0'
const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [screen, setScreen] = useState(0); 
  const [isTeacher, setIsTeacher] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Ці стани поки залишаємо для тестів, але пізніше теж перенесемо в БД
  const [publishedTests, setPublishedTests] = useState(() => {
    const saved = localStorage.getItem('published_tests');
    return saved ? JSON.parse(saved) : [];
  });

  const [testHistory, setTestHistory] = useState(() => {
    const saved = localStorage.getItem('test_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    localStorage.setItem('published_tests', JSON.stringify(publishedTests));
    localStorage.setItem('test_history', JSON.stringify(testHistory));
  }, [publishedTests, testHistory]);

  // Основна функція авторизації стала асинхронною
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
    const email = formData.get('email').toLowerCase();
    const password = formData.get('password');
    const name = formData.get('name');
    const selectedRole = isTeacher ? 'teacher' : 'student';

    if (isLoginMode) {
      // 🔑 Вхід у систему
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError('Невірний email або пароль');
        return;
      }

      const userRole = data.user.user_metadata.role;
      if (userRole !== selectedRole) {
        setError(`Цей акаунт зареєстрований як ${userRole === 'student' ? 'студент' : 'викладач'}.`);
        return;
      }

      setCurrentUser({
        name: data.user.user_metadata.full_name,
        email: data.user.email,
        role: userRole
      });
      setScreen(userRole === 'teacher' ? 3 : 2);

    } else {
      // 📝 Реєстрація нового користувача
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: selectedRole,
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        const newUser = { 
          name: data.user.user_metadata.full_name, 
          email: data.user.email, 
          role: data.user.user_metadata.role 
        };
        setCurrentUser(newUser);
        setScreen(selectedRole === 'teacher' ? 3 : 2);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setScreen(0);
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
                  onClick={() => { setIsTeacher(false); setError(''); }}
                >
                  <div className="status-icon">🎓</div>
                  <span>Я студент</span>
                </button>
                <button 
                  type="button"
                  className={`status-card ${isTeacher ? 'active teacher' : ''}`} 
                  onClick={() => { setIsTeacher(true); setError(''); }}
                >
                  <div className="status-icon">👨‍🏫</div>
                  <span>Я викладач</span>
                </button>
              </div>
            </div>

            <div className="card registration-card">
              <h3 style={{ marginTop: '-15px', marginBottom: '20px', color: '#000' }}>
                {isLoginMode ? 'Авторизація' : 'Реєстрація'} {isTeacher ? 'викладача' : 'студента'}
              </h3>
              
              {error && <div className="error-msg" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
              
              <form onSubmit={handleAuth} className="auth-form">
                {!isLoginMode && <input name="name" placeholder="Повне ім'я" required />}
                <input name="email" type="email" placeholder="Електронна пошта" required />
                <input name="password" type="password" placeholder="Пароль" required />
                <button type="submit" className="main-submit-btn">
                  {isLoginMode ? 'Увійти' : 'Зареєструватися'}
                </button>
              </form>

              <div 
                className="auth-mode-switch" 
                onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
              >
                {isLoginMode ? 'Ще не зареєстровані? Створити акаунт' : 'Вже маєте акаунт? Увійти'}
              </div>
            </div>
          </main>

          <footer className="main-footer">
            <p>© {new Date().getFullYear()} Е-Оцінка. Всі права застережено.</p>
          </footer>
        </div>
      )}

      {/* Решта екранів (Constructor, Dashboards, TestRunner) залишаються без змін */}
      {screen === 1 && (
        <Constructor 
          questions={questions} 
          setQuestions={setQuestions} 
          onExit={() => setScreen(3)} 
          onPublish={(newTitle) => {
            setPublishedTests([...publishedTests, { 
              id: Date.now(), 
              title: newTitle, 
              questions: questions,
              author: currentUser?.name 
            }]); 
            setScreen(3); 
          }} 
        />
      )}

      {screen === 2 && (
        <StudentDashboard 
          user={currentUser}
          tests={publishedTests} 
          history={testHistory.filter(h => h.userEmail === currentUser?.email)} 
          onStartTest={(t) => { setActiveTest(t); setScreen(4); }} 
          onExit={handleLogout} 
        />
      )}

      {screen === 3 && (
        <TeacherDashboard 
          user={currentUser}
          tests={publishedTests} 
          onDelete={(id) => setPublishedTests(publishedTests.filter(t => t.id !== id))} 
          onCreateNew={() => { setQuestions([]); setScreen(1); }} 
          onExit={handleLogout} 
        />
      )}

      {screen === 4 && activeTest && (
        <TestRunner 
          test={activeTest} 
          onFinish={(result) => {
            if (result) {
              const newEntry = {
                ...result,
                id: Date.now(),
                userEmail: currentUser?.email,
                userName: currentUser?.name,
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