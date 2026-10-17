# LMS SAAS — LEARNING MANAGEMENT SYSTEM

Hệ thống quản lý học tập đa người dùng (Learning Management System SaaS) được xây dựng theo mô hình kiến trúc Monorepo hiện đại, phân tách rõ ràng giữa Frontend (Next.js) và Backend For Frontend (BFF .NET).

---

## 1. TỔNG QUAN KIẾN TRÚC DỰ ÁN

Dự án được tổ chức thành hai phân hệ độc lập trong cùng một kho chứa mã nguồn:

* **Frontend (`client/`)**:
  * Framework: Next.js 16 (App Router) & React 19
  * Ngôn ngữ: TypeScript 5
  * Styling: Tailwind CSS v4 (@tailwindcss/turbopack)
  * Schema Validation: Zod
  * Trình quản lý gói: pnpm (v10)
* **Backend For Frontend (`BFF/`)**:
  * Nền tảng: .NET 10 Web API
  * Kiến trúc: Clean Architecture (Api, Core, Infrastructure, UnitTests)
  * Kiểm thử: xUnit, .NET Test SDK
* **Chất lượng mã nguồn & CI/CD**:
  * Git Hooks: Husky 9 + lint-staged (chặn lỗi compile/lint tại máy trước khi commit)
  * CI Pipeline: GitHub Actions tự động kiểm định độc lập cho cả Client và Backend khi có Push hoặc Pull Request vào nhánh `main`
* **Hệ thống tài liệu & Quy chuẩn Agent**:
  * Quản lý tập trung trong thư mục `.docs/` và `.agent/`

---

## 2. CẤU TRÚC THƯ MỤC CHÍNH

```text
.
├── .github/
│   └── workflows/ci.yml              # CI/CD Pipeline tự động trên GitHub Actions
├── .husky/
│   └── pre-commit                    # Git hook chạy lint-staged trước khi commit
├── .agent/
│   └── skills/ui-ux-pro-max/SKILL.md # Trí tuệ thiết kế UI/UX độc lập cho Frontend
├── .docs/
│   ├── RULES.md                      # Quy tắc code bắt buộc (SOLID, DRY, tên file IN HOA)
│   ├── FEATURES_DONE.md              # Bảng theo dõi tiến độ tính năng
│   └── DIARY.md                      # Nhật ký công việc và quyết định kiến trúc theo ngày
├── .AGENT.md                         # File chỉ mục và điều phối trung tâm cho AI Agent
├── .editorconfig                     # Cấu hình đồng bộ định dạng mã nguồn (C# & TypeScript)
├── lint-staged.config.mjs            # Cấu hình kiểm tra file staged cho cả Client và BFF
├── package.json                      # Quản lý devTools tại thư mục gốc
├── BFF/                              # Mã nguồn Backend (.NET 10 Web API)
│   ├── LmsSaaS.Api/                  # Web API controllers & entrypoint
│   ├── LmsSaaS.Core/                 # Entities, interfaces, DTOs & domain logic
│   ├── LmsSaaS.Infrastructure/       # Database context & external services
│   ├── LmsSaaS.UnitTests/            # Dự án Unit Test xUnit
│   └── LmsSaaS.slnx                  # Solution file của Visual Studio
└── client/                           # Mã nguồn Frontend (Next.js 16)
    ├── public/                       # Static assets
    ├── src/
    │   ├── app/                      # App Router (pages & layouts)
    │   ├── components/common/        # UI components dùng chung (Button...)
    │   ├── constants/                # Hằng số hệ thống & route paths
    │   ├── hooks/                    # Custom React hooks (useDebounce...)
    │   ├── lib/                      # Hàm tiện ích (utils.ts) & validations (Zod)
    │   ├── services/                 # HTTP client (apiClient.ts) kết nối BFF
    │   └── types/                    # Interfaces & models toàn cục
    ├── .env.example                  # File mẫu biến môi trường
    └── package.json                  # Dependencies của Client
```

---

## 3. YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

Trước khi cài đặt, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:

* **Node.js**: Phiên bản 20.x trở lên (khuyến nghị Node 22+ hoặc 24+)
* **pnpm**: Phiên bản 10.x trở lên (`npm install -g pnpm`)
* **.NET SDK**: Phiên bản 10.x trở lên (để chạy và build BFF)
* **Git**: Phiên bản mới nhất

---

## 4. HƯỚNG DẪN CLONE & CÀI ĐẶT

### Bước 1: Clone repository về máy

```bash
git clone https://github.com/nvhao100604/lms_saas.git
cd lms_saas
```

### Bước 2: Cài đặt công cụ quản lý Git Hooks tại thư mục gốc

```bash
# Cài đặt Husky và lint-staged cho toàn repo
pnpm install
```

### Bước 3: Cài đặt dependencies cho Frontend (`client/`)

```bash
# Di chuyển vào thư mục client và cài đặt gói
cd client
pnpm install

# Hoặc cài đặt trực tiếp từ thư mục gốc:
# pnpm --dir client install
```

### Bước 4: Thiết lập biến môi trường cho Frontend

Tạo file `.env.local` từ file mẫu `.env.example`:

```bash
# Trên Windows PowerShell:
Copy-Item client/.env.example client/.env.local

# Trên Linux/macOS:
cp client/.env.example client/.env.local
```

### Bước 5: Khôi phục gói phụ thuộc cho Backend (`BFF/`)

```bash
dotnet restore BFF/LmsSaaS.slnx
```

---

## 5. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

### 5.1. Khởi chạy Frontend (Next.js)

```bash
cd client
pnpm run dev
```

Ứng dụng Frontend sẽ chạy tại địa chỉ: `http://localhost:3000`

### 5.2. Khởi chạy Backend API (.NET)

Mở một cửa sổ dòng lệnh khác:

```bash
dotnet run --project BFF/LmsSaaS.Api
```

API sẽ khởi chạy và sẵn sàng nhận kết nối tại `http://localhost:5000` hoặc `https://localhost:5001`.

---

## 6. KIỂM THỬ & KIỂM ĐỊNH CHẤT LƯỢNG MÃ NGUỒN

### 6.1. Kiểm tra Frontend
```bash
# Kiểm tra định dạng và lỗi linter
pnpm --dir client run lint

# Kiểm tra an toàn kiểu dữ liệu TypeScript
pnpm --dir client exec tsc --noEmit

# Biên dịch thử nghiệm bản Production
pnpm --dir client run build
```

### 6.2. Kiểm tra Backend
```bash
# Biên dịch solution .NET
dotnet build BFF/LmsSaaS.slnx

# Chạy toàn bộ Unit Tests trong solution
dotnet test BFF/LmsSaaS.slnx

# Chạy test chi tiết với báo cáo console
dotnet test BFF/LmsSaaS.slnx --logger "console;verbosity=detailed"
```

### 6.3. Cơ chế Git Hook tự động
Khi bạn thực hiện lệnh `git commit`, Husky và lint-staged sẽ tự động:
* Kiểm tra ESLint và TypeScript cho các file thay đổi trong `client/`.
* Biên dịch và chạy test cho các file thay đổi trong `BFF/`.
* Chặn commit nếu phát hiện bất kỳ lỗi nào.

---

## 7. TÀI LIỆU QUẢN TRỊ & HƯỚNG DẪN

Để nắm rõ các quy chuẩn lập trình và quy trình phát triển, vui lòng tham khảo các tài liệu sau:

* [.AGENT.md](file:///.AGENT.md): Chỉ mục và hướng dẫn trung tâm dành cho AI Agent.
* [.docs/RULES.md](file:///.docs/RULES.md): Bộ quy tắc bắt buộc về SOLID, Clean Code, DRY và quy ước đặt tên file.
* [.docs/FEATURES_DONE.md](file:///.docs/FEATURES_DONE.md): Bảng theo dõi tiến độ chi tiết của các tính năng.
* [.docs/DIARY.md](file:///.docs/DIARY.md): Nhật ký làm việc và quyết định kiến trúc theo từng ngày.