import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  currentUser: {
    name: string;
    email: string;
    role: string;
  };
}

export const TopBar: React.FC<TopBarProps> = ({ currentUser }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Lehrer';
      case 'student': return 'Schüler';
      default: return role;
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Willkommen, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">{getRoleLabel(currentUser.role)}</p>
        </div>
        <div className="flex items-center justify-between sm:space-x-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm hidden sm:inline">{currentUser.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">Abmelden</span>
          </button>
        </div>
      </div>
    </div>
  );
};
