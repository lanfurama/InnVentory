# Proposal bàn giao phần mềm – Hệ thống Quản lý Inventaris Barang

**Phiên bản:** 1.0  
**Đối tượng:** Phòng IT (vận hành & bảo trì)

---

## 1. Tổng quan

- **Tên hệ thống:** Sistem Informasi Inventaris Barang (SIIB) – Quản lý tài sản / kho.
- **Loại ứng dụng:** Web (server-side render, EJS).
- **Mục đích:** Quản lý danh mục tài sản, nhập/xuất kho, in/quét QR, quản lý người dùng và ghi log hoạt động.

---

## 2. Kiến trúc & công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | Node.js |
| Framework | Express 4.x |
| Database | PostgreSQL (database: `siib`) |
| Template | EJS |
| UI | AdminLTE 3.2 |
| Phiên đăng nhập | cookie-session |
| Mật khẩu | bcrypt |
| Đa ngôn ngữ | i18next (en, vi) |

**Cấu trúc mã nguồn chính:**
- `src/app.js` – Cấu hình Express, middleware, routes.
- `src/server.js` – Khởi động server.
- `src/config/` – Kết nối DB, i18n.
- `src/controllers/` – Xử lý request/response.
- `src/routes/` – Định tuyến theo module.
- `src/queries/` – Truy vấn PostgreSQL (không dùng ORM).
- `src/views/` – Giao diện EJS.
- `database/db.sql` – Dump PostgreSQL (pg_dump custom format).
- `scripts/setup-db.js` – Tạo DB và restore từ dump.

---

## 3. Cơ sở dữ liệu (PostgreSQL – database `siib`)

| Bảng | Mô tả ngắn | Cột chính |
|------|------------|-----------|
| **stock** | Danh mục tài sản/kho | idbarang (PK), namabarang, deskripsi, stock, image, kodebarang, penginput |
| **masuk** | Phiếu nhập kho | idmasuk (PK), idbarang, tanggal, keterangan, qty, namabarang_m, kodebarang_m, penginput |
| **keluar** | Phiếu xuất kho | idkeluar (PK), idbarang, tanggal, penerima, qty, namabarang_k, kodebarang_k, penginput |
| **users** | Người dùng hệ thống | id (PK), email, password (bcrypt), role |
| **log** | Log HTTP request | idlog (PK), date, usr, method, endpoint, status_code |

**Quan hệ:** `masuk`/`keluar` tham chiếu `idbarang` tới `stock`. Không có FK ràng buộc trong schema hiện tại; logic nghiệp vụ nằm trong ứng dụng.

---

## 4. Chức năng & phân quyền

- **Đăng nhập / Đăng xuất:** `/login`, `/logout` (cookie-session).
- **Dashboard:** Thống kê tổng quan (số lượng tài sản, tổng tồn kho).
- **Quản lý Barang (stock):** CRUD tài sản, upload ảnh, mã hàng (kodebarang).
- **Barang Masuk (nhập kho):** Tạo phiếu nhập, cập nhật số lượng tồn.
- **Barang Keluar (xuất kho):** Tạo phiếu xuất, giảm tồn kho.
- **QR Code:** In mã QR hàng loạt; quét QR (webcam hoặc upload ảnh).
- **Users:** Chỉ **superadmin** – CRUD user, reset mật khẩu.
- **Account:** Xem/sửa thông tin tài khoản đăng nhập.
- **Log:** Xem lịch sử request (user, method, endpoint, status).

**Phân quyền:**
- **superadmin:** Toàn quyền (kể cả quản lý Users).
- **user:** Các chức năng nghiệp vụ (stock, nhập/xuất, QR, account, log); không vào được `/users`.

---

## 5. Triển khai & vận hành

**Yêu cầu môi trường:**
- Node.js (phiên bản tương thích package.json).
- PostgreSQL (đường dẫn `pg_restore` trong PATH khi chạy setup-db).
- Biến môi trường trong `.env` (copy từ `.env.example`).

**Biến môi trường cần cấu hình:**

| Biến | Ý nghĩa | Ví dụ |
|------|---------|--------|
| HOSTNAME | Host chạy app | localhost |
| PORT | Cổng HTTP | 3001 |
| SESSION_KEYS | Key cookie session (tùy chọn) | Chuỗi bí mật, ổn định khi restart |
| PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT | Kết nối PostgreSQL | Theo môi trường IT |

**Lệnh triển khai lần đầu:**
1. `npm install`
2. Tạo `.env` từ `.env.example`, chỉnh lại thông tin Postgres.
3. `npm run setup-db` – tạo database `siib` và restore từ `database/db.sql`.
4. `npm start` – chạy server (production: `node src/server.js`).
5. Truy cập `http://<HOSTNAME>:<PORT>`; đăng nhập bằng tài khoản trong DB (xem README.md).

**Tài khoản mặc định (sau restore):**  
Xem README.md (superadmin@email.com, admin@email.com, user@email.com, usr@email.com). **IT nên đổi mật khẩu ngay sau lần đầu đăng nhập.**

**File tĩnh & upload:**
- CSS/JS: `public/css`, `public/js`, AdminLTE qua `public/plugins`, `public/dist`.
- Ảnh upload (tài sản): lưu trong `public/uploads` (tên file do app sinh).

---

## 6. Tài liệu & bảo trì

- **README.md** – Hướng dẫn cài đặt, chạy, tài khoản mẫu.
- **GIOI_THIEU_DU_AN.md** – Giới thiệu dự án, công nghệ, cấu trúc thư mục.
- **PROPOSAL_BAN_GIAO_IT.md** (file này) – Tài liệu bàn giao cho IT.

**Bảo trì gợi ý:**
- Backup định kỳ database `siib` và thư mục `public/uploads`.
- Kiểm tra dung lượng ổ đĩa cho upload và log.
- Cập nhật dependency (`npm audit`, nâng cấp Node/PostgreSQL theo chính sách bảo mật).
- Giữ `SESSION_KEYS` cố định và bí mật; đổi key khi nghi ngờ lộ session.

**Liên hệ / Nguồn gốc:** Dự án gốc – WGS Bootcamp Batch 4 (Sava Reyhano). License: GNU GPL v3.0 (xem LICENSE).

---

*Tài liệu này dùng để bàn giao vận hành và bảo trì cho phòng IT; chi tiết kỹ thuật nằm trong mã nguồn và README.*
