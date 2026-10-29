# LMS SAAS — ENTERPRISE MULTI-TENANT LEARNING MANAGEMENT SYSTEM

[English](#english-version) | [Tiếng Việt](#phiên-bản-tiếng-việt)

---

<a name="english-version"></a>
## ENGLISH VERSION

An enterprise-grade Multi-Tenant Learning Management System (LMS SaaS) built with a modern monorepo architecture, cleanly decoupling the **Frontend (Next.js 16 App Router & Material UI)** from the **Backend For Frontend (BFF .NET 10 Clean Architecture, MassTransit & RabbitMQ)**.

---

### 1. ARCHITECTURE & TECH STACK

* **Frontend (`client/`)**:
  * **Core Framework**: Next.js 16 (App Router, Turbopack, Cache Components `"use cache"`, Partial Prerendering - PPR) & React 19
  * **Design System & UI**: **Material UI (MUI v9)** with `@emotion/react`, `@emotion/styled`, `@mui/material-nextjs/v15-appRouter` (`enableCssLayer: true`) & Tailwind CSS v4
  * **Theme & Typography**: Enterprise theme palette (Indigo 600, Slate 900, `#f8fafc` background), Plus Jakarta Sans typography, 10px rounded corners, accessible contrast (4.5:1+)
  * **Internationalization (i18n)**: Redux Toolkit bilingual state (English & Vietnamese) supporting dynamic language switching across navigation, modules, and notification popovers
  * **State & Data Fetching**: SWR (Stale-While-Revalidate) with smart intervals, deduplication, revalidation on focus & Redux Toolkit
  * **API Layer**: Axios wrapper with interceptors for automatic 401 handling, Silent Refresh Token Rotation, and normalized error mapping
  * **Schema Validation**: Zod
  * **Package Manager**: pnpm (v10)
* **Backend For Frontend (`BFF/`)**:
  * **Platform**: .NET 10 Web API, C# 13+
  * **Architecture**: Clean Architecture (`LmsSaaS.Api`, `LmsSaaS.Core`, `LmsSaaS.Infrastructure`, `LmsSaaS.UnitTests`)
  * **Database & ORM**: PostgreSQL (Supabase) with Entity Framework Core 10
  * **Multi-tenancy Isolation**: Tenant data isolation via `ITenantEntity` and automatic EF Core Global Query Filters through reflection
  * **Event-Driven Messaging**: **MassTransit 8** with **RabbitMQ** (AMQP 0-9-1) and **Hybrid Transport** (dynamic fallback to In-Memory bus when running locally without Docker)
  * **Multi-Tenant Background Workers**: Context restoration inside MassTransit Consumers (`ICurrentTenantService.SetTenantContext`) for background threads
  * **Command Query Separation (CQS)**: Explicit naming without `Dto` suffixes (`*Request`, `*Response`), dynamic HTTP PATCH using `ToPatchDictionary()` reflection
  * **Scheduling & Conflict Detection**: Automated periodic session generation (`ClassSessions`), instructor time conflict detection, and subscription plan limits enforcement (`MaxClassesLimit`)
  * **Testing**: xUnit, NSubstitute, .NET Test SDK (100% test pass rate)
* **Infrastructure & CI/CD**:
  * **Containerization**: Docker Compose with `lms-rabbitmq` (`rabbitmq:4-management-alpine`) and `lms-bff`
  * **Git Hooks**: Husky 9 + lint-staged (blocking commits on linter, type-check, or unit test failures)
  * **CI Pipeline**: GitHub Actions automated matrix verifying both Client and Backend on push and PR to `main`

---

### 2. REPOSITORY STRUCTURE

```text
.
├── .github/
│   └── workflows/ci.yml              # Automated CI/CD Pipeline on GitHub Actions
├── .husky/
│   └── pre-commit                    # Git hook executing lint-staged before commit
├── .agent/
│   └── skills/ui-ux-pro-max/SKILL.md # UI/UX design intelligence skill for Next.js & MUI
├── .docs/
│   ├── RULES.md                      # Mandatory coding rules (SOLID, DRY, CQS, No emoji)
│   ├── FEATURES_DONE.md              # Detailed progress and completed features tracker
│   └── DIARY.md                      # Engineering diary and architectural decision records (ADR)
├── .AGENT.md                         # Central coordination index for AI Agents
├── docker-compose.yml                # Docker services (RabbitMQ 4, .NET 10 BFF)
├── BFF/                              # Backend For Frontend (.NET 10 Web API)
│   ├── LmsSaaS.Api/                  # Controllers (Auth, Courses, Classes, Schedule, Notifications), Middlewares
│   ├── LmsSaaS.Core/                 # Entities, Interfaces, Events, CQS Models, Enums
│   ├── LmsSaaS.Infrastructure/       # AppDbContext, MassTransit Consumers, Supabase Npgsql, DI setup
│   ├── LmsSaaS.UnitTests/            # xUnit automated test suite (55 test cases, 100% passed)
│   └── LmsSaaS.slnx                  # .NET Solution file
└── client/                           # Frontend application (Next.js 16 + MUI)
    ├── src/
    │   ├── app/                      # App Router (layouts, [tenantSlug], auth route handlers)
    │   ├── components/
    │   │   ├── classes/              # Classes module (ClassesView, ClassDialog, EnrollmentDrawer)
    │   │   ├── courses/              # Courses module (CoursesView, CachedCourseCatalog, CourseDialog)
    │   │   ├── schedule/             # 7-day weekly schedule grid with role-based filtering
    │   │   ├── attendance/           # Batch roll-call attendance sheet with transactional upsert
    │   │   ├── layout/               # App Shell MUI (WorkspaceSidebar, WorkspaceHeader, NotificationBell)
    │   │   └── providers/            # MuiProvider, Redux StoreProvider, SWRProvider, AuthProvider
    │   ├── constants/                # Routes (ROUTES.API), Cache tags, Environment constants
    │   ├── hooks/                    # SWR Hooks (useCourses, useClasses, useSchedule, useNotifications)
    │   ├── locales/                  # Bilingual dictionaries (vi.ts, en.ts, types.ts)
    │   ├── lib/                      # Axios client, utils, Zod schemas
    │   ├── services/                 # API client services (notificationService, classService, etc.)
    │   ├── store/                    # Redux Toolkit store (languageSlice, hooks)
    │   ├── theme/                    # MUI Enterprise Theme (palette, typography, overrides)
    │   └── types/                    # TypeScript interfaces aligned with Backend CQS contracts
    ├── next.config.ts                # Turbopack, Cache life profiles, Rewrites to BFF
    └── package.json                  # Dependencies (MUI v9, Next.js 16, React 19, Emotion, SWR, Redux)
```

---

### 3. IMPLEMENTED MODULES & FEATURES

1. **Multi-Tenant Auth & Silent Token Rotation**:
   - Multi-tenant sign-in with 2-stage tenant selector.
   - HttpOnly Cookie session management controlled by the .NET BFF.
   - Background silent token rotation via Edge Middleware and Axios Interceptors with mutex locks.
2. **Courses Management (`Courses`)**:
   - MUI TableContainer with instant search, pagination, and tuition fee formatting.
   - Quick status toggle via `<Switch>` calling HTTP PATCH, optimistic UI update via SWR.
   - Next.js 16 `"use cache"` directive integration via `CachedCourseCatalog`.
3. **Classes Management & Conflict Detection (`Classes`)**:
   - Class listing with course badge, teacher info, room, capacity, and session count.
   - Class creation modal with visual weekday selector (`<ToggleButtonGroup>`).
   - Automated session generator (`ClassSessions`), instructor time conflict detection, and subscription limit checks.
4. **Student Enrollment & Class Drawer (`Enrollments`)**:
   - Enrollment drawer with real-time capacity badge (`enrolled / MaxCapacity`).
   - Duplicate enrollment prevention and audit-safe enrollment cancellation.
5. **Weekly Schedule Grid (`/schedule`)**:
   - 7-day timetable (Monday through Sunday) with week navigation and today highlight.
   - Dynamic role-based view: Admins view all classes, Instructors view assigned classes, Students view enrolled classes with personal attendance status.
6. **Batch Attendance Roll-Call (`/attendance`)**:
   - Real-time attendance KPIs (Total, Present, Late, Absent).
   - Topic entry, "Mark All Present" shortcut, and 4-state toggle per student.
   - Atomic batch upsert executed in a single Database Transaction (ACID All-or-Nothing).
7. **Event-Driven Notification System (`Notifications`)**:
   - **Broker & Consumers**: MassTransit 8 with RabbitMQ (AMQP) and In-Memory fallback. Background consumers restore tenant context and persist notifications for class assignment and absence alerts.
   - **MUI Notification Bell**: Embedded in `WorkspaceHeader` with unread badge count, popover drawer, unread highlight dot, and Vietnamese/English relative timestamps.
   - **Zero Technical Jargon**: 100% user-friendly, clean UI without any technical infrastructure terms.

---

### 4. GETTING STARTED

#### 4.1. Prerequisites
* **Node.js**: Version 20.x or higher (Node 22+ recommended)
* **pnpm**: Version 10.x or higher (`npm install -g pnpm`)
* **.NET SDK**: Version 10.x or higher
* **Docker & Docker Compose**: For RabbitMQ and containerized execution

#### 4.2. Installation & Setup
```bash
# 1. Install root dependencies (Husky & dev tools)
pnpm install

# 2. Install client dependencies
pnpm --dir client install

# 3. Restore .NET packages
dotnet restore BFF/LmsSaaS.slnx
```

#### 4.3. Environment Configuration
Copy `client/.env.example` to `client/.env.local`:
```bash
# Windows PowerShell:
Copy-Item client/.env.example client/.env.local

# Linux / macOS:
cp client/.env.example client/.env.local
```

#### 4.4. Running the Development Environment

**Option A: Running with Docker Compose (Full Stack with RabbitMQ)**:
```bash
docker compose up -d
```
- RabbitMQ Management Dashboard: [http://localhost:15672](http://localhost:15672) (guest / guest)
- BFF .NET API: [http://localhost:5045](http://localhost:5045)

**Option B: Running Locally (In-Memory Bus Fallback)**:
```bash
# Terminal 1: Run .NET 10 BFF (Port 5045)
dotnet run --project BFF/LmsSaaS.Api

# Terminal 2: Run Next.js 16 Client (Port 3000)
pnpm --dir client dev
```
* Client Web Application: [http://localhost:3000](http://localhost:3000)
* Swagger OpenAPI Documentation: [http://localhost:5045/swagger](http://localhost:5045/swagger)

---

### 5. QUALITY ASSURANCE & TESTING

All checks must pass 100% green before creating any commit:

```bash
# 1. Run Backend Unit Tests (55 test cases, 100% pass)
dotnet test BFF/LmsSaaS.slnx

# 2. Build Backend Solution (0 warnings, 0 errors)
dotnet build BFF/LmsSaaS.slnx

# 3. Frontend TypeScript Type-Check (0 errors)
pnpm --dir client exec tsc --noEmit

# 4. Frontend ESLint
pnpm --dir client run lint

# 5. Production Next.js 16 Build
pnpm --dir client run build
```

---

<a name="phiên-bản-tiếng-việt"></a>
## PHIÊN BẢN TIẾNG VIỆT

Hệ thống quản lý đào tạo & học tập đa khách thuê (Multi-tenant LMS SaaS) chuẩn Enterprise, được xây dựng theo mô hình Monorepo hiện đại, phân tách độc lập giữa **Frontend (Next.js 16 App Router & Material UI)** và **Backend For Frontend (BFF .NET 10 Clean Architecture, MassTransit & RabbitMQ)**.

---

### 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

Dự án được thiết kế theo các tiêu chuẩn kiến trúc phần mềm cao cấp, đảm bảo tính mở rộng, bảo mật và trải nghiệm người dùng doanh nghiệp:

* **Frontend (`client/`)**:
  * **Core Framework**: Next.js 16 (App Router, Turbopack, Cache Components `"use cache"`, Partial Prerendering - PPR) & React 19
  * **Design System & UI**: **Material UI (MUI v9)** kết hợp `@emotion/react`, `@emotion/styled`, `@mui/material-nextjs/v15-appRouter` (`enableCssLayer: true`) & Tailwind CSS v4
  * **Theme tập trung**: Palette chuẩn Enterprise (Indigo 600, Slate 900, background `#f8fafc`), Typography Plus Jakarta Sans, bo góc chuẩn 10px, loại bỏ box-shadow thô cũ
  * **Đa ngôn ngữ (i18n)**: Redux Toolkit hỗ trợ chuyển đổi mượt mà giữa Tiếng Việt và Tiếng Anh trên toàn bộ hệ thống (menu, phân hệ, chuông thông báo)
  * **State & Data Fetching**: SWR (Stale-While-Revalidate) tự động deduplication, revalidation on focus & Redux Toolkit
  * **API Layer**: Axios wrapper với Interceptors tự động bắt lỗi 401 và thực hiện Silent Refresh Token Rotation ngầm không gián đoạn
  * **Schema Validation**: Zod
  * **Package Manager**: pnpm (v10)
* **Backend For Frontend (`BFF/`)**:
  * **Nền tảng**: .NET 10 Web API, C# 13+
  * **Kiến trúc**: Clean Architecture (`LmsSaaS.Api`, `LmsSaaS.Core`, `LmsSaaS.Infrastructure`, `LmsSaaS.UnitTests`)
  * **Cơ sở dữ liệu**: PostgreSQL Supabase kết hợp Entity Framework Core 10
  * **Multi-tenancy**: Tự động lọc dữ liệu khách thuê qua `ITenantEntity` và Global Query Filters
  * **Xử lý sự kiện (Event-Driven)**: **MassTransit 8** kết nối **RabbitMQ** với cơ chế **Hybrid Transport** (tự động chuyển sang In-Memory Bus khi chạy local không có Docker)
  * **Khôi phục ngữ cảnh Tenant**: Phục hồi thông tin Tenant cho Scoped Service trong luồng nền của Consumer (`ICurrentTenantService.SetTenantContext`)
  * **Cơ chế CQS & Dynamic HTTP PATCH**: Extension `ToPatchDictionary()` sử dụng Reflection chỉ cập nhật đúng các cột thực tế thay đổi, không dùng hậu tố `Dto`
  * **Thuật toán Xếp lịch & Kiểm soát Hạn ngạch**: Tự động rải lịch học định kỳ (`ClassSessions`), phát hiện trùng lịch giảng dạy của giảng viên và kiểm soát hạn ngạch gói cước (`MaxClassesLimit`)
  * **Kiểm thử**: xUnit, NSubstitute, .NET Test SDK (100% tests passed)
* **Hạ tầng & CI/CD**:
  * **Container hóa**: Docker Compose với dịch vụ `lms-rabbitmq` (`rabbitmq:4-management-alpine`) và `lms-bff`
  * **Git Hooks**: Husky 9 + lint-staged (chặn commit lỗi linter, type-check, hoặc unit test thất bại)
  * **CI Pipeline**: GitHub Actions tự động kiểm định độc lập cho cả Client và Backend khi có Push hoặc Pull Request vào nhánh `main`

---

### 2. CẤU TRÚC THƯ MỤC DỰ ÁN

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
├── docker-compose.yml                # Khởi chạy RabbitMQ 4 và BFF .NET 10
├── BFF/                              # Mã nguồn Backend (.NET 10 Web API)
│   ├── LmsSaaS.Api/                  # Controllers (Auth, Courses, Classes, Schedule, Notifications), Middlewares
│   ├── LmsSaaS.Core/                 # Entities, Interfaces, Events, CQS Models, Enums
│   ├── LmsSaaS.Infrastructure/       # AppDbContext, MassTransit Consumers, Npgsql, DI setup
│   ├── LmsSaaS.UnitTests/            # Bộ kiểm thử Unit Test xUnit (55 test cases đạt 100%)
│   └── LmsSaaS.slnx                  # Solution file .NET
└── client/                           # Mã nguồn Frontend (Next.js 16 + MUI)
    ├── src/
    │   ├── app/                      # App Router (layout, [tenantSlug], api proxy routes)
    │   ├── components/
    │   │   ├── classes/              # Phân hệ Lớp học (ClassesView, Dialog mở lớp, EnrollmentDrawer)
    │   │   ├── courses/              # Phân hệ Khóa học (CoursesView, CachedCourseCatalog, Dialogs)
    │   │   ├── schedule/             # Thời khóa biểu tuần 7 ngày theo vai trò
    │   │   ├── attendance/           # Sổ điểm danh theo lô với giao dịch Transaction
    │   │   ├── layout/               # App Shell MUI (WorkspaceSidebar, WorkspaceHeader, NotificationBell)
    │   │   └── providers/            # MuiProvider, Redux StoreProvider, SWRProvider, AuthProvider
    │   ├── constants/                # Routes (ROUTES.API), Cache tags, Cấu hình môi trường
    │   ├── hooks/                    # SWR Hooks (useCourses, useClasses, useSchedule, useNotifications)
    │   ├── locales/                  # Bộ từ điển song ngữ (vi.ts, en.ts, types.ts)
    │   ├── lib/                      # Axios client, utils, Zod schemas
    │   ├── services/                 # Thin API services (notificationService, classService...)
    │   ├── store/                    # Redux Toolkit store (languageSlice, hooks)
    │   ├── theme/                    # MUI Enterprise Theme (palette, typography, component overrides)
    │   └── types/                    # Types đồng bộ CQS (Create/Patch/Response không dùng đuôi Dto)
    ├── next.config.ts                # Turbopack, Cache life profiles, Rewrites kết nối BFF
    └── package.json                  # Dependencies (MUI v9, Next.js 16, React 19, Emotion, SWR, Redux)
```

---

### 3. CÁC PHÂN HỆ TÍNH NĂNG ĐÃ TRIỂN KHAI

#### 3.1. Xác thực & Quản lý Phiên Đa khách thuê (Multi-tenancy Auth)
- Đăng nhập đa trung tâm, tự động phân quyền theo vai trò (`CenterAdmin`, `Teacher`, `Student`).
- Cơ chế **Silent Refresh Token Rotation**: Xoay vòng Refresh Token ngầm tại Edge Middleware và Axios Interceptors với Mutex Queue, không làm gián đoạn người dùng.
- Cookie HttpOnly bảo mật cao với thời hạn do `.NET BFF` kiểm soát duy nhất (Single Source of Truth).

#### 3.2. Quản lý Khóa học (`Courses`)
- Bảng danh sách khóa học sử dụng **MUI TableContainer & Table** kèm thanh tìm kiếm nhanh.
- Nút gạt `<Switch>` bật/tắt nhanh trạng thái tuyển sinh: Gọi trực tiếp HTTP PATCH chỉ gửi `{ isActive }`, đồng bộ tức thì qua SWR.
- Hộp thoại `<Dialog>` Tạo mới & Chỉnh sửa: Tự động tính toán diff và chỉ gửi các trường thay đổi lên máy chủ qua `PatchCourseRequest`.
- Tích hợp Server Component `CachedCourseCatalog` minh họa directive `"use cache"` của Next.js 16.

#### 3.3. Quản lý Lớp học & Xếp lịch Tự động (`Classes`)
- Hiển thị danh sách lớp học: Khóa học (`Chip`), Giảng viên, Phòng học, Thời gian, Sĩ số, Tổng số buổi (`Chip`), Trạng thái (`Tuyển sinh`, `Đang học`, `Hoàn thành`, `Đã hủy`).
- Hộp thoại `<Dialog maxWidth="md" fullWidth>` Mở lớp học mới:
  - `<FormControl>` + `<Select>` chọn Khóa học và Giảng viên (từ API `/api/members/teachers`).
  - `<ToggleButtonGroup>` trực quan chọn các thứ trong tuần (Thứ 2 &rarr; Chủ Nhật).
  - Thuật toán tự động rải lịch sinh ra toàn bộ danh sách `ClassSessions` theo khung giờ định kỳ.
  - Kiểm soát hạn ngạch gói cước (`MaxClassesLimit`) và tự động kiểm tra chống trùng giờ giảng dạy của giảng viên.

#### 3.4. Quản lý Ghi danh Học viên (`Enrollments`)
- Ngăn kéo [EnrollmentDrawer.tsx](file:///client/src/components/classes/EnrollmentDrawer.tsx) hiển thị danh sách học viên trong lớp, chip hiển thị sĩ số thời gian thực (`count / MaxCapacity`).
- Kiểm soát nghiêm ngặt sĩ số tối đa, ngăn ngừa ghi danh trùng lặp và hỗ trợ hủy ghi danh an toàn (bảo lưu lịch sử điểm danh cũ).

#### 3.5. Thời khóa biểu Tuần theo Vai trò (`/schedule`)
- Lưới thời khóa biểu 7 ngày (Thứ 2 &rarr; Chủ Nhật) trực quan bằng Material UI.
- Phân quyền thông minh: `CenterAdmin` xem toàn bộ trung tâm (kèm bộ lọc lớp/giảng viên), `Teacher` chỉ xem các lớp mình phụ trách kèm nút *"Điểm danh"*, `Student` chỉ xem lớp đã ghi danh kèm huy hiệu trạng thái chuyên cần cá nhân.

#### 3.6. Sổ Điểm danh Buổi học theo Lô (`/attendance`)
- Thống kê 4 thẻ KPI chuyên cần theo thời gian thực (Tổng số, Có mặt, Đi muộn, Vắng).
- Ô nhập chủ đề bài giảng (`Topic`), nút *"Đánh dấu tất cả Có mặt"*, `<ToggleButtonGroup>` 4 trạng thái và ô ghi chú học viên.
- Thao tác lưu điểm danh theo lô bọc trong một Database Transaction duy nhất (All-or-Nothing).

#### 3.7. Hệ thống Thông báo Hướng sự kiện (Event-Driven Notification System)
- **Hạ tầng Broker & Consumers**: MassTransit 8 kết nối RabbitMQ (AMQP 0-9-1) và In-Memory Bus fallback. Các Background Consumer khôi phục ngữ cảnh Tenant an toàn và ghi bản ghi thông báo phân công giảng dạy hoặc cảnh báo vắng mặt.
- **Chuông thông báo MUI ([NotificationBell.tsx](file:///client/src/components/layout/NotificationBell.tsx))**: Tích hợp trên `WorkspaceHeader` với Badge đỏ hiển thị số lượng chưa đọc, Popover cuộn êm ái, đánh dấu thông báo chưa đọc (chấm xanh + nền sáng), thời gian tương đối đa ngữ (VI / EN).
- **Giao diện sạch (Zero Technical Jargon)**: Thân thiện tuyệt đối với người dùng cuối, không xuất hiện bất kỳ thuật ngữ kỹ thuật hạ tầng nào trên màn hình.

---

### 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

#### 4.1. Yêu cầu môi trường
* **Node.js**: Phiên bản 20.x trở lên (khuyến nghị Node 22+)
* **pnpm**: Phiên bản 10.x trở lên (`npm install -g pnpm`)
* **.NET SDK**: Phiên bản 10.x trở lên
* **Docker & Docker Compose**: Dùng cho RabbitMQ và triển khai container

#### 4.2. Cài đặt các gói phụ thuộc
```bash
# 1. Cài đặt tại thư mục gốc (Husky & devTools)
pnpm install

# 2. Cài đặt dependencies cho Client
pnpm --dir client install

# 3. Khôi phục gói .NET cho Backend
dotnet restore BFF/LmsSaaS.slnx
```

#### 4.3. Thiết lập biến môi trường
Tạo file `client/.env.local` từ `client/.env.example`:
```bash
# Windows PowerShell:
Copy-Item client/.env.example client/.env.local

# Linux/macOS:
cp client/.env.example client/.env.local
```

#### 4.4. Khởi chạy môi trường phát triển (Dev)

**Cách 1: Chạy toàn bộ với Docker Compose (BFF + RabbitMQ)**:
```bash
docker compose up -d
```
- RabbitMQ Management Dashboard: [http://localhost:15672](http://localhost:15672) (guest / guest)
- BFF .NET API: [http://localhost:5045](http://localhost:5045)

**Cách 2: Chạy Local (Tận dụng In-Memory Bus)**:
```bash
# Cửa sổ 1: Khởi chạy Backend .NET 10 BFF (Port 5045)
dotnet run --project BFF/LmsSaaS.Api

# Cửa sổ 2: Khởi chạy Frontend Next.js 16 (Port 3000)
pnpm --dir client dev
```
* Giao diện người dùng: [http://localhost:3000](http://localhost:3000)
* Swagger API Documentation: [http://localhost:5045/swagger](http://localhost:5045/swagger)

---

### 5. KIỂM THỬ & KIỂM ĐỊNH CHẤT LƯỢNG

Toàn bộ dự án phải đạt 100% tiêu chuẩn xanh trước khi triển khai hoặc tạo commit:

```bash
# 1. Kiểm tra Backend Unit Tests (55 test cases đạt 100%)
dotnet test BFF/LmsSaaS.slnx

# 2. Biên dịch giải pháp Backend (0 warning, 0 error)
dotnet build BFF/LmsSaaS.slnx

# 3. Kiểm tra Type-check TypeScript Frontend (0 lỗi)
pnpm --dir client exec tsc --noEmit

# 4. Kiểm tra ESLint
pnpm --dir client run lint

# 5. Biên dịch thử nghiệm bản Production Next.js 16
pnpm --dir client run build
```

---

### 6. TÀI LIỆU QUẢN TRỊ & HƯỚNG DẪN CHI TIẾT

* [.AGENT.md](file:///.AGENT.md): Chỉ mục và hướng dẫn trung tâm dành cho AI Agent.
* [.docs/RULES.md](file:///.docs/RULES.md): Bộ quy tắc bắt buộc về Clean Code, CQS, SOLID, DRY và đặt tên.
* [.docs/FEATURES_DONE.md](file:///.docs/FEATURES_DONE.md): Tiến độ chi tiết các phân hệ đã hoàn thành.
* [.docs/DIARY.md](file:///.docs/DIARY.md): Nhật ký kỹ thuật và các quyết định kiến trúc theo từng ngày.
