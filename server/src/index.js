import cors from 'cors';
import express from 'express';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import { CONFIG } from './config.js';
import { RoomManager } from './RoomManager.js';

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true }));

const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) return next();
    res.sendFile(join(clientDist, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const roomManager = new RoomManager(io);

function sanitizeName(name) {
  return (name || '').toString().trim().slice(0, CONFIG.MAX_NAME_LENGTH);
}

function roomJoinedPayload(room) {
  return { players: room.getPublicPlayers(), hostId: room.hostId, phase: room.state };
}

io.on('connection', (socket) => {
  socket.data.roomCode = null;
  socket.data.playerName = null;

  socket.on('create_room', ({ playerName } = {}) => {
    const name = sanitizeName(playerName);
    if (!name) return socket.emit('error', { message: 'Nome inválido.' });

    const room = roomManager.createRoom();
    room.addPlayer({ id: socket.id, name, score: 0, connected: true });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerName = name;

    socket.emit('room_created', { roomCode: room.code, playerId: socket.id });
    io.to(room.code).emit('room_joined', roomJoinedPayload(room));
  });

  socket.on('join_room', ({ roomCode, playerName } = {}) => {
    const name = sanitizeName(playerName);
    if (!name) return socket.emit('error', { message: 'Nome inválido.' });

    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    if (room.state !== 'lobby') return socket.emit('error', { message: 'Esta sala já iniciou o jogo.' });
    if (room.players.size >= CONFIG.MAX_PLAYERS) return socket.emit('error', { message: 'Sala cheia.' });

    room.addPlayer({ id: socket.id, name, score: 0, connected: true });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerName = name;

    socket.emit('room_joined', roomJoinedPayload(room));
    socket.to(room.code).emit('room_joined', roomJoinedPayload(room));
  });

  socket.on('start_game', ({ roomCode } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Apenas o host pode iniciar o jogo.' });
    if (room.players.size < CONFIG.MIN_PLAYERS) {
      return socket.emit('error', { message: `São necessários ao menos ${CONFIG.MIN_PLAYERS} jogadores.` });
    }
    room.startGame();
  });

  socket.on('submit_questions', ({ roomCode, questions } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    const result = room.submitQuestions(socket.id, questions);
    if (result?.error) socket.emit('error', { message: result.error });
  });

  socket.on('submit_answer', ({ roomCode, text } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    const result = room.submitAnswer(socket.id, text);
    if (result?.error) socket.emit('error', { message: result.error });
  });

  socket.on('submit_answer_ratings', ({ roomCode, ratings } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    const result = room.submitAnswerRatings(socket.id, ratings);
    if (result?.error) socket.emit('error', { message: result.error });
  });

  socket.on('submit_guess', ({ roomCode, guess } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    const result = room.submitGuess(socket.id, guess);
    if (result?.error) socket.emit('error', { message: result.error });
  });

  socket.on('send_reaction', ({ roomCode, emoji } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    room.sendReaction(socket.id, emoji);
  });

  socket.on('next_round', ({ roomCode } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Apenas o host pode avançar a rodada.' });
    const result = room.nextRound();
    if (result?.error) socket.emit('error', { message: result.error });
  });

  socket.on('end_game', ({ roomCode } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Apenas o host pode encerrar o jogo.' });
    const result = room.endGame();
    if (result?.error) socket.emit('error', { message: result.error });
  });

  socket.on('restart_game', ({ roomCode } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Apenas o host pode reiniciar o jogo.' });
    room.resetToLobby();
    io.to(room.code).emit('room_joined', roomJoinedPayload(room));
  });

  socket.on('kick_player', ({ roomCode, playerId } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada.' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Apenas o host pode expulsar jogadores.' });
    if (playerId === socket.id) return socket.emit('error', { message: 'Você não pode se expulsar.' });
    if (!room.players.has(playerId)) return socket.emit('error', { message: 'Jogador não encontrado.' });

    const kickedSocket = io.sockets.sockets.get(playerId);
    room.removePlayer(playerId);
    io.to(room.code).emit('player_kicked', { playerId });
    if (kickedSocket) {
      kickedSocket.leave(room.code);
      kickedSocket.data.roomCode = null;
    }
    if (room.players.size === 0) roomManager.deleteRoom(room.code);
  });

  socket.on('rejoin_room', ({ roomCode, playerId } = {}) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala não encontrada ou expirada.' });
    const player = room.reconnectPlayer(playerId, socket.id);
    if (!player) return socket.emit('error', { message: 'Não foi possível reconectar.' });

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerName = player.name;

    socket.emit('room_joined', roomJoinedPayload(room));
    socket.to(room.code).emit('room_joined', roomJoinedPayload(room));
    if (room.state !== 'lobby') {
      room.broadcastState();
    }
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = roomManager.getRoom(code);
    if (!room) return;

    if (room.state === 'lobby' || room.state === 'game_over') {
      room.removePlayer(socket.id);
      io.to(room.code).emit('room_joined', roomJoinedPayload(room));
      if (room.players.size === 0) roomManager.deleteRoom(room.code);
    } else {
      room.markDisconnected(socket.id, () => {
        io.to(room.code).emit('room_joined', roomJoinedPayload(room));
        if (room.players.size === 0) roomManager.deleteRoom(room.code);
      });
      room.broadcastState();
    }
  });
});

const PORT = process.argv[2] || process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Qual é a Nota? - servidor rodando na porta ${PORT}`);
});
