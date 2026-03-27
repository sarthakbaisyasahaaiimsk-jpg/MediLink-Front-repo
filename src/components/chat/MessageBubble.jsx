import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, FileText, Image as ImageIcon, AlertCircle, Pin, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageReactions from './MessageReactions';
import AudioPlayer from './AudioPlayer';

export default function MessageBubble({ 
  message, 
  isOwn, 
  showSender,
  onAddReaction,
  onRemoveReaction,
  onPin,
  onArchive,
  currentUserId
}) {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'HH:mm');
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img 
              src={message.file_url} 
              alt="Shared image" 
              className="rounded-lg max-w-full max-h-80 object-cover"
              loading="lazy"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="max-w-xs">
            <video 
              src={message.file_url} 
              controls
              className="rounded-lg max-w-full max-h-80"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="max-w-xs">
            <AudioPlayer audioUrl={message.file_url} fileName={message.content} />
            {message.content && message.message_type === 'audio' && (
              <p className="mt-2 text-xs text-slate-500">Voice message</p>
            )}
          </div>
        );
      case 'file':
        return (
          <a 
            href={message.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <FileText className="w-6 h-6 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.content || 'Document'}</p>
              <p className="text-xs opacity-70">Tap to download</p>
            </div>
          </a>
        );
      case 'case_reference':
        return (
          <div className="p-3 bg-white/20 rounded-lg border-l-4 border-teal-300">
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1 font-semibold">📋 Case Reference</p>
            <p className="text-sm break-words">{message.content}</p>
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>;
    }
  };

  const isRead = message.read_by?.length > 1 || (message.is_read && message.read_by?.includes(message.sender_id));

  return (
    <div className={cn(
      "flex flex-col gap-1 mb-3 group",
      isOwn ? "items-end" : "items-start"
    )}>
      {showSender && !isOwn && (
        <span className="text-xs font-semibold text-teal-600 px-1 mb-0.5">
          {message.sender_name}
        </span>
      )}
      
      <div className={cn(
        "px-4 py-2 rounded-2xl shadow-sm max-w-[85%] sm:max-w-[70%] relative",
        isOwn 
          ? "bg-teal-500 text-white rounded-br-md" 
          : "bg-slate-200 text-slate-900 rounded-bl-md"
      )}>
        {/* Message Content */}
        {renderContent()}
        
        {/* Message Status */}
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1 text-[11px]",
          isOwn ? "text-teal-100" : "text-slate-500"
        )}>
          <span>{formatTime(message.created_date)}</span>
          {isOwn && (
            <>
              {isRead 
                ? <CheckCheck className="w-3.5 h-3.5 text-teal-100" strokeWidth={3} />
                : <Check className="w-3.5 h-3.5 text-teal-100" strokeWidth={3} />
              }
            </>
          )}
        </div>

        {/* Pinned Indicator */}
        {message.is_pinned && (
          <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1">
            <Pin className="w-3 h-3 text-amber-900" fill="currentColor" />
          </div>
        )}

        {/* Archived Indicator */}
        {message.is_archived && (
          <div className="absolute -top-2 -left-2 bg-slate-400 rounded-full p-1">
            <Archive className="w-3 h-3 text-white" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Message Actions (appear on hover) */}
      {isOwn && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
          {!message.is_pinned && onPin && (
            <button
              onClick={() => onPin(message.id)}
              className="text-xs px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
              title="Pin message"
            >
              📌 Pin
            </button>
          )}
          {onArchive && (
            <button
              onClick={() => onArchive(message.id)}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Archive message"
            >
              📦 Archive
            </button>
          )}
        </div>
      )}

      {/* Reactions */}
      {onAddReaction && (
        <MessageReactions 
          message={message}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}