import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

describe('Chess Rules Compliance', () => {
  it('handles en passant capture correctly', () => {
    // White pawn on e5, Black plays d7-d5. White can capture e5xd6 e.p.
    const chess = new Chess('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    const move = chess.move({ from: 'e5', to: 'd6' });
    expect(move).toBeDefined();
    expect(move.captured).toBe('p');
  });

  it('handles kingside and queenside castling', () => {
    // White can castle kingside or queenside
    const chess = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const legalMoves = chess.moves({ verbose: true });
    const castles = legalMoves.filter(m => m.san === 'O-O' || m.san === 'O-O-O');
    expect(castles.length).toBe(2);
  });

  it('handles pawn promotion', () => {
    // White pawn on a7 ready to promote to Queen
    const chess = new Chess('8/P7/8/8/8/8/8/4K2k w - - 0 1');
    const move = chess.move({ from: 'a7', to: 'a8', promotion: 'q' });
    expect(move).toBeDefined();
    expect(move.promotion).toBe('q');
    expect(chess.get('a8').type).toBe('q');
  });
});
