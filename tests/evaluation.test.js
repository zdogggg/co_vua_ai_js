import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { evaluatePosition, CHECKMATE_SCORE } from '../src/ai/evaluation.js';

describe('Chess Evaluation', () => {
  it('evaluates initial starting board with symmetric equality', () => {
    const chess = new Chess();
    const score = evaluatePosition(chess);
    expect(score).toBe(0);
  });

  it('gives positive score when White is ahead in material', () => {
    // White has an extra Queen
    const chess = new Chess('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const score = evaluatePosition(chess);
    expect(score).toBeGreaterThan(0);
  });

  it('gives negative score when Black is ahead in material', () => {
    // Black has an extra Queen (White lost queen)
    const chess = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR b KQkq - 0 1');
    const score = evaluatePosition(chess);
    expect(score).toBeLessThan(0);
  });

  it('detects checkmate for terminal positions', () => {
    // Scholar's mate: White checkmated Black (Black to move)
    const chess = new Chess('r1bqkb1r/pppp1Qpp/2n5/4p3/2B1n3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4');
    expect(chess.isCheckmate()).toBe(true);
    const score = evaluatePosition(chess);
    expect(score).toBe(CHECKMATE_SCORE);
  });

  it('detects stalemate as 0 score draw', () => {
    // Stalemate position: Black king on a8, White queen on c7, White king on c8. Black to move, no legal moves, not in check.
    const chess = new Chess('k7/2Q5/2K5/8/8/8/8/8 b - - 0 1');
    expect(chess.isGameOver()).toBe(true);
    expect(chess.isCheckmate()).toBe(false);
    expect(evaluatePosition(chess)).toBe(0);
  });
});
