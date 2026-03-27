import React from 'react';
import { cn } from '@/lib/utils';

export default function TypingIndicator({ typingUsers = [], currentUserId }) {
  if (!typingUsers.length) return null;

  const displayNames = typingUsers.slice(0, 2).join(', ');
  const hasMore = typingUsers.length > 2;
  const text = hasMore 
    ? `${displayNames} and ${typingUsers.length - 2} more are typing...`
    : `${displayNames} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-slate-500 text-sm">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
}
