# Kế hoạch dự án: Game cờ vua AI bằng JavaScript

## 1. Tổng quan

**Mục tiêu:** Xây dựng game cờ vua chạy trên trình duyệt với giao diện hiện đại, AI tự triển khai bằng Minimax và Alpha-Beta Pruning, có bảng phân tích thuật toán để trình bày đồ án và có thể deploy lên GitHub Pages.

**Nguyên tắc cốt lõi**
- Tự viết hàm đánh giá thế cờ, Minimax và Alpha-Beta Pruning.
- Không dùng Stockfish, Stockfish WASM hoặc engine bên ngoài để quyết định nước đi.
- Có thể dùng `chess.js` cho luật cờ, nước đi hợp lệ, trạng thái ván và FEN/SAN.
- Đo hiệu năng thực tế; không ghi số liệu benchmark giả định thành kết quả thật.

## 2. Tính năng

### Game
- Chơi người với AI.
- Chọn bên Trắng/Đen và độ sâu tìm kiếm.
- Chọn Minimax hoặc Alpha-Beta Pruning.
- Chế độ AI đấu với AI.
- Hiển thị nước đi hợp lệ, nước cuối cùng, lịch sử nước đi và trạng thái ván.
- Hỗ trợ nhập thành, bắt tốt qua đường, phong cấp, chiếu, chiếu hết và hòa.
- Nút ván mới, hoàn tác, lật bàn cờ và chọn quân phong cấp.

### Phân tích thuật toán
- Hiển thị thuật toán đang chạy, độ sâu, nước đi được chọn và điểm đánh giá.
- Đếm node đã duyệt, node bị cắt tỉa và thời gian suy nghĩ.
- Benchmark trên cùng vị trí, cùng độ sâu và cùng hàm đánh giá.
- Bảng/biểu đồ so sánh Minimax với Alpha-Beta.
- Chế độ minh họa cây tìm kiếm hoặc nhánh bị cắt để hỗ trợ bảo vệ đồ án.

## 3. Công nghệ

| Công nghệ | Vai trò |
|---|---|
| HTML | Cấu trúc trang |
| CSS | Giao diện, bàn cờ, responsive |
| JavaScript ES Modules | Logic game và thuật toán AI |
| Vite | Dev server và build |
| `chess.js` | Luật cờ, nước đi hợp lệ, trạng thái ván, FEN/SAN |
| Bàn cờ tự dựng hoặc thư viện hiển thị | Hiển thị và tương tác với quân cờ |
| Vitest | Kiểm thử thuật toán |
| Git/GitHub | Quản lý mã nguồn |
| GitHub Pages | Hosting web tĩnh |

**Ranh giới thư viện:** `chess.js` chỉ lo luật cờ và trạng thái. Thuật toán tự viết phải chọn nước đi dựa trên hàm đánh giá và tìm kiếm của project. Không dùng engine cờ bên ngoài làm AI.

## 4. Cấu trúc thư mục

```text
co-vua-ai/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── PLAN.md
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
│   │   ├── move-history.js
│   │   └── game-status.js
│   ├── ai/
│   │   ├── evaluation.js
│   │   ├── move-ordering.js
│   │   ├── minimax.js
│   │   ├── alpha-beta.js
│   │   └── search-worker.js
│   ├── analysis/
│   │   ├── benchmark.js
│   │   └── metrics.js
│   └── styles/
│       ├── base.css
│       ├── board.css
│       └── panels.css
└── tests/
    ├── evaluation.test.js
    ├── minimax.test.js
    ├── alpha-beta.test.js
    ├── chess-rules.test.js
    └── benchmark.test.js
```

Có thể bắt đầu với ít file hơn và tách dần theo nhu cầu; không cần tạo toàn bộ file rỗng từ ngày đầu.

## 5. Thiết kế giao diện

### Bàn cờ
- Bàn cờ 8×8 với màu ô sáng/tối rõ ràng.
- Quân cờ dễ nhận diện.
- Tô sáng ô đang chọn, nước đi cuối và ô đang bị chiếu.
- Gợi ý các ô có thể đi.
- Hộp chọn quân khi phong cấp.
- Hỗ trợ lật bàn cờ và màn hình nhỏ.

### Bảng điều khiển
- Trạng thái: bên nào đến lượt, chiếu, chiếu hết hoặc hòa.
- Chế độ: Người vs Minimax, Người vs Alpha-Beta, AI vs AI.
- Độ sâu tìm kiếm.
- Chọn bên người chơi.
- Ván mới, hoàn tác và lật bàn cờ.
- Lịch sử nước đi theo ký hiệu cờ vua.

### Bảng phân tích
- Thuật toán đang dùng.
- Độ sâu.
- Nước đi AI chọn.
- Điểm đánh giá.
- Thời gian suy nghĩ (ms).
- Số node đã thăm.
- Số lần cắt tỉa.
- Số node con bỏ qua và tỷ lệ tiết kiệm node.
- Cây tìm kiếm minh họa ở chế độ học tập.

### Hiệu năng giao diện
Bản đầu có thể chạy AI trực tiếp để dễ phát triển. Nếu tìm kiếm làm đơ trình duyệt, chuyển thuật toán sang Web Worker để UI vẫn phản hồi. Giới hạn độ sâu mặc định để tránh treo trang.

## 6. Thiết kế thuật toán

### 6.1. Hàm đánh giá — `evaluation.js`

Quy ước điểm: **dương có lợi cho Trắng, âm có lợi cho Đen**.

Giá trị quân khởi điểm tham khảo:

| Quân | Điểm |
|---|---:|
| Tốt | 100 |
| Mã | 320 |
| Tượng | 330 |
| Xe | 500 |
| Hậu | 900 |
| Vua | Xử lý riêng ở trạng thái kết thúc |

Các thành phần:
1. Tổng giá trị quân còn lại.
2. Thưởng nhỏ cho việc kiểm soát trung tâm.
3. Thưởng phát triển quân ở mức đơn giản.
4. Có thể thêm piece-square tables sau khi bản cơ bản hoạt động.

Không nên làm hàm đánh giá quá phức tạp trước khi Minimax chạy ổn định. Viết test để bảo đảm cùng vị trí luôn cho cùng kết quả.

### 6.2. Minimax — `minimax.js`

- Trắng là MAX, cố gắng tối đa hóa điểm.
- Đen là MIN, cố gắng tối thiểu hóa điểm.
- Nếu ván kết thúc, trả về điểm thắng/thua/hòa.
- Nếu đạt độ sâu 0, trả về hàm đánh giá.
- Duyệt các nước hợp lệ, mô phỏng từng nước, gọi đệ quy rồi hoàn tác.
- Lưu số node đã duyệt và thời gian.

Pseudocode:

```text
minimax(position, depth, maximizing):
    nodesVisited += 1

    if position is terminal:
        return terminalScore(position)

    if depth == 0:
        return evaluate(position)

    moves = legalMoves(position)

    if maximizing:
        best = -infinity
        for move in moves:
            apply(move)
            score = minimax(position, depth - 1, false)
            undo(move)
            best = max(best, score)
        return best
    else:
        best = +infinity
        for move in moves:
            apply(move)
            score = minimax(position, depth - 1, true)
            undo(move)
            best = min(best, score)
        return best
```

MAX/MIN phải nhất quán với quy ước điểm. Tránh lỗi để AI Đen cũng tối đa hóa điểm của Trắng. Khi có nhiều nước đồng điểm, có thể chọn nước đầu tiên theo thứ tự ổn định.

### 6.3. Alpha-Beta Pruning — `alpha-beta.js`

- `alpha`: điểm tốt nhất MAX đã bảo đảm.
- `beta`: điểm tốt nhất MIN đã bảo đảm.
- Khi `alpha >= beta`, phần còn lại của nhánh không thể thay đổi quyết định ở cấp trên và có thể bị cắt.

Pseudocode:

```text
alphaBeta(position, depth, alpha, beta, maximizing):
    nodesVisited += 1

    if position is terminal:
        return terminalScore(position)

    if depth == 0:
        return evaluate(position)

    moves = legalMoves(position)

    if maximizing:
        value = -infinity
        for move in moves:
            apply(move)
            score = alphaBeta(position, depth - 1, alpha, beta, false)
            undo(move)
            value = max(value, score)
            alpha = max(alpha, value)

            if alpha >= beta:
                cutoffs += 1
                break
        return value
    else:
        value = +infinity
        for move in moves:
            apply(move)
            score = alphaBeta(position, depth - 1, alpha, beta, true)
            undo(move)
            value = min(value, score)
            beta = min(beta, value)

            if alpha >= beta:
                cutoffs += 1
                break
        return value
```

Bộ đếm `cutoffs` có thể là số lần điều kiện cắt tỉa xảy ra. Nếu muốn thống kê số node con thực sự bị bỏ qua, phải đếm riêng số nước còn lại chưa duyệt tại mỗi lần cắt.

### 6.4. Trạng thái và hoàn tác

- Dùng `chess.js` làm nguồn trạng thái chuẩn.
- Mỗi nước thử phải được hoàn tác đúng cách; không để trạng thái bàn cờ bị thay đổi sau tìm kiếm.
- Bản đầu có thể sao chép trạng thái để dễ hiểu; phiên bản tối ưu có thể dùng `move()`/`undo()` với `try/finally`.
- Kiểm tra trạng thái kết thúc trước khi đánh giá lá độ sâu 0.
- Điểm chiếu hết nên có điều chỉnh theo độ sâu để ưu tiên thắng nhanh và trì hoãn thua.
- Xử lý trường hợp không còn nước đi hợp lệ.
- Không để AI đi khi ván đã kết thúc hoặc người chơi đang chọn phong cấp.

### 6.5. Sắp xếp nước đi

Phát triển theo từng bước:
1. Bản đầu giữ thứ tự nước đi từ thư viện luật.
2. Sau đó ưu tiên nước bắt quân có lợi, phong cấp và chiếu.
3. Benchmark Alpha-Beta có và không có sắp xếp nước đi.

Phải tách hai phép so sánh:
- **So sánh thuật toán thuần:** Minimax và Alpha-Beta cùng thứ tự nước đi.
- **So sánh cải tiến:** Alpha-Beta không sắp xếp với Alpha-Beta có sắp xếp.

Hai thuật toán có thể chọn nước đi khác nhau khi nhiều nước có cùng điểm. Khi đó, so sánh điểm tối ưu và tính hợp lệ, không bắt buộc nước đi phải giống hệt.

## 7. Benchmark và số liệu

Tạo `benchmark.js` với một tập FEN cố định:
- Vị trí khai cuộc.
- Vị trí giữa ván có nhiều nước hợp lệ.
- Vị trí có bắt quân.
- Vị trí chiến thuật.
- Vị trí tàn cuộc đơn giản.

Mỗi lượt ghi:
- FEN.
- Độ sâu.
- Thuật toán.
- Nước đi được chọn.
- Điểm.
- Số node đã thăm.
- Số lần cắt tỉa/số node con bỏ qua.
- Thời gian bằng `performance.now()`.

Công thức:
- **Tiết kiệm node (%)** = `(1 - nodesAlphaBeta / nodesMinimax) × 100`.
- **Tốc độ tương đối** = `timeMinimax / timeAlphaBeta`.

Chạy nhiều lượt và lấy trung vị thời gian nếu muốn giảm nhiễu. Không ghi số liệu giả vào báo cáo. Thời gian phụ thuộc máy, trình duyệt và tải hệ thống; Alpha-Beta thường giảm node nhưng không bảo đảm luôn nhanh hơn rõ rệt ở mọi vị trí.

## 8. Kiểm thử

### Luật và giao diện
- Nước hợp lệ được chấp nhận, nước không hợp lệ bị từ chối.
- Nhập thành hai phía.
- Bắt tốt qua đường.
- Phong cấp thành hậu, xe, tượng, mã.
- Chiếu, chiếu hết, hòa bí.
- Không đi tiếp khi ván đã kết thúc.
- Hoàn tác khôi phục đúng vị trí và lượt đi.
- Chọn quân Đen thì AI có thể đi trước nếu đến lượt AI.

### Minimax
- Trả về nước đi hợp lệ.
- Xử lý đúng trạng thái kết thúc.
- Chạy được ở độ sâu thấp.
- Không làm thay đổi vị trí đầu vào sau khi tìm kiếm.
- Đếm node lớn hơn 0.
- MAX/MIN đúng theo quy ước điểm.

### Alpha-Beta
- Trả nước đi hợp lệ.
- Không làm thay đổi vị trí đầu vào.
- Với cùng FEN, độ sâu, hàm đánh giá và thứ tự nước đi, giá trị tối ưu phải khớp Minimax.
- Với cùng thứ tự duyệt và cách đếm nhất quán, số node thăm không nên lớn hơn Minimax.
- Bộ đếm cắt tỉa tăng khi có nhánh bị cắt.

### Benchmark
- Cùng FEN và độ sâu cho cả hai thuật toán.
- Số liệu được đo khi chạy, không hard-code.
- Chạy benchmark không làm thay đổi ván đang chơi.

## 9. Kế hoạch triển khai theo giai đoạn

### Giai đoạn 1 — Khởi tạo
- Cài Node.js LTS.
- Tạo project Vite vanilla JavaScript.
- Cài `chess.js` và Vitest.
- Chạy trang mặc định.
- Khởi tạo Git.

**Tiêu chí hoàn thành:** `npm run dev` hoạt động.

### Giai đoạn 2 — Bàn cờ và luật
- Vẽ bàn cờ và quân.
- Chọn quân, tô nước hợp lệ và đi quân.
- Lịch sử nước đi, trạng thái ván, hoàn tác, ván mới.
- Xử lý phong cấp và các luật đặc biệt thông qua `chess.js`.

**Tiêu chí:** chơi được một ván người-vs-người hoàn chỉnh.

### Giai đoạn 3 — Hàm đánh giá
- Viết giá trị quân và tổng điểm vật chất.
- Thêm thưởng trung tâm/phát triển đơn giản.
- Viết test.

**Tiêu chí:** điểm nhất quán và đúng dấu theo quy ước.

### Giai đoạn 4 — Minimax
- Viết đệ quy MAX/MIN.
- Xử lý độ sâu và terminal.
- Trả về nước đi tốt nhất và số liệu.
- Cho người chơi đấu Minimax.

**Tiêu chí:** AI luôn đi hợp lệ và không làm hỏng trạng thái bàn cờ.

### Giai đoạn 5 — Alpha-Beta
- Thêm alpha/beta và điều kiện cắt.
- Đếm cắt tỉa.
- Đối chiếu với Minimax trên nhiều vị trí.

**Tiêu chí:** giá trị tối ưu khớp Minimax ở các test tương ứng.

### Giai đoạn 6 — Phân tích và benchmark
- Ghi node, thời gian, điểm và nước đi.
- Chạy tập FEN cố định.
- Hiển thị bảng so sánh và biểu đồ nếu cần.
- So sánh move ordering bật/tắt.

**Tiêu chí:** có số liệu thực nghiệm tái chạy được.

### Giai đoạn 7 — Hoàn thiện UI
- Cải thiện thiết kế và responsive.
- Thêm AI đấu AI.
- Dùng Web Worker nếu tìm kiếm làm đơ giao diện.
- Thêm trạng thái đang suy nghĩ và giới hạn độ sâu.

**Tiêu chí:** demo ổn định, dễ hiểu.

### Giai đoạn 8 — Deploy và bảo vệ
- Viết README.
- Cấu hình GitHub Actions/GitHub Pages.
- Kiểm tra đường dẫn asset khi deploy dưới tên repository.
- Chuẩn bị slide và demo thuật toán.

**Tiêu chí:** trang web hoạt động trên link công khai và có benchmark thực tế.

## 10. Khởi tạo project

Cài Node.js LTS, rồi chạy:

```bash
npm create vite@latest co-vua-ai -- --template vanilla
cd co-vua-ai
npm install
npm install chess.js
npm install -D vitest
npm run dev
```

Trong `package.json`, bổ sung script test nếu chưa có:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

Giữ nguyên các trường khác do Vite tạo ra; chỉ thêm hoặc chỉnh phần `scripts`.

Lệnh thường dùng:

```bash
npm run dev
npm run test
npm run build
npm run preview
```

## 11. Git và GitHub Pages

### `.gitignore`

```gitignore
node_modules/
dist/
.env
.DS_Store
Thumbs.db
.vscode/
.idea/
coverage/
```

### Đẩy project lên GitHub

Tạo repository GitHub trước, sau đó:

```bash
git init -b main
git add .
git commit -m "Initial commit: chess AI web project"
git remote add origin https://github.com/USERNAME/co-vua-ai.git
git push -u origin main
```

Thay `USERNAME` bằng tài khoản GitHub. Nếu remote đã có sẵn, dùng `git remote -v` để kiểm tra trước khi thêm.

### Cấu hình Vite cho GitHub Pages

Nếu repository tên `co-vua-ai`, trang thường nằm dưới đường dẫn `/co-vua-ai/`. Đặt `vite.config.js` như sau:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/co-vua-ai/',
});
```

Tên `base` phải khớp tên repository. Nếu dùng custom domain hoặc xuất bản ở root domain, cấu hình có thể khác. Dùng GitHub Actions để build thư mục `dist` và deploy lên Pages.

## 12. Chuẩn bị bảo vệ đồ án

### Trình tự demo
1. Giải thích `chess.js` phụ trách luật, còn AI là thuật toán tự viết.
2. Chọn một FEN và độ sâu cố định.
3. Chạy Minimax, ghi nước đi, điểm, thời gian và số node.
4. Chạy Alpha-Beta trên cùng vị trí và độ sâu.
5. So sánh điểm tối ưu và số node.
6. Bật sắp xếp nước đi để giải thích cải tiến.
7. Minh họa điều kiện `alpha >= beta`.
8. Trình bày hạn chế và hướng phát triển.

### Câu hỏi thường gặp
- **Minimax là gì?** Cây tìm kiếm giả định hai bên đều chơi tối ưu; MAX tối đa hóa điểm và MIN tối thiểu hóa điểm.
- **Alpha-Beta có đổi kết quả không?** Không đổi giá trị tối ưu khi triển khai đúng trên cùng cây tìm kiếm; nó cắt các nhánh không ảnh hưởng quyết định.
- **Vì sao thứ tự nước đi quan trọng?** Nước tốt được xét sớm có thể giúp cắt tỉa nhiều hơn.
- **Vì sao không dùng Stockfish?** Mục tiêu đồ án là tự cài đặt và giải thích thuật toán.
- **AI có hoàn hảo không?** Không; chất lượng phụ thuộc độ sâu, hàm đánh giá và thời gian tính toán.
- **Benchmark có cố định không?** Số node thường ổn định trong cùng điều kiện, còn thời gian có thể dao động theo máy và trình duyệt.

## 13. Checklist nghiệm thu

- [ ] Chạy được bằng `npm run dev`.
- [ ] Build thành công bằng `npm run build`.
- [ ] Đi quân hợp lệ và xử lý luật đặc biệt.
- [ ] Có lịch sử, hoàn tác và ván mới.
- [ ] Minimax tự triển khai và có test.
- [ ] Alpha-Beta tự triển khai và có test.
- [ ] Giá trị tối ưu được đối chiếu với Minimax.
- [ ] Node/thời gian được đo thực tế.
- [ ] Có bảng benchmark trên cùng vị trí và độ sâu.
- [ ] Có chế độ người-vs-AI và chọn thuật toán.
- [ ] Giao diện có trạng thái ván và bảng phân tích.
- [ ] README mô tả kiến trúc, cách chạy và deploy.
- [ ] GitHub Pages hoạt động.
- [ ] Không sử dụng Stockfish hay engine ngoài làm AI.
