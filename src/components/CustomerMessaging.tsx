import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageCircle, Send, User, Headphones } from "lucide-react";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'team';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

export default function CustomerMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Message[]>();
      messages?.forEach((message) => {
        if (!conversationMap.has(message.conversation_id)) {
          conversationMap.set(message.conversation_id, []);
        }
        conversationMap.get(message.conversation_id)!.push(message);
      });

      // Also get team responses
      const conversationIds = Array.from(conversationMap.keys());
      if (conversationIds.length > 0) {
        const { data: teamMessages, error: teamError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .eq('sender_type', 'team')
          .order('created_at', { ascending: true });

        if (teamError) throw teamError;

        teamMessages?.forEach((message) => {
          if (!conversationMap.has(message.conversation_id)) {
            conversationMap.set(message.conversation_id, []);
          }
          conversationMap.get(message.conversation_id)!.push(message);
        });
      }

      // Convert to conversation objects
      const conversationsList = Array.from(conversationMap.entries()).map(([id, messages]) => {
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        return {
          id,
          messages: sortedMessages,
          lastMessage: sortedMessages[sortedMessages.length - 1],
          unreadCount: sortedMessages.filter(m => !m.is_read && m.sender_type === 'team').length,
        };
      });

      setConversations(conversationsList);
      
      // Auto-select first conversation if none selected
      if (!activeConversation && conversationsList.length > 0) {
        setActiveConversation(conversationsList[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'sender_type=eq.team' },
        (payload) => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const startNewConversation = async () => {
    if (!user) return;

    const conversationId = `conv_${user.id}_${Date.now()}`;
    setActiveConversation(conversationId);
    
    // Add empty conversation to state
    setConversations(prev => [
      {
        id: conversationId,
        messages: [],
        unreadCount: 0,
      },
      ...prev
    ]);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !activeConversation) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: activeConversation,
          sender_id: user.id,
          sender_type: 'customer',
          message: newMessage.trim(),
        }]);

      if (error) throw error;

      setNewMessage('');
      loadConversations();
      
      toast({
        title: "Message sent!",
        description: "Our team will respond to your message shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'team');
      
      loadConversations();
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getActiveConversation = () => {
    return conversations.find(c => c.id === activeConversation);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to access customer support.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
          <Button size="sm" onClick={startNewConversation} className="btn-primary">
            New Chat
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {loading ? (
              <p className="p-4 text-muted-foreground">Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-muted-foreground mb-4">No conversations yet.</p>
                <Button onClick={startNewConversation} className="btn-primary">
                  Start First Conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeConversation === conversation.id
                        ? 'bg-primary/10 border-primary border'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setActiveConversation(conversation.id);
                      markAsRead(conversation.id);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm">
                        Support Chat
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {conversation.lastMessage.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conversation.lastMessage.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Customer Support Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeConversation ? (
            <div className="flex flex-col h-[500px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {getActiveConversation()?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.sender_type === 'customer'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender_type === 'customer' ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Headphones className="h-3 w-3" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.sender_type === 'customer' ? 'You' : 'Support Team'}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending} className="btn-primary">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}