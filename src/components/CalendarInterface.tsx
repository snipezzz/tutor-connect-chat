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
  const [availableSlots, setAvailableSlots] = useState<{start: Date, end: Date}[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);
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

  const isTeacher = userRole === 'teacher';

  const handleCancelAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Termin konnte nicht storniert werden.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Termin erfolgreich storniert!" });
    loadAppointments();
  };

  const checkOverlappingAppointments = async (startTime: Date, endTime: Date) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`);

    if (error) {
      console.error('Error checking overlapping appointments:', error);
      return true;
    }

    return (data?.length || 0) > 0;
  };

  const getAvailableTimeSlots = (selectedDate: Date) => {
    const slots: {start: Date, end: Date}[] = [];
    const dayOfWeek = selectedDate.getDay();

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      for (let hour = 15; hour < 19; hour++) {
        slots.push({
          start: new Date(selectedDate.setHours(hour, 0, 0, 0)),
          end: new Date(selectedDate.setHours(hour + 1, 0, 0, 0))
        });
      }
    } else if (dayOfWeek === 6) {
      for (let hour = 10; hour < 15; hour++) {
        slots.push({
          start: new Date(selectedDate.setHours(hour, 0, 0, 0)),
          end: new Date(selectedDate.setHours(hour + 1, 0, 0, 0))
        });
      }
    }

    return slots;
  };

  const isTimeSlotBooked = (time: Date) => {
    return appointments.some(apt => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      return time >= aptStart && time < aptEnd;
    });
  };

  const isTimeSlotAvailable = (time: Date) => {
    const slots = getAvailableTimeSlots(new Date(date));
    return slots.some(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      return time >= slotStart && time < slotEnd;
    });
  };

  const getTimeSlotStatus = (time: Date) => {
    if (isTimeSlotBooked(time)) return 'booked';
    if (isTimeSlotAvailable(time)) return 'available';
    return 'unavailable';
  };

  useEffect(() => {
    if (profile) {
      loadAppointments();
      if (!isTeacher) {
        loadTeachers();
      }
    }
  }, [profile, userRole, isTeacher]);

  useEffect(() => {
    if (date) {
      const slots = getAvailableTimeSlots(new Date(date));
      setAvailableSlots(slots);
    }
  }, [date]);

  const loadAppointments = async () => {
    if (!profile) return;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        teacher:profiles!appointments_teacher_id_fkey(name),
        student:profiles!appointments_student_id_fkey(name)
      `);

    if (isTeacher) {
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

    if (!isTeacher) {
      const dayOfWeek = startDateTime.getDay();
      const startHour = startDateTime.getHours();
      const startMinutes = startDateTime.getMinutes();
      const endHour = endDateTime.getHours();
      const endMinutes = endDateTime.getMinutes();

      let isValidTime = false;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const isStartTimeValid = (startHour > 15 || (startHour === 15 && startMinutes >= 0)) && (startHour < 19);
        const isEndTimeValid = (endHour > 15 || (endHour === 15 && endMinutes > 0)) && (endHour < 19 || (endHour === 19 && endMinutes === 0));

        if (isStartTimeValid && isEndTimeValid && startDateTime < endDateTime) {
          isValidTime = true;
        }
      } else if (dayOfWeek === 6) {
        const isStartTimeValid = (startHour > 10 || (startHour === 10 && startMinutes >= 0)) && (startHour < 15);
        const isEndTimeValid = (endHour > 10 || (endHour === 10 && endMinutes > 0)) && (endHour < 15 || (endHour === 15 && endMinutes === 0));

        if (isStartTimeValid && isEndTimeValid && startDateTime < endDateTime) {
          isValidTime = true;
        }
      }

      if (!isValidTime) {
        toast({
          title: "Fehler",
          description: "Terminbuchung nur innerhalb der Öffnungszeiten möglich (Mo-Fr 15:00-19:00 Uhr, Sa 10:00-15:00 Uhr) und Endzeit muss nach Startzeit liegen.",
          variant: "destructive",
        });
        return;
      }

      const hasOverlap = await checkOverlappingAppointments(startDateTime, endDateTime);
      if (hasOverlap) {
        toast({
          title: "Fehler",
          description: "Dieser Zeitraum ist bereits belegt. Bitte wählen Sie einen anderen Zeitraum.",
          variant: "destructive",
        });
        return;
      }

      if (!newAppointment.teacher_id) {
        toast({
          title: "Fehler",
          description: "Bitte wählen Sie einen Lehrer aus.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from('appointments')
      .insert({
        teacher_id: newAppointment.teacher_id,
        student_id: profile.id,
        title: isTeacher ? newAppointment.title : 'Anmeldung zur Nachhilfe',
        description: newAppointment.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'scheduled',
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Termin konnte nicht erstellt werden." + error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: isTeacher ? "Termin erfolgreich gebucht!" : "Erfolgreich eingetragen!" });
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
                Zur Nachhilfe eintragen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Zur Nachhilfe eintragen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
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
                    <Select
                      value={newAppointment.start_time}
                      onValueChange={(value) => setNewAppointment({...newAppointment, start_time: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Zeit wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot, index) => (
                          <SelectItem key={index} value={format(slot.start, 'HH:mm')}>
                            {format(slot.start, 'HH:mm')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end_time">Bis</Label>
                    <Select
                      value={newAppointment.end_time}
                      onValueChange={(value) => setNewAppointment({...newAppointment, end_time: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Zeit wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot, index) => (
                          <SelectItem key={index} value={format(slot.end, 'HH:mm')}>
                            {format(slot.end, 'HH:mm')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="teacher">Lehrer</Label>
                  <Select 
                    value={newAppointment.teacher_id} 
                    onValueChange={(value) => setNewAppointment({...newAppointment, teacher_id: value})}
                    required
                  >
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
                  <Label htmlFor="description">Beschreibung (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newAppointment.description}
                    onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full">Eintragen</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        {userRole === 'teacher' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Neuen Termin erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Neuen Termin erstellen</DialogTitle>
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
                    required
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
                <Button type="submit" className="w-full">Termin erstellen</Button>
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
            {date && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {availableSlots.map((slot, index) => {
                    const status = getTimeSlotStatus(slot.start);
                    const isBooked = status === 'booked';
                    const isAvailable = status === 'available';
                    
                    return (
                      <div
                        key={index}
                        className={`
                          p-3 rounded-lg border transition-colors
                          ${isBooked ? 'bg-red-50 border-red-200' : ''}
                          ${isAvailable ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer' : ''}
                          ${!isBooked && !isAvailable ? 'bg-gray-50 border-gray-200' : ''}
                        `}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedSlot(slot);
                            setNewAppointment({
                              ...newAppointment,
                              date: format(date, 'yyyy-MM-dd'),
                              start_time: format(slot.start, 'HH:mm'),
                              end_time: format(slot.end, 'HH:mm')
                            });
                            setShowCreateDialog(true);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {format(slot.start, 'HH:mm')} - {format(slot.end, 'HH:mm')}
                            </span>
                            {isBooked && (
                              <span className="ml-2 text-sm text-red-600">
                                (Belegt)
                              </span>
                            )}
                          </div>
                          {isAvailable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-100"
                            >
                              Buchen
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Heutige Termine</h3>
                  <div className="space-y-3">
                    {getAppointmentsForDate(date).length > 0 ? (
                      getAppointmentsForDate(date).map((appointment) => (
                        <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            {userRole === 'student' ? (
                              <h4 className="font-medium">Anmeldung</h4>
                            ) : (
                              <h4 className="font-medium">{appointment.title}</h4>
                            )}
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {format(new Date(appointment.start_time), 'HH:mm', { locale: de })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: de })}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                Stornieren
                              </Button>
                            </div>
                          </div>
                          {userRole === 'student' ? (
                            appointment.description && <p className="text-sm text-gray-600 mb-1">{appointment.description}</p>
                          ) : (
                            <p className="text-sm text-gray-600 mb-1">{appointment.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {userRole === 'teacher' ? `Schüler: ${appointment.student.name}` : `Lehrer: ${appointment.teacher.name}`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Keine Termine für diesen Tag</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                      {userRole === 'student' ? (
                        <h4 className="font-medium">Anmeldung am {format(new Date(appointment.start_time), 'dd.MM.yyyy', { locale: de })}</h4>
                      ) : (
                        <h4 className="font-medium">{appointment.title}</h4>
                      )}
                      <p className="text-sm text-gray-600">{appointment.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {userRole === 'teacher' ? `Schüler: ${appointment.student.name}` : `Lehrer: ${appointment.teacher.name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                      </p>
                      {userRole === 'teacher' && (
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.start_time), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      )}
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
