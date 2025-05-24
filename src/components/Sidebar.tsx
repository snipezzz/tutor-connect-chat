import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  X
} from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  userRole: 'admin' | 'teacher' | 'student';
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, currentView, onViewChange }) => {
  const getNavigationItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (userRole === 'teacher' || userRole === 'student') {
      items.push(
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'calendar', label: 'Kalender', icon: Calendar },
        { id: 'assignments', label: 'Aufgaben', icon: FileText }
      );
    }

    if (userRole === 'teacher') {
      items.push({ id: 'students', label: 'Meine Schüler', icon: Users });
    }

    if (userRole === 'student') {
      items.push({ id: 'teachers', label: 'Meine Lehrer', icon: Users });
    }

    if (userRole === 'admin') {
      items.push(
        { id: 'users', label: 'Benutzer', icon: Users },
        { id: 'settings', label: 'Einstellungen', icon: Settings }
      );
    }

    return items;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>
        <nav className="space-y-1">
          {getNavigationItems().map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentView === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="h-5 w-5 mr-2" />
                <span className="text-sm">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
