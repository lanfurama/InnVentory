# Giới thiệu dự án – Hệ thống Quản lý Inventaris Barang

## Tổng quan

**Sistem Informasi Inventaris Barang** là ứng dụng web quản lý tài sản/inventaris được xây dựng bằng **Node.js** và **Express**, sử dụng **PostgreSQL** làm cơ sở dữ liệu và **EJS** làm template engine. Đây là dự án cuối khóa WGS Bootcamp Batch 4 của tác giả Sava Reyhano.

## Công nghệ sử dụng

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Template:** EJS
- **Giao diện:** AdminLTE 3.2
- **Xác thực:** Cookie Session, bcrypt

## Chức năng chính

| Module | Mô tả |
|--------|-------|
| **Dashboard** | Tổng quan thống kê hệ thống |
| **Quản lý Barang** | CRUD tài sản, chi tiết từng mặt hàng |
| **Barang Masuk** | Quản lý nhập kho |
| **Barang Keluar** | Quản lý xuất kho |
| **QR Code** | Tạo mã QR hàng loạt, quét mã QR (webcam/upload ảnh) |
| **Users** | Quản lý người dùng, phân quyền (superadmin, user) |
| **Account** | Thông tin tài khoản cá nhân |
| **Log** | Lịch sử hoạt động hệ thống |

## Cấu trúc thư mục chính

```
├── src/
│   ├── controllers/    # Xử lý logic
│   ├── routes/         # Định tuyến
│   ├── queries/        # Truy vấn database
│   └── views/          # Giao diện EJS
├── database/           # Schema SQL
├── public/             # CSS, JS, hình ảnh
└── scripts/            # Setup database
```

## Khởi động nhanh

1. **Yêu cầu:** Node.js, PostgreSQL
2. Tạo file `.env` từ `.env.example` và cấu hình kết nối DB
3. Chạy `npm install` → `npm run setup-db` → `npm start`
4. Truy cập `http://localhost:3000` và đăng nhập (xem README.md cho tài khoản mẫu)

## Tài liệu chi tiết

Xem file **README.md** để biết hướng dẫn cài đặt chi tiết, ảnh minh họa và thông tin bản quyền.
