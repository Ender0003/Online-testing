import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('відображає сторінку авторизації при старті', () => {
  render(<App />);
  expect(screen.getByText('Е-Оцінка')).toBeInTheDocument();
  expect(screen.getByText('Я студент')).toBeInTheDocument();
  expect(screen.getByText('Я викладач')).toBeInTheDocument();
});

test('перемикає режим між логіном та реєстрацією', async () => {
  render(<App />);
  const switchBtn = screen.getByText(/Ще не зареєстровані/i);
  await userEvent.click(switchBtn);
  expect(screen.getByPlaceholderText("Повне ім'я")).toBeInTheDocument();
});
