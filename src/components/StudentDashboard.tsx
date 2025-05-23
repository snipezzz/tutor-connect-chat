
import React, { useState } from 'react';
import { Users, MessageCircle, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string;
  isOnline: boolean;
  unreadMessages: number;
}

export const StudentDashboard: React.FC = () => {
  const [teachers] = useState<Teacher[]>([
    { id: '1', name: 'Arif Mustafa', subject: 'Mathematik & Physik', email: 'arif@nachhilfe.de', isOnline: true, unreadMessages: 1 },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schüler Dashboard</h1>
        <p className="text-gray-600">Ihre Lehrer und Aufgaben im Überblick</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meine Lehrer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ungelesene Nachrichten</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.reduce((acc, t) => acc + t.unreadMessages, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Aufgaben</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Meine Lehrer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">{teacher.name.charAt(0)}</span>
                    </div>
                    {teacher.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.subject}</p>
                    <p className="text-xs text-gray-400">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {teacher.unreadMessages > 0 && (
                    <Badge className="bg-red-100 text-red-800">
                      {teacher.unreadMessages} neue Nachricht
                    </Badge>
                  )}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Termin buchen
                    </Button>
                  </div>
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
                  <p className="font-medium">Mathematik - Arif Mustafa</p>
                  <p className="text-sm text-gray-600">Heute, 15:00 - 16:00</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">In 30 Min</Badge>
              </div>
              <div className="text-center py-4 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine weiteren Termine heute</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Offene Aufgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">Quadratische Gleichungen</p>
                  <Badge className="bg-orange-100 text-orange-800">Fällig in 2 Tagen</Badge>
                </div>
                <p className="text-sm text-gray-600">Von: Arif Mustafa</p>
                <p className="text-xs text-gray-400">Zugewiesen: 22.05.2024</p>
              </div>
              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">Mechanik Übungen</p>
                  <Badge className="bg-red-100 text-red-800">Überfällig</Badge>
                </div>
                <p className="text-sm text-gray-600">Von: Arif Mustafa</p>
                <p className="text-xs text-gray-400">Zugewiesen: 20.05.2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
