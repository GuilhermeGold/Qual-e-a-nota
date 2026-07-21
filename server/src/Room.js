import { CONFIG } from './config.js';
import { pickRandomNote, shuffle } from './utils.js';

/**
 * Room é a fonte da verdade para uma partida. Toda a lógica de rodada roda
 * aqui, no servidor; o cliente só exibe o que recebe via 'game_state'.
 *
 * A única informação que difere por jogador é a nota da rodada: o escolhido
 * nunca a recebe até a fase de 'reveal'. Por isso o game_state é montado
 * uma vez e emitido individualmente para cada socket, com o campo `note`
 * calculado por destinatário.
 */
export class Room {
  constructor(io, code) {
    this.io = io;
    this.code = code;
    this.players = new Map(); // playerId -> { id, name, score, connected, disconnectTimer }
    this.hostId = null;
    this.state = 'lobby';
    this.round = 0;
    this.chooserPool = [];
    this.currentChooserId = null;
    this.currentNote = null;
    this.questions = new Map(); // targetId -> pergunta
    this.answers = new Map(); // targetId -> { question, text }
    this.lastResult = null;
  }

  // ---------- Jogadores ----------

  addPlayer(player) {
    this.players.set(player.id, player);
    if (this.hostId === null) this.hostId = player.id;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
    this.players.delete(playerId);
    this.questions.delete(playerId);
    this.answers.delete(playerId);
    this.chooserPool = this.chooserPool.filter((id) => id !== playerId);

    if (this.hostId === playerId) {
      const next = [...this.players.values()][0];
      this.hostId = next ? next.id : null;
    }

    if (this.state !== 'lobby' && this.state !== 'game_over') {
      if (playerId === this.currentChooserId) {
        // O escolhido saiu no meio da rodada: recomeça com um novo escolhido.
        this._beginRound();
      } else if (this.state === 'answering' && this.answers.size >= this.questions.size && this.questions.size > 0) {
        this.state = 'guessing';
        this.broadcastState();
      } else {
        this.broadcastState();
      }
    }
  }

  markDisconnected(playerId, onRemoved) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = false;
    player.disconnectTimer = setTimeout(() => {
      this.removePlayer(playerId);
      onRemoved?.();
    }, CONFIG.RECONNECT_GRACE * 1000);
  }

  reconnectPlayer(oldId, newSocketId) {
    const player = this.players.get(oldId);
    if (!player || player.connected) return null;
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
    player.connected = true;
    this.players.delete(oldId);
    player.id = newSocketId;
    this.players.set(newSocketId, player);

    if (this.hostId === oldId) this.hostId = newSocketId;
    if (this.currentChooserId === oldId) this.currentChooserId = newSocketId;
    this.chooserPool = this.chooserPool.map((id) => (id === oldId ? newSocketId : id));
    if (this.questions.has(oldId)) {
      this.questions.set(newSocketId, this.questions.get(oldId));
      this.questions.delete(oldId);
    }
    if (this.answers.has(oldId)) {
      this.answers.set(newSocketId, this.answers.get(oldId));
      this.answers.delete(oldId);
    }
    return player;
  }

  // ---------- Ciclo de jogo ----------

  startGame() {
    if (this.state !== 'lobby') return;
    for (const p of this.players.values()) p.score = 0;
    this.round = 1;
    this.chooserPool = shuffle([...this.players.keys()]);
    this.io.to(this.code).emit('game_started', {});
    this._beginRound();
  }

  resetToLobby() {
    this.state = 'lobby';
    this.round = 0;
    this.chooserPool = [];
    this.currentChooserId = null;
    this.currentNote = null;
    this.questions = new Map();
    this.answers = new Map();
    this.lastResult = null;
    for (const p of this.players.values()) p.score = 0;
  }

  destroy() {
    for (const p of this.players.values()) {
      if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
    }
  }

  _beginRound() {
    if (this.players.size === 0) return;
    if (this.chooserPool.length === 0) {
      this.chooserPool = shuffle([...this.players.keys()]);
    }
    let nextChooser = this.chooserPool.shift();
    while (nextChooser && !this.players.has(nextChooser)) {
      if (this.chooserPool.length === 0) {
        this.chooserPool = shuffle([...this.players.keys()]);
      }
      nextChooser = this.chooserPool.shift();
    }
    this.currentChooserId = nextChooser ?? null;
    this.currentNote = pickRandomNote();
    this.questions = new Map();
    this.answers = new Map();
    this.lastResult = null;
    this.state = 'assigning';
    this.broadcastState();
  }

  /** O escolhido define, de uma vez, a pergunta para cada outro jogador. */
  submitQuestions(chooserId, questionsByTarget) {
    if (this.state !== 'assigning') return { error: 'Fase de perguntas não está ativa.' };
    if (chooserId !== this.currentChooserId) return { error: 'Só o jogador escolhido pode enviar perguntas.' };
    if (!questionsByTarget || typeof questionsByTarget !== 'object') {
      return { error: 'Perguntas inválidas.' };
    }

    const targetIds = [...this.players.keys()].filter((id) => id !== chooserId);
    const cleaned = new Map();
    for (const targetId of targetIds) {
      const raw = questionsByTarget[targetId];
      const trimmed = (raw || '').toString().trim().slice(0, CONFIG.MAX_QUESTION_LENGTH);
      if (!trimmed) return { error: 'Toda pergunta precisa ser preenchida.' };
      cleaned.set(targetId, trimmed);
    }

    this.questions = cleaned;
    this.answers = new Map();
    this.state = 'answering';
    this.broadcastState();
    return { ok: true };
  }

  submitAnswer(playerId, text) {
    if (this.state !== 'answering') return { error: 'Fase de respostas não está ativa.' };
    if (!this.questions.has(playerId)) return { error: 'Você não recebeu pergunta nesta rodada.' };
    if (this.answers.has(playerId)) return { error: 'Você já respondeu nesta rodada.' };
    const trimmed = (text || '').toString().trim().slice(0, CONFIG.MAX_ANSWER_LENGTH);
    if (!trimmed) return { error: 'Resposta não pode ser vazia.' };

    this.answers.set(playerId, { question: this.questions.get(playerId), text: trimmed });

    if (this.answers.size >= this.questions.size) {
      this.state = 'guessing';
    }
    this.broadcastState();
    return { ok: true };
  }

  submitGuess(chooserId, guess) {
    if (this.state !== 'guessing') return { error: 'Fase de palpite não está ativa.' };
    if (chooserId !== this.currentChooserId) return { error: 'Só o jogador escolhido pode palpitar.' };
    const guessNum = Number(guess);
    if (!Number.isInteger(guessNum) || guessNum < CONFIG.NOTE_MIN || guessNum > CONFIG.NOTE_MAX) {
      return { error: 'Palpite inválido.' };
    }

    const correct = guessNum === this.currentNote;
    if (correct) {
      const chooser = this.players.get(chooserId);
      if (chooser) chooser.score += 1;
    }
    this.lastResult = { correct, guess: guessNum, note: this.currentNote, chooserId };
    this.state = 'reveal';
    this.broadcastState();
    return { ok: true };
  }

  /** Host avança pra próxima rodada, sorteando o próximo escolhido sem repetir o ciclo. */
  nextRound() {
    if (this.state !== 'reveal') return { error: 'Só é possível avançar após a revelação.' };
    this.round += 1;
    this._beginRound();
    return { ok: true };
  }

  /** Host encerra a partida a qualquer momento durante o jogo. */
  endGame() {
    if (this.state === 'lobby' || this.state === 'game_over') {
      return { error: 'Não há partida em andamento.' };
    }
    this.state = 'game_over';
    this.broadcastState();
    return { ok: true };
  }

  /** Reação rápida (emoji) na tela de revelação. Sem histórico — só um relay efêmero. */
  sendReaction(playerId, emoji) {
    if (this.state !== 'reveal') return;
    if (!CONFIG.REACTIONS.includes(emoji)) return;
    const player = this.players.get(playerId);
    if (!player) return;
    this.io.to(this.code).emit('reaction', {
      id: `${playerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerId,
      playerName: player.name,
      emoji,
    });
  }

  // ---------- Serialização ----------

  _questionsObject() {
    return Object.fromEntries(this.questions);
  }

  _answersObject() {
    return Object.fromEntries(this.answers);
  }

  /** A nota só é visível pra quem não é o escolhido da rodada (ou pra todos, no reveal/lobby/fim). */
  _noteFor(playerId) {
    if (this.state === 'lobby') return null;
    if (this.state === 'reveal' || this.state === 'game_over') return this.currentNote;
    return playerId === this.currentChooserId ? null : this.currentNote;
  }

  broadcastState() {
    const base = {
      phase: this.state,
      round: this.round,
      players: this.getPublicPlayers(),
      chooserId: this.currentChooserId,
      questions: this._questionsObject(),
      answers: this._answersObject(),
      result: this.state === 'reveal' ? this.lastResult : null,
    };
    for (const playerId of this.players.keys()) {
      this.io.to(playerId).emit('game_state', { ...base, note: this._noteFor(playerId) });
    }
  }

  getPublicPlayer(p) {
    return {
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
      isHost: p.id === this.hostId,
    };
  }

  getPublicPlayers() {
    return [...this.players.values()].map((p) => this.getPublicPlayer(p));
  }
}
