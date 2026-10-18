# PROJECT WORK DIARY (NHẬT KÝ PHÁT TRIỂN)

Tài liệu này ghi lại toàn bộ lịch sử các phiên làm việc, những quyết định kiến trúc và thay đổi quan trọng theo từng ngày trong quá trình phát triển dự án **LMS SaaS**.

---

## [2026-10-17] Khởi tạo nền tảng dự án & Hệ sinh thái AI Agent

### Mục tiêu trong ngày
* Khởi tạo dự án Frontend Next.js sạch, hiện đại tại thư mục `client/`.
* Thiết lập toàn bộ cấu trúc AI Agent, bộ quy tắc chuẩn và hệ thống tài liệu quản lý.

### Các công việc đã thực hiện
1. **Thiết lập Frontend (`client`)**:
   - Sử dụng `create-next-app` phiên bản mới nhất với các tùy chọn: TypeScript, Tailwind CSS v4, App Router, ESLint 9, `src/` directory, và package manager `pnpm`.
   - Đổi tên thư mục thành `client` (chữ thường) để tuân thủ quy ước đặt tên gói của npm.
   - Chạy lệnh kiểm tra `pnpm run build` xác nhận quá trình biên dịch và khởi tạo hoàn tất không có lỗi.
2. **Cấu hình Git Ignore**:
   - Thêm quy tắc chặn các file nhạy cảm (.NET / Supabase connection strings, node_modules, build artifacts, cấu hình Agent cục bộ).
3. **Xây dựng hệ sinh thái AI Agent & Tài liệu (.docs)**:
   - Khởi tạo [.AGENT.md](file:///d:/Project/SAAS/.AGENT.md) làm trung tâm điều phối và chỉ mục tài liệu cho Agent.
   - Soạn thảo [.docs/RULES.md](file:///d:/Project/SAAS/.docs/RULES.md) định nghĩa toàn diện về SOLID, quy ước đặt tên file (bắt buộc IN HOA cho file `.md`), ưu tiên tách file dùng chung và phân định ranh giới Backend (User tự code BFF).
   - Thiết lập bảng theo dõi tính năng [.docs/FEATURES_DONE.md](file:///d:/Project/SAAS/.docs/FEATURES_DONE.md).
   - Đóng gói Skill UI/UX Pro Max trong [.agent/skills/ui-ux-pro-max/SKILL.md](file:///d:/Project/SAAS/.agent/skills/ui-ux-pro-max/SKILL.md) tối ưu cho Next.js 15+ và Tailwind CSS v4.
4. **Bổ sung Quy tắc Thiết kế & Mã nguồn (Code & UI Rules)**:
   - Thêm quy tắc nghiêm cấm sử dụng emoji trong mã nguồn sinh ra (JSX, strings, comments); mọi biểu tượng trực quan bắt buộc dùng Icon từ thư viện chuẩn (sẽ chọn và cài đặt thư viện sau).
5. **Thiết lập Hạ tầng Chất lượng Code & CI/CD (Husky, Zod, GitHub Actions cho Client & BFF)**:
   - Cài đặt và cấu hình Husky 9 tại thư mục gốc với hook `pre-commit` chạy `lint-staged`.
   - Cấu hình `lint-staged.config.mjs` tự động chạy:
     + Với Client (`client/**`): ESLint (`--fix`) và TypeScript check (`tsc --noEmit`).
     + Với Backend (`BFF/**`): `dotnet build` và `dotnet test`.
   - Khởi tạo project `LmsSaaS.UnitTests` (.NET 10 xUnit) trong `BFF/` và tích hợp vào solution `LmsSaaS.slnx`.
   - Cài đặt Zod cho Client và tạo schema mẫu tại `client/src/lib/validations/authSchema.ts`.
   - Thiết lập GitHub Actions CI workflow tại `.github/workflows/ci.yml` kiểm định tự động song song cho cả Frontend và Backend.

### Quyết định kiến trúc & Kỹ thuật
* **Kiến trúc phân tầng**:
  * Frontend: Next.js 15+ (App Router) với Tailwind CSS v4, chú trọng tính modular và reusable components.
  * Backend: .NET BFF do người dùng tự chủ động phát triển; Agent tôn trọng ranh giới và không can thiệp tự tiện.
* **Quy chuẩn Markdown**: Thống nhất tuyệt đối tên tất cả file `.md` đều phải viết IN HOA để tạo tính đồng nhất và dễ nhận diện.
* **Tích hợp Skill độc lập**: Không clone toàn bộ repository bên ngoài; thay vào đó tích hợp trực tiếp hướng dẫn và nguyên tắc cốt lõi của `ui-ux-pro-max` vào `.agent/skills/ui-ux-pro-max/SKILL.md` để giữ dự án gọn nhẹ, sạch sẽ và tải nhanh.
* **Chuẩn hóa Icon & Cấm Emoji**: Loại bỏ hoàn toàn emoji thô sơ trong mã nguồn để đảm bảo độ chuyên nghiệp của giao diện SaaS, tránh lỗi hiển thị lệch giữa các nền tảng và tuân thủ chuẩn a11y. Khi cần icon, sẽ import từ thư viện icon chuẩn.
* **Kiểm định mã nguồn hai tầng (Two-layer Quality Gate)**:
  * Tầng 1 (Local Git Hook): Husky + lint-staged chặn ngay tại máy lập trình viên trước khi commit nếu có lỗi linter hoặc lỗi type TypeScript.
  * Tầng 2 (Remote CI): GitHub Actions tự động kiểm định lại toàn diện trong môi trường sạch (clean container) mỗi khi có Push hoặc Pull Request vào nhánh `main`.

### Kế hoạch tiếp theo
* Chuẩn hóa cấu trúc thư mục Frontend và khởi tạo các thành phần nền tảng.

---

## [2026-10-18] Chuẩn hóa Khung sườn Cấu trúc Thư mục Frontend & Đồng bộ Editor

### Mục tiêu trong ngày
* Hoàn thiện bộ khung cấu trúc thư mục cho Frontend `client/src/` theo chuẩn SOLID và DRY.
* Cung cấp các tiện ích cốt lõi (utils, types, constants, apiClient, custom hooks, common button).
* Thiết lập cấu hình `.editorconfig` đồng bộ định dạng mã nguồn tại Root.

### Các công việc đã thực hiện
1. **Tiện ích và Thư viện hỗ trợ Frontend**:
   - Cài đặt `clsx` và `tailwind-merge` cho `client`.
   - Tạo `src/lib/utils.ts` chứa hàm `cn()`, `formatCurrency()`, `formatDate()`.
2. **Định nghĩa Types & Route Constants**:
   - Tạo `src/types/index.ts` định nghĩa các interfaces toàn cục: `User`, `UserRole`, `ApiResponse`, `PaginatedResponse`.
   - Tạo `src/constants/routes.ts` quản lý tập trung toàn bộ route paths (AUTH, DASHBOARD, LEARNING).
3. **Tầng Service & Custom Hook**:
   - Tạo `src/services/apiClient.ts` bọc `fetch` chuẩn, hỗ trợ query params, typing và xử lý lỗi tập trung.
   - Tạo `src/hooks/useDebounce.ts` tối ưu tìm kiếm và xử lý sự kiện liên tục.
4. **Common UI Components**:
   - Tạo `src/components/common/Button.tsx` và `src/components/common/index.ts` tuân thủ nghiêm ngặt chuẩn UI/UX, hỗ trợ các variants, sizes, loading state và hoàn toàn không chứa emoji.
5. **Cấu hình Môi trường & Editor**:
   - Tạo `client/.env.example` mẫu cấu hình kết nối API.
   - Tạo `.editorconfig` ở Root đồng bộ tab size và format giữa C# (4 spaces) và TypeScript (2 spaces).
6. **Sửa quy tắc Gitignore cho file môi trường mẫu**:
   - Điều chỉnh `client/.gitignore` và root `.gitignore` để un-ignore các file `*.example` (`client/.env.example`), đảm bảo file mẫu cấu hình được theo dõi trên Git.
7. **Biên soạn tài liệu dự án [README.md](file:///d:/Project/SAAS/README.md)**:
   - Viết tài liệu hướng dẫn đầy đủ bao gồm: Giới thiệu tổng quan hệ thống LMS SaaS, sơ đồ kiến trúc thư mục, yêu cầu môi trường (Node, pnpm, .NET SDK), hướng dẫn các bước clone và cài đặt, cách chạy dev server cả 2 phân hệ và hướng dẫn kiểm thử.

### Quyết định kiến trúc & Kỹ thuật
* **Phân tầng rõ ràng cho Frontend**:
  - Tách biệt rạch ròi giữa UI trưng bày (`components/`), tầng gọi mạng (`services/apiClient.ts`), kiểu dữ liệu (`types/`), logic tái sử dụng (`hooks/`) và các hằng số (`constants/routes.ts`).
  - Đảm bảo tuân thủ nguyên tắc Single Responsibility (SOLID) ngay từ những dòng code đầu tiên.

### Kế hoạch tiếp theo
* Xây dựng tiếp các common UI components còn lại (`Input`, `Card`, `Modal`, `Badge`...) tại `src/components/common/`.
* Thiết kế App Shell Layout cho ứng dụng LMS (Sidebar điều hướng, Header Bar, User Menu).

---

## [2026-10-18] Triển khai Nền tảng Backend BFF (.NET 10, Multi-tenancy, JWT & Database Schema)

### Mục tiêu trong phiên làm việc
* Triển khai toàn bộ tầng Core Domain, Entities, Enums và Common Interface theo thiết kế ERD.
* Cấu hình DbContext, kết nối Supabase PostgreSQL và thiết lập cơ chế đa khách thuê (Multi-tenancy).
* Tách biệt thực thể gói cước `SubscriptionPlan` độc lập, sinh EF Migration và cập nhật Database.
* Xây dựng luồng xác thực Custom JWT scoped theo Tenant, Options Pattern (`IOptions<JwtOptions>`), Tenant Resolution Middleware và AuthController.
* Thiết lập bộ Unit Test toàn diện cho Data Layer, Service Layer và Middleware Layer (13/13 tests pass).

### Các công việc đã thực hiện
1. **Khởi tạo Domain Model & Entities (`LmsSaaS.Core`)**:
   - Tạo interface đa khách thuê `ITenantEntity` (`TenantId`).
   - Định nghĩa các Enums: `RoleInTenant`, `ClassStatus`, `TuitionStatus`, `AttendanceStatus`.
   - Tạo toàn bộ 12 entities: `Tenant`, `User`, `TenantMember`, `Course`, `Class`, `ClassSession`, `Enrollment`, `Attendance`, `ClassMaterial`, `Quiz`, `QuizSubmission`, `SubscriptionPlan`.
   - Tuân thủ nghiêm ngặt chuẩn C# 12+: File-scoped namespace, using đầy đủ, tách mỗi class một file, không constructor thủ công, khởi tạo giá trị mặc định cho thuộc tính.
2. **Cấu hình EF Core & Multi-tenancy (`LmsSaaS.Infrastructure`)**:
   - Tạo `AppDbContext` đăng ký 12 `DbSet` tương ứng.
   - Cơ chế Reflection tự động áp dụng `HasQueryFilter` lọc dữ liệu theo `CurrentTenantId` cho mọi entity kế thừa `ITenantEntity`.
   - Cấu hình Unique Indexes: `Tenant.Slug`, `User.Email`, `TenantMember(TenantId, UserId)`, `Enrollment(ClassId, StudentId)`, `SubscriptionPlan.Code`.
   - Cấu hình cột kiểu PostgreSQL JSONB cho `QuestionsJson` và `AnswersJson`.
   - Cấu hình độ chính xác số thực chuẩn `numeric` (`TuitionFee`, `Score`, `Price`).
   - Thiết lập `DeleteBehavior.Restrict` cho toàn bộ các khóa ngoại liên quan tới `User` để tránh cascade vòng.
3. **Tách riêng bảng SubscriptionPlans & Quota Management**:
   - Tạo thực thể hệ thống `SubscriptionPlan` độc lập, tách các giới hạn `MaxClassesLimit`, `MaxStudentsPerClass` ra khỏi `Tenant`.
   - Cập nhật quan hệ 1-N giữa `SubscriptionPlan` và `Tenant` (`SubscriptionPlanId`).
   - Tạo migration `AddSubscriptionPlansTable`, bổ sung bước nạp sẵn 2 gói hệ thống (`FREE` và `PRO`) và chuyển đổi dữ liệu an toàn.
   - Chạy `dotnet ef database update` áp dụng thành công lên Supabase PostgreSQL.
   - Cập nhật `DbSeeder` tự động khởi tạo dữ liệu mẫu cho hệ thống.
4. **Custom Tenant-Scoped JWT Authentication & Security Middleware**:
   - Định nghĩa `JwtOptions` theo Options Pattern và đăng ký qua `services.Configure<JwtOptions>`.
   - Triển khai `ICurrentTenantService` và `CurrentTenantService` lưu trữ ngữ cảnh khách thuê (`TenantId`, `TenantSlug`, `UserId`, `Role`).
   - Triển khai `IJwtService` và `JwtService` sinh Tenant-Scoped JWT ký HMAC-SHA256 chứa 5 claims bắt buộc.
   - Tạo `TenantResolutionMiddleware`: kiểm tra header `X-Tenant-Slug`, chặn 403 Forbidden ngay lập tức nếu lệch claim token; tự động nạp ngữ cảnh vào `ICurrentTenantService`.
   - Cấu hình pipeline chuẩn trong `Program.cs` (`UseAuthentication` -> `TenantResolutionMiddleware` -> `UseAuthorization`).
   - Tạo `AuthController` với 2 endpoints: `POST /api/auth/login` và `POST /api/auth/select-tenant`.
5. **Kiểm thử tự động (Unit Tests)**:
   - Xây dựng 13 bài unit test bao phủ toàn bộ:
     + 8 tests trong `DbContextModelTests` (12 entities, ITenantEntity, unique indexes, jsonb, precision, restrict delete, query filter isolation).
     + 2 tests trong `JwtServiceTests` (kiểm tra Options Pattern, sinh token, claims, chữ ký).
     + 3 tests trong `TenantResolutionMiddlewareTests` (chặn lệch slug 403, trích xuất ngữ cảnh, unauthenticated pass-through).
   - Kiểm tra `dotnet build` đạt 0 Warning(s), 0 Error(s).
   - Kiểm tra `dotnet test` đạt 13/13 Passed (100%).

### Quyết định kiến trúc & Kỹ thuật
* **Multi-tenancy by Isolation (Row-Level Security / Global Query Filter)**:
  - Phân tách dữ liệu tự động ở mức ORM thông qua `ITenantEntity` và Reflection, giúp lập trình viên không cần viết điều kiện `Where(x => x.TenantId == ...)` thủ công ở từng query.
  - Các bảng dùng chung cấp hệ thống (`Tenant`, `User`, `SubscriptionPlan`) không kế thừa `ITenantEntity` và không bị ảnh hưởng bởi bộ lọc này.
* **Tenant-Scoped JWT + Defense in Depth**:
  - Token không chỉ định danh người dùng mà còn gắn chặt với ngữ cảnh của một trung tâm cụ thể.
  - Middleware đóng vai trò chốt chặn vòng ngoài (Security Gatekeeper): đối chiếu giữa request header và token claim, ngăn chặn triệt để nguy cơ tấn công IDOR hoặc nhầm lẫn ngữ cảnh khách thuê.
* **Options Pattern (`IOptions<T>`)**:
  - Tuân thủ nguyên tắc Clean Architecture, tách biệt cấu hình và business logic, hỗ trợ type-safety và dễ dàng unit test không cần phụ thuộc vào `IConfiguration`.


