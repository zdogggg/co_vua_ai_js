import { Chess } from 'chess.js';
import { GameMode } from './settings.js';
import { findBestMove } from '../ai/ai-service.js';
import { evaluatePosition } from '../ai/evaluation.js';
import { getGameStatus } from '../chess/game-status.js';

const START_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const MATERIAL = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export class GameController {
  constructor({ settings, boardView, historyView, onStateChange, onMetricsUpdate }) {
    this.settings = settings;
    this.boardView = boardView;
    this.historyView = historyView;
    this.onStateChange = onStateChange || (() => {});
    this.onMetricsUpdate = onMetricsUpdate || (() => {});

    this.chess = new Chess();
    this.isAiThinking = false;
    this.isPaused = false;
    this.aiTimer = null;
    this.selectedSquare = null;
    this.currentLegalMoves = [];

    // Incremented on every New Game / Undo. An AI search started for an older
    // position compares its id and throws its result away instead of playing it.
    this.positionId = 0;

    // Connect board click callback
    this.boardView.onSquareClick = this.handleSquareClick.bind(this);

    // Subscribe to settings changes
    this.settings.subscribe((key) => {
      if (key === 'isBoardFlipped' || key === '*') {
        this.boardView.setFlipped(this.settings.get('isBoardFlipped'));
        this.render();
      }
    });

    this.init();
  }

  init() {
    this.boardView.setFlipped(this.settings.get('isBoardFlipped'));
    this.render();
  }

  startNewGame() {
    this.cancelPendingAi();
    this.isPaused = false;
    this.chess.reset();
    this.clearSelection();
    this.render();

    this.checkNextTurn();
  }

  /** Stops any scheduled or running AI search and invalidates its result. */
  cancelPendingAi() {
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    this.positionId++;
    this.isAiThinking = false;
    this.boardView.hidePromotionModal();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.currentLegalMoves = [];
  }

  findKingSquare(color) {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === color) {
          return `${String.fromCharCode(97 + c)}${8 - r}`;
        }
      }
    }
    return null;
  }

  /**
   * Pieces each side has lost, derived from what is left on the board
   * (works for promotions too: a promoted pawn counts as the new piece).
   */
  getCapturedPieces() {
    const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
    for (const row of this.chess.board()) {
      for (const p of row) {
        if (p && p.type !== 'k') counts[p.color][p.type]++;
      }
    }

    const lost = { w: [], b: [] };
    let material = { w: 0, b: 0 };
    for (const color of ['w', 'b']) {
      for (const type of ['q', 'r', 'b', 'n', 'p']) {
        const missing = Math.max(0, START_COUNTS[type] - counts[color][type]);
        for (let i = 0; i < missing; i++) lost[color].push(type);
        material[color] += counts[color][type] * MATERIAL[type];
      }
    }
    // lost.w = white pieces captured by Black, shown next to Black's name (and vice versa)
    return { lost, materialDiff: material.w - material.b };
  }

  render() {
    const boardMatrix = this.chess.board();
    const checkSquare = this.chess.inCheck() ? this.findKingSquare(this.chess.turn()) : null;

    this.boardView.setHighlights({
      selected: this.selectedSquare,
      legalMoves: this.currentLegalMoves,
      lastMove: this.getLastMoveVerbose(),
      checkSquare
    });

    this.boardView.render(boardMatrix);
    this.historyView.setMoves(this.chess.history());

    this.onStateChange({
      status: getGameStatus(this.chess),
      isAiThinking: this.isAiThinking,
      isPaused: this.isPaused,
      turn: this.chess.turn(),
      mode: this.settings.get('gameMode'),
      playerColor: this.settings.get('playerColor'),
      flipped: this.settings.get('isBoardFlipped'),
      captured: this.getCapturedPieces(),
      evalScore: evaluatePosition(this.chess),
      canUndo: this.chess.history().length > 0
    });
  }

  getLastMoveVerbose() {
    const history = this.chess.history({ verbose: true });
    if (history.length > 0) {
      const last = history[history.length - 1];
      return { from: last.from, to: last.to };
    }
    return null;
  }

  isHumanTurn() {
    if (this.chess.isGameOver()) return false;
    const mode = this.settings.get('gameMode');
    if (mode === GameMode.PLAYER_VS_PLAYER) return true;
    if (mode === GameMode.AI_VS_AI) return false;

    // Player vs AI
    const playerColor = this.settings.get('playerColor');
    return this.chess.turn() === playerColor;
  }

  handleSquareClick(square) {
    if (this.isAiThinking || !this.isHumanTurn()) {
      return;
    }

    const piece = this.chess.get(square);
    const currentTurn = this.chess.turn();

    // 1. If clicking a friendly piece, select it (clicking it again deselects)
    if (piece && piece.color === currentTurn) {
      if (this.selectedSquare === square) {
        this.clearSelection();
      } else {
        this.selectedSquare = square;
        this.currentLegalMoves = this.chess.moves({ square, verbose: true });
      }
      this.render();
      return;
    }

    // 2. If a square is already selected, try to move to clicked square
    if (this.selectedSquare) {
      const from = this.selectedSquare;
      const chosenMove = this.currentLegalMoves.find(m => m.to === square);
      if (chosenMove) {
        // Check for promotion. Capture from/to now: the selection may change before the user picks.
        if (chosenMove.promotion) {
          this.boardView.showPromotionModal(currentTurn, (promotionPiece) => {
            this.executeMove({ from, to: square, promotion: promotionPiece });
          });
          return;
        }

        this.executeMove({ from, to: square });
        return;
      }
    }

    // 3. Clicked empty square or illegal destination: deselect
    this.clearSelection();
    this.render();
  }

  executeMove(moveObj) {
    try {
      const move = this.chess.move(moveObj);
      if (move) {
        this.clearSelection();
        this.render();

        this.checkNextTurn();
      }
    } catch (err) {
      console.warn('Illegal move attempted:', err);
    }
  }

  checkNextTurn() {
    if (this.chess.isGameOver() || this.isPaused) {
      this.render();
      return;
    }

    const mode = this.settings.get('gameMode');
    if (mode === GameMode.AI_VS_AI) {
      this.aiTimer = setTimeout(() => this.makeAIMove(), this.settings.get('aiDelayMs'));
    } else if (mode === GameMode.PLAYER_VS_AI && !this.isHumanTurn()) {
      // Delay slightly so the player's move is painted before the AI starts
      this.aiTimer = setTimeout(() => this.makeAIMove(), 50);
    }
  }

  async makeAIMove() {
    this.aiTimer = null;
    if (this.chess.isGameOver()) return;

    const requestId = this.positionId;
    this.isAiThinking = true;
    this.render();

    const algorithm = this.settings.get('algorithm');
    const depth = Number(this.settings.get('depth'));
    const useMoveOrdering = Boolean(this.settings.get('useMoveOrdering'));

    try {
      const result = await findBestMove(this.chess.fen(), {
        algorithm,
        depth,
        useMoveOrdering
      });

      // New game / undo happened while searching: this result is for an old position
      if (requestId !== this.positionId) return;

      this.isAiThinking = false;

      if (result && result.bestMove) {
        this.chess.move(result.bestMove);
        this.onMetricsUpdate({
          algorithm,
          depth,
          bestMove: result.bestMove.san || `${result.bestMove.from}-${result.bestMove.to}`,
          score: result.bestScore,
          nodes: result.nodesVisited,
          cutoffs: result.cutoffs ?? 0,
          branchesPruned: result.branchesPruned ?? 0,
          timeMs: Number(result.timeMs.toFixed(1)),
          nps: Math.round(result.nodesVisited / (Math.max(result.timeMs, 1) / 1000))
        });
      }

      this.render();
      this.checkNextTurn();
    } catch (err) {
      if (requestId !== this.positionId) return;
      console.error('Error during AI move execution:', err);
      this.isAiThinking = false;
      this.render();
    }
  }

  undo() {
    if (this.chess.history().length === 0) return;
    this.cancelPendingAi();

    const mode = this.settings.get('gameMode');
    if (mode === GameMode.PLAYER_VS_AI) {
      // Undo both AI move and Player move, so it is the player's turn again
      this.chess.undo();
      if (!this.isHumanTurn() && this.chess.history().length > 0) {
        this.chess.undo();
      }
    } else {
      this.chess.undo();
      // In AI vs AI, stepping back pauses the game so it can be inspected
      if (mode === GameMode.AI_VS_AI) this.isPaused = true;
    }

    this.clearSelection();
    this.render();

    // e.g. player is Black and undid back to the start: the AI (White) must move again
    this.checkNextTurn();
  }

  togglePause() {
    if (this.isPaused) {
      this.isPaused = false;
      this.render();
      this.checkNextTurn();
    } else {
      this.cancelPendingAi();
      this.isPaused = true;
      this.render();
    }
  }

  flipBoard() {
    const current = this.settings.get('isBoardFlipped');
    this.settings.set('isBoardFlipped', !current);
  }
}
