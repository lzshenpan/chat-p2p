import React, { useEffect, useState } from 'react';
import { Clock, Phone, Video, User } from 'lucide-react';
import axios from 'axios';

interface CallRecord {
  id: string;
  targetUserId: string;
  targetUsername: string;
  callType: 'video' | 'audio';
  duration: number;
  qualityData: any;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface CallHistoryProps {
  userId: string;
}

const CallHistory: React.FC<CallHistoryProps> = ({ userId }) => {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCallHistory();
  }, [userId, currentPage]);

  const fetchCallHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/calls/history', {
        params: {
          page: currentPage,
          limit: 10
        }
      });
      
      setCallHistory(response.data.calls);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      setError(error.response?.data?.error || '获取通话记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('zh-CN', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getQualityStatus = (qualityData: any) => {
    if (!qualityData) return { status: 'unknown', text: '未知' };
    
    const latency = qualityData.latency || 0;
    const packetLoss = qualityData.packetLoss || 0;
    
    if (latency < 100 && packetLoss < 1) {
      return { status: 'excellent', text: '优秀' };
    } else if (latency < 300 && packetLoss < 5) {
      return { status: 'good', text: '良好' };
    } else {
      return { status: 'poor', text: '一般' };
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">通话记录</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading"></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">通话记录</h3>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#ef4444'
        }}>
          <p>{error}</p>
          <button 
            onClick={fetchCallHistory}
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">通话记录</h3>
        <p className="card-subtitle">最近的通话历史</p>
      </div>

      {callHistory.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#6b7280'
        }}>
          <Clock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>暂无通话记录</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {callHistory.map((record) => {
              const quality = getQualityStatus(record.qualityData);
              
              return (
                <div 
                  key={record.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* 通话类型图标 */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: record.callType === 'video' ? '#4f46e5' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {record.callType === 'video' ? <Video size={20} /> : <Phone size={20} />}
                  </div>

                  {/* 通话信息 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <User size={16} color="#6b7280" />
                      <span style={{ fontWeight: '500', color: '#111827' }}>
                        {record.targetUsername}
                      </span>
                      <span style={{
                        background: record.callType === 'video' ? '#eef2ff' : '#ecfdf5',
                        color: record.callType === 'video' ? '#4f46e5' : '#10b981',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {record.callType === 'video' ? '视频' : '语音'}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <span>{formatDate(record.startTime)}</span>
                      <span>•</span>
                      <span>{formatDuration(record.duration)}</span>
                      <span>•</span>
                      <span style={{
                        color: quality.status === 'excellent' ? '#10b981' : 
                              quality.status === 'good' ? '#f59e0b' : '#ef4444'
                      }}>
                        质量: {quality.text}
                      </span>
                    </div>
                  </div>

                  {/* 质量指示器 */}
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: quality.status === 'excellent' ? '#10b981' : 
                               quality.status === 'good' ? '#f59e0b' : '#ef4444'
                  }}></div>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
              >
                上一页
              </button>
              
              <span style={{ 
                padding: '8px 16px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallHistory;
