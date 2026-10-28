import { describe, it, expect } from 'vitest';
import { BENCHMARK_POSITIONS, runBenchmarkComparison } from '../src/analysis/benchmark.js';

describe('Benchmark Suite', () => {
  it('runs benchmark comparison and generates valid metrics', () => {
    const pos = BENCHMARK_POSITIONS[3]; // Pawn endgame
    const result = runBenchmarkComparison(pos.fen, 2, true);

    expect(result.minimax.nodes).toBeGreaterThan(0);
    expect(result.alphaBeta.nodes).toBeGreaterThan(0);
    expect(result.alphaBeta.nodes).toBeLessThanOrEqual(result.minimax.nodes);
    expect(result.savingsPercent).toBeGreaterThanOrEqual(0);
    expect(result.minimax.bestMove).toBeDefined();
    expect(result.alphaBeta.bestMove).toBeDefined();
  });
});
