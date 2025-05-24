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
  is_pending?: boolean;
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
  const [showSidebar, setShowSidebar] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  // Use a ref for the typing timer to avoid issues with effect dependencies
  const typingTimer = React.useRef<NodeJS.Timeout | null>(null);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher': return 'Lehrer';
      case 'student': return 'Schüler';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

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
    let channel: any;

    if (selectedContact && profile?.id) {
      const channelName = `chat_${[profile.id, selectedContact].sort().join('_')}`;

      channel = supabase
        .channel(channelName, { config: { presence: { key: profile.id } } })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id=eq.${selectedContact},receiver_id=eq.${profile?.id}), and(sender_id=eq.${profile?.id},receiver_id=eq.${selectedContact}))`,
          },
          (payload) => {
            const newMessage = payload.new as Message;

            // Only process messages relevant to the current chat
            if (
              (newMessage.sender_id === selectedContact && newMessage.receiver_id === profile?.id) ||
              (newMessage.sender_id === profile?.id && newMessage.receiver_id === selectedContact)
            ) {
              setMessages((prevMessages) => [...prevMessages, newMessage].slice());

              if (newMessage.receiver_id === profile?.id) {
                 markAsRead();
              }
            }
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const otherUserPresence = presenceState[selectedContact];

          // Check if the other user is present and their typing status
          const otherUserIsTyping = otherUserPresence && otherUserPresence.some((p: any) => p.typing === true);
          setIsOtherUserTyping(otherUserIsTyping);

        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
           // console.log('New users joined: ', newPresences);
        })
         .on('presence', { event: 'leave' }, ({ leftPresences }) => {
            // console.log('Users left: ', leftPresences);
            if(leftPresences.some((p: any) => p.key === selectedContact)){
              setIsOtherUserTyping(false);
            }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ typing: false });
          }
        });

      // Clean up the channel when the component unmounts or selectedContact changes
       return () => {
        if (channel) {
          console.log('Unsubscribing from channel:', channelName);
          channel.unsubscribe();
           supabase.removeChannel(channel);
        }
      };
    } else {
      // Clean up the channel if selectedContact becomes null
       return () => {
        if (channel) {
           console.log('Cleaning up channel when contact becomes null');
           channel.unsubscribe();
           supabase.removeChannel(channel);
        }
      };
    }

  }, [selectedContact, profile?.id]);

  const handleTypingStart = () => {
    if (!selectedContact || !profile?.id) return;
    // Clear any existing timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    // Send typing = true
     supabase.channel(`chat_${[profile.id, selectedContact].sort().join('_')}`).track({ typing: true });
  };

  const handleTypingEnd = () => {
    if (!selectedContact || !profile?.id) return;
    // Set a timer to send typing = false after a delay
    typingTimer.current = setTimeout(() => {
      supabase.channel(`chat_${[profile.id, selectedContact].sort().join('_')}`).track({ typing: false });
    }, 1000);
  };

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

    const newMessage: Message = {
       // Assign a temporary ID for optimistic update
       id: 'temp-' + Date.now(),
       content: messageText.trim(),
       sender_id: profile.id,
       receiver_id: selectedContact,
       created_at: new Date().toISOString(), // Use client-side time initially
       sender: { name: profile.name || 'You' },
       // Add a temporary flag to indicate this is an optimistic update
       is_pending: true,
    } as any; // Use 'any' for temporary properties not in the main Message interface

    // Optimistically add the new message to the state
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMessageText('');

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.id,
        receiver_id: selectedContact,
        content: newMessage.content,
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
       // Revert the optimistic update if sending failed
       setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newMessage.id));
      return;
    }

    // No need to track typing: false here, the real-time update will handle it
    // supabase.channel(`chat_${[profile?.id, selectedContact].sort().join('_')}`).track({ typing: false });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col sm:flex-row">
      {/* Mobile Sidebar Button */}
      <div className="sm:hidden flex-shrink-0 p-2 bg-white border-b border-gray-200">
        <Button onClick={() => setShowSidebar(true)} className="bg-blue-600 text-white w-full">
          Kontakte anzeigen
        </Button>
      </div>

      {/* Sidebar (Kontakte) */}
      <div
        className={
          `
          fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-200 ${showSidebar ? 'block' : 'hidden'} sm:hidden
          `
        }
        onClick={() => setShowSidebar(false)}
      />
      <div
        className={
          `
          fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-lg transform transition-transform duration-200
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          sm:static sm:translate-x-0 sm:w-80 sm:block sm:h-auto sm:shadow-none sm:z-0
          `
        }
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
            {userRole === 'teacher' ? 'Meine Schüler' : 'Meine Lehrer'}
          </h2>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setShowSidebar(false)}>
            <span className="text-2xl">×</span>
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] sm:max-h-none">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => {
                setSelectedContact(contact.id);
                setShowSidebar(false);
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedContact === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{contact.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{contact.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">{getRoleLabel(contact.role)}</p>
                </div>
              </div>
              {contact.unreadCount > 0 && (
                <div className="h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {contact.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {contacts.find(c => c.id === selectedContact)?.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                  {contacts.find(c => c.id === selectedContact)?.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                   {isOtherUserTyping ? `${contacts.find(c => c.id === selectedContact)?.name} schreibt...` : 'Online'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80vw] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-sm text-sm sm:text-base ${message.sender_id === profile?.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
                  >
                    <p>{message.content}</p>
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
            <div className="p-2 sm:p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" className="hidden sm:inline-flex">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    if (e.target.value) {
                      handleTypingStart();
                    } else {
                      handleTypingEnd();
                    }
                  }}
                  placeholder="Nachricht eingeben..."
                  className="flex-1 text-sm sm:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                   onBlur={handleTypingEnd}
                />
                <Button variant="outline" size="icon" className="hidden sm:inline-flex">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 sm:px-4 sm:py-2">
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