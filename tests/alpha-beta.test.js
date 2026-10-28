import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { minimaxSearch } from '../src/ai/minimax.js';
import { alphaBetaSearch } from '../src/ai/alpha-beta.js';

describe('Alpha-Beta Search', () => {
  it('does not mutate original chess board after search', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const chess = new Chess(fen);
    alphaBetaSearch(chess, 2);
    expect(chess.fen()).toBe(fen);
  });

  it('yields the exact same optimal score as Minimax on identical depth', () => {
    // Testing on a standard position at depth 2 (no move ordering so search order matches minimax)
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
    const chess1 = new Chess(fen);
    const chess2 = new Chess(fen);

    const mmResult = minimaxSearch(chess1, 2);
    const abResult = alphaBetaSearch(chess2, 2, false);

    expect(abResult.bestScore).toBe(mmResult.bestScore);
  });

  it('prunes branches and visits fewer or equal nodes compared to Minimax', () => {
    // Endgame or small branching position for ultra-fast comparison
    const fen = '8/2p5/4k3/8/8/4K3/8/8 w - - 0 1';
    const chess1 = new Chess(fen);
    const chess2 = new Chess(fen);

    const mmResult = minimaxSearch(chess1, 3);
    const abResult = alphaBetaSearch(chess2, 3, true);

    expect(abResult.nodesVisited).toBeLessThanOrEqual(mmResult.nodesVisited);
  }, 10000);

  it('finds mate in 1 move for White', () => {
    const chess = new Chess('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1');
    const result = alphaBetaSearch(chess, 2);
    expect(result.bestMove).toBeDefined();
    expect(result.bestMove.san).toBe('Qxf7#');
  });
});
