export const PHASES = {
  LOBBY: 'lobby',
  ASSIGNING: 'assigning',
  ANSWERING: 'answering',
  GUESSING: 'guessing',
  REVEAL: 'reveal',
  GAME_OVER: 'game_over',
};

export const NOTE_MIN = 1;
export const NOTE_MAX = 10;

export const QUESTION_BANK = [
  'Qual é a sua comida favorita?',
  'Qual filme você reveria de novo sem pensar duas vezes?',
  'Qual lugar do mundo você mais quer visitar?',
  'Que super-herói você seria?',
  'Qual animal de estimação você teria?',
  'Qual sobremesa você escolheria numa festa?',
  'Qual estação do ano você prefere?',
  'Qual é o seu jeito favorito de viajar?',
  'Que música está tocando na sua cabeça agora?',
  'Qual profissão (além da sua) você mais admira?',
  'Qual esporte você mais gosta de assistir?',
  'Qual seria seu último prato antes de um jejum?',
  'Que tipo de festa você mais curte?',
  'Qual série você maratonaria de novo?',
  'Qual seu personagem de desenho favorito?',
  'Qual cheiro te deixa mais feliz na hora?',
  'Qual seu jeito ideal de passar um domingo?',
  'Qual bebida você pediria num bar?',
  'Qual seria seu talento escondido?',
  'Qual seu emoji mais usado?',
];

export function pickRandomQuestion(excluded = []) {
  const available = QUESTION_BANK.filter((q) => !excluded.includes(q));
  const pool = available.length > 0 ? available : QUESTION_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}
