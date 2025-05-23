
import React from 'react';
import { Users, MessageCircle, Calendar, BookOpen, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: 'admin' | 'teacher' | 'student';
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const getMenuItems = () => {
    const commonItems = [
      { icon: MessageCircle, label: 'Chat', path: '/chat' },
    ];

    switch (userRole) {
      case 'admin':
        return [
          { icon: Users, label: 'Benutzerverwaltung', path: '/admin/users' },
          { icon: Settings, label: 'Einstellungen', path: '/admin/settings' },
          ...commonItems,
        ];
      case 'teacher':
        return [
          { icon: User, label: 'Meine Schüler', path: '/teacher/students' },
          { icon: Calendar, label: 'Termine', path: '/teacher/calendar' },
          { icon: BookOpen, label: 'Aufgaben', path: '/teacher/assignments' },
          ...commonItems,
        ];
      case 'student':
        return [
          { icon: User, label: 'Meine Lehrer', path: '/student/teachers' },
          { icon: Calendar, label: 'Termine buchen', path: '/student/booking' },
          { icon: BookOpen, label: 'Aufgaben', path: '/student/assignments' },
          ...commonItems,
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
          <a
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors",
              "border-l-4 border-transparent hover:border-blue-500"
            )}
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};
