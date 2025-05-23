
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
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Willkommen, {currentUser.name}
          </h2>
          <p className="text-sm text-gray-500">{getRoleLabel(currentUser.role)}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-5 w-5" />
            <span className="text-sm">{currentUser.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Abmelden</span>
          </button>
        </div>
      </div>
    </div>
  );
};
