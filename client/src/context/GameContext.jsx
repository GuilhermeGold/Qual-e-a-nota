import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
import { PHASES } from '../constants.js';

const GameContext = createContext(null);
const STORAGE_KEY = 'qualEaNota.session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function GameProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected);
  const [reconnecting, setReconnecting] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [myId, setMyId] = useState(socket.id ?? null);
  const [hostId, setHostId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [phase, setPhase] = useState(PHASES.LOBBY);
  const [round, setRound] = useState(0);
  const [chooserId, setChooserId] = useState(null);
  const [note, setNote] = useState(null);
  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [answerGuesses, setAnswerGuesses] = useState({});
  const [suggestedGuess, setSuggestedGuess] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [guessSuspense, setGuessSuspense] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const sessionRef = useRef(loadSession());
  const suspenseTimerRef = useRef(null);

  const resetGameState = useCallback(() => {
    setPhase(PHASES.LOBBY);
    setRound(0);
    setChooserId(null);
    setNote(null);
    setQuestions({});
    setAnswers({});
    setAnswerGuesses({});
    setSuggestedGuess(null);
    setResult(null);
    setStreak(0);
    setBestStreak(0);
  }, []);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      setMyId(socket.id);
      const saved = sessionRef.current;
      if (saved?.roomCode && saved?.playerId) {
        setReconnecting(true);
        socket.emit('rejoin_room', { roomCode: saved.roomCode, playerId: saved.playerId });
      }
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onRoomCreated({ roomCode: code, playerId }) {
      sessionRef.current = { roomCode: code, playerId };
      saveSession(sessionRef.current);
      setRoomCode(code);
      setError(null);
      resetGameState();
    }

    function onRoomJoined({ players: list, hostId: host, phase: roomPhase }) {
      setReconnecting(false);
      setPlayers(list);
      setHostId(host);
      if (roomPhase === PHASES.LOBBY) resetGameState();
      else if (roomPhase) setPhase(roomPhase);
      const code = sessionRef.current?.roomCode;
      if (code) {
        setRoomCode(code);
        sessionRef.current = { roomCode: code, playerId: socket.id };
        saveSession(sessionRef.current);
      }
      setError(null);
    }

    function onGameStarted() {
      setError(null);
    }

    function onGameState(state) {
      setPhase(state.phase);
      setRound(state.round);
      setPlayers(state.players);
      setChooserId(state.chooserId);
      setNote(state.note);
      setQuestions(state.questions || {});
      setAnswers(state.answers || {});
      setAnswerGuesses(state.answerGuesses || {});
      setSuggestedGuess(state.suggestedGuess ?? null);
      setResult(state.result || null);
      setStreak(state.streak ?? 0);
      setBestStreak(state.bestStreak ?? 0);
      if (state.phase !== PHASES.GUESSING && state.phase !== PHASES.REVEAL) {
        clearTimeout(suspenseTimerRef.current);
        setGuessSuspense(false);
      }
    }

    function onReaction(reaction) {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2200);
    }

    function onPlayerKicked({ playerId }) {
      if (playerId === sessionRef.current?.playerId) {
        clearSession();
        sessionRef.current = null;
        setRoomCode(null);
        resetGameState();
        setError('Você foi removido da sala.');
      }
    }

    function onError({ message }) {
      setError(message);
      setReconnecting(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('game_started', onGameStarted);
    socket.on('game_state', onGameState);
    socket.on('player_kicked', onPlayerKicked);
    socket.on('error', onError);
    socket.on('reaction', onReaction);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('game_started', onGameStarted);
      socket.off('game_state', onGameState);
      socket.off('player_kicked', onPlayerKicked);
      socket.off('error', onError);
      socket.off('reaction', onReaction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoom = useCallback((playerName) => {
    setError(null);
    socket.emit('create_room', { playerName });
  }, []);

  const joinRoom = useCallback((code, playerName) => {
    setError(null);
    sessionRef.current = { roomCode: code.toUpperCase(), playerId: socket.id };
    socket.emit('join_room', { roomCode: code.toUpperCase(), playerName });
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start_game', { roomCode });
  }, [roomCode]);

  const submitQuestions = useCallback(
    (questionsByTarget) => {
      socket.emit('submit_questions', { roomCode, questions: questionsByTarget });
    },
    [roomCode]
  );

  const submitAnswer = useCallback(
    (text) => {
      socket.emit('submit_answer', { roomCode, text });
    },
    [roomCode]
  );

  const submitAnswerRatings = useCallback(
    (ratingsByTarget) => {
      socket.emit('submit_answer_ratings', { roomCode, ratings: ratingsByTarget });
    },
    [roomCode]
  );

  const submitGuess = useCallback(
    (guess) => {
      socket.emit('submit_guess', { roomCode, guess });
      setGuessSuspense(true);
      clearTimeout(suspenseTimerRef.current);
      suspenseTimerRef.current = setTimeout(() => setGuessSuspense(false), 1400);
    },
    [roomCode]
  );

  const sendReaction = useCallback(
    (emoji) => {
      socket.emit('send_reaction', { roomCode, emoji });
    },
    [roomCode]
  );

  const nextRound = useCallback(() => {
    socket.emit('next_round', { roomCode });
  }, [roomCode]);

  const endGame = useCallback(() => {
    socket.emit('end_game', { roomCode });
  }, [roomCode]);

  const restartGame = useCallback(() => {
    socket.emit('restart_game', { roomCode });
  }, [roomCode]);

  const kickPlayer = useCallback(
    (playerId) => {
      socket.emit('kick_player', { roomCode, playerId });
    },
    [roomCode]
  );

  const leaveRoom = useCallback(() => {
    clearSession();
    sessionRef.current = null;
    setRoomCode(null);
    resetGameState();
    setPlayers([]);
    setHostId(null);
    socket.disconnect();
    socket.connect();
  }, [resetGameState]);

  const value = {
    connected,
    reconnecting,
    roomCode,
    myId,
    hostId,
    players,
    phase,
    round,
    chooserId,
    note,
    questions,
    answers,
    answerGuesses,
    suggestedGuess,
    result,
    error,
    guessSuspense,
    reactions,
    streak,
    bestStreak,
    displayPhase: phase === PHASES.REVEAL && guessSuspense ? PHASES.GUESSING : phase,
    isHost: myId != null && hostId === myId,
    isChooser: myId != null && chooserId === myId,
    createRoom,
    joinRoom,
    startGame,
    submitQuestions,
    submitAnswer,
    submitAnswerRatings,
    submitGuess,
    nextRound,
    endGame,
    restartGame,
    kickPlayer,
    leaveRoom,
    sendReaction,
    clearError: () => setError(null),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de GameProvider');
  return ctx;
}
