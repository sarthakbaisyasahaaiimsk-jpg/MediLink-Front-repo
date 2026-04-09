import React, { useState, useRef } from 'react';
import * as apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Image, FileText, X, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AudioRecorder from './AudioRecorder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatInput({ 
  onSend, 
  disabled, 
  conversationId, 
  currentUserId, 
  senderName, 
  senderPhoto,
  onSearchOpen 
}) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSend = async () => {
    if ((!message.trim() && !attachment) || disabled || sending) return;

    setSending(true);

    try {
      const messageData = {
        content: attachment ? attachment.name : message.trim(),
        message_type: attachment?.type || 'text',
      };

      if (attachment?.type === 'image' || attachment?.type === 'file' || attachment?.type === 'audio') {
        messageData.file_url = attachment.url;
      }

      onSend(messageData);
      setMessage('');
      setAttachment(null);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleAudioRecorded = async (audioBlob) => {
    setUploading(true);
    try {
      const result = await apiClient.uploadFile(audioBlob);
      
      setAttachment({
        url: result.file_url,
        type: 'audio',
        name: 'voice_message.mp3'
      });

      toast({
        title: 'Audio recorded',
        description: 'Voice message ready to send',
variant: 'default',
        duration: 3000
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (file, type) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const result = await apiClient.uploadFile(file);
      
      setAttachment({
        url: result.file_url,
        type,
        name: file.name
      });

      toast({
        title: 'File uploaded',
        description: `${file.name} is ready to send`,
variant: 'default',
        duration: 3000
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed bottom-24 left-[63%] -translate-x-1/2 w-[70%] max-w-3xl bg-white border border-slate-200 shadow-lg rounded-xl z-50">
      {uploading && (
        <div className="text-xs text-slate-500 px-4 py-2 bg-slate-50 border-b">
          ⏳ Uploading file...
        </div>
      )}

      {attachment && (
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b">
          {attachment.type === 'image' ? (
            <img
              src={attachment.url}
              alt="preview"
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <FileText className="w-5 h-5 text-teal-500" />
          )}

          <span className="text-sm text-slate-700 flex-1 truncate font-medium">
            {attachment.name}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-slate-200"
            onClick={() => setAttachment(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 p-2">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-slate-500 hover:text-teal-600 hover:bg-slate-100"
              disabled={uploading || attachment}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
              <Image className="w-4 h-4 mr-2 text-teal-500" />
              <span>Photo or Video</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              <span>Document</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AudioRecorder 
          onAudioRecorded={handleAudioRecorded}
          disabled={uploading || !!attachment}
        />

        {onSearchOpen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSearchOpen}
            className="text-slate-500 hover:text-teal-600"
          >
            <Search className="w-5 h-5" />
          </Button>
        )}

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachment ? 'Add a caption...' : 'Type a message...'}
          disabled={disabled || sending || uploading}
          className="flex-1 bg-slate-50 border-slate-300 focus:bg-white"
          type="text"
        />

        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !attachment) || disabled || sending || uploading}
          className={`shrink-0 transition-all ${
            (!message.trim() && !attachment)
              ? 'bg-slate-300 text-slate-500 hover:bg-slate-300 cursor-not-allowed'
              : 'bg-teal-500 text-white hover:bg-teal-600'
          }`}
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file, file.type.startsWith('image/') ? 'image' : 'video');
              e.target.value = '';
            }
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file, 'file');
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}