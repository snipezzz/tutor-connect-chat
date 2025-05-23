
import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  senderName: string;
}

interface ChatContact {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isOnline: boolean;
  lastMessage: string;
  unreadCount: number;
}

interface ChatInterfaceProps {
  userRole: 'teacher' | 'student';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userRole }) => {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  // Mock data - würde später aus Supabase kommen
  const contacts: ChatContact[] = userRole === 'teacher' 
    ? [
        { id: '1', name: 'Nico Schmidt', role: 'student', isOnline: true, lastMessage: 'Danke für die Hilfe heute!', unreadCount: 2 },
        { id: '2', name: 'Fabian Weber', role: 'student', isOnline: false, lastMessage: 'Wann ist unser nächster Termin?', unreadCount: 0 },
      ]
    : [
        { id: '1', name: 'Arif Mustafa', role: 'teacher', isOnline: true, lastMessage: 'Gerne! Lass mich wissen wenn du Fragen hast.', unreadCount: 1 },
      ];

  const messages: Message[] = [
    { id: '1', text: 'Hallo! Ich brauche Hilfe bei den Quadratischen Gleichungen.', sender: 'other', timestamp: '14:30', senderName: 'Nico Schmidt' },
    { id: '2', text: 'Hallo Nico! Kein Problem, womit genau hast du Schwierigkeiten?', sender: 'me', timestamp: '14:32', senderName: 'Arif Mustafa' },
    { id: '3', text: 'Ich verstehe nicht, wie ich die Lösungsformel anwenden soll.', sender: 'other', timestamp: '14:33', senderName: 'Nico Schmidt' },
    { id: '4', text: 'Lass uns das Schritt für Schritt durchgehen. Hast du die Aufgabe zur Hand?', sender: 'me', timestamp: '14:35', senderName: 'Arif Mustafa' },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Sending message:', messageText);
      setMessageText('');
    }
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
                  <div className="relative">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{contact.name.charAt(0)}</span>
                    </div>
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
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
                  <p className="text-sm text-gray-500">
                    {contacts.find(c => c.id === selectedContact)?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      message.sender === 'me'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp}
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
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Wählen Sie einen Kontakt</h3>
              <p className="text-gray-500">Klicken Sie auf einen Kontakt, um eine Unterhaltung zu beginnen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
