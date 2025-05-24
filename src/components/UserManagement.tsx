import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editUserData, setEditUserData] = useState<{
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
  }>({
    name: '',
    email: '',
    role: 'student' as 'student' | 'teacher' | 'admin'
  });
  
  const { signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(data || []);
    setTeachers(data?.filter(u => u.role === 'teacher') || []);
    setStudents(data?.filter(u => u.role === 'student') || []);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await signUp(
      newUser.email.trim(),
      newUser.password.trim(),
      newUser.name,
      newUser.role
    );

    if (error) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Benutzer erfolgreich erstellt!" });
    setShowCreateUser(false);
    setNewUser({ name: '', email: '', password: '', role: 'student' });
    setTimeout(() => loadUsers(), 1000);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht gelöscht werden.",
        variant: "destructive",
      });
      console.error('Error deleting user:', error);
      return;
    }

    toast({ title: "Benutzer erfolgreich gelöscht!" });
    loadUsers(); // Reload users after deletion
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setEditUserData({ name: user.name, email: user.email, role: user.role as 'student' | 'teacher' | 'admin' });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const allowedRoles = ['student', 'teacher', 'admin'];
    if (!allowedRoles.includes(editUserData.role)) {
       console.error('Invalid role selected:', editUserData.role);
       toast({
         title: "Fehler",
         description: "Ungültige Rolle ausgewählt.",
         variant: "destructive",
       });
       return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
         name: editUserData.name,
         email: editUserData.email,
         role: editUserData.role
      })
      .eq('id', editingUser.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
      console.error('Error updating user:', error);
      return;
    }

    toast({ title: "Benutzer erfolgreich aktualisiert!" });
    setShowEditUser(false);
    setEditingUser(null);
    loadUsers(); // Reload users after update
  };

  const handleAssignStudents = async () => {
    if (!selectedTeacher || selectedStudents.length === 0) return;

    const assignments = selectedStudents.map(studentId => ({
      teacher_id: selectedTeacher,
      student_id: studentId
    }));

    const { error } = await supabase
      .from('teacher_student_assignments')
      .upsert(assignments);

    if (error) {
      toast({
        title: "Fehler",
        description: "Zuweisung konnte nicht erstellt werden.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Schüler erfolgreich zugewiesen!" });
    setShowAssignDialog(false);
    setSelectedTeacher('');
    setSelectedStudents([]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Lehrer';
      case 'student': return 'Schüler';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h1>
        <div className="flex space-x-2">
          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Neuen Benutzer erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rolle</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Schüler</SelectItem>
                      <SelectItem value="teacher">Lehrer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Erstellen</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Schüler zuweisen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schüler zu Lehrer zuweisen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Lehrer auswählen</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
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
                  <Label>Schüler auswählen</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {students.map((student) => (
                      <label key={student.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <span>{student.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAssignStudents} className="w-full">
                  Zuweisen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Benutzer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lehrer</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schüler</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Benutzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-Mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rolle</Label>
                <Select value={editUserData.role} onValueChange={(value) => setEditUserData({...editUserData, role: value as 'student' | 'teacher' | 'admin'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Schüler</SelectItem>
                    <SelectItem value="teacher">Lehrer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Speichern</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Students Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">
            Schüler zu Lehrer zuweisen
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schüler zu Lehrer zuweisen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lehrer auswählen</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
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
              <Label>Schüler auswählen</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <span>{student.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleAssignStudents} className="w-full">
              Zuweisen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
