
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AdminDashboard } from '@/components/AdminDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { StudentDashboard } from '@/components/StudentDashboard';
import { ChatInterface } from '@/components/ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type UserRole = 'admin' | 'teacher' | 'student';
type CurrentView = 'dashboard' | 'chat' | 'calendar' | 'assignments' | 'users';

interface User {
  name: string;
  email: string;
  role: UserRole;
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');
  const [loginEmail, setLoginEmail] = useState('');

  // Demo Accounts
  const demoAccounts = [
    { email: 'admin@nachhilfe.de', name: 'Admin User', role: 'admin' as UserRole },
    { email: 'arif@nachhilfe.de', name: 'Arif Mustafa', role: 'teacher' as UserRole },
    { email: 'nico@student.de', name: 'Nico Schmidt', role: 'student' as UserRole },
    { email: 'fabian@student.de', name: 'Fabian Weber', role: 'student' as UserRole },
  ];

  const handleLogin = () => {
    const user = demoAccounts.find(account => account.email === loginEmail);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setCurrentView('dashboard');
    } else {
      alert('Benutzer nicht gefunden. Verwenden Sie eine der Demo-E-Mail-Adressen.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginEmail('');
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'dashboard':
        switch (currentUser.role) {
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
        if (currentUser.role === 'teacher' || currentUser.role === 'student') {
          return <ChatInterface userRole={currentUser.role} />;
        }
        return <div>Chat nicht verfügbar für diese Rolle</div>;
      case 'users':
        if (currentUser.role === 'admin') {
          return <AdminDashboard />;
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
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">Online Nachhilfe</CardTitle>
            <p className="text-gray-600">Anmelden für den Demo-Zugang</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="E-Mail-Adresse eingeben"
              />
            </div>
            
            <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700">
              Anmelden
            </Button>

            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-gray-700">Demo-Accounts:</p>
              {demoAccounts.map((account) => (
                <div
                  key={account.email}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setLoginEmail(account.email)}
                >
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{account.role}</p>
                  </div>
                  <p className="text-xs text-blue-600">{account.email}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Für vollständige Funktionalität (Echtzeit-Chat, Datenspeicherung) 
                ist eine Supabase-Integration erforderlich.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Layout 
      userRole={currentUser.role} 
      currentUser={currentUser}
    >
      {renderContent()}
    </Layout>
  );
};

export default Index;
