import { SettingsManager } from './app/settings.js';
import { BoardView } from './chess/board-view.js';
import { MoveHistoryView } from './chess/move-history.js';
import { GameController } from './app/game-controller.js';
import { UIController } from './app/ui-controller.js';

document.addEventListener('DOMContentLoaded', () => {
  const boardContainer = document.getElementById('board-container');
  const historyContainer = document.getElementById('history-container');

  const settings = new SettingsManager();
  const boardView = new BoardView(boardContainer);
  const historyView = new MoveHistoryView(historyContainer);

  let uiController = null;

  const gameController = new GameController({
    settings,
    boardView,
    historyView,
    onStateChange: (state) => {
      if (uiController) {
        uiController.updateState(state);
      }
    },
    onMetricsUpdate: (metrics) => {
      if (uiController) {
        uiController.updateMetrics(metrics);
      }
    }
  });

  uiController = new UIController({ settings, gameController });
  gameController.render();
});
