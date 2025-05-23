
import React from 'react';
import { Users, MessageCircle, Calendar, BookOpen, Settings, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: 'admin' | 'teacher' | 'student';
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, currentView, onViewChange }) => {
  const getMenuItems = () => {
    const commonItems = [
      { icon: Home, label: 'Dashboard', view: 'dashboard' },
      { icon: MessageCircle, label: 'Chat', view: 'chat' },
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...commonItems,
          { icon: Users, label: 'Benutzerverwaltung', view: 'users' },
          { icon: Settings, label: 'Einstellungen', view: 'settings' },
        ];
      case 'teacher':
        return [
          ...commonItems,
          { icon: User, label: 'Meine Schüler', view: 'students' },
          { icon: Calendar, label: 'Termine', view: 'calendar' },
          { icon: BookOpen, label: 'Aufgaben', view: 'assignments' },
        ];
      case 'student':
        return [
          ...commonItems,
          { icon: User, label: 'Meine Lehrer', view: 'teachers' },
          { icon: Calendar, label: 'Termine buchen', view: 'calendar' },
          { icon: BookOpen, label: 'Aufgaben', view: 'assignments' },
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Online Nachhilfe</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={cn(
              "w-full flex items-center px-6 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors",
              "border-l-4 border-transparent hover:border-blue-500",
              currentView === item.view && "bg-blue-50 text-blue-600 border-l-blue-500"
            )}
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
