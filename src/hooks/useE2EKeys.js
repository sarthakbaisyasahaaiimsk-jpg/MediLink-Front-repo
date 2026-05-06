import { useState, useEffect, useRef } from 'react';
import { getOrCreateKeyPair, deriveSharedKey, publicKeyToBase64, base64ToBytes } from '@/utils/crypto';

const API_BASE = 'https://medilink-back-repo-1.onrender.com';

export function useE2EKeys(currentUserEmail, recipientEmail) {
  const sharedKeyRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!currentUserEmail || !recipientEmail) return;

    // Reset when conversation changes
    setReady(false);
    sharedKeyRef.current = null;

    async function initKeys() {
      try {
        // 1. Get token — adjust the key name if your app uses a different one
        const token =
          localStorage.getItem('access_token') ||
          localStorage.getItem('token') ||
          sessionStorage.getItem('access_token') ||
          sessionStorage.getItem('token');

        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // 2. Get/create our keypair
        const { privateKey, publicKeyRaw } = await getOrCreateKeyPair();
        const myPubKeyB64 = publicKeyToBase64(publicKeyRaw);

        // 3. Register our public key with the backend
        const registerRes = await fetch(`${API_BASE}/api/keys/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            user_id: currentUserEmail,
            public_key: myPubKeyB64,
          }),
        });

        if (!registerRes.ok) {
          const text = await registerRes.text();
          throw new Error(`Register failed (${registerRes.status}): ${text}`);
        }

        // 4. Fetch recipient's public key
        const keyRes = await fetch(
          `${API_BASE}/api/keys/${encodeURIComponent(recipientEmail)}`,
          { headers: { ...authHeader } }
        );

        if (!keyRes.ok) {
          if (keyRes.status === 404) {
            console.warn(`E2E: Recipient ${recipientEmail} has not registered a key yet.`);
          } else {
            const text = await keyRes.text();
            throw new Error(`Key fetch failed (${keyRes.status}): ${text}`);
          }
          return;
        }

        const { public_key } = await keyRes.json();

        // 5. Derive shared AES-GCM key
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