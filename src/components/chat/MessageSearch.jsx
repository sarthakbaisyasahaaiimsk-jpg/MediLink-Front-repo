import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as apiClient from '@/api/client';
import { cn } from '@/lib/utils';

export default function MessageSearch({ conversationId, onSelectMessage, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        searchMessages();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const searchMessages = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/messages/search?conversation_id=${conversationId}&q=${encodeURIComponent(query)}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      const data = await response.json();
      setResults(data.messages || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onSelectMessage(results[selectedIndex]);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="w-full max-w-md border rounded-lg shadow-lg bg-white overflow-hidden">
      {/* Search Input */}
      <div className="p-3 border-b border-slate-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search messages..."
          autoFocus
          className="border-none focus:ring-0 px-2"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-slate-500 text-sm">
            Searching...
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No messages found
          </div>
        )}

        {results.map((message, index) => (
          <button
            key={message.id}
            onClick={() => {
              onSelectMessage(message);
              onClose();
            }}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors",
              selectedIndex === index && "bg-teal-50"
            )}
          >
            <div className="text-sm font-medium text-slate-600">
              {message.sender_name}
            </div>
            <div className="text-sm text-slate-700 truncate mt-1">
              {message.message_type === 'text' 
                ? message.content 
                : `📎 ${message.message_type.toUpperCase()}: ${message.content}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {new Date(message.created_date).toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* Help text */}
      {results.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
          Press ↑↓ to navigate, Enter to select, Esc to close
        </div>
      )}
    </div>
  );
}
