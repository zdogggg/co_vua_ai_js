import { Chess } from 'chess.js';
import { GameMode } from './settings.js';
import { findBestMove } from '../ai/ai-service.js';
import { getGameStatus } from '../chess/game-status.js';

export class GameController {
  constructor({ settings, boardView, historyView, onStatusChange, onMetricsUpdate }) {
    this.settings = settings;
    this.boardView = boardView;
    this.historyView = historyView;
    this.onStatusChange = onStatusChange || (() => {});
    this.onMetricsUpdate = onMetricsUpdate || (() => {});

    this.chess = new Chess();
    this.isAiThinking = false;
    this.aiLoopTimer = null;

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
    this.stopAiLoop();
    this.chess.reset();
    this.boardView.setHighlights({ selected: null, legalMoves: [], lastMove: null, checkSquare: null });
    this.historyView.setMoves([]);
    this.render();

    this.checkNextTurn();
  }

  stopAiLoop() {
    if (this.aiLoopTimer) {
      clearTimeout(this.aiLoopTimer);
      this.aiLoopTimer = null;
    }
  }

  render() {
    const boardMatrix = this.chess.board();
    
    // Find King in check square if in check
    let checkSquare = null;
    if (this.chess.inCheck()) {
      const turn = this.chess.turn();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = boardMatrix[r][c];
          if (p && p.type === 'k' && p.color === turn) {
            const file = String.fromCharCode(97 + c);
            const rank = 8 - r;
            checkSquare = `${file}${rank}`;
            break;
          }
        }
        if (checkSquare) break;
      }
    }

    const lastMove = this.getLastMoveVerbose();
    this.boardView.setHighlights({
      selected: this.selectedSquare,
      legalMoves: this.currentLegalMoves || [],
      lastMove,
      checkSquare
    });

    this.boardView.render(boardMatrix);
    this.historyView.setMoves(this.chess.history());
    this.onStatusChange(getGameStatus(this.chess), this.isAiThinking);
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

    // 1. If clicking a friendly piece, select it
    if (piece && piece.color === currentTurn) {
      this.selectedSquare = square;
      this.currentLegalMoves = this.chess.moves({ square, verbose: true });
      this.render();
      return;
    }

    // 2. If a square is already selected, try to move to clicked square
    if (this.selectedSquare) {
      const chosenMove = (this.currentLegalMoves || []).find(m => m.to === square);
      if (chosenMove) {
        // Check for promotion
        if (chosenMove.promotion) {
          this.boardView.showPromotionModal(currentTurn, (promotionPiece) => {
            this.executeMove({
              from: this.selectedSquare,
              to: square,
              promotion: promotionPiece
            });
          });
          return;
        }

        this.executeMove({
          from: this.selectedSquare,
          to: square
        });
        return;
      }
    }

    // 3. Clicked empty square or illegal destination: deselect
    this.selectedSquare = null;
    this.currentLegalMoves = [];
    this.render();
  }

  executeMove(moveObj) {
    try {
      const move = this.chess.move(moveObj);
      if (move) {
        this.selectedSquare = null;
        this.currentLegalMoves = [];
        this.render();

        this.checkNextTurn();
      }
    } catch (err) {
      console.warn('Illegal move attempted:', err);
    }
  }

  checkNextTurn() {
    if (this.chess.isGameOver()) {
      this.render();
      return;
    }

    const mode = this.settings.get('gameMode');
    if (mode === GameMode.AI_VS_AI) {
      this.aiLoopTimer = setTimeout(() => this.makeAIMove(), this.settings.get('aiDelayMs'));
    } else if (mode === GameMode.PLAYER_VS_AI && !this.isHumanTurn()) {
      // Delay slightly for natural responsiveness
      setTimeout(() => this.makeAIMove(), 50);
    }
  }

  async makeAIMove() {
    if (this.chess.isGameOver()) return;

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
          nps: Math.round(result.nodesVisited / ((result.timeMs || 1) / 1000))
        });
      }

      this.render();
      this.checkNextTurn();
    } catch (err) {
      console.error('Error during AI move execution:', err);
      this.isAiThinking = false;
      this.render();
    }
  }

  undo() {
    if (this.isAiThinking) return;
    this.stopAiLoop();

    const mode = this.settings.get('gameMode');
    if (mode === GameMode.PLAYER_VS_AI) {
      // Undo both AI move and Player move
      this.chess.undo();
      if (!this.isHumanTurn()) {
        this.chess.undo();
      }
    } else {
      this.chess.undo();
    }

    this.selectedSquare = null;
    this.currentLegalMoves = [];
    this.render();
  }

  flipBoard() {
    const current = this.settings.get('isBoardFlipped');
    this.settings.set('isBoardFlipped', !current);
  }
}
