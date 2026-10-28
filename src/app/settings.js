export const GameMode = {
  PLAYER_VS_AI: 'player-vs-ai',
  AI_VS_AI: 'ai-vs-ai',
  PLAYER_VS_PLAYER: 'player-vs-player'
};

export const defaultSettings = {
  gameMode: GameMode.PLAYER_VS_AI,
  playerColor: 'w', // 'w' or 'b'
  algorithm: 'alphabeta', // 'alphabeta' or 'minimax'
  depth: 3, // 1 to 4
  useMoveOrdering: true,
  isBoardFlipped: false,
  aiDelayMs: 300 // pause between AI moves in AI vs AI
};

export class SettingsManager {
  constructor(initial = {}) {
    this.settings = { ...defaultSettings, ...initial };
    this.listeners = new Set();
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.notify(key, value);
  }

  update(newSettings) {
    Object.assign(this.settings, newSettings);
    this.notify('*', this.settings);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(key, value) {
    for (const listener of this.listeners) {
      try {
        listener(key, value, this.settings);
      } catch (err) {
        console.error('Settings listener error:', err);
      }
    }
  }
}
