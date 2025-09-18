import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface User {
  userId: string;
  username: string;
  socketId: string;
}

interface Call {
  id: string;
  caller: User;
  callee: User;
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  startTime: Date;
  connectTime?: Date;
  endTime?: Date;
  type: 'video' | 'audio';
}

interface CallState {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: User[];
  currentCall: Call | null;
  callHistory: any[];
  isLoading: boolean;
  error: string | null;
  
  // Socket 相关
  connectSocket: (userId: string, username: string) => void;
  disconnectSocket: () => void;
  
  // 通话相关
  initiateCall: (targetUserId: string, callType?: 'video' | 'audio') => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  endCall: (callId: string) => void;
  
  // WebRTC 信令
  sendOffer: (callId: string, offer: RTCSessionDescriptionInit, targetUserId: string) => void;
  sendAnswer: (callId: string, answer: RTCSessionDescriptionInit, targetUserId: string) => void;
  sendIceCandidate: (callId: string, candidate: RTCIceCandidateInit, targetUserId: string) => void;
  
  // 质量监控
  reportQuality: (callId: string, qualityData: any) => void;
  
  // 状态管理
  setCurrentCall: (call: Call | null) => void;
  setActiveUsers: (users: User[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  socket: null,
  isConnected: false,
  activeUsers: [],
  currentCall: null,
  callHistory: [],
  isLoading: false,
  error: null,

  connectSocket: (userId: string, username: string) => {
    const socket = io('/', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket 连接成功');
      set({ isConnected: true });
      
      // 加入用户
      socket.emit('user:join', { userId, username });
    });

    socket.on('disconnect', () => {
      console.log('Socket 连接断开');
      set({ isConnected: false });
    });

    // 在线用户列表更新
    socket.on('users:online', (users: User[]) => {
      set({ activeUsers: users });
    });

    // 通话相关事件
    socket.on('call:incoming', (data: { callId: string; caller: User; callType: string }) => {
      const call: Call = {
        id: data.callId,
        caller: data.caller,
        callee: { userId, username, socketId: socket.id || '' },
        status: 'ringing',
        startTime: new Date(),
        type: data.callType as 'video' | 'audio'
      };
      set({ currentCall: call });
    });

    socket.on('call:initiated', (data: { callId: string }) => {
      console.log('通话发起成功:', data.callId);
    });

    socket.on('call:accepted', (data: { callId: string }) => {
      const { currentCall } = get();
      if (currentCall && currentCall.id === data.callId) {
        set({
          currentCall: {
            ...currentCall,
            status: 'connected',
            connectTime: new Date()
          }
        });
      }
    });

    socket.on('call:rejected', (data: { callId: string }) => {
      const { currentCall } = get();
      if (currentCall && currentCall.id === data.callId) {
        set({
          currentCall: {
            ...currentCall,
            status: 'rejected',
            endTime: new Date()
          }
        });
      }
    });

    socket.on('call:ended', (data: { callId: string }) => {
      const { currentCall } = get();
      if (currentCall && currentCall.id === data.callId) {
        set({
          currentCall: {
            ...currentCall,
            status: 'ended',
            endTime: new Date()
          }
        });
      }
    });

    socket.on('call:error', (data: { message: string }) => {
      set({ error: data.message });
    });

    // WebRTC 信令事件
    socket.on('webrtc:offer', (data: { callId: string; offer: RTCSessionDescriptionInit }) => {
      // 这里需要与 WebRTC 管理器集成
      console.log('收到 Offer:', data);
    });

    socket.on('webrtc:answer', (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
      // 这里需要与 WebRTC 管理器集成
      console.log('收到 Answer:', data);
    });

    socket.on('webrtc:ice-candidate', (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      // 这里需要与 WebRTC 管理器集成
      console.log('收到 ICE Candidate:', data);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  initiateCall: (targetUserId: string, callType: 'video' | 'audio' = 'video') => {
    const { socket } = get();
    if (socket) {
      socket.emit('call:initiate', { targetUserId, callType });
    }
  },

  acceptCall: (callId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('call:accept', { callId });
    }
  },

  rejectCall: (callId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('call:reject', { callId });
    }
  },

  endCall: (callId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('call:end', { callId });
    }
  },

  sendOffer: (callId: string, offer: RTCSessionDescriptionInit, targetUserId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('webrtc:offer', { callId, offer, targetUserId });
    }
  },

  sendAnswer: (callId: string, answer: RTCSessionDescriptionInit, targetUserId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('webrtc:answer', { callId, answer, targetUserId });
    }
  },

  sendIceCandidate: (callId: string, candidate: RTCIceCandidateInit, targetUserId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('webrtc:ice-candidate', { callId, candidate, targetUserId });
    }
  },

  reportQuality: (callId: string, qualityData: any) => {
    const { socket } = get();
    if (socket) {
      socket.emit('call:quality-report', { callId, qualityData });
    }
  },

  setCurrentCall: (call: Call | null) => {
    set({ currentCall: call });
  },

  setActiveUsers: (users: User[]) => {
    set({ activeUsers: users });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
