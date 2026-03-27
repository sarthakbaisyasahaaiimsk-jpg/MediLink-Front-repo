import CryptoJS from 'crypto-js';

/**
 * End-to-End Encryption Utility
 * Uses AES encryption for message content
 */

class MessageEncryption {
  constructor() {
    // In production, this should be derived from user's password
    // For now, using a fixed key (in real app, use proper key derivation)
    this.keyId = 'default_key_v1';
  }

  /**
   * Generate a random encryption key
   */
  generateKey() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  /**
   * Encrypt message content
   * @param {string} content - Message content to encrypt
   * @param {string} key - Encryption key
   * @returns {object} - { encryptedContent, keyId }
   */
  encrypt(content, key = null) {
    try {
      const encryptionKey = key || this.getStoredKey();
      
      if (!encryptionKey) {
        console.warn('No encryption key available, storing key in localStorage');
        const newKey = this.generateKey();
        this.storeKey(newKey);
        return this.encrypt(content, newKey);
      }

      const encrypted = CryptoJS.AES.encrypt(content, encryptionKey).toString();
      
      return {
        encryptedContent: encrypted,
        keyId: this.keyId,
        isEncrypted: true
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return { encryptedContent: content, keyId: null, isEncrypted: false };
    }
  }

  /**
   * Decrypt message content
   * @param {string} encryptedContent - Encrypted message
   * @param {string} key - Decryption key
   * @returns {string} - Decrypted content
   */
  decrypt(encryptedContent, key = null) {
    try {
      const decryptionKey = key || this.getStoredKey();
      
      if (!decryptionKey) {
        console.warn('No decryption key available');
        return encryptedContent;
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedContent, decryptionKey).toString(
        CryptoJS.enc.Utf8
      );
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedContent;
    }
  }

  /**
   * Store encryption key in localStorage
   * WARNING: This is not production-ready. In production:
   * - Use IndexedDB with better security
   * - Derive from user password
   * - Rotate keys periodically
   */
  storeKey(key) {
    try {
      localStorage.setItem(`medilink_enc_key_${this.keyId}`, key);
    } catch (error) {
      console.error('Failed to store encryption key:', error);
    }
  }

  /**
   * Retrieve stored encryption key
   */
  getStoredKey() {
    try {
      return localStorage.getItem(`medilink_enc_key_${this.keyId}`);
    } catch (error) {
      console.error('Failed to retrieve encryption key:', error);
      return null;
    }
  }

  /**
   * Hash string for verification
   */
  hash(content) {
    return CryptoJS.SHA256(content).toString();
  }

  /**
   * Generate HMAC for message integrity
   */
  generateHMAC(content, key = null) {
    const hmacKey = key || this.getStoredKey();
    if (!hmacKey) return null;
    return CryptoJS.HmacSHA256(content, hmacKey).toString();
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(content, hmac, key = null) {
    const computed = this.generateHMAC(content, key);
    return computed === hmac;
  }

  /**
   * Check if content is encrypted JSON
   */
  isEncrypted(content) {
    try {
      // Encrypted content has U2FsdGVkX1 prefix (base64 encoded "Salted__")
      return typeof content === 'string' && content.startsWith('U2FsdGVkX1');
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const encryption = new MessageEncryption();

export default MessageEncryption;
