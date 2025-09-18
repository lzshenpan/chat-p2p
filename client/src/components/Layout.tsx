import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, verifyToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useCallStore();

  useEffect(() => {
    // 验证 token
    verifyToken();
  }, [verifyToken]);

  useEffect(() => {
    // 连接 Socket
    if (user) {
      connectSocket(user.id, user.username);
    }

    return () => {
      disconnectSocket();
    };
  }, [user, connectSocket, disconnectSocket]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
