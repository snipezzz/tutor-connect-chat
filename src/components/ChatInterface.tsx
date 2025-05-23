
import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender: {
    name: string;
  };
}

interface Contact {
  id: string;
  name: string;
  role: string;
  unreadCount: number;
}

interface ChatInterfaceProps {
  userRole: 'teacher' | 'student';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userRole }) => {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      loadContacts();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages();
      markAsRead();
    }
  }, [selectedContact]);

  useEffect(() => {
    if (selectedContact) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${profile?.id}`,
          },
          (payload) => {
            if (payload.new.sender_id === selectedContact) {
              loadMessages();
            }
            loadContacts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedContact, profile?.id]);

  const loadContacts = async () => {
    if (!profile) return;

    let query = supabase
      .from('teacher_student_assignments')
      .select(`
        teacher_id,
        student_id,
        teacher:profiles!teacher_student_assignments_teacher_id_fkey(id, name, role),
        student:profiles!teacher_student_assignments_student_id_fkey(id, name, role)
      `);

    if (userRole === 'teacher') {
      query = query.eq('teacher_id', profile.id);
    } else {
      query = query.eq('student_id', profile.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading contacts:', error);
      return;
    }

    const contactList = data?.map((assignment: any) => {
      const contact = userRole === 'teacher' ? assignment.student : assignment.teacher;
      return {
        id: contact.id,
        name: contact.name,
        role: contact.role,
        unreadCount: 0,
      };
    }) || [];

    for (let contact of contactList) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', contact.id)
        .eq('receiver_id', profile.id)
        .is('read_at', null);
      
      contact.unreadCount = count || 0;
    }

    setContacts(contactList);
  };

  const loadMessages = async () => {
    if (!profile || !selectedContact) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(name)
      `)
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedContact}),and(sender_id.eq.${selectedContact},receiver_id.eq.${profile.id})`)
      .order('created_at');

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const markAsRead = async () => {
    if (!profile || !selectedContact) return;

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', selectedContact)
      .eq('receiver_id', profile.id)
      .is('read_at', null);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !profile || !selectedContact) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.id,
        receiver_id: selectedContact,
        content: messageText.trim(),
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
      return;
    }

    setMessageText('');
    loadMessages();
  };

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Kontakte Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            {userRole === 'teacher' ? 'Meine Schüler' : 'Meine Lehrer'}
          </h2>
        </div>
        <div className="overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedContact === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{contact.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{contact.role}</p>
                  </div>
                </div>
                {contact.unreadCount > 0 && (
                  <div className="h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {contacts.find(c => c.id === selectedContact)?.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {contacts.find(c => c.id === selectedContact)?.name}
                  </h3>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      message.sender_id === profile?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender_id === profile?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="outline" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="h-12 w-12 text-gray-400 mx-auto mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Wählen Sie einen Kontakt</h3>
              <p className="text-gray-500">Klicken Sie auf einen Kontakt, um eine Unterhaltung zu beginnen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
