import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { Layout } from '@/components/Layout'; // Remove Layout import for isolation
import { useAuth } from '@/hooks/useAuth';

// Keep imports for types if needed elsewhere, but avoid using components
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

  console.log('Index component state:', { 
    user: !!user, 
    profile: profile ? { id: profile.id, name: profile.name, role: profile.role } : null, 
    loading 
  });

  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, immediate redirect to auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Simplify rendering to only use native HTML elements
  if (loading) {
    console.log('Rendering simplified loading state...');
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <p style={{ fontSize: '1.5rem', color: '#4b5563' }}>Lädt...</p>
      </div>
    );
  }

  if (!user) {
     console.log('Rendering null user state (should redirect via useEffect)...');
     return null; // Rely on useEffect for redirect
  }

  if (!profile) {
    console.log('Rendering simplified profile loading state...');
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <p style={{ fontSize: '1.5rem', color: '#4b5563' }}>Profil wird geladen oder erstellt...</p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Benutzer ID: {user?.id}</p>
      </div>
    );
  }

  // If user and profile exist and not loading, render a simple success message
  console.log('Rendering simplified success state...');
  
  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#d1fae5' }}>
         <p style={{ fontSize: '1.5rem', color: '#065f46' }}>Hauptanwendung geladen (vereinfacht)</p>
         <p style={{ fontSize: '0.875rem', color: '#065f46', marginTop: '0.5rem' }}>Benutzerrolle: {profile.role}</p>
    </div>
  );
};

export default Index;
