import React, { useState, useEffect } from 'react';
import { login } from '../services/auth';
import { cookieUtils } from '../utils/cookies';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    ma_dvcs: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Load thông tin đã lưu từ cookie
  useEffect(() => {
    const savedInfo = cookieUtils.getLoginInfo();
    if (savedInfo.username || savedInfo.password || savedInfo.ma_dvcs) {
      setFormData({
        username: savedInfo.username || '',
        password: savedInfo.password || '',
        ma_dvcs: savedInfo.ma_dvcs || '',
      });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(
        formData.username,
        formData.password,
        formData.ma_dvcs
      );

      if (result.token) {
        // Thông tin đăng nhập và token đã được lưu trong hàm login()
        // Checkbox "Remember me" chỉ để hiển thị, luôn lưu để tự động đăng nhập lại khi cần
        if (onLoginSuccess) {
          onLoginSuccess(result);
        }
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Đăng nhập CRM</h1>
        <p className="login-subtitle">Tool hỗ trợ tối ưu kế toán</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ma_dvcs">Mã đơn vị cơ sở</label>
            <input
              type="text"
              id="ma_dvcs"
              name="ma_dvcs"
              value={formData.ma_dvcs}
              onChange={handleChange}
              required
              placeholder="Nhập mã đơn vị cơ sở"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Lưu thông tin đăng nhập</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
