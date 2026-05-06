// src/hooks/useE2EKeys.js
import { useState, useEffect, useRef } from 'react';
import { getOrCreateKeyPair, deriveSharedKey, publicKeyToBase64, base64ToBytes } from '@/utils/crypto';
import * as apiClient from '@/api/client';

export function useE2EKeys(currentUserEmail, recipientEmail) {
  const sharedKeyRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!currentUserEmail || !recipientEmail) return;

    async function initKeys() {
      try {
        // 1. Get/create our keypair
        const { privateKey, publicKeyRaw } = await getOrCreateKeyPair();
        const myPubKeyB64 = publicKeyToBase64(publicKeyRaw);

        // 2. Register our public key with Flask backend
        await fetch('/api/keys/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUserEmail, public_key: myPubKeyB64 })
        });

        // 3. Fetch recipient's public key
        const res = await fetch(`/api/keys/${encodeURIComponent(recipientEmail)}`);
        if (!res.ok) {
          console.warn('Recipient has no public key yet — E2E not ready');
          return;
        }
        const { public_key } = await res.json();

        // 4. Derive shared AES-GCM key
        sharedKeyRef.current = await deriveSharedKey(privateKey, base64ToBytes(public_key));
        setReady(true);
      } catch (err) {
        console.error('E2E key init failed:', err);
      }
    }

    initKeys();
  }, [currentUserEmail, recipientEmail]);

  return { sharedKey: sharedKeyRef.current, ready };
}