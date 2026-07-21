import { Room } from './Room.js';
import { generateRoomCode } from './utils.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // code -> Room
  }

  createRoom() {
    const code = generateRoomCode(new Set(this.rooms.keys()));
    const room = new Room(this.io, code);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toString().trim().toUpperCase()) || null;
  }

  deleteRoom(code) {
    const room = this.rooms.get(code);
    if (!room) return;
    room.destroy();
    this.rooms.delete(code);
  }
}
