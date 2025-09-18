import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { User, Mail, Calendar, Edit3, Save, X } from 'lucide-react';
import CallHistory from '../components/CallHistory';
import axios from 'axios';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    createdAt: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/users/profile');
      setProfile(response.data);
      setEditUsername(response.data.username);
    } catch (error: any) {
      setError(error.response?.data?.error || '获取用户信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditUsername(profile.username);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditUsername(profile.username);
    setError(null);
  };

  const handleSave = async () => {
    if (!editUsername.trim()) {
      setError('用户名不能为空');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const response = await axios.put('/api/users/profile', {
        username: editUsername.trim()
      });
      
      setProfile(response.data.user);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.response?.data?.error || '更新失败');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* 用户信息卡片 */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div className="card-header">
            <h2 className="card-title">个人资料</h2>
            <p className="card-subtitle">管理您的账户信息</p>
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

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* 用户名 */}
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                用户名
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                    disabled={isSaving}
                  />
                ) : (
                  <div style={{ 
                    flex: 1, 
                    padding: '12px 16px', 
                    background: '#f9fafb', 
                    borderRadius: '8px',
                    color: '#111827'
                  }}>
                    {profile.username}
                  </div>
                )}
                
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !editUsername.trim()}
                      className="btn btn-success btn-sm"
                    >
                      {isSaving ? (
                        <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                      ) : (
                        <Save size={16} />
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="btn btn-secondary btn-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* 邮箱 */}
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                邮箱
              </label>
              <div style={{ 
                padding: '12px 16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                color: '#6b7280'
              }}>
                {profile.email || '游客用户'}
              </div>
            </div>

            {/* 注册时间 */}
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                注册时间
              </label>
              <div style={{ 
                padding: '12px 16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                color: '#6b7280'
              }}>
                {profile.createdAt ? formatDate(profile.createdAt) : '未知'}
              </div>
            </div>
          </div>
        </div>

        {/* 账户操作 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">账户操作</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={logout}
              className="btn btn-danger"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 通话记录 */}
        {user && !user.isGuest && (
          <div style={{ marginTop: '30px' }}>
            <CallHistory userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
