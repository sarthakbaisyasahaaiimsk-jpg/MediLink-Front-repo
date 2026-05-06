import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as apiClient from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreVertical, Search, Phone, Video, MessageCircle, ShieldCheck, ShieldOff, Users, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatListItem from '@/components/chat/ChatListItem';
import ChatInput from '@/components/chat/ChatInput';
import DecryptedMessage from '@/components/chat/DecryptedMessage';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useE2EKeys } from '@/hooks/useE2EKeys';
import { encryptMessage } from '@/utils/crypto';

// ── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ user, contacts, onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (contact) => {
    setSelected(prev =>
      prev.find(s => s.email === contact.email)
        ? prev.filter(s => s.email !== contact.email)
        : [...prev, contact]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast({ title: 'Group name is required', variant: 'destructive' });
      return;
    }
    if (selected.length < 1) {
      toast({ title: 'Select at least one member', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const participants = [user.email, ...selected.map(s => s.email)];
      const participantNames = ['', ...selected.map(s => s.name)];

      const group = await apiClient.entities.Conversation.create({
        is_group: true,
        group_name: groupName.trim(),
        participants,
        participant_names: participantNames,
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: {},
      });

      toast({ title: `Group "${groupName}" created!` });
      onCreated(group);
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to create group', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">New Group Chat</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Group Name</label>
            <Input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Cardiology Team"
              className="bg-slate-50"
            />
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(c => (
                <span
                  key={c.email}
                  className="flex items-center gap-1 bg-teal-50 text-teal-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {c.name}
                  <button onClick={() => toggle(c)} className="ml-0.5 text-teal-500 hover:text-teal-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search & pick contacts */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Add Members ({selected.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-9 bg-slate-50"
              />
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <ScrollArea className="h-52">
                {filtered.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No contacts found</p>
                ) : (
                  filtered.map(contact => {
                    const isSelected = !!selected.find(s => s.email === contact.email);
                    const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={contact.email}
                        onClick={() => toggle(contact)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-0',
                          isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                        )}
                      >
                        {contact.photo ? (
                          <img src={contact.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{contact.name}</p>
                          <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t border-slate-100 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : `Create Group${selected.length > 0 ? ` (${selected.length + 1})` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function Chats() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatList, setShowChatList] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdFromUrl = urlParams.get('conversationId');

  useEffect(() => {
    const loadUser = async () => {
      const u = await apiClient.auth.me();
      setUser(u);
      const profiles = await apiClient.entities.DoctorProfile.filter({ created_by: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    };
    loadUser();
  }, []);

  // ── E2E Encryption ──────────────────────────────────────────────────────────
  const recipientEmail = selectedConversation && !selectedConversation.is_group
    ? selectedConversation.participants?.find(p => p !== user?.email) ?? null
    : null;

  const { sharedKey, ready: e2eReady } = useE2EKeys(user?.email ?? null, recipientEmail);
  // ────────────────────────────────────────────────────────────────────────────

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const convos = await apiClient.entities.Conversation.filter(
        { participants: user.email },
        '-last_message_time'
      );
      return convos;
    },
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  // ── Derive contacts from existing 1:1 conversations ─────────────────────────
  const contacts = useMemo(() => {
    if (!user?.email) return [];
    const seen = new Set();
    const result = [];
    conversations.forEach(c => {
      if (c.is_group) return;
      const idx = c.participants?.findIndex(p => p !== user.email);
      if (idx === -1 || idx === undefined) return;
      const email = c.participants?.[idx];
      if (!email || seen.has(email)) return;
      seen.add(email);
      result.push({
        email,
        name: c.participant_names?.[idx] || email,
        photo: c.participant_photos?.[idx] || null,
      });
    });
    return result;
  }, [conversations, user?.email]);
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const convo = conversations.find(c => c.id === conversationIdFromUrl);
      if (convo) {
        setSelectedConversation(convo);
        setShowChatList(false);
      }
    }
  }, [conversationIdFromUrl, conversations]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () =>
      apiClient.entities.Message.filter(
        { conversation_id: selectedConversation.id },
        'created_date'
      ),
    enabled: !!selectedConversation?.id,
    refetchInterval: selectedConversation?.id ? 3000 : false,
    staleTime: 1000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && user && messages.length > 0) {
      const unreadMessages = messages.filter(
        m => m.sender_id !== user.email && !m.read_by?.includes(user.email)
      );
      unreadMessages.forEach(async (msg) => {
        await apiClient.entities.Message.update(msg.id, {
          is_read: true,
          read_by: [...(msg.read_by || []), user.email],
        });
      });

      if (selectedConversation.unread_count?.[user.email] > 0) {
        apiClient.entities.Conversation.update(selectedConversation.id, {
          unread_count: { ...selectedConversation.unread_count, [user.email]: 0 },
        });
      }
    }
  }, [selectedConversation, messages, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      if (!selectedConversation?.id || !user?.email) {
        throw new Error('Conversation or user not loaded');
      }

      let contentToStore = messageData.content;
      let ivToStore = null;
      let isEncrypted = false;

      if (sharedKey) {
        try {
          const { iv, ciphertext } = await encryptMessage(sharedKey, messageData.content);
          contentToStore = ciphertext;
          ivToStore = iv;
          isEncrypted = true;
        } catch (err) {
          console.error('Encryption failed, sending plaintext as fallback:', err);
        }
      }

      const message = await apiClient.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_id: user.email,
        sender_name: profile?.full_name || user.full_name,
        sender_photo: profile?.profile_photo,
        ...messageData,
        content: contentToStore,
        iv: ivToStore,
        is_encrypted: isEncrypted,
        read_by: [user.email],
      });

      const participants = selectedConversation.participants || [];
      const updatedUnread = { ...(selectedConversation.unread_count || {}) };
      participants.forEach(p => {
        if (p !== user.email) {
          updatedUnread[p] = (updatedUnread[p] || 0) + 1;
        }
      });

      const lastMessagePreview = isEncrypted ? '🔒 Encrypted message' : messageData.content.slice(0, 50);

      await apiClient.entities.Conversation.update(selectedConversation.id, {
        last_message: lastMessagePreview,
        last_message_time: new Date().toISOString(),
        last_message_sender: user.email,
        unread_count: updatedUnread,
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const filteredConversations = conversations.filter(c => {
    if (c.is_group) {
      return c.group_name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const otherIndex = c.participants?.findIndex(p => p !== user?.email);
    const otherName = c.participant_names?.[otherIndex] || '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationDisplay = (conversation) => {
    if (conversation.is_group) {
      return { name: conversation.group_name || 'Group', photo: null };
    }
    const otherIndex = conversation.participants?.findIndex(p => p !== user?.email);
    return {
      name: conversation.participant_names?.[otherIndex] || 'Doctor',
      photo: conversation.participant_photos?.[otherIndex],
    };
  };

  const other = selectedConversation
    ? getConversationDisplay(selectedConversation)
    : { name: '', photo: null };
  const initials = other.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="h-screen flex bg-slate-100">
      {/* ── Create Group Modal ───────────────────────────────────────────────── */}
      {showCreateGroup && (
        <CreateGroupModal
          user={user}
          contacts={contacts}
          onClose={() => setShowCreateGroup(false)}
          onCreated={(group) => {
            queryClient.invalidateQueries(['conversations']);
            setSelectedConversation(group);
            setShowChatList(false);
          }}
        />
      )}

      {/* ── Chat List Sidebar ────────────────────────────────────────────────── */}
      <div
        className={cn(
          'w-full md:w-96 bg-white border-r border-slate-200 flex flex-col',
          'md:flex',
          !showChatList && 'hidden md:flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-teal-500 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <p className="text-teal-100 text-sm">{profile?.full_name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateGroup(true)}
              className="text-white hover:bg-teal-700/50 rounded-full"
              title="New Group Chat"
            >
              <Users className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 bg-slate-50 border-none"
            />
          </div>
        </div>

        {/* Scrollable conversation list */}
        <ScrollArea className="flex-1">
          {loadingConversations ? (
            <div className="p-4 text-center text-slate-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="mb-2">No conversations yet</p>
              <p className="text-sm">Start by messaging a doctor from the Network page</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <ChatListItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={user?.email}
                isActive={selectedConversation?.id === conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setShowChatList(false);
                }}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────────────── */}
      <div className={cn('flex-1 flex flex-col', showChatList && 'hidden md:flex')}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowChatList(true)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              {other.photo ? (
                <img src={other.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                  {selectedConversation.is_group
                    ? <Users className="w-5 h-5" />
                    : initials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 truncate">{other.name}</h2>
                {selectedConversation.is_group ? (
                  <p className="text-xs text-slate-400">
                    {selectedConversation.participants?.length} members
                  </p>
                ) : (
                  <div className="flex items-center gap-1">
                    {e2eReady ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-teal-500" />
                        <p className="text-xs text-teal-600 font-medium">End-to-end encrypted</p>
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-3 h-3 text-slate-400" />
                        <p className="text-xs text-slate-400">Setting up encryption…</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 pb-24"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e2e8f0\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            >
              {loadingMessages ? (
                <div className="text-center text-slate-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Say hello to start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <DecryptedMessage
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === user?.email}
                    showSender={
                      selectedConversation.is_group && message.sender_id !== user?.email
                    }
                    sharedKey={sharedKey}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="sticky bottom-16 bg-white border-t p-2 z-40">
              <ChatInput
                onSend={(data) => sendMessageMutation.mutate({
                  ...data,
                  conversation_id: selectedConversation.id,
                })}
                disabled={sendMessageMutation.isPending}
                conversationId={selectedConversation?.id}
                currentUserId={user?.email}
                senderName={profile?.full_name || user?.full_name}
                senderPhoto={profile?.profile_photo}
              />
            </div>
          </>
        ) : (
          /* ── Empty state with scrollable contacts ──────────────────────────── */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Top section */}
            <div className="text-center pt-10 pb-6 px-4 shrink-0">
              <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700">Your Messages</h2>
              <p className="mt-1 text-slate-500 text-sm">Select a conversation or start a new group</p>
              <Button
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white gap-2"
                onClick={() => setShowCreateGroup(true)}
              >
                <Users className="w-4 h-4" />
                New Group Chat
              </Button>
            </div>

            {/* Scrollable contacts */}
            {contacts.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 shrink-0">
                  Contacts
                </p>
                <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {contacts.map((contact) => {
                    const ini = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const convo = conversations.find(
                      c => !c.is_group && c.participants?.includes(contact.email)
                    );
                    return (
                      <div
                        key={contact.email}
                        onClick={() => {
                          if (convo) {
                            setSelectedConversation(convo);
                            setShowChatList(false);
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                      >
                        {contact.photo ? (
                          <img src={contact.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {ini}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{contact.name}</p>
                          <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                        </div>
                        <MessageCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}