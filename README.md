# LMS SAAS — ENTERPRISE LEARNING MANAGEMENT SYSTEM

Hệ thống quản lý đào tạo & học tập đa khách thuê (Multi-tenant LMS SaaS) chuẩn Enterprise, được xây dựng theo mô hình Monorepo hiện đại, phân tách độc lập giữa **Frontend (Next.js 16 App Router & Material UI)** và **Backend For Frontend (BFF .NET 10 Clean Architecture)**.

---

## 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

Dự án được thiết kế theo các tiêu chuẩn kiến trúc phần mềm cao cấp, đảm bảo tính mở rộng, bảo mật và trải nghiệm người dùng doanh nghiệp:

* **Frontend (`client/`)**:
  * **Core Framework**: Next.js 16 (App Router, Turbopack, Cache Components `"use cache"`, Partial Prerendering) & React 19
  * **Design System & UI**: **Material UI (MUI v9)** kết hợp `@emotion/react`, `@emotion/styled`, `@mui/material-nextjs/v15-appRouter` (`enableCssLayer: true`) & Tailwind CSS v4
  * **Theme tập trung**: Palette chuẩn Enterprise (Indigo 600, Slate 900, background `#f8fafc`), Typography Plus Jakarta Sans, bo góc chuẩn 10px, loại bỏ box-shadow thô cũ
  * **State & Data Fetching**: SWR (Stale-While-Revalidate) tự động deduplication, revalidation on focus & Redux Toolkit
  * **API Layer**: Axios wrapper với Interceptors tự động bắt lỗi 401 và thực hiện Silent Refresh Token Rotation ngầm không gián đoạn
  * **Schema Validation**: Zod
  * **Package Manager**: pnpm (v10)
* **Backend For Frontend (`BFF/`)**:
  * **Nền tảng**: .NET 10 Web API, C# 13+
  * **Kiến trúc**: Clean Architecture (Api, Core, Infrastructure, UnitTests)
  * **Cơ sở dữ liệu**: PostgreSQL Supabase kết hợp Entity Framework Core 10
  * **Multi-tenancy**: Tự động lọc dữ liệu khách thuê qua `ITenantEntity` và Global Query Filters
  * **Cơ chế CQS & Dynamic HTTP PATCH**: Extension `ToPatchDictionary()` sử dụng Reflection chỉ cập nhật đúng các cột thực tế thay đổi
  * **Thuật toán Xếp lịch & Kiểm soát Hạn ngạch**: Tự động rải lịch học định kỳ (`ClassSessions`), phát hiện trùng lịch giảng dạy của giảng viên và kiểm soát hạn ngạch gói cước (`MaxClassesLimit`)
  * **Kiểm thử**: xUnit, FluentAssertions, .NET Test SDK (100% tests passed)
* **Chất lượng mã nguồn & CI/CD**:
  * **Git Hooks**: Husky 9 + lint-staged (chặn commit lỗi linter, type-check, hoặc unit test thất bại)
  * **CI Pipeline**: GitHub Actions tự động kiểm định độc lập cho cả Client và Backend khi có Push hoặc Pull Request vào nhánh `main`

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
.
├── .github/
│   └── workflows/ci.yml              # CI/CD Pipeline tự động trên GitHub Actions
├── .husky/
│   └── pre-commit                    # Git hook chạy lint-staged trước khi commit
├── .agent/
│   └── skills/ui-ux-pro-max/SKILL.md # Trí tuệ thiết kế UI/UX độc lập cho Frontend
├── .docs/
│   ├── RULES.md                      # Quy tắc code bắt buộc (SOLID, DRY, quy chuẩn CQS)
│   ├── FEATURES_DONE.md              # Bảng theo dõi tiến độ chi tiết từng phân hệ
│   └── DIARY.md                      # Nhật ký công việc và quyết định kiến trúc kỹ thuật
├── .AGENT.md                         # File chỉ mục và điều phối trung tâm cho AI Agent
├── docker-compose.yml                # Khởi chạy BFF .NET 10 và các dịch vụ phụ trợ
├── BFF/                              # Mã nguồn Backend (.NET 10 Web API)
│   ├── LmsSaaS.Api/                  # Controllers (Auth, Courses, Classes, Members), Middlewares
│   ├── LmsSaaS.Core/                 # Entities, Interfaces, DTOs (Request/Response CQS), PatchExtensions
│   ├── LmsSaaS.Infrastructure/       # AppDbContext, Multitenancy interceptors, Supabase connection
│   ├── LmsSaaS.UnitTests/            # Bộ kiểm thử Unit Test xUnit (39 test cases đạt 100%)
│   └── LmsSaaS.slnx                  # Solution file .NET
└── client/                           # Mã nguồn Frontend (Next.js 16 + MUI)
    ├── src/
    │   ├── app/                      # App Router (layout, [tenantSlug], api proxy routes)
    │   ├── components/
    │   │   ├── classes/              # Phân hệ Lớp học (ClassesView, Dialog mở lớp, Drawer lịch học)
    │   │   ├── courses/              # Phân hệ Khóa học (CoursesView, CachedCourseCatalog, Dialogs)
    │   │   ├── layout/               # App Shell MUI (WorkspaceSidebar, WorkspaceHeader, Shell)
    │   │   └── providers/            # MuiProvider (AppRouterCacheProvider + ThemeProvider)
    │   ├── constants/                # Routes (ROUTES.API), Cache tags, Cấu hình môi trường
    │   ├── hooks/                    # SWR Hooks (useCourses, useClasses, useTeachers)
    │   ├── lib/                      # Axios client, utils (formatCurrency, formatDate), Zod schemas
    │   ├── services/                 # Thin API services (courseService, classService, memberService)
    │   ├── theme/                    # MUI Enterprise Theme (palette, typography, component overrides)
    │   └── types/                    # Types đồng bộ CQS (Create/Patch/Response không dùng đuôi Dto)
    ├── next.config.ts                # Turbopack, Cache life profiles, Rewrites kết nối BFF
    └── package.json                  # Dependencies (MUI v9, Emotion, SWR, Axios, Redux)
```

---

## 3. CÁC PHÂN HỆ TÍNH NĂNG ĐÃ TRIỂN KHAI

### 3.1. Xác thực & Quản lý Phiên Đa khách thuê (Multi-tenancy Auth)
- Đăng nhập đa trung tâm, tự động phân quyền theo vai trò (`TenantAdmin`, `Teacher`, `Student`).
- Cơ chế **Silent Refresh Token Rotation**: Xoay vòng Refresh Token ngầm tại Edge Middleware và Axios Interceptors với Mutex Queue, không làm gián đoạn người dùng.
- Cookie HttpOnly bảo mật cao với thời hạn do `.NET BFF` kiểm soát duy nhất (Single Source of Truth).

### 3.2. Quản lý Khóa học (`Courses`)
- Bảng danh sách khóa học sử dụng **MUI TableContainer & Table** kèm thanh tìm kiếm nhanh.
- Nút gạt `<Switch>` bật/tắt nhanh trạng thái tuyển sinh: Gọi trực tiếp HTTP PATCH chỉ gửi `{ isActive }`, đồng bộ tức thì qua SWR.
- Hộp thoại `<Dialog>` Tạo mới & Chỉnh sửa: Tự động tính toán diff và chỉ gửi các trường thay đổi lên máy chủ qua `PatchCourseRequest`.
- Hộp thoại xác nhận Xóa khóa học: Hiển thị `<Alert severity="error">` chi tiết nếu khóa học đang có lớp học liên kết.
- Tích hợp Server Component `CachedCourseCatalog` minh họa directive `"use cache"` của Next.js 16.

### 3.3. Quản lý Lớp học & Xếp lịch Tự động (`Classes`)
- Hiển thị danh sách lớp học: Khóa học (`Chip`), Giảng viên, Phòng học, Thời gian, Sĩ số, Tổng số buổi (`Chip`), Trạng thái (`Tuyển sinh`, `Đang học`, `Hoàn thành`, `Đã hủy`).
- Hộp thoại `<Dialog maxWidth="md" fullWidth>` Mở lớp học mới:
  - `<FormControl>` + `<Select>` chọn Khóa học và Giảng viên (từ API `/api/members/teachers`).
  - `<ToggleButtonGroup>` trực quan chọn các thứ trong tuần (Thứ 2 &rarr; Chủ Nhật).
  - Thuật toán tự động rải lịch sinh ra toàn bộ danh sách `ClassSessions` theo khung giờ định kỳ.
  - Kiểm soát hạn ngạch gói cước (`MaxClassesLimit`) và tự động kiểm tra chống trùng giờ giảng dạy của giảng viên. Khi có va chạm, hiển thị `<Alert severity="error" variant="filled">` nổi bật ngay đầu Dialog.
- Ngăn kéo `<Drawer anchor="right">` Lịch trình buổi học: Mở danh sách toàn bộ các buổi học với số thứ tự `#`, chủ đề, ngày tháng và khung giờ UTC.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 4.1. Yêu cầu môi trường
* **Node.js**: Phiên bản 20.x trở lên (khuyến nghị Node 22+)
* **pnpm**: Phiên bản 10.x trở lên (`npm install -g pnpm`)
* **.NET SDK**: Phiên bản 10.x trở lên
* **PostgreSQL / Supabase**: Database kết nối cho BFF

### 4.2. Cài đặt các gói phụ thuộc
```bash
# 1. Cài đặt tại thư mục gốc (Husky & devTools)
pnpm install

# 2. Cài đặt dependencies cho Client
pnpm --dir client install

# 3. Khôi phục gói .NET cho Backend
dotnet restore BFF/LmsSaaS.slnx
```

### 4.3. Thiết lập biến môi trường
Tạo file `client/.env.local` từ `client/.env.example`:
```bash
# Windows PowerShell:
Copy-Item client/.env.example client/.env.local

# Linux/macOS:
cp client/.env.example client/.env.local
```

### 4.4. Khởi chạy môi trường phát triển (Dev)
```bash
# Cửa sổ 1: Khởi chạy Backend .NET 10 BFF (Port 5045)
dotnet run --project BFF/LmsSaaS.Api

# Cửa sổ 2: Khởi chạy Frontend Next.js 16 (Port 3000)
pnpm --dir client dev
```
* Giao diện người dùng: [http://localhost:3000](http://localhost:3000)
* Swagger API Documentation: [http://localhost:5045/swagger](http://localhost:5045/swagger)

---

## 5. KIỂM THỬ & KIỂM ĐỊNH CHẤT LƯỢNG

Toàn bộ dự án phải đạt 100% tiêu chuẩn xanh trước khi triển khai hoặc tạo commit:

```bash
# 1. Kiểm tra Backend Unit Tests (39 test cases đạt 100%)
dotnet test BFF/LmsSaaS.slnx

# 2. Kiểm tra Type-check TypeScript Frontend (0 lỗi)
pnpm --dir client exec tsc --noEmit

# 3. Kiểm tra ESLint
pnpm --dir client run lint

# 4. Biên dịch thử nghiệm bản Production Next.js 16
pnpm --dir client run build
```

---

## 6. TÀI LIỆU QUẢN TRỊ & HƯỚNG DẪN CHI TIẾT

* [.AGENT.md](file:///.AGENT.md): Chỉ mục và hướng dẫn trung tâm dành cho AI Agent.
* [.docs/RULES.md](file:///.docs/RULES.md): Bộ quy tắc bắt buộc về Clean Code, CQS, SOLID, DRY và đặt tên.
* [.docs/FEATURES_DONE.md](file:///.docs/FEATURES_DONE.md): Tiến độ chi tiết các phân hệ đã hoàn thành.
* [.docs/DIARY.md](file:///.docs/DIARY.md): Nhật ký kỹ thuật và các quyết định kiến trúc theo từng ngày.