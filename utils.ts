import { Player } from './types';

// Parse comma separated string into players with duplicate handling
export const parsePlayers = (input: string): Player[] => {
  const rawNames = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  const players: Player[] = [];
  const nameCounts: Record<string, number> = {};

  rawNames.forEach(name => {
    let finalName = name;
    if (nameCounts[name]) {
      nameCounts[name]++;
      finalName = `${name} (${nameCounts[name]})`;
    } else {
      nameCounts[name] = 1;
    }
    
    players.push({
      id: crypto.randomUUID(),
      name: finalName,
      score: 0
    });
  });

  return players;
};

export const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};

export const getRandomSpy = (players: Player[]): string => {
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex].id;
};
