
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AdminDashboard } from '@/components/AdminDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { StudentDashboard } from '@/components/StudentDashboard';
import { ChatInterface } from '@/components/ChatInterface';
import { UserManagement } from '@/components/UserManagement';
import { CalendarInterface } from '@/components/CalendarInterface';
import { AssignmentInterface } from '@/components/AssignmentInterface';
import { useAuth } from '@/hooks/useAuth';

type CurrentView = 'dashboard' | 'chat' | 'calendar' | 'assignments' | 'users';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = React.useState<CurrentView>('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        switch (profile.role) {
          case 'admin':
            return <AdminDashboard />;
          case 'teacher':
            return <TeacherDashboard />;
          case 'student':
            return <StudentDashboard />;
          default:
            return <div>Rolle nicht erkannt</div>;
        }
      case 'chat':
        if (profile.role === 'teacher' || profile.role === 'student') {
          return <ChatInterface userRole={profile.role} />;
        }
        return <div>Chat nicht verfügbar für diese Rolle</div>;
      case 'users':
        if (profile.role === 'admin') {
          return <UserManagement />;
        }
        return <div>Keine Berechtigung</div>;
      case 'calendar':
        if (profile.role === 'teacher' || profile.role === 'student') {
          return <CalendarInterface userRole={profile.role} />;
        }
        return <div>Kalender nicht verfügbar für diese Rolle</div>;
      case 'assignments':
        if (profile.role === 'teacher' || profile.role === 'student') {
          return <AssignmentInterface userRole={profile.role} />;
        }
        return <div>Aufgaben nicht verfügbar für diese Rolle</div>;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature in Entwicklung</h2>
            <p className="text-gray-600">Diese Funktion wird bald verfügbar sein.</p>
          </div>
        );
    }
  };

  return (
    <Layout 
      userRole={profile.role as 'admin' | 'teacher' | 'student'} 
      currentUser={profile}
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      {renderContent()}
    </Layout>
  );
};

export default Index;
