import crypto from 'crypto';

const PREFIX = 'enc:';
// Generate a safe 32-byte key from the environment variable (or default fallback)
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || 'psycho_lab_default_encryption_key',
  'psycholab_salt',
  32
);
const IV_LENGTH = 16;

/**
 * Encrypts a string value. Returns original value if it is already encrypted or if encryption fails.
 */
export function encrypt(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  if (text.startsWith(PREFIX)) return text; // Already encrypted
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return PREFIX + iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypts a string value. Returns original value if it's not encrypted or if decryption fails.
 */
export function decrypt(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  if (!text.startsWith(PREFIX)) return text; // Return as-is if not encrypted
  
  try {
    const textParts = text.substring(PREFIX.length).split(':');
    if (textParts.length !== 2) return text;
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    return text;
  }
}

/**
 * Encrypts sensitive fields in a client object.
 */
export function encryptClientData(client: any) {
  if (!client) return client;
  return {
    ...client,
    name: encrypt(client.name),
    registration_number: encrypt(client.registration_number),
    test_registration_number: encrypt(client.test_registration_number),
    parent_name: encrypt(client.parent_name),
    parent_phone: encrypt(client.parent_phone),
    address: encrypt(client.address),
  };
}

/**
 * Decrypts sensitive fields in a client object.
 */
export function decryptClientData(client: any) {
  if (!client) return client;
  return {
    ...client,
    name: decrypt(client.name),
    registration_number: decrypt(client.registration_number),
    test_registration_number: decrypt(client.test_registration_number),
    parent_name: decrypt(client.parent_name),
    parent_phone: decrypt(client.parent_phone),
    address: decrypt(client.address),
  };
}
