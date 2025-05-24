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
  // Keine hartcodierten Lehrer, Aufgaben oder Termine mehr
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
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ungelesene Nachrichten</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Aufgaben</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
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
          <div className="text-center text-gray-400 py-8">Noch keine Lehrer zugewiesen.</div>
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
            <div className="text-center text-gray-400 py-8">Keine Termine vorhanden.</div>
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
            <div className="text-center text-gray-400 py-8">Keine Aufgaben vorhanden.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
