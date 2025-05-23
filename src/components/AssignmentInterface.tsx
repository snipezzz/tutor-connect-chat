
import React, { useState, useEffect } from 'react';
import { FileUp, Download, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Assignment {
  id: string;
  title: string;
  description: string;
  file_url: string;
  due_date: string;
  status: string;
  created_at: string;
  teacher: { name: string };
  student: { name: string };
}

interface Student {
  id: string;
  name: string;
}

interface AssignmentInterfaceProps {
  userRole: 'teacher' | 'student';
}

export const AssignmentInterface: React.FC<AssignmentInterfaceProps> = ({ userRole }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    student_id: '',
    title: '',
    description: '',
    due_date: '',
    file: null as File | null
  });
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      loadAssignments();
      if (userRole === 'teacher') {
        loadStudents();
      }
    }
  }, [profile, userRole]);

  const loadAssignments = async () => {
    if (!profile) return;

    let query = supabase
      .from('assignments')
      .select(`
        *,
        teacher:profiles!assignments_teacher_id_fkey(name),
        student:profiles!assignments_student_id_fkey(name)
      `);

    if (userRole === 'teacher') {
      query = query.eq('teacher_id', profile.id);
    } else {
      query = query.eq('student_id', profile.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading assignments:', error);
      return;
    }

    setAssignments(data || []);
  };

  const loadStudents = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('teacher_student_assignments')
      .select(`
        student:profiles!teacher_student_assignments_student_id_fkey(id, name)
      `)
      .eq('teacher_id', profile.id);

    if (error) {
      console.error('Error loading students:', error);
      return;
    }

    setStudents(data?.map(item => item.student) || []);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    let fileUrl = '';
    
    if (newAssignment.file) {
      const fileExt = newAssignment.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, newAssignment.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Fehler",
          description: "Datei konnte nicht hochgeladen werden.",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrl;
    }

    const { error } = await supabase
      .from('assignments')
      .insert({
        teacher_id: profile.id,
        student_id: newAssignment.student_id,
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.due_date ? new Date(newAssignment.due_date).toISOString() : null,
        file_url: fileUrl,
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Aufgabe erfolgreich erstellt!" });
    setShowCreateDialog(false);
    setNewAssignment({
      student_id: '',
      title: '',
      description: '',
      due_date: '',
      file: null
    });
    loadAssignments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen';
      case 'in_progress': return 'In Bearbeitung';
      case 'overdue': return 'Überfällig';
      default: return 'Ausstehend';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {userRole === 'teacher' ? 'Aufgaben verwalten' : 'Meine Aufgaben'}
        </h1>
        {userRole === 'teacher' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileUp className="h-4 w-4 mr-2" />
                Neue Aufgabe erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <Label htmlFor="student">Schüler</Label>
                  <Select value={newAssignment.student_id} onValueChange={(value) => setNewAssignment({...newAssignment, student_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Schüler wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Fälligkeitsdatum</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="file">Datei anhängen</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setNewAssignment({...newAssignment, file: e.target.files?.[0] || null})}
                  />
                </div>
                <Button type="submit" className="w-full">Aufgabe erstellen</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {userRole === 'teacher' ? `Schüler: ${assignment.student.name}` : `Lehrer: ${assignment.teacher.name}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(assignment.status)}>
                    {getStatusIcon(assignment.status)}
                    <span className="ml-1">{getStatusLabel(assignment.status)}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignment.description && (
                  <p className="text-gray-700">{assignment.description}</p>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Erstellt: {format(new Date(assignment.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                  {assignment.due_date && (
                    <span>Fällig: {format(new Date(assignment.due_date), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                  )}
                </div>

                {assignment.file_url && (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Datei herunterladen
                      </a>
                    </Button>
                  </div>
                )}

                {userRole === 'student' && assignment.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Als erledigt markieren
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userRole === 'teacher' ? 'Keine Aufgaben erstellt' : 'Keine Aufgaben vorhanden'}
              </h3>
              <p className="text-gray-500">
                {userRole === 'teacher' 
                  ? 'Erstellen Sie Ihre erste Aufgabe für Ihre Schüler.' 
                  : 'Sie haben noch keine Aufgaben von Ihren Lehrern erhalten.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
