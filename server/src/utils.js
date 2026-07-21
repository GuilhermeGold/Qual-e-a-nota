import { CONFIG } from './config.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O/0/I/1 para evitar confusão

export function generateRoomCode(existingCodes) {
  let code;
  do {
    code = '';
    for (let i = 0; i < CONFIG.ROOM_CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (existingCodes.has(code));
  return code;
}

export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandomNote() {
  return CONFIG.NOTE_MIN + Math.floor(Math.random() * (CONFIG.NOTE_MAX - CONFIG.NOTE_MIN + 1));
}
