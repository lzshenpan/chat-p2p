import { useRef, useEffect, useCallback, useState } from 'react';
import { useCallStore } from '../stores/callStore';
import axios from 'axios';

interface WebRTCConfig {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  callId: string;
  targetUserId: string;
  isInitiator: boolean;
}

interface QualityData {
  latency: number;
  packetLoss: number;
  bitrate: number;
  resolution: string;
  framerate: number;
}

export const useWebRTC = ({
  localVideoRef,
  remoteVideoRef,
  callId,
  targetUserId,
  isInitiator
}: WebRTCConfig) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [qualityData, setQualityData] = useState<QualityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { 
    socket, 
    sendOffer, 
    sendAnswer, 
    sendIceCandidate, 
    reportQuality 
  } = useCallStore();

  // 获取 ICE 服务器配置
  const getIceServers = useCallback(async () => {
    try {
      const response = await axios.get('/api/ice-servers');
      return response.data.iceServers;
    } catch (error) {
      console.error('获取 ICE 服务器配置失败:', error);
      // 使用默认的 STUN 服务器
      return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
    }
  }, []);

  // 创建 PeerConnection
  const createPeerConnection = useCallback(async () => {
    const iceServers = await getIceServers();
    
    const peerConnection = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10
    });

    // ICE 候选处理
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(callId, event.candidate, targetUserId);
      }
    };

    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log('连接状态:', peerConnection.connectionState);
      setIsConnected(peerConnection.connectionState === 'connected');
      
      if (peerConnection.connectionState === 'failed') {
        setError('连接失败，请重试');
      }
    };

    // ICE 连接状态变化
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE 连接状态:', peerConnection.iceConnectionState);
    };

    // 接收远程流
    peerConnection.ontrack = (event) => {
      console.log('收到远程流');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // 统计信息收集
    const collectStats = async () => {
      if (!peerConnection) return;

      try {
        const stats = await peerConnection.getStats();
        const qualityData: QualityData = {
          latency: 0,
          packetLoss: 0,
          bitrate: 0,
          resolution: '0x0',
          framerate: 0
        };

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            qualityData.latency = report.currentRoundTripTime * 1000 || 0;
          }
          
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            qualityData.bitrate = report.bytesReceived * 8 / 1000 || 0;
            qualityData.resolution = `${report.frameWidth}x${report.frameHeight}`;
            qualityData.framerate = report.framesPerSecond || 0;
          }
          
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            const packetsLost = report.packetsLost || 0;
            const packetsReceived = report.packetsReceived || 0;
            qualityData.packetLoss = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
          }
        });

        setQualityData(qualityData);
        
        // 上报质量数据
        reportQuality(callId, qualityData);
      } catch (error) {
        console.error('收集统计信息失败:', error);
      }
    };

    // 定期收集统计信息
    const statsInterval = setInterval(collectStats, 5000);

    peerConnectionRef.current = peerConnection;
    
    return () => {
      clearInterval(statsInterval);
    };
  }, [callId, targetUserId, sendIceCandidate, sendOffer, sendAnswer, getIceServers]);

  // 获取本地媒体流
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 添加轨道到 PeerConnection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('获取媒体流失败:', error);
      setError('无法访问摄像头或麦克风');
      throw error;
    }
  }, [localVideoRef]);

  // 发起通话
  const initiateCall = useCallback(async () => {
    try {
      setError(null);
      
      // 创建 PeerConnection
      await createPeerConnection();
      
      // 获取本地流
      await getLocalStream();

      if (!peerConnectionRef.current) {
        throw new Error('PeerConnection 创建失败');
      }

      // 创建 Offer
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnectionRef.current.setLocalDescription(offer);
      
      // 发送 Offer
      sendOffer(callId, offer, targetUserId);
      
    } catch (error) {
      console.error('发起通话失败:', error);
      setError('发起通话失败');
    }
  }, [callId, targetUserId, createPeerConnection, getLocalStream, sendOffer]);

  // 处理收到的 Offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      setError(null);
      
      if (!peerConnectionRef.current) {
        await createPeerConnection();
        await getLocalStream();
      }

      if (!peerConnectionRef.current) {
        throw new Error('PeerConnection 创建失败');
      }

      await peerConnectionRef.current.setRemoteDescription(offer);
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      sendAnswer(callId, answer, targetUserId);
      
    } catch (error) {
      console.error('处理 Offer 失败:', error);
      setError('处理通话请求失败');
    }
  }, [callId, targetUserId, createPeerConnection, getLocalStream, sendAnswer]);

  // 处理收到的 Answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('PeerConnection 不存在');
      }

      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('处理 Answer 失败:', error);
      setError('处理通话响应失败');
    }
  }, []);

  // 处理 ICE 候选
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (!peerConnectionRef.current) {
        throw new Error('PeerConnection 不存在');
      }

      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('处理 ICE 候选失败:', error);
    }
  }, []);

  // 切换静音状态
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // 切换视频状态
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // 结束通话
  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsConnected(false);
    setQualityData(null);
    setError(null);
  }, []);

  // Socket 事件监听
  useEffect(() => {
    if (!socket) return;

    const handleWebRTCOffer = (data: { callId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.callId === callId) {
        handleOffer(data.offer);
      }
    };

    const handleWebRTCAnswer = (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
      if (data.callId === callId) {
        handleAnswer(data.answer);
      }
    };

    const handleWebRTCIceCandidate = (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      if (data.callId === callId) {
        handleIceCandidate(data.candidate);
      }
    };

    socket.on('webrtc:offer', handleWebRTCOffer);
    socket.on('webrtc:answer', handleWebRTCAnswer);
    socket.on('webrtc:ice-candidate', handleWebRTCIceCandidate);

    return () => {
      socket.off('webrtc:offer', handleWebRTCOffer);
      socket.off('webrtc:answer', handleWebRTCAnswer);
      socket.off('webrtc:ice-candidate', handleWebRTCIceCandidate);
    };
  }, [socket, callId, handleOffer, handleAnswer, handleIceCandidate]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    isConnected,
    isMuted,
    isVideoEnabled,
    qualityData,
    error,
    initiateCall,
    toggleMute,
    toggleVideo,
    endCall,
    setError
  };
};
