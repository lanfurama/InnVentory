# Fixed Assets Software

Phần mềm quản lý tài sản cố định (Fixed Assets Management Software).

## Mục lục

- [Cài đặt lần đầu](#cài-đặt-lần-đầu)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Tính năng chính](#tính-năng-chính)
- [License](#license)

## Cài đặt lần đầu

### Yêu cầu

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/)

### Cài đặt

1. Clone repository và vào thư mục dự án.

2. Tạo file `.env` từ `.env.example` và cấu hình kết nối PostgreSQL:

   ```bash
   cp .env.example .env
   ```

3. Cài đặt dependencies:

   ```bash
   npm install
   ```

4. Tạo database và schema:

   ```bash
   npm run setup-db
   ```

   Script sẽ tạo database, chạy schema (`database/schema.sql`) và seed tài khoản mặc định.

## Chạy ứng dụng

```bash
npm start
```

Truy cập [http://localhost:3000](http://localhost:3000).

### Tài khoản đăng nhập mặc định

| email | password | role |
|-------|----------|------|
| superadmin@email.com | superadmin123 | superadmin |
| admin@email.com | admin123 | superadmin |
| user@email.com | password | user |
| usr@email.com | password | user |

## Tính năng chính

- **Quản lý tài sản**: CRUD tài sản cố định với mã, serial, danh mục, phòng ban, giá trị, ngày mua, vị trí, bảo hành
- **Danh mục tài sản**: Phân loại theo category với thời gian sử dụng và phương pháp khấu hao
- **Phòng ban**: Quản lý departments gán tài sản
- **Chuyển giao**: Theo dõi lịch sử chuyển tài sản giữa các phòng ban
- **Bảo trì**: Ghi nhận lịch sử bảo trì, chi phí
- **Khấu hao**: Bảng ghi nhận khấu hao theo tài sản
- **Dashboard**: Tổng quan tổng tài sản, tổng giá trị, khấu hao
- **QR Code**: Tạo mã QR cho mã tài sản (in tem)
- **Đa ngôn ngữ**: Tiếng Việt / English

## License

Dự án sử dụng [GNU General Public License v3.0](LICENSE).
