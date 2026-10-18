# FEATURES DONE & ROADMAP TRACKING

Tài liệu này theo dõi toàn bộ tiến độ tính năng của dự án **LMS SaaS**, phân chia rõ ràng các hạng mục đã hoàn thành, đang tiến hành và kế hoạch sắp tới.

---

## 1. TỔNG QUAN TIẾN ĐỘ

| Trạng thái | Số lượng | Tỷ lệ |
| :--- | :--- | :--- |
| **Đã hoàn thành (Done)** | 7 | 100% (Giai đoạn khởi tạo, Hạ tầng & Backend Auth/DB) |
| **Đang tiến hành (In Progress)** | 0 | 0% |
| **Kế hoạch sắp tới (Todo)** | 2 | - |

---

## 2. DANH SÁCH TÍNH NĂNG ĐÃ HOÀN THÀNH (DONE)

### [2026-10-17] Khởi tạo nền tảng Frontend (Client)
* **Mô tả**: Thiết lập dự án Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 tại thư mục [client](file:///d:/Project/SAAS/client).
* **Kết quả**:
  * Cấu trúc App Router với thư mục `src/app/`.
  * Linter ESLint 9 và trình quản lý gói `pnpm`.
  * Cấu hình Turbopack và xác thực biên dịch `pnpm run build` thành công.
* **Người thực hiện**: AI Agent & User.

### [2026-10-17] Thiết lập hệ sinh thái AI Agent & Tài liệu (.docs)
* **Mô tả**: Xây dựng cấu trúc điều phối cho Agent, hệ thống tài liệu và skill chuyên biệt.
* **Kết quả**:
  * Thiết lập entry point [.AGENT.md](file:///d:/Project/SAAS/.AGENT.md).
  * Bộ quy tắc chuẩn [RULES.md](file:///d:/Project/SAAS/.docs/RULES.md) (SOLID, đặt tên, DRY, file dùng chung, phân định BE).
  * Tài liệu theo dõi [FEATURES_DONE.md](file:///d:/Project/SAAS/.docs/FEATURES_DONE.md) và [DIARY.md](file:///d:/Project/SAAS/.docs/DIARY.md).
  * Tích hợp Skill `ui-ux-pro-max` trong [.agent/skills/ui-ux-pro-max/SKILL.md](file:///d:/Project/SAAS/.agent/skills/ui-ux-pro-max/SKILL.md).
* **Người thực hiện**: AI Agent & User.

### [2026-10-17] Thiết lập Hạ tầng Chất lượng Code & CI/CD (Husky, Zod, GitHub Actions cho Client & BFF)
* **Mô tả**: Tích hợp Git hooks chặn commit lỗi, schema validation và pipeline tự động hóa CI/CD cho cả Frontend (Next.js) và Backend (BFF .NET).
* **Kết quả**:
  * Cấu hình Husky 9 và lint-staged tại thư mục gốc quản lý Git hooks tập trung cho cả Client (ESLint, tsc) và BFF (dotnet build, dotnet test).
  * Khởi tạo dự án Unit Test `LmsSaaS.UnitTests` (.NET 10 xUnit) trong `BFF/` và liên kết vào solution `LmsSaaS.slnx`.
  * Cài đặt Zod cho Client và tạo cấu trúc validation dùng chung tại `client/src/lib/validations/authSchema.ts`.
  * Thiết lập GitHub Actions CI workflow tại `.github/workflows/ci.yml` tự động kiểm định độc lập cho cả Client và Backend khi có Push hoặc Pull Request.
* **Người thực hiện**: AI Agent & User.

### [2026-10-18] Chuẩn hóa Khung sườn Cấu trúc Thư mục Frontend (Client Foundation)
* **Mô tả**: Xây dựng toàn bộ các tầng thư mục chức năng cho Frontend theo chuẩn SOLID, DRY và Clean Architecture.
* **Kết quả**:
  * Tạo `src/lib/utils.ts` với hàm nối class `cn()` (clsx + tailwind-merge) và các helper format tiền tệ, ngày tháng.
  * Tạo `src/types/index.ts` định nghĩa các interfaces toàn cục (`User`, `ApiResponse`, `PaginatedResponse`).
  * Tạo `src/constants/routes.ts` quản lý tập trung toàn bộ route paths của ứng dụng.
  * Tạo `src/services/apiClient.ts` xử lý HTTP client chuẩn với `fetch` kết nối tới BFF .NET.
  * Tạo `src/hooks/useDebounce.ts` custom hook dùng chung.
  * Tạo `src/components/common/Button.tsx` component dùng chung chuẩn UX/a11y không emoji.
  * Tạo `client/.env.example` và `.editorconfig` đồng bộ định dạng mã nguồn tại Root.
* **Người thực hiện**: AI Agent & User.

### [2026-10-18] Triển khai Backend Core & Multi-tenancy Database Schema (BFF .NET)
* **Mô tả**: Xây dựng toàn bộ 11 thực thể khởi đầu, cấu hình DbContext PostgreSQL Supabase và tự động hóa bộ lọc đa khách thuê (`ITenantEntity`).
* **Kết quả**:
  * Tạo 11 entities, 5 enums và interface `ITenantEntity` tuân thủ nghiêm ngặt C# 12+.
  * Cấu hình DbContext: reflection auto query filter theo `CurrentTenantId`, PostgreSQL JSONB, độ chính xác numeric, restrict delete cho quan hệ User.
  * Tạo 6 bài unit tests ban đầu kiểm định toàn diện model mapping và isolation logic.
* **Người thực hiện**: AI Agent & User.

### [2026-10-18] Tách thực thể SubscriptionPlan độc lập & Áp dụng Migration Supabase
* **Mô tả**: Tách rời quota giới hạn (`MaxClassesLimit`, `MaxStudentsPerClass`) ra khỏi `Tenant` thành bảng hệ thống `SubscriptionPlan`.
* **Kết quả**:
  * Tạo entity `SubscriptionPlan` (Code, Name, Price, Quotas), bỏ enum trùng tên tránh lỗi CS0104.
  * Thiết lập quan hệ 1-N `SubscriptionPlan` -> `Tenant` với `OnDelete(DeleteBehavior.Restrict)`.
  * Tạo migration `AddSubscriptionPlansTable`, nạp sẵn 2 gói hệ thống (`FREE`, `PRO`) và migrate an toàn dữ liệu Tenant cũ.
  * Cập nhật schema thành công lên cơ sở dữ liệu Supabase PostgreSQL.
  * Cập nhật `DbSeeder` tự động seed gói cước và dữ liệu mẫu.
* **Người thực hiện**: AI Agent & User.

### [2026-10-18] Triển khai Custom Tenant-Scoped JWT Authentication & Security Middleware
* **Mô tả**: Xây dựng hệ thống cấp phát token JWT theo Options Pattern, Middleware chặn truy cập chéo và AuthController.
* **Kết quả**:
  * Định nghĩa `JwtOptions` (Section `"Jwt"`), cấu hình `AddJwtBearer` qua Options Pattern.
  * Triển khai `JwtService` sinh Tenant-Scoped JWT HMAC-SHA256 với 5 claims: `NameIdentifier`, `Email`, `Role`, `tenant_id`, `tenant_slug`.
  * Triển khai `TenantResolutionMiddleware` đối chiếu `X-Tenant-Slug` và claim token, ngắt 403 Forbidden nếu lệch; nạp ngữ cảnh vào `ICurrentTenantService`.
  * Tạo `AuthController` với endpoints `/api/auth/login` và `/api/auth/select-tenant`.
  * Bộ unit test đạt 13/13 tests pass (100%), biên dịch 0 error, 0 warning.
* **Người thực hiện**: AI Agent & User.

---

## 3. TÍNH NĂNG ĐANG TIẾN HÀNH (IN PROGRESS)
*(Hiện chưa có task nào đang chạy)*

---

## 4. KẾ HOẠCH SẮP TỚI (TODO / ROADMAP)

### Giai đoạn 1: Xây dựng Core UI & Design System (Client)
- [x] Thiết lập thư mục components dùng chung `src/components/common/` (Button, index...).
- [ ] Xây dựng App Shell Layout (Sidebar điều hướng, Header Bar, User Avatar, Notification Menu).
- [ ] Định nghĩa Design Tokens (Theme colors, Spacing, Typography) chuẩn theo `ui-ux-pro-max`.

### Giai đoạn 2: Tích hợp Xác thực (Authentication)
- [x] Tích hợp API xác thực từ Backend (BFF .NET) / Supabase.
- [x] Quản lý trạng thái phiên đăng nhập Backend (JWT token, middleware bảo vệ tenant).
- [ ] Màn hình Đăng nhập (Sign In) & Đăng ký (Sign Up) trên Client.
- [ ] Client Auth context/middleware quản lý token lưu trữ và route protection.

### Giai đoạn 3: Phân hệ Quản trị & Khóa học (LMS Core)
- [ ] Dashboard tổng quan (Thống kê học viên, doanh thu, khóa học).
- [ ] Quản lý khóa học (Tạo khóa học, chương trình học, upload bài giảng).
- [ ] Giao diện người học (Trang chi tiết khóa học, trình phát video bài giảng, theo dõi tiến độ).

### Giai đoạn 4: Đánh giá & Thanh toán
- [ ] Hệ thống làm bài trắc nghiệm / nộp bài tập.
- [ ] Cổng thanh toán khóa học.
