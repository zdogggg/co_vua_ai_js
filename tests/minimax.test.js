import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { minimaxSearch } from '../src/ai/minimax.js';

describe('Minimax Search', () => {
  it('does not mutate original chess board after search', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const chess = new Chess(fen);
    minimaxSearch(chess, 2);
    expect(chess.fen()).toBe(fen);
  });

  it('finds mate in 1 move for White', () => {
    // Scholar's mate setup: White Queen on f3, Bishop on c4, ready to play Qxf7#
    const chess = new Chess('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1');
    const result = minimaxSearch(chess, 2);
    expect(result.bestMove).toBeDefined();
    expect(result.bestMove.san).toBe('Qxf7#');
  });

  it('visits nodes and records elapsed time', () => {
    const chess = new Chess();
    const result = minimaxSearch(chess, 2);
    expect(result.nodesVisited).toBeGreaterThan(20);
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
  });
});
