
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

type CurrentView = 'dashboard' | 'chat' | 'calendar' | 'assignments' | 'users' | 'students' | 'teachers' | 'settings';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = React.useState<CurrentView>('dashboard');

  console.log('Index component state:', { 
    user: !!user, 
    profile: profile ? { id: profile.id, name: profile.name, role: profile.role } : null, 
    loading, 
    currentView 
  });

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleViewChange = (view: string) => {
    console.log('Changing view to:', view);
    setCurrentView(view as CurrentView);
  };

  if (loading) {
    console.log('Still loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, should redirect');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Keine Berechtigung. Weiterleitung...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    console.log('User exists but no profile found - this should not happen anymore');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profil wird erstellt...</p>
          <p className="text-xs text-gray-400 mt-2">Benutzer ID: {user.id}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering main app for user:', profile);

  const renderContent = () => {
    console.log('Rendering content for view:', currentView, 'role:', profile.role);
    
    try {
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
              return <div>Rolle nicht erkannt: {profile.role}</div>;
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
        case 'students':
          if (profile.role === 'teacher') {
            return <div>Meine Schüler - Feature in Entwicklung</div>;
          }
          return <div>Keine Berechtigung</div>;
        case 'teachers':
          if (profile.role === 'student') {
            return <div>Meine Lehrer - Feature in Entwicklung</div>;
          }
          return <div>Keine Berechtigung</div>;
        case 'settings':
          if (profile.role === 'admin') {
            return <div>Einstellungen - Feature in Entwicklung</div>;
          }
          return <div>Keine Berechtigung</div>;
        default:
          return (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature in Entwicklung</h2>
              <p className="text-gray-600">Diese Funktion wird bald verfügbar sein.</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Fehler beim Laden</h2>
          <p className="text-gray-600">Es gab einen Fehler beim Laden des Inhalts.</p>
          <p className="text-xs text-gray-400 mt-2">Fehler: {String(error)}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Seite neu laden
          </button>
        </div>
      );
    }
  };

  return (
    <Layout 
      userRole={profile.role as 'admin' | 'teacher' | 'student'} 
      currentUser={profile}
      currentView={currentView}
      onViewChange={handleViewChange}
    >
      {renderContent()}
    </Layout>
  );
};

export default Index;
