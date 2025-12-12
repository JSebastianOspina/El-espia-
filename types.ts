export interface Player {
  id: string;
  name: string;
  score: number;
}

export enum ViewState {
  SETUP = 'SETUP',
  PLAYER_PREVIEW = 'PLAYER_PREVIEW',
  WORD_SELECT = 'WORD_SELECT',
  REVEAL = 'REVEAL',
  IN_PROGRESS = 'IN_PROGRESS',
  RESULTS = 'RESULTS',
  LEADERBOARD = 'LEADERBOARD',
}

export interface RoundHistory {
  id: string;
  word: string;
  spyName: string;
  accusedName: string | null; // Null if "Nadie"
  spyGuessed: boolean;
  date: string;
}

export interface CurrentRound {
  word: string;
  spyId: string;
  revealIndex: number;
  isRevealed: boolean; // True if current player is looking at the card
}

export interface GameState {
  players: Player[];
  history: RoundHistory[];
  view: ViewState;
  currentRound: CurrentRound | null;
}