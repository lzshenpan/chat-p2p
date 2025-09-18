import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCallStore } from '../stores/callStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { Phone, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const CallPage: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const { currentCall, acceptCall, endCall } = useCallStore();
  const [isInitiator, setIsInitiator] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const {
    isConnected,
    isMuted,
    isVideoEnabled,
    qualityData,
    error,
    initiateCall,
    toggleMute,
    toggleVideo,
    endCall: endWebRTCCall,
    setError
  } = useWebRTC({
    localVideoRef,
    remoteVideoRef,
    callId: callId || '',
    targetUserId: currentCall?.caller.userId || currentCall?.callee.userId || '',
    isInitiator
  });

  // 确定是否为发起方
  useEffect(() => {
    if (currentCall && callId) {
      // 这里需要根据当前用户ID判断是否为发起方
      // 简化处理：如果通话状态是 ringing，说明是接收方
      setIsInitiator(currentCall.status !== 'ringing');
    }
  }, [currentCall, callId]);

  // 处理通话接受
  const handleAcceptCall = () => {
    if (currentCall && callId) {
      acceptCall(callId);
    }
  };

  // 处理通话结束
  const handleEndCall = () => {
    if (callId) {
      endCall(callId);
    }
    endWebRTCCall();
    navigate('/');
  };

  // 发起通话
  useEffect(() => {
    if (isInitiator && currentCall?.status === 'ringing') {
      initiateCall();
    }
  }, [isInitiator, currentCall, initiateCall]);

  // 通话计时
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected && currentCall?.connectTime) {
      const startTime = new Date(currentCall.connectTime).getTime();
      
      interval = setInterval(() => {
        const now = Date.now();
        setCallDuration(Math.floor((now - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, currentCall]);

  // 格式化通话时长
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentCall || !callId) {
    return (
      <div className="container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="card">
          <h2>通话不存在</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#000'
    }}>
      {/* 通话状态栏 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            {currentCall.caller.username} ↔ {currentCall.callee.username}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
            {currentCall.type === 'video' ? '视频通话' : '语音通话'}
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {isConnected ? formatDuration(callDuration) : '00:00'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {isConnected ? '已连接' : '连接中...'}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          padding: '12px 16px',
          textAlign: 'center'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              marginLeft: '8px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* 视频区域 */}
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        {/* 远程视频 */}
        <div style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          background: '#1f2937'
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {!isConnected && (
            <div className="video-overlay">
              <div style={{ textAlign: 'center' }}>
                <div className="loading" style={{ marginBottom: '16px' }}></div>
                <p>正在连接...</p>
              </div>
            </div>
          )}
        </div>

        {/* 本地视频 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '200px',
          height: '150px',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#374151',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // 镜像效果
            }}
          />
        </div>

        {/* 质量监控 */}
        {qualityData && (
          <div className="quality-monitor">
            <div className="quality-item">
              <span>延迟:</span>
              <span className={`quality-value ${
                qualityData.latency < 100 ? '' : 
                qualityData.latency < 300 ? 'warning' : 'error'
              }`}>
                {qualityData.latency.toFixed(0)}ms
              </span>
            </div>
            <div className="quality-item">
              <span>丢包:</span>
              <span className={`quality-value ${
                qualityData.packetLoss < 1 ? '' : 
                qualityData.packetLoss < 5 ? 'warning' : 'error'
              }`}>
                {qualityData.packetLoss.toFixed(1)}%
              </span>
            </div>
            <div className="quality-item">
              <span>码率:</span>
              <span className="quality-value">
                {qualityData.bitrate.toFixed(0)}kbps
              </span>
            </div>
            <div className="quality-item">
              <span>分辨率:</span>
              <span className="quality-value">
                {qualityData.resolution}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 通话控制 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div className="call-controls">
          {/* 静音按钮 */}
          <button
            onClick={toggleMute}
            className={`call-control-btn mute ${isMuted ? 'active' : ''}`}
            title={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* 视频按钮 */}
          {currentCall.type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`call-control-btn video ${isVideoEnabled ? 'active' : ''}`}
              title={isVideoEnabled ? '关闭视频' : '开启视频'}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
          )}

          {/* 挂断按钮 */}
          <button
            onClick={handleEndCall}
            className="call-control-btn end"
            title="挂断"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* 通话接受/拒绝按钮（仅在 ringing 状态显示） */}
      {currentCall.status === 'ringing' && !isInitiator && (
        <div style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '20px'
        }}>
          <button
            onClick={handleAcceptCall}
            className="btn btn-success btn-lg"
            style={{ borderRadius: '50px' }}
          >
            <Phone size={20} />
            接听
          </button>
          <button
            onClick={handleEndCall}
            className="btn btn-danger btn-lg"
            style={{ borderRadius: '50px' }}
          >
            拒绝
          </button>
        </div>
      )}
    </div>
  );
};

export default CallPage;
