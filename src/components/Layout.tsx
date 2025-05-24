import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'teacher' | 'student';
  currentUser: any;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  userRole, 
  currentUser,
  currentView,
  onViewChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar currentUser={currentUser} />
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Menu className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        lg:hidden fixed inset-y-0 left-0 transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out z-50
      `}>
        <div className="h-full w-64 bg-white shadow-lg">
          <Sidebar 
            userRole={userRole} 
            currentView={currentView}
            onViewChange={(view) => {
              onViewChange(view);
              setIsMobileMenuOpen(false);
            }}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 h-screen sticky top-0">
          <Sidebar 
            userRole={userRole} 
            currentView={currentView}
            onViewChange={onViewChange}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
