import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestUsername, setGuestUsername] = useState('');

  const { login, guestLogin, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isGuestMode) {
        await guestLogin(guestUsername);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (error) {
      // 错误已在 store 中处理
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'guestUsername') {
      setGuestUsername(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    clearError();
  };

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-header">
          <h1 className="card-title">ChatP2P</h1>
          <p className="card-subtitle">点对点视频通话</p>
        </div>

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            color: '#dc2626', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isGuestMode ? (
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                用户名
              </label>
              <input
                type="text"
                name="guestUsername"
                value={guestUsername}
                onChange={handleInputChange}
                className="form-input"
                placeholder="请输入用户名"
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  邮箱
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="请输入邮箱"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  密码
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="请输入密码"
                    required
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading"></div>
                登录中...
              </>
            ) : (
              isGuestMode ? '游客登录' : '登录'
            )}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => {
                setIsGuestMode(!isGuestMode);
                clearError();
              }}
              className="btn btn-outline"
              style={{ width: '100%' }}
            >
              {isGuestMode ? '切换到账号登录' : '游客模式'}
            </button>
          </div>

          {!isGuestMode && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#6b7280' }}>还没有账号？</span>
              <Link 
                to="/register" 
                style={{ 
                  color: '#4f46e5', 
                  textDecoration: 'none', 
                  marginLeft: '8px',
                  fontWeight: '500'
                }}
              >
                立即注册
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
