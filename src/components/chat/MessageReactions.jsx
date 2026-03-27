import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const COMMON_EMOJIS = [
  '❤️', '👍', '😂', '😮', '😢', '😡',
  '🔥', '⭐', '🎉', '👏', '🙏', '💯'
];

export default function MessageReactions({ 
  message, 
  onAddReaction, 
  onRemoveReaction, 
  currentUserId 
}) {
  const [showPicker, setShowPicker] = useState(false);
  
  if (!message.reactions || Object.keys(message.reactions).length === 0) {
    return (
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          >
            <Smile className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="grid grid-cols-6 gap-1">
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  onAddReaction(message.id, emoji);
                  setShowPicker(false);
                }}
                className="p-2 text-xl hover:bg-slate-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(message.reactions).map(([emoji, users]) => {
        const hasReacted = users.includes(currentUserId);
        
        return (
          <button
            key={emoji}
            onClick={() => {
              if (hasReacted) {
                onRemoveReaction(message.id, emoji);
              } else {
                onAddReaction(message.id, emoji);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
              hasReacted
                ? 'bg-teal-100 text-teal-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={users.join(', ')}
          >
            <span className="text-base">{emoji}</span>
            <span className="text-xs font-medium">{users.length}</span>
          </button>
        );
      })}
      
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          >
            <Smile className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="grid grid-cols-6 gap-1">
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  if (Object.keys(message.reactions).includes(emoji)) {
                    if (message.reactions[emoji].includes(currentUserId)) {
                      onRemoveReaction(message.id, emoji);
                    } else {
                      onAddReaction(message.id, emoji);
                    }
                  } else {
                    onAddReaction(message.id, emoji);
                  }
                  setShowPicker(false);
                }}
                className="p-2 text-xl hover:bg-slate-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
