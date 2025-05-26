import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

// Import necessary components only when profile and not loading
// import { AdminDashboard } from '@/components/AdminDashboard';
// import { TeacherDashboard } from '@/components/TeacherDashboard';
// import { StudentDashboard } from '@/components/StudentDashboard';
// import { ChatInterface } from '@/components/ChatInterface';
// import { UserManagement } from '@/components/UserManagement';
// import { CalendarInterface } from '@/components/CalendarInterface';
// import { AssignmentInterface } from '@/components/AssignmentInterface';
// import { SettingsInterface } from '@/components/SettingsInterface';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  // const [currentView, setCurrentView] = React.useState<CurrentView>('dashboard'); // Simplified view management for now

  console.log('Index component state:', { 
    user: !!user, 
    profile: profile ? { id: profile.id, name: profile.name, role: profile.role } : null, 
    loading 
  });

  // Immediate redirect if not loading and no user
  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, immediate redirect to auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Simplify rendering based on auth state
  if (loading) {
    console.log('Rendering loading state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  // useEffect handles !user redirect, so this block is technically redundant for rendering but kept for clarity
  if (!user) {
     console.log('Rendering null user state (should redirect via useEffect)...');
     return null; // Rely on useEffect for redirect
  }

  // If user exists but no profile, show profile loading/creation message
  if (!profile) {
    console.log('Rendering profile loading state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profil wird geladen oder erstellt...</p>
          <p className="text-xs text-gray-400 mt-2">Benutzer ID: {user.id}</p>
          {/* Optional: Button to reload if stuck */}
          {/* <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Seite neu laden
          </button> */}
        </div>
      </div>
    );
  }

  // If user and profile exist and not loading, render main app layout
  console.log('Rendering main app layout for user:', profile);
  
  // Simplified renderContent - assuming default dashboard for now
  const renderContent = () => {
      // We can add the switch logic back later if needed, for now just a placeholder
      return (
          <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Content Here</h2>
              <p className="text-gray-600">Dies ist der Hauptbereich Ihrer Anwendung.</p>
          </div>
      );
  };

  return (
    <Layout 
      userRole={profile.role as 'admin' | 'teacher' | 'student'} 
      currentUser={profile}
      // Simplify props for now
      currentView={'dashboard'} // Default view
      onViewChange={() => {}} // No view change functionality for now
    >
      {/* Render actual content later */}
      {/* {renderContent()} */}
      <div className="text-center py-12">
           <h2 className="text-xl font-semibold text-gray-900 mb-4">Hauptanwendung geladen</h2>
           <p className="text-gray-600">Wenn Sie dies sehen, ist der Auth-Flow erfolgreich.</p>
      </div>
    </Layout>
  );
};

export default Index;
