
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordChangeForm } from './PasswordChangeForm';
import { useAuth } from '@/hooks/useAuth';

export const SettingsInterface: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-gray-600">Verwalten Sie Ihre Kontoeinstellungen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontoinformationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-gray-900">{profile?.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">E-Mail:</span>
                  <p className="text-gray-900">{profile?.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Rolle:</span>
                  <p className="text-gray-900">
                    {profile?.role === 'admin' ? 'Administrator' : 
                     profile?.role === 'teacher' ? 'Lehrer' : 'Schüler'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
};
