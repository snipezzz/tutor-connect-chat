import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Appointment {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  teacher: { name: string };
  student: { name: string };
}

interface Teacher {
  id: string;
  name: string;
}

interface CalendarInterfaceProps {
  userRole: 'teacher' | 'student';
}

export const CalendarInterface: React.FC<CalendarInterfaceProps> = ({ userRole }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    teacher_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: ''
  });
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      loadAppointments();
      if (userRole === 'student') {
        loadTeachers();
      }
    }
  }, [profile, userRole]);

  const loadAppointments = async () => {
    if (!profile) return;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        teacher:profiles!appointments_teacher_id_fkey(name),
        student:profiles!appointments_student_id_fkey(name)
      `);

    if (userRole === 'teacher') {
      query = query.eq('teacher_id', profile.id);
    } else {
      query = query.eq('student_id', profile.id);
    }

    const { data, error } = await query.order('start_time');

    if (error) {
      console.error('Error loading appointments:', error);
      return;
    }

    setAppointments(data || []);
  };

  const loadTeachers = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('teacher_student_assignments')
      .select(`
        teacher:profiles!teacher_student_assignments_teacher_id_fkey(id, name)
      `)
      .eq('student_id', profile.id);

    if (error) {
      console.error('Error loading teachers:', error);
      return;
    }

    setTeachers(data?.map(item => item.teacher) || []);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const startDateTime = new Date(`${newAppointment.date}T${newAppointment.start_time}`);
    const endDateTime = new Date(`${newAppointment.date}T${newAppointment.end_time}`);

    const { error } = await supabase
      .from('appointments')
      .insert({
        teacher_id: newAppointment.teacher_id,
        student_id: profile.id,
        title: newAppointment.title,
        description: newAppointment.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'scheduled',
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Termin konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Termin erfolgreich gebucht!" });
    setShowCreateDialog(false);
    setNewAppointment({
      teacher_id: '',
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: ''
    });
    loadAppointments();
  };

  const getAppointmentsForDate = (selectedDate: Date) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return appointments.filter(apt => {
      const aptDate = format(new Date(apt.start_time), 'yyyy-MM-dd');
      return aptDate === dateStr;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {userRole === 'teacher' ? 'Meine Termine' : 'Termine buchen'}
        </h1>
        {userRole === 'student' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Neuen Termin buchen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Neuen Termin buchen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <Label htmlFor="teacher">Lehrer</Label>
                  <Select value={newAppointment.teacher_id} onValueChange={(value) => setNewAppointment({...newAppointment, teacher_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Lehrer wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={newAppointment.description}
                    onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Datum</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Von</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newAppointment.start_time}
                      onChange={(e) => setNewAppointment({...newAppointment, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Bis</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newAppointment.end_time}
                      onChange={(e) => setNewAppointment({...newAppointment, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Termin buchen</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kalender</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={de}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Termine für {date ? format(date, 'dd.MM.yyyy', { locale: de }) : 'Heute'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {date && getAppointmentsForDate(date).length > 0 ? (
                getAppointmentsForDate(date).map((appointment) => (
                  <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{appointment.title}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{appointment.description}</p>
                    <p className="text-xs text-gray-500">
                      {userRole === 'teacher' ? `Schüler: ${appointment.student.name}` : `Lehrer: ${appointment.teacher.name}`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Keine Termine für diesen Tag</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle kommenden Termine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appointments
              .filter(apt => new Date(apt.start_time) > new Date())
              .map((appointment) => (
                <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{appointment.title}</h4>
                      <p className="text-sm text-gray-600">{appointment.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {userRole === 'teacher' ? `Schüler: ${appointment.student.name}` : `Lehrer: ${appointment.teacher.name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(appointment.start_time), 'dd.MM.yyyy', { locale: de })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
