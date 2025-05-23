
import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'teacher' | 'student';
  currentUser: {
    name: string;
    email: string;
    role: string;
  };
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole, currentUser }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <TopBar currentUser={currentUser} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
