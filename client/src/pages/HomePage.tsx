import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { Video, Phone, Users, Clock } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    activeUsers, 
    isConnected, 
    initiateCall, 
    currentCall,
    setCurrentCall 
  } = useCallStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 如果有进行中的通话，跳转到通话页面
    if (currentCall && currentCall.status === 'connected') {
      navigate(`/call/${currentCall.id}`);
    }
  }, [currentCall, navigate]);

  const handleCallUser = (targetUserId: string, callType: 'video' | 'audio') => {
    initiateCall(targetUserId, callType);
  };

  const handleAcceptCall = () => {
    if (currentCall) {
      navigate(`/call/${currentCall.id}`);
    }
  };

  const handleRejectCall = () => {
    if (currentCall) {
      // 这里需要调用 rejectCall
      setCurrentCall(null);
    }
  };

  // 过滤掉当前用户
  const otherUsers = activeUsers.filter(u => u.userId !== user?.id);
  
  // 调试信息
  console.log('当前用户:', user);
  console.log('所有在线用户:', activeUsers);
  console.log('其他用户:', otherUsers);

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '32px', 
          fontWeight: '600',
          marginBottom: '12px'
        }}>
          欢迎回来，{user?.username}！
        </h1>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '18px',
          marginBottom: '20px'
        }}>
          选择在线用户开始视频通话
        </p>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444'
          }}></div>
          {isConnected ? '已连接' : '连接中...'}
        </div>
      </div>

      {/* 来电提示 */}
      {currentCall && currentCall.status === 'ringing' && (
        <div className="card" style={{ 
          marginBottom: '30px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '2px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div className="call-status ringing">
            <h3 style={{ marginBottom: '12px' }}>来电</h3>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>
              {currentCall.caller.username} 邀请您进行 {currentCall.type === 'video' ? '视频' : '语音'} 通话
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={handleAcceptCall}
                className="btn btn-success"
              >
                <Phone size={20} />
                接听
              </button>
              <button
                onClick={handleRejectCall}
                className="btn btn-danger"
              >
                拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 在线用户列表 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} />
            在线用户 ({otherUsers.length})
          </h2>
          <p className="card-subtitle">
            点击用户开始通话
          </p>
        </div>

        {otherUsers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>暂无其他在线用户</p>
          </div>
        ) : (
          <div className="user-list">
            {otherUsers.map((user) => (
              <div key={user.userId} className="user-item">
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-status online">在线</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCallUser(user.userId, 'video')}
                    className="btn btn-primary btn-sm"
                    title="视频通话"
                  >
                    <Video size={16} />
                  </button>
                  <button
                    onClick={() => handleCallUser(user.userId, 'audio')}
                    className="btn btn-secondary btn-sm"
                    title="语音通话"
                  >
                    <Phone size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 功能说明 */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h3 className="card-title">功能特性</h3>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(79, 70, 229, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Video size={24} color="#4f46e5" />
            </div>
            <h4 style={{ marginBottom: '8px' }}>高清视频</h4>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              支持高清视频通话，流畅体验
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Clock size={24} color="#10b981" />
            </div>
            <h4 style={{ marginBottom: '8px' }}>低延迟</h4>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              P2P 直连，延迟低于 300ms
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Users size={24} color="#ef4444" />
            </div>
            <h4 style={{ marginBottom: '8px' }}>端到端加密</h4>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              保护您的隐私安全
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
