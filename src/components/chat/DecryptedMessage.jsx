// src/components/chat/DecryptedMessage.jsx
import { useState, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { decryptMessage } from '@/utils/crypto';

export default function DecryptedMessage({ message, isOwn, showSender, sharedKey }) {
  const [content, setContent] = useState(
    message.is_encrypted ? '🔒 Decrypting...' : message.content
  );

  useEffect(() => {
    if (message.is_encrypted && sharedKey && message.iv) {
      decryptMessage(sharedKey, message.iv, message.content)
        .then(setContent)
        .catch(() => setContent('[Unable to decrypt]'));
    }
  }, [message.id, sharedKey]);

  return (
    <MessageBubble
      message={{ ...message, content }}
      isOwn={isOwn}
      showSender={showSender}
    />
  );
}