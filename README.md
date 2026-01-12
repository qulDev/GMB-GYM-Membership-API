# 🏋️ GMB - GYM Membership Backend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-5.2.1-blue.svg" alt="Express">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-7.1.0-orange.svg" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16+-blue.svg" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-7+-red.svg" alt="Redis">
  <img src="https://img.shields.io/badge/Tests-560%20passing-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/License-ISC-yellow.svg" alt="License">
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Postman Collection](#-postman-collection)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**GMB (GYM Membership Backend)** adalah RESTful API backend komprehensif untuk mengelola keanggotaan gym. Dibangun dengan teknologi modern termasuk Express.js 5, TypeScript, Prisma ORM, dan terintegrasi dengan payment gateway Midtrans untuk pemrosesan pembayaran yang seamless.

Sistem ini menyediakan fungsionalitas lengkap untuk:

- Registrasi dan autentikasi pengguna dengan JWT
- Manajemen paket membership
- Penanganan subscription
- Pemrosesan pembayaran via Midtrans
- Tracking check-in/check-out
- Penjadwalan dan booking kelas
- Manajemen trainer
- Dashboard member dengan rekomendasi personalisasi
- Reporting dan analitik admin

---

## ✨ Features

### 🔐 Authentication & Authorization

- Registrasi pengguna dengan verifikasi email
- Autentikasi berbasis JWT (Access Token + Refresh Token)
- Role-based access control (USER/ADMIN)
- Token blacklisting dengan Redis
- Hashing password aman dengan bcrypt

### 👤 User Management

- Manajemen profil pengguna
- Manajemen pengguna admin
- Dukungan soft delete

### 📋 Membership Plans

- Multiple tier membership
- Durasi dan harga yang dapat dikustomisasi
- Plan berbasis fitur
- Limit check-in per hari

### 💳 Subscriptions & Payments

- Manajemen subscription
- Integrasi payment gateway Midtrans
- Penanganan webhook pembayaran
- Tracking riwayat pembayaran

### 🚪 Check-In/Check-Out

- Tracking check-in real-time
- Penegakan limit check-in otomatis
- Riwayat dan analitik check-in

### 🧘 Classes & Trainers

- Penjadwalan dan manajemen kelas
- Profil dan spesialisasi trainer
- Sistem booking kelas
- Manajemen kapasitas

### 📊 Member Dashboard

- Dashboard personalisasi untuk member
- Ringkasan subscription
- Statistik check-in (mingguan/bulanan)
- Rekomendasi kelas
- Kelas yang akan datang
- Aktivitas check-in terbaru

### 📈 Admin Reports

- Statistik dashboard
- Laporan pendapatan
- Analitik kehadiran
- Log aktivitas sistem

---

## 🛠 Tech Stack

| Technology     | Version | Description                 |
| -------------- | ------- | --------------------------- |
| **Node.js**    | ≥18     | JavaScript runtime          |
| **Express.js** | 5.2.1   | Web framework               |
| **TypeScript** | 5.9.3   | Type-safe JavaScript        |
| **Prisma**     | 7.1.0   | ORM untuk PostgreSQL        |
| **PostgreSQL** | 16+     | Database utama              |
| **Redis**      | 7+      | Penyimpanan token & caching |
| **Midtrans**   | 1.4.3   | Payment gateway             |
| **Jest**       | 30.2.0  | Testing framework           |
| **Zod**        | 4.2.1   | Validasi schema             |
| **JWT**        | -       | Token autentikasi           |
| **bcrypt**     | 6.0.0   | Hashing password            |

---

## 📁 Project Structure

```
GMB/
├── docs/                        # File dokumentasi
│   ├── Api_spec.json            # Spesifikasi OpenAPI 3.0
│   ├── GMB.postman_collection.json
│   └── GMB.postman_environment.json
├── logs/                        # Log aplikasi
├── prisma/
│   ├── schema.prisma            # Schema database
│   ├── seed.ts                  # Database seeder
│   └── migrations/              # Migrasi database
├── src/
│   ├── index.ts                 # Entry point aplikasi
│   ├── secret.ts                # Konfigurasi environment
│   ├── config/                  # File konfigurasi
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── midtrans.config.ts
│   │   └── redis.config.ts
│   ├── controllers/             # Handler route
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── membership.controller.ts
│   │   ├── subscription.controller.ts
│   │   ├── payments.controller.ts
│   │   ├── checkin.controller.ts
│   │   ├── class.controller.ts
│   │   ├── trainer.controller.ts
│   │   ├── member-dashboard.controller.ts
│   │   ├── reports.controller.ts
│   │   └── logs.controller.ts
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/                  # Repository layer
│   │   ├── user.repository.ts
│   │   ├── membership.repository.ts
│   │   └── ...
│   ├── routes/                  # API routes
│   │   └── api/
│   ├── services/                # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── ...
│   ├── types/                   # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   └── ...
│   ├── utils/                   # Fungsi utilitas
│   │   ├── jwt.helper.ts
│   │   └── password.helper.ts
│   └── validations/             # Schema validasi Zod
├── coverage/                    # Laporan coverage test
├── jest.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Pastikan Anda telah menginstal:

- **Node.js** (v18 atau lebih tinggi)
- **npm** atau **pnpm**
- **PostgreSQL** (v16 atau lebih tinggi)
- **Redis** (v7 atau lebih tinggi)
- **Akun Midtrans** (untuk pemrosesan pembayaran)

### Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/qulDev/GMB-GYM-Membership-API.git
   cd GMB-GYM-Membership-API
   ```

2. **Install dependencies**

   ```bash
   npm install
   # atau
   pnpm install
   ```
 
3. **Buat file environment**
   ```bash
   cp .env.example .env
   ```

### Environment Variables

Buat file `.env` di direktori root dengan variabel berikut:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gmb_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Midtrans Configuration
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
```

### Database Setup

1. **Jalankan migrasi database**

   ```bash
   npx prisma migrate dev
   ```

2. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

3. **Seed database (opsional)**

   ```bash
   npm run db:seed
   ```

4. **Reset database (development only)**
   ```bash
   npm run db:reset
   ```

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Ini memulai server dengan hot-reload menggunakan `nodemon`.

### Production Build

```bash
npm run build
npm start
```

### Available Scripts

| Script                  | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Mulai server development dengan hot-reload |
| `npm run build`         | Build TypeScript ke JavaScript             |
| `npm start`             | Mulai server production                    |
| `npm run db:reset`      | Reset dan migrasi database                 |
| `npm run db:seed`       | Seed database dengan data sample           |
| `npm test`              | Jalankan semua unit test                   |
| `npm run test:coverage` | Jalankan test dengan laporan coverage      |

---

## 📖 API Documentation

### Swagger UI

Dokumentasi API interaktif tersedia melalui Swagger UI:

```
http://localhost:3000/api-docs
```

Swagger UI memungkinkan Anda untuk:

- Melihat semua endpoint API
- Mencoba request langsung dari browser
- Melihat schema request/response
- Test autentikasi dengan JWT token

### Base URL

```
http://localhost:3000/api/v1
```

### API Endpoints Summary

| Method               | Endpoint                        | Description                   | Auth |
| -------------------- | ------------------------------- | ----------------------------- | ---- |
| **Authentication**   |
| POST                 | `/auth/register`                | Register user baru            | ❌   |
| POST                 | `/auth/login`                   | Login user                    | ❌   |
| POST                 | `/auth/refresh`                 | Refresh access token          | ❌   |
| POST                 | `/auth/logout`                  | Logout user                   | ✅   |
| **Users**            |
| GET                  | `/users/me`                     | Get profil user saat ini      | ✅   |
| PUT                  | `/users/me`                     | Update profil user saat ini   | ✅   |
| GET                  | `/users`                        | List semua user (Admin)       | 👑   |
| GET                  | `/users/:id`                    | Get user by ID (Admin)        | 👑   |
| DELETE               | `/users/:id`                    | Hapus user (Admin)            | 👑   |
| **Membership Plans** |
| GET                  | `/membership-plans`             | List semua plan               | ❌   |
| GET                  | `/membership-plans/:id`         | Get plan by ID                | ❌   |
| POST                 | `/membership-plans`             | Buat plan (Admin)             | 👑   |
| PUT                  | `/membership-plans/:id`         | Update plan (Admin)           | 👑   |
| DELETE               | `/membership-plans/:id`         | Hapus plan (Admin)            | 👑   |
| **Subscriptions**    |
| GET                  | `/subscriptions`                | Get subscription saya         | ✅   |
| GET                  | `/subscriptions/current`        | Get subscription aktif        | ✅   |
| POST                 | `/subscriptions`                | Buat subscription             | ✅   |
| POST                 | `/subscriptions/current/cancel` | Batalkan subscription saya    | ✅   |
| POST                 | `/subscriptions/:id/activate`   | Aktifkan subscription (Admin) | 👑   |
| POST                 | `/subscriptions/:id/cancel`     | Batalkan subscription (Admin) | 👑   |
| GET                  | `/subscriptions/expiring-soon`  | Cek akan expired (Admin)      | 👑   |
| POST                 | `/subscriptions/expire-check`   | Trigger expire check (Admin)  | 👑   |
| **Payments**         |
| GET                  | `/payments`                     | Get riwayat pembayaran        | ✅   |
| GET                  | `/payments/:id`                 | Get detail pembayaran         | ✅   |
| POST                 | `/payments/:subscriptionId`     | Proses pembayaran             | ✅   |
| POST                 | `/payments/webhook/midtrans`    | Webhook Midtrans              | ❌   |
| **Check-In/Out**     |
| POST                 | `/check-ins`                    | Check in                      | ✅   |
| POST                 | `/check-ins/:id/checkout`       | Check out                     | ✅   |
| GET                  | `/check-ins`                    | Get riwayat check-in          | ✅   |
| GET                  | `/check-ins/current`            | Get status saat ini           | ✅   |
| **Classes**          |
| GET                  | `/classes`                      | List semua kelas              | ❌   |
| GET                  | `/classes/:id`                  | Get detail kelas              | ❌   |
| POST                 | `/classes`                      | Buat kelas (Admin)            | 👑   |
| PUT                  | `/classes/:id`                  | Update kelas (Admin)          | 👑   |
| DELETE               | `/classes/:id`                  | Hapus kelas (Admin)           | 👑   |
| POST                 | `/classes/:id/book`             | Booking kelas                 | ✅   |
| POST                 | `/classes/:id/cancel`           | Batalkan booking              | ✅   |
| GET                  | `/classes/my-bookings`          | Get booking saya              | ✅   |
| GET                  | `/classes/:id/participants`     | Get peserta (Admin)           | 👑   |
| **Trainers**         |
| GET                  | `/trainers`                     | List semua trainer            | ❌   |
| GET                  | `/trainers/:id`                 | Get detail trainer            | ❌   |
| POST                 | `/trainers`                     | Buat trainer (Admin)          | 👑   |
| PUT                  | `/trainers/:id`                 | Update trainer (Admin)        | 👑   |
| DELETE               | `/trainers/:id`                 | Hapus trainer (Admin)         | 👑   |
| **Member Dashboard** |
| GET                  | `/member/dashboard`             | Get dashboard member          | ✅   |
| **Reports (Admin)**  |
| GET                  | `/reports/dashboard`            | Statistik dashboard           | 👑   |
| GET                  | `/reports/revenue`              | Laporan pendapatan            | 👑   |
| GET                  | `/reports/attendance`           | Laporan kehadiran             | 👑   |
| **Logs (Admin)**     |
| GET                  | `/logs`                         | List semua log                | 👑   |
| GET                  | `/logs/:id`                     | Get log by ID                 | 👑   |
| POST                 | `/logs`                         | Buat log                      | ✅   |
| DELETE               | `/logs/:id`                     | Hapus log (Admin)             | 👑   |

**Legend:**

- ❌ Tidak perlu autentikasi
- ✅ Perlu autentikasi user
- 👑 Perlu autentikasi admin

### OpenAPI Specification

Dokumentasi API lengkap tersedia dalam format OpenAPI 3.0:

```
docs/Api_spec.json
```

Atau akses langsung via Swagger UI di `http://localhost:3000/api-docs`

---

## 🧪 Testing

### Running Tests

```bash
# Jalankan semua test
npm test

# Jalankan test dengan coverage
npm run test:coverage

# Jalankan file test spesifik
npm test -- user.service.test.ts

# Jalankan test dalam mode watch
npm test -- --watch
```

### Test Coverage

Project ini mempertahankan coverage test tinggi dengan **560 test** di **38 test suite**:

| Category     | Tests | Status |
| ------------ | ----- | ------ |
| Repositories | 153   | ✅     |
| Services     | 192   | ✅     |
| Controllers  | 110   | ✅     |
| Middlewares  | 12    | ✅     |
| Utilities    | 10    | ✅     |

### Test Structure

```
src/
├── config/__tests__/
├── controllers/__tests__/
├── middlewares/__tests__/
├── models/__tests__/
├── services/__tests__/
└── utils/__tests__/
```

---

## 📮 Postman Collection

Import collection dan environment Postman untuk pengujian API yang mudah:

### Files Location

```
docs/
├── GMB.postman_collection.json    # API collection
└── GMB.postman_environment.json   # Environment variables
```

### Setup Instructions

1. **Import Collection**

   - Buka Postman
   - Klik `Import` → Pilih `GMB.postman_collection.json`

2. **Import Environment**

   - Klik `Import` → Pilih `GMB.postman_environment.json`
   - Pilih environment "GMB - GYM Membership"

3. **Configure Environment Variables**
   | Variable | Description |
   |----------|-------------|
   | `baseUrl` | API base URL (default: http://localhost:3000) |
   | `adminEmail` | Email admin user |
   | `adminPassword` | Password admin user |
   | `userEmail` | Email test user |
   | `userPassword` | Password test user |

4. **Testing Flow**
   - Mulai dengan `Authentication` → `Register` atau `Login`
   - Token akan otomatis disimpan ke environment
   - Lanjutkan testing endpoint lainnya

---

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur Anda (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

### Code Style

- Ikuti best practice TypeScript
- Tulis unit test untuk fitur baru
- Update dokumentasi API saat menambah endpoint
- Gunakan commit message yang bermakna

---

## 📄 License

Project ini dilisensikan di bawah Lisensi ISC.

---

## 👨‍💻 Authors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/qulDev">
        <img src="https://github.com/qulDev.png" width="100px;" alt="qulDev"/><br />
        <sub><b>qulDev</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Fanndev">
        <img src="https://github.com/Fanndev.png" width="100px;" alt="Fanndev"/><br />
        <sub><b>Fanndev</b></sub>
      </a>
    </td>
  </tr>
</table>

Built with ❤️ untuk manajemen gym
