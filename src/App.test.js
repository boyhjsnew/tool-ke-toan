import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login form', () => {
  render(<App />);
  const loginTitle = screen.getByText(/Đăng nhập CRM/i);
  expect(loginTitle).toBeInTheDocument();
});
