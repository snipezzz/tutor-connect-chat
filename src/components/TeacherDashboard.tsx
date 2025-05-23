
import React, { useState } from 'react';
import { Users, MessageCircle, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  name: string;
  email: string;
  lastActive: string;
  unreadMessages: number;
}

export const TeacherDashboard: React.FC = () => {
  const [students] = useState<Student[]>([
    { id: '1', name: 'Nico Schmidt', email: 'nico@student.de', lastActive: '2024-05-23 14:30', unreadMessages: 2 },
    { id: '2', name: 'Fabian Weber', email: 'fabian@student.de', lastActive: '2024-05-23 12:15', unreadMessages: 0 },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lehrer Dashboard</h1>
        <p className="text-gray-600">Übersicht über Ihre Schüler und Aktivitäten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meine Schüler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ungelesene Nachrichten</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.reduce((acc, s) => acc + s.unreadMessages, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heutige Termine</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Meine Schüler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-lg">{student.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    <p className="text-xs text-gray-400">Zuletzt aktiv: {student.lastActive}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {student.unreadMessages > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      {student.unreadMessages} neue Nachrichten
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Kommende Termine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Mathematik - Nico Schmidt</p>
                  <p className="text-sm text-gray-600">Heute, 15:00 - 16:00</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">In 30 Min</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Physik - Fabian Weber</p>
                  <p className="text-sm text-gray-600">Heute, 17:00 - 18:00</p>
                </div>
                <Badge className="bg-gray-100 text-gray-800">In 2h 30min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Letzte Aufgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="font-medium">Quadratische Gleichungen</p>
                <p className="text-sm text-gray-600">Zugewiesen an: Nico Schmidt</p>
                <p className="text-xs text-gray-400">Erstellt: 22.05.2024</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="font-medium">Mechanik Grundlagen</p>
                <p className="text-sm text-gray-600">Zugewiesen an: Fabian Weber</p>
                <p className="text-xs text-gray-400">Erstellt: 21.05.2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
