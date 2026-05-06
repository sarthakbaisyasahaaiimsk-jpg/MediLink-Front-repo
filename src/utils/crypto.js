// src/utils/crypto.js

function openKeyDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('e2e-keys', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('keys');
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}

function getFromDB(db, key) {
  return new Promise(resolve => {
    const req = db.transaction('keys').objectStore('keys').get(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

function saveToDB(db, key, value) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('keys', 'readwrite').objectStore('keys').put(value, key);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}

export async function getOrCreateKeyPair() {
  const db = await openKeyDB();
  const stored = await getFromDB(db, 'keypair');
  if (stored) return stored;

  const keypair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
  const publicKeyRaw = await window.crypto.subtle.exportKey('spki', keypair.publicKey);
  const result = { privateKey: keypair.privateKey, publicKey: keypair.publicKey, publicKeyRaw };
  await saveToDB(db, 'keypair', result);
  return result;
}

export async function deriveSharedKey(myPrivateKey, theirPublicKeyRaw) {
  const theirPublicKey = await window.crypto.subtle.importKey(
    'spki', theirPublicKeyRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, []
  );
  return window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(sharedKey, plaintext) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
}

export async function decryptMessage(sharedKey, iv, ciphertext) {
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const ctBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, sharedKey, ctBytes);
  return new TextDecoder().decode(decrypted);
}

export function publicKeyToBase64(raw) {
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export function base64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}