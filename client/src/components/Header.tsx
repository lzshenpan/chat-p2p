import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User, Video, Settings } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '16px 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            textDecoration: 'none'
          }}
        >
          <Video size={32} color="white" />
          <h1 style={{ 
            color: 'white', 
            fontSize: '24px', 
            fontWeight: '600',
            margin: 0
          }}>
            ChatP2P
          </h1>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 导航链接 */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/"
              className="btn btn-outline"
              style={{
                background: isActive('/') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                textDecoration: 'none'
              }}
            >
              首页
            </Link>
            
            {user && !user.isGuest && (
              <Link
                to="/profile"
                className="btn btn-outline"
                style={{
                  background: isActive('/profile') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textDecoration: 'none'
                }}
              >
                <Settings size={16} />
                个人中心
              </Link>
            )}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="white" />
            <span style={{ color: 'white', fontSize: '16px' }}>
              {user?.username}
            </span>
            {user?.isGuest && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                游客
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
          >
            <LogOut size={16} />
            退出
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
