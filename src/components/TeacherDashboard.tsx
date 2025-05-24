import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

interface Student {
  id: string;
  name: string;
  email: string;
  lastActive?: string; // optional, da wir es hier nicht direkt verwenden
  unreadMessages?: number; // optional
}

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  student: {
    name: string;
  };
}

export const TeacherDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      const loadStudents = async () => {
        setLoadingStudents(true);
        const { data, error } = await supabase
          .from('teacher_student_assignments')
          .select(`
            student_id,
            student:profiles!teacher_student_assignments_student_id_fkey(id, name, email)
          `)
          .eq('teacher_id', profile.id);

        if (error) {
          console.error('Error loading students:', error);
          setStudents([]);
        } else {
          const studentList = data?.map(assignment => assignment.student) || [];
          setStudents(studentList);
        }
        setLoadingStudents(false);
      };
      loadStudents();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      const loadAppointments = async () => {
        setLoadingAppointments(true);
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,\
            student:profiles!appointments_student_id_fkey(name)\
          `)
          .eq('teacher_id', profile.id) // Filter nach Terminen, die diesem Lehrer zugeordnet sind (auch wenn teacher_id null ist, könnte man hier anders filtern, je nach finaler Logik)
          .order('start_time');

        if (error) {
          console.error('Error loading appointments:', error);
          setAppointments([]);
        } else {
          // Filtern nach heutigen Terminen
          const todayAppointments = data?.filter(apt => isToday(new Date(apt.start_time))) || [];
          setAppointments(todayAppointments as Appointment[]);
        }
        setLoadingAppointments(false);
      };
      loadAppointments();
    }
  }, [profile?.id]);

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
            <div className="text-2xl font-bold">{loadingStudents ? '-' : students.length}</div>
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
            <CardTitle className="text-sm font-medium">Heutige Termine</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingAppointments ? '-' : appointments.length}</div>
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
          {loadingStudents ? (
            <div className="text-center text-gray-400 py-8">Schüler werden geladen...</div>
          ) : students.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Noch keine Schüler zugewiesen.</div>
          ) : (
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Heutige Termine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAppointments ? (
              <div className="text-center text-gray-400 py-8">Termine werden geladen...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Keine Termine für heute vorhanden.</div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium">{appointment.student.name}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(appointment.start_time), 'HH:mm', { locale: de })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: de })}
                      </span>
                    </div>
                    {appointment.title !== 'Anmeldung zur Nachhilfe' && (
                      <p className="text-sm text-gray-600">{appointment.title}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            <div className="text-center text-gray-400 py-8">Keine Aufgaben vorhanden.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
