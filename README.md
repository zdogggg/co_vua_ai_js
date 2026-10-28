# Trò chơi Cờ Vua AI (JavaScript) ♟️🤖

Dự án game cờ vua trên nền web được xây dựng bằng JavaScript thuần (ES Modules), Vite và triển khai thuật toán trí tuệ nhân tạo **Minimax** cùng **Alpha-Beta Pruning** với bảng phân tích hiệu năng thực tế.

🔗 **GitHub Repository:** [https://github.com/zdogggg/co_vua_ai_js.git](https://github.com/zdogggg/co_vua_ai_js.git)

---

## 🌟 Tính năng nổi bật

### 1. Trò chơi Cờ vua
* **Chế độ chơi đa dạng:**
  * Người vs AI (Chọn cầm quân Trắng hoặc Đen).
  * AI vs AI (Tự động đấu với nhau để xem hai thuật toán đối đầu).
  * Người vs Người (Chơi 2 người trên cùng 1 máy).
* **Luật chơi quốc tế:** Nhập thành (Kingside & Queenside), bắt tốt qua đường (*En Passant*), phong cấp quân cờ (Hậu, Xe, Tượng, Mã), phát hiện chiếu, chiếu hết và các điều kiện hòa (hòa bí, lặp 3 lần, luật 50 nước, thiếu quân).
* **Giao diện hiện đại & tương tác mượt mà:**
  * Bàn cờ SVG sắc nét mọi độ phân giải.
  * Tô sáng ô chọn, nước đi hợp lệ, nước đi cuối cùng và Vua bị chiếu.
  * Hỗ trợ lật bàn cờ và đi lại (Undo).

### 2. Thuật toán AI Tự Phát Triển
* **Nguyên tắc cốt lõi:** Không sử dụng Stockfish hay bất kỳ engine bên ngoài nào.
* **Hàm đánh giá (Heuristic Evaluation):**
  * Điểm vật chất (Material value: Tốt 100, Mã 320, Tượng 330, Xe 500, Hậu 900).
  * Bảng vị trí quân cờ (Piece-Square Tables - PST) thưởng kiểm soát trung tâm và an toàn vua.
  * Điểm chiếu hết có tính toán độ sâu để AI chọn đường chiếu hết ngắn nhất.
* **Minimax:** Duyệt toàn bộ không gian trạng thái ở độ sâu chỉ định.
* **Alpha-Beta Pruning:** Cắt tỉa các nhánh không tối ưu với điều kiện $\alpha \ge \beta$.
* **Sắp xếp nước đi (Move Ordering):** Áp dụng kỹ thuật MVV-LVA (*Most Valuable Victim - Least Valuable Attacker*) để tối đa hóa số lần cắt tỉa nhánh của Alpha-Beta.
* **Web Worker:** AI suy nghĩ trên luồng riêng, không làm đơ giao diện người dùng.

### 3. Bảng Phân Tích & Benchmark Thực Tế
* Đếm số node đã duyệt, số lần cắt tỉa, số nhánh con bỏ qua, thời gian suy nghĩ (ms) và tốc độ duyệt (nps).
* **Tab Benchmark:** Chạy thử nghiệm độc lập trên cùng thế cờ (FEN) và cùng độ sâu giữa Minimax và Alpha-Beta để chứng minh tỷ lệ tiết kiệm node (%) và độ tăng tốc (speedup).

---

## 📁 Cấu trúc thư mục

```text
co_vua_ai_js/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── PLAN_co_vua_AI_JavaScript.md
├── .gitignore
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js
│   ├── app/
│   │   ├── game-controller.js
│   │   ├── ui-controller.js
│   │   └── settings.js
│   ├── chess/
│   │   ├── board-view.js
│   │   ├── pieces.js
│   │   ├── move-history.js
│   │   └── game-status.js
│   ├── ai/
│   │   ├── evaluation.js
│   │   ├── move-ordering.js
│   │   ├── minimax.js
│   │   ├── alpha-beta.js
│   │   ├── search-worker.js
│   │   └── ai-service.js
│   ├── analysis/
│   │   └── benchmark.js
│   └── styles/
│       ├── base.css
│       ├── board.css
│       └── panels.css
└── tests/
    ├── chess-rules.test.js
    ├── evaluation.test.js
    ├── minimax.test.js
    ├── alpha-beta.test.js
    └── benchmark.test.js
```

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### 1. Yêu cầu
* Đã cài đặt **Node.js** (khuyến nghị phiên bản 18+ hoặc 20 LTS).

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Trình duyệt sẽ tự động mở tại `http://localhost:3000`.

### 4. Chạy bộ kiểm thử tự động (Unit Tests)
```bash
npm test
```

### 5. Đóng gói triển khai (Build Production)
```bash
npm run build
```
Thư mục xuất bản: `dist/`.

---

## 🧪 Kết quả kiểm thử tự động (Vitest)
Tất cả 16 kịch bản kiểm thử đều đã vượt qua:
* Kiểm tra luật cờ: Phong cấp, bắt tốt qua đường, nhập thành 2 cánh.
* Hàm đánh giá đối xứng ở khai cuộc, tính đúng điểm ưu thế và phát hiện chiếu hết/hòa bí.
* Minimax tìm đúng nước chiếu hết (Mate in 1), không làm thay đổi trạng thái bàn cờ ban đầu.
* Alpha-Beta cho ra cùng điểm tối ưu như Minimax, đồng thời cắt giảm số node duyệt rõ rệt.
