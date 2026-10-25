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

---

## [2026-10-19] Triển khai BFF Auth Flow, Edge Middleware & Redux Toolkit i18n cho Client

### Mục tiêu trong ngày
* Xây dựng luồng xác thực Client BFF với HttpOnly Cookie an toàn chống XSS.
* Triển khai `middleware.ts` trên Edge/Node Runtime bảo vệ các Dynamic Route `/[tenantSlug]/*`, kiểm tra hết hạn và chặn truy cập chéo (Context Mismatch Check).
* Cập nhật trang `/login` xử lý tự động điều hướng quay lại (`redirectPath`) sau khi chọn trung tâm.
* Quản lý trạng thái đa ngôn ngữ (Tiếng Việt / English) qua Redux Toolkit, loại bỏ hoàn toàn hardcoded route strings.

### Các công việc đã thực hiện
1. **Kiến trúc BFF & HttpOnly Cookie**:
   - Cấu hình biến môi trường `DOTNET_API_URL=http://localhost:5045` trong `client/.env.local`.
   - Tạo các interfaces TypeScript chuẩn tại `client/src/types/auth.ts`: `TenantSummary`, `LoginResponse`, `SelectTenantResponse`, `SetSessionResponse`.
   - Tạo Next.js Route Handlers:
     + `src/app/api/auth/login-proxy/route.ts`: Tiếp nhận thông tin đăng nhập từ client, chuyển tiếp sang .NET BFF và trả về danh sách trung tâm.
     + `src/app/api/auth/set-session/route.ts`: Gọi `select-tenant` xuống .NET BFF, trích xuất access token và gán cookie `access_token` với `httpOnly: true, sameSite: 'lax', path: '/', maxAge: 14400`.
2. **Next.js Edge Middleware (`client/src/middleware.ts`)**:
   - Viết hàm `decodeJwtPayload` giải mã Payload Base64URL trực tiếp trên Edge Runtime không phụ thuộc thư viện bên ngoài.
   - Kiểm tra tuần tự:
     + Chưa đăng nhập -> Redirect về `/login?redirect=<current_path>`.
     + Token hỏng hoặc claim `exp` đã hết hạn -> Xóa cookie `access_token` và redirect về `/login`.
     + Lệch slug (`requestedTenantSlug !== payload.tenant_slug`) -> Tự động bẻ lái redirect về đúng `/${payload.tenant_slug}/dashboard`.
     + Hợp lệ -> `NextResponse.next()`.
   - Cấu hình Matcher chuẩn xác bỏ qua static files, assets, API và login.
3. **Cập nhật Giao diện Login (`client/src/app/(auth)/login/page.tsx`)**:
   - Tích hợp `useSearchParams` đọc query `redirect`, bọc trong `<Suspense>` tương thích strict PPR.
   - Xử lý điều hướng thông minh sau khi chọn trung tâm: nếu `redirectPath` khớp với slug vừa chọn thì điều hướng về trang đó, ngược lại về Dashboard mặc định.
4. **Tích hợp Redux Toolkit i18n & Loại bỏ Hardcoded Routes**:
   - Cài đặt `@reduxjs/toolkit` và `react-redux`.
   - Tạo `src/store/slices/languageSlice.ts` định nghĩa từ điển song ngữ (Tiếng Việt / Tiếng Anh) cho toàn bộ UI và Auth.
   - Tạo `src/store/index.ts`, `src/store/hooks.ts` và `src/store/StoreProvider.tsx` bọc trong `RootLayout`.
   - Tạo component dùng chung `src/components/common/LanguageSwitcher.tsx` với icon SVG chuẩn không emoji.
   - Chuẩn hóa `src/constants/routes.ts` bổ sung các helpers định tuyến động cho `TENANT` và `API`.
5. **Kiểm thử thực tế**:
   - `pnpm run build`: Đạt 0 lỗi TypeScript, 0 lỗi cú pháp App Router, kích hoạt thành công Partial Prerendering và Proxy Middleware.
   - `pnpm dev`: Kiểm định thành công cả 3 kịch bản chuyển hướng qua `curl` (chưa đăng nhập, lệch tenant slug, token hết hạn xóa cookie).

### Quyết định kiến trúc & Kỹ thuật
* **BFF (Backend For Frontend) Cookie Security**:
  - Trình duyệt client không lưu JWT trong `localStorage` hay `sessionStorage`. Toàn bộ token được bảo vệ bởi cờ `HttpOnly`, ngăn chặn mọi nguy cơ đánh cắp token qua XSS.
* **Edge-compatible Lightweight Token Parsing**:
  - Không nạp thư viện `jsonwebtoken` (vốn phụ thuộc Node.js core crypto), chỉ giải mã Base64URL phần payload bằng Web APIs (`atob`) giúp middleware khởi động nhanh và tương thích hoàn toàn với Edge Runtime.
* **Tách rời từ điển Localization (Separation of Concerns)**:
  - Tách riêng toàn bộ dữ liệu văn bản từ điển ra thư mục `src/locales/` (`types.ts`, `vi.ts`, `en.ts`, `index.ts`), giúp `languageSlice.ts` chỉ đảm nhận nhiệm vụ quản lý state của Redux, tạo điều kiện thuận lợi mở rộng quy mô text và bổ sung ngôn ngữ mới dễ dàng.

---

## [2026-10-19] Nâng cấp Hệ thống Xác thực BFF: Refresh Token Rotation & OpenAPI Transformers

### Mục tiêu trong ngày
* Xây dựng cơ chế Refresh Token Rotation gắn theo ngữ cảnh trung tâm (`ITenantEntity`) trong `BFF/`.
* Tái cấu trúc và bổ sung các endpoints xác thực: `select-tenant` cấp phát Refresh Token, `refresh` xoay vòng token không phụ thuộc tenant header cũ, `revoke` thu hồi an toàn.
* Cấu hình Swagger UI thông qua OpenAPI Transformers thuần (.NET 10 `Microsoft.AspNetCore.OpenApi` + `Swashbuckle.AspNetCore.SwaggerUI`), không cài thêm thư viện Scalar ngoài.
* Tạo EF Core migration và cập nhật bảng `RefreshTokens` lên Supabase PostgreSQL.
* Bổ sung bài kiểm thử tự động, đảm bảo 0 lỗi biên dịch, 0 cảnh báo và 100% test case vượt qua.

### Các công việc đã thực hiện
1. **Mô hình Dữ liệu & Options Pattern**:
   - Bổ sung cấu hình `"RefreshTokenExpiryDays": 7` trong `appsettings.json` và `appsettings.Development.json`.
   - Cập nhật `JwtOptions.cs` với thuộc tính `RefreshTokenExpiryDays` (mặc định 7 ngày).
   - Tạo thực thể `RefreshToken.cs` kế thừa `ITenantEntity`, lưu trữ `TenantId`, `UserId`, `Token`, `ExpiresAt`, `CreatedAt`, `RevokedAt`, `ReplacedByToken` và 3 computed properties: `IsExpired`, `IsRevoked`, `IsActive`.
   - Bổ sung quan hệ 1-N `User.RefreshTokens` trong `User.cs`.
   - Khai báo `IJwtService.GenerateRefreshToken()` và DTO `RefreshTokenRequest.cs`.
2. **Tầng Infrastructure & Database**:
   - Triển khai `JwtService.GenerateRefreshToken()` sử dụng `RandomNumberGenerator.GetBytes(64)` và `Convert.ToBase64String(...)`.
   - Cấu hình Fluent API trong `AppDbContext.cs`:
     + `DbSet<RefreshToken> RefreshTokens`.
     + Đặt Unique Index cho cột `Token`, độ dài tối đa 200 ký tự.
     + Bỏ qua 3 computed properties (`entity.Ignore(...)`).
     + Ràng buộc khóa ngoại: `TenantId` trỏ về `Tenant` (Cascade Delete), `UserId` trỏ về `User` (Restrict Delete).
     + Tự động thừa hưởng Tenant Query Filter toàn cục nhờ kế thừa `ITenantEntity`.
   - Tạo migration `20261019042858_AddRefreshTokensTable` và chạy `dotnet ef database update` cập nhật thành công lên Supabase PostgreSQL.
3. **Nâng cấp AuthController**:
   - Tiêm phụ thuộc `IOptions<JwtOptions>` theo Options Pattern (loại bỏ hoàn toàn việc đọc `IConfiguration` thủ công).
   - Nâng cấp `POST /api/auth/select-tenant`: Cấp phát đồng thời `accessToken` và `refreshToken`, lưu bản ghi `RefreshToken` mới vào DB, trả về `{ accessToken, refreshToken, tenantSlug, role }`.
   - Thêm `POST /api/auth/refresh`: Sử dụng `.IgnoreQueryFilters()` để tra cứu token trong DB độc lập với header `CurrentTenantId`, kiểm tra tính hợp lệ và trạng thái `IsActive`, đánh dấu `RevokedAt` và `ReplacedByToken`, sinh token mới và trả về bộ token đã xoay vòng.
   - Thêm `POST /api/auth/revoke`: Yêu cầu `[Authorize]`, đánh dấu `RevokedAt = UtcNow` cho Refresh Token còn hiệu lực để đăng xuất an toàn.
4. **OpenAPI Transformers cho Swagger UI**:
   - Triển khai `BearerSecuritySchemeTransformer.cs` (`IOpenApiDocumentTransformer`) sử dụng `OpenApiSecuritySchemeReference("Bearer", document)` tương thích chuẩn `Microsoft.OpenApi` v2 trong .NET 10, hiển thị nút khóa Authorize trong Swagger UI.
   - Triển khai `TenantHeaderOperationTransformer.cs` (`IOpenApiOperationTransformer`) tự động chèn Header `X-Tenant-Slug` (mặc định `"apex-english"`), loại bỏ các route không cần ngữ cảnh trung tâm (`api/auth/login`, `api/auth/select-tenant`, `api/auth/refresh`, `api/health`).
   - Đăng ký transformers trong `Program.cs` thông qua `builder.Services.AddOpenApi(...)`.
5. **Kiểm thử Unit Test**:
   - Cập nhật `DbContextModelTests.cs`: Kiểm tra đủ 13 entities, `ITenantEntity` implementation cho `RefreshToken`, unique index trên `Token`, restrict delete trên `User`, và query filter tự động.
   - Mở rộng `JwtServiceTests.cs`: Kiểm tra tính hợp lệ của chuỗi Base64 64 bytes sinh ra và tính ngẫu nhiên/độc nhất giữa các lần gọi.
   - Tạo `RefreshTokenRotationTests.cs`: Kiểm thử trạng thái computed properties (`IsActive`, `IsExpired`, `IsRevoked`), mô phỏng logic xoay vòng token.
   - Chạy kiểm thử: Toàn bộ 21/21 tests đều Passed (100%), biên dịch 0 Error, 0 Warning.

### Quyết định kiến trúc & Kỹ thuật
* **Refresh Token Rotation gắn chặt vào Tenant Context (`ITenantEntity`)**:
  - Mỗi Refresh Token được sinh ra sau khi người dùng đã chọn trung tâm cụ thể (`select-tenant`), do đó token bị khóa cứng với `TenantId`. Việc này ngăn chặn tuyệt đối tình trạng dùng token của trung tâm A để truy cập tài nguyên của trung tâm B khi làm mới.
* **Bypass Query Filter trong Endpoint Refresh**:
  - Tại thời điểm client gọi endpoint `/api/auth/refresh`, Access Token đã hết hạn nên `CurrentTenantService` chưa có thông tin `TenantId`. Sử dụng `.IgnoreQueryFilters()` cho phép truy vấn chính xác Refresh Token từ DB dựa trên chuỗi ngẫu nhiên bảo mật cao và quan hệ `Tenant`/`User`.
* **OpenAPI Transformers trong .NET 10**:
  - Tận dụng sức mạnh của OpenAPI Transformers thuần trong ASP.NET Core 10 kết hợp `Swashbuckle.AspNetCore.SwaggerUI`, không cần cài thêm các framework bên thứ ba như Scalar, giữ codebase tinh gọn và tuân thủ chặt chẽ tiêu chuẩn của hệ sinh thái Microsoft.

---

## [2026-10-19] Đồng bộ Thời hạn Cookie Động (Single Source of Truth) & Silent Refresh Token Rotation (Next.js 16)

### Mục tiêu trong ngày
* Đồng bộ cơ chế quản lý thời hạn token: Chuyển toàn bộ quyền kiểm soát `maxAge` của Cookie về `.NET BFF` (Single Source of Truth), loại bỏ hoàn toàn các giá trị hardcode ở phía Next.js.
* Triển khai hoàn thiện cơ chế Silent Refresh Token Rotation tại `src/middleware.ts` trên Next.js App Router (Edge/Node Runtime).
* Xây dựng các Route Handlers `/api/auth/refresh` và `/api/auth/logout` phục vụ quản lý phiên và thu hồi token đồng bộ với `.NET BFF`.
* Cung cấp tiện ích `fetchFromBff<T>` hỗ trợ các Server Components và Server Actions giao tiếp chuẩn xác với Backend kèm token và context header `X-Tenant-Slug`.

### Các công việc đã thực hiện
1. **Nâng cấp `.NET BFF` (`AuthController`)**:
   - Trong `POST /api/auth/select-tenant` và `POST /api/auth/refresh`, tính toán chính xác:
     + `accessTokenExpiresIn = (int)TimeSpan.FromHours(expiryHours).TotalSeconds`
     + `refreshTokenExpiresIn = (int)TimeSpan.FromDays(expiryDays).TotalSeconds`
   - Đưa cả 2 trường vào payload JSON trả về cho Client.
2. **Cập nhật TypeScript Types & Route Constants (`client`)**:
   - Mở rộng `SelectTenantResponse` và `RefreshTokenResponse` trong `src/types/auth.ts` gồm 6 trường: `accessToken`, `refreshToken`, `accessTokenExpiresIn`, `refreshTokenExpiresIn`, `tenantSlug`, `role`.
   - Bổ sung `API.AUTH.REFRESH: "/api/auth/refresh"` và `API.AUTH.LOGOUT: "/api/auth/logout"` trong `src/constants/routes.ts`.
3. **Route Handlers**:
   - `src/app/api/auth/set-session/route.ts`: Nhận response từ BFF và thiết lập `access_token` (`maxAge: data.accessTokenExpiresIn`), `refresh_token` (`maxAge: data.refreshTokenExpiresIn`).
   - `src/app/api/auth/refresh/route.ts`: Tiếp nhận `refresh_token` từ cookie, gọi sang `.NET BFF`, cập nhật cặp token mới với `maxAge` động, hoặc xóa sạch cookies nếu token không hợp lệ (401).
   - `src/app/api/auth/logout/route.ts`: Gọi sang `.NET BFF` `/api/auth/revoke` thu hồi Refresh Token trên DB, sau đó xóa sạch cookies trên trình duyệt.
4. **Nâng cấp `src/middleware.ts` (Silent Refresh Token Rotation)**:
   - Chuyển thành `async function middleware(request: NextRequest)`.
   - Khi `access_token` bị thiếu hoặc đã hết hạn (`exp`), nếu vẫn còn `refresh_token`, Middleware tự động gọi `fetch` sang `.NET BFF` `/api/auth/refresh`.
   - Khi refresh thành công: Đính kèm cặp token mới vào `response.cookies` với `maxAge: data.accessTokenExpiresIn` và `maxAge: data.refreshTokenExpiresIn`, cập nhật header cookie cho request downstream, kiểm tra Context Mismatch (`requestedTenantSlug` vs `tenantSlug`) và cho phép người dùng tiếp tục mà không bị gián đoạn.
   - Khi refresh thất bại: Xóa toàn bộ cookies và chuyển hướng về `/login?redirect=...`.
5. **Tiện ích BFF Client (`src/lib/bff-client.ts`)**:
   - Viết hàm `fetchFromBff<T>(endpoint, options)` tự động đọc `access_token` từ `cookies()`, gắn `Authorization: Bearer ...` và `X-Tenant-Slug`, gọi `${process.env.DOTNET_API_URL}${endpoint}` với `cache: "no-store"`.
6. **Kiểm tra và Xác minh chất lượng**:
   - `dotnet test BFF/LmsSaaS.slnx -m:1 /nr:false`: Đạt 21/21 tests passed (100%), 0 Warning, 0 Error.
   - `pnpm run build` tại `client`: Đạt 0 lỗi TypeScript, 0 lỗi linter, biên dịch trong 677ms.
   - **Live Integration Testing**: Chạy kiểm thử trực tiếp 6 kịch bản xác thực thực tế trên Backend BFF kết nối Supabase:
     + `POST /api/auth/login`: Xác thực thành công tài khoản `john.teacher@apex.edu.vn`.
     + `POST /api/auth/select-tenant`: Sinh token và trả về `accessTokenExpiresIn: 14400s`, `refreshTokenExpiresIn: 604800s`.
     + `POST /api/auth/refresh`: Xoay vòng Refresh Token thành công, cấp cặp token mới với expiry động.
     + Old Token Replay Prevention: Refresh Token cũ bị từ chối 401 Unauthorized khi cố tái sử dụng.
     + `POST /api/auth/revoke`: Thu hồi token thành công trong Database.
     + Revoked Token Rejection: Token đã thu hồi bị từ chối 401 Unauthorized khi gửi lên.
   - Đảm bảo toàn bộ các tiến trình kiểm thử đã được giải phóng sạch sẽ (ports 5045 và 3000 không còn chạy ngầm).
7. **Tập trung hóa Cấu hình (Environment & AppSettings)**:
   - Client: Tạo `src/constants/config.ts` (`COOKIE_NAMES`, `ENV_CONFIG`), cập nhật `.env.local` và `.env.example`. Thay thế toàn bộ hardcode URLs và tên cookie trong các route handlers, middleware và bff-client.
   - Backend: Tạo `TenantSettings.cs`, cấu hình `"TenantSettings"` trong `appsettings.json` và `appsettings.Development.json`, tiêm `IOptions<TenantSettings>` vào `TenantHeaderOperationTransformer`.

### Quyết định kiến trúc & Kỹ thuật
* **Bypass Query Filter tại các bước Pre-Auth**:
  - Tại `POST /api/auth/login` và `POST /api/auth/select-tenant`, người dùng chưa chọn trung tâm nên `CurrentTenantId` là null. Do thực thể `TenantMember` kế thừa `ITenantEntity`, cần áp dụng `.IgnoreQueryFilters()` để không bị bộ lọc đa khách thuê ẩn mất danh sách trung tâm của người dùng.
* **Tập trung hóa Cấu hình Đa môi trường**:
  - Tách rời toàn bộ cookie names, API URLs và slug mặc định vào file cấu hình môi trường `.env.local` và `appsettings.json`, tuân thủ chuẩn 12-Factor App và nguyên tắc DRY.
* **Single Source of Truth cho thời hạn Cookie**:
  - Việc Backend `.NET` là nguồn chân lý duy nhất xác định `accessTokenExpiresIn` và `refreshTokenExpiresIn` giúp tránh hoàn toàn hiện tượng lệch pha thời gian (Clock Skew / Desync) giữa thời hạn thực tế của JWT/Database và thời hạn tồn tại của HttpOnly Cookie trên trình duyệt. Khi đổi cấu hình `JwtOptions` ở Backend, Frontend tự động cập nhật ngay lập tức mà không cần sửa code hay build lại.
* **Non-blocking Silent Refresh tại Edge Middleware**:
  - Người dùng không phải bấm đăng nhập lại khi Access Token hết hạn (4 giờ). Middleware tự động thực hiện Refresh Token Rotation ngầm (silent), đảm bảo trải nghiệm người dùng liền mạch (Seamless UX) trong khi vẫn duy trì chuẩn bảo mật cấp doanh nghiệp cao nhất.

---

## [2026-10-19] Thiết lập Tầng gọi API Tập trung Axios kết hợp SWR (Next.js 16)

### Mục tiêu trong ngày
* Xây dựng tầng gọi API tập trung chuẩn hóa cho Frontend bằng Axios kết hợp SWR.
* Tự động bắt lỗi 401 Unauthorized tại Response Interceptor với hàng đợi Mutex (`failedQueue`), kích hoạt Silent Refresh ngầm và tự động gửi lại (replay) request ban đầu mà không làm gián đoạn người dùng.
* Cung cấp Thin Service Layer loại bỏ hoàn toàn việc viết `try-catch` thủ công ở các UI components.
* Xây dựng Custom Hooks với `useSWR` tối ưu hóa caching, deduplication, optimistic mutation và revalidation.

### Các công việc đã thực hiện
1. **Cài đặt thư viện**:
   - Cài đặt `axios` v1.20 và `swr` v2.5 qua `pnpm add axios swr`.
2. **Khởi tạo Axios Instance (`src/lib/axios.ts`)**:
   - `axiosClient` cấu hình sẵn `baseURL: ENV_CONFIG.PUBLIC_API_URL`, `timeout: 15000`, `withCredentials: true`.
   - Request Interceptor: Tự động trích xuất slug trung tâm từ URL và gắn Header `X-Tenant-Slug`.
   - Response Interceptor:
     + Bắt lỗi 401 với cơ chế khóa hàng đợi (`isRefreshing` + `failedQueue`), ngăn chặn nhiều request đồng thời kích hoạt nhiều lượt refresh token (chống vi phạm Refresh Token Rotation).
     + Gọi sang Route Handler `/api/auth/refresh` bằng fetch native với cookie hiện tại.
     + Nếu thành công: Giải phóng hàng đợi và replay request ban đầu.
     + Nếu thất bại: Chuyển hướng người dùng về trang `/login?redirect=...`.
     + Chuẩn hóa lỗi thống nhất thành lớp `AppApiError` (`status`, `message`, `data`).
   - Cung cấp tiện ích `api` (`get`, `post`, `put`, `patch`, `delete`) unwrapped `response.data`.
3. **Thin Service Layer (`src/services/exampleService.ts`)**:
   - Xây dựng `exampleService` cung cấp các phương thức CRUD (`getCourses`, `getCourseById`, `createCourse`, `updateCourse`, `deleteCourse`) hoàn toàn không chứa khối `try-catch` lặp lại.
4. **Tích hợp SWR Custom Hooks & UI Component**:
   - Tạo `src/hooks/useExampleCourses.ts`: Custom Hook bọc `useSWR`, trả về `courses`, `totalItems`, `totalPages`, `currentPage`, `hasNextPage`, `isLoading`, `isError`, `error`, và hàm `mutate()`.
   - Tạo `src/components/example/ExampleCourseList.tsx`: Component hiển thị đầy đủ 4 trạng thái UI (Loading Skeleton, Error Alert với nút Thử lại, Data Cards với chuyển trang, Empty State) theo tiêu chuẩn UX `ui-ux-pro-max`.
5. **Kiểm tra và Xác minh chất lượng**:
   - `pnpm run build`: Biên dịch thành công trong 816ms, 0 lỗi TypeScript, 0 cảnh báo linter.
   - `dotnet test BFF/LmsSaaS.slnx`: 21/21 Unit tests Backend đạt 100%.

### Quyết định kiến trúc & Kỹ thuật
* **Mutex & Queueing Pattern trong Axios Interceptor**:
  - Khi người dùng truy cập một trang dashboard tải nhiều widget song song và Access Token vừa hết hạn, nếu không có cơ chế xếp hàng, tất cả các request sẽ đồng thời gọi Refresh Token. Do Refresh Token Rotation chỉ cho phép sử dụng token 1 lần duy nhất, các request đến sau sẽ gửi token đã bị thu hồi và khiến người dùng bị văng ra trang Login. Việc dùng cờ `isRefreshing` kết hợp `failedQueue` đảm bảo chỉ có duy nhất 1 lượt refresh diễn ra, các request khác tạm dừng và replay ngay khi token mới sẵn sàng.
* **Tách biệt Thin Service Layer và State Management (SWR)**:
  - Tầng Service chỉ tập trung vào việc định nghĩa HTTP contract và URL parameters (Pure API calling).
  - Tầng Custom Hook (SWR) chịu trách nhiệm về state lifecycle (`isLoading`, `data`, `error`), cache retention, deduping interval và revalidation, giúp code giao diện cực kỳ sạch sẽ, dễ đọc và dễ unit test.

---

## [2026-10-19] Bản địa hóa Đa ngôn ngữ Tập trung (Redux i18n) & Chuẩn hóa Log / Exception 100% Tiếng Anh

### Mục tiêu trong phiên làm việc
* Rà soát và loại bỏ 100% văn bản hardcoded ở phía Frontend (Client Next.js 16).
* Khai báo toàn bộ văn bản giao diện, thông báo xác thực, nhãn form, schema validation, aria-labels và tiêu đề trang vào từ điển `src/locales/` (`types.ts`, `vi.ts`, `en.ts`).
* Hỗ trợ chuyển đổi ngôn ngữ tức thời (live switching Tiếng Việt / Tiếng Anh) thông qua Redux Toolkit (`useAppSelector((state) => state.language.t)`).
* Chuẩn hóa 100% các dòng log lập trình viên, thông báo lỗi ngoại lệ (`Error`), response messages ở tầng API Server (Next.js Route Handlers và .NET BFF) sang hoàn toàn bằng Tiếng Anh.

### Các công việc đã thực hiện
1. **Mở rộng Từ điển Bản địa hóa (`src/locales/`)**:
   - Cập nhật `types.ts`: Bổ sung các interfaces `AuthValidationTranslations`, `CoursesTranslations`, `HomeTranslations`, cùng các trường mở rộng trong `CommonTranslations` (`footerSecurityBadge`, `switchLanguageAria`, `closeErrorAria`, `showPasswordAria`, `hidePasswordAria`, `logoAlt`) và `DashboardTranslations` (`sessionHttpOnlyPrefix`, `sessionActive`, `sessionProtected`, `statsGrowth`, `statsOnline`...).
   - Cập nhật `vi.ts`: Khai báo chi tiết 100% bản dịch Tiếng Việt chuẩn mực, chuyên nghiệp.
   - Cập nhật `en.ts`: Khai báo chi tiết 100% bản dịch Tiếng Anh đối ứng 1:1 theo strict TypeScript interface.
2. **Cập nhật Schema Validation (`src/lib/validations/authSchema.ts`)**:
   - Chuyển đổi các thông báo lỗi Zod schema từ hardcoded tiếng Việt sang factory functions `createLoginSchema(t)` và `createRegisterSchema(t)` đọc trực tiếp từ `t.auth.validation`.
3. **Refactor Giao diện Client sang Redux Reactivity**:
   - Tạo Client Component `src/components/dashboard/DashboardView.tsx` nhận `{ tenantSlug, hasToken }`, liên kết với Redux store `t` giúp toàn bộ Dashboard chuyển đổi ngôn ngữ mượt mà ngay trên Client.
   - Nâng cấp `src/app/[tenantSlug]/dashboard/page.tsx` thành Server Component bọc ngoài gọn gàng, chuyển việc hiển thị giao diện cho `DashboardView`.
   - Tạo `src/components/home/HomeView.tsx` và refactor `src/app/page.tsx`: Loại bỏ toàn bộ hardcoded text, hiển thị thanh chuyển ngữ `LanguageSwitcher` trên trang chủ.
   - Refactor `src/components/example/ExampleCourseList.tsx`: Thay thế toàn bộ chuỗi tìm kiếm, nút làm mới, phân trang, thông báo lỗi và trạng thái rỗng bằng `t.courses.*`.
   - Nâng cấp `src/components/common/LanguageSwitcher.tsx`: Sử dụng `t.common.switchLanguageAria` và nhãn ngôn ngữ động.
   - Nâng cấp `src/app/(auth)/login/page.tsx`: Sử dụng `t.common.closeErrorAria`, `t.common.showPasswordAria`, `t.common.hidePasswordAria`, `t.common.footerSecurityBadge`.
4. **Chuẩn hóa Thông báo Lỗi & Log 100% Tiếng Anh**:
   - Route Handlers Next.js (`src/app/api/auth/*`): Toàn bộ thông điệp trả về JSON (`message`) và lỗi bắt được chuyển thành câu tiếng Anh chuyên nghiệp.
   - Client API Utilities (`src/lib/axios.ts`, `src/lib/bff-client.ts`): Toàn bộ lỗi `Error` và fallback messages chuyển sang tiếng Anh.
   - .NET Backend (`AuthController.cs`, `TenantResolutionMiddleware.cs`, `BearerSecuritySchemeTransformer.cs`, `TenantHeaderOperationTransformer.cs`): Toàn bộ response messages và mô tả OpenAPI chuyển sang tiếng Anh chuẩn RESTful.
5. **Kiểm tra và Xác minh chất lượng**:
   - `pnpm run build`: 0 lỗi TypeScript, 0 lỗi linting, tất cả routes compile thành công.
   - `dotnet test`: Toàn bộ 21/21 Unit tests trong `LmsSaaS.UnitTests` đều passed 100%.

### Quyết định kiến trúc & Kỹ thuật
* **Phân định rõ ranh giới UI Text vs Server Log / Developer Messages**:
  - Toàn bộ văn bản hiển thị cho người dùng cuối (End-user UI) bắt buộc đi qua Redux dictionary (`t.*`) để người dùng có thể chuyển đổi linh hoạt giữa Tiếng Việt và Tiếng Anh.
  - Toàn bộ thông báo hệ thống, mã lỗi API, Exception Message và Console/Logger của lập trình viên bắt buộc ghi bằng Tiếng Anh để đảm bảo chuẩn quốc tế, dễ tích hợp với các hệ thống APM / Log Aggregation (Datadog, OpenTelemetry, Sentry).

---

## [2026-10-19] Tái Cấu Trúc Toàn Diện Các API Route Handlers & Auth Service với Axios

### Mục tiêu trong phiên làm việc
* Loại bỏ triệt để mã nguồn rườm rà (boilerplate `fetch`, `JSON.stringify`, `response.json()`, manual status checking, headers) tại các Route Handlers `src/app/api/auth/*`.
* Tận dụng tối đa sức mạnh của Axios đã cài đặt: Tạo Axios instance chuyên biệt cho Server (`bffClient`) kết nối sang .NET BFF.
* Đóng gói tầng Client Service (`authService.ts`) để trang Đăng nhập (`login/page.tsx`) gọi API trực tiếp qua Axios một cách gọn gàng, rõ nghĩa.
* Hợp nhất các client gọi API cũ (`apiClient.ts`) về chuẩn Axios duy nhất.

### Các công việc đã thực hiện
1. **Nâng cấp `src/lib/bff-client.ts`**:
   - Khởi tạo `bffClient: AxiosInstance` cấu hình sẵn `baseURL: ENV_CONFIG.DOTNET_API_URL`, headers JSON và timeout 15s.
   - Viết hàm `handleBffError(error: unknown)` tự động bắt `AxiosError`, trích xuất status code và JSON data từ .NET BFF để trả về `NextResponse.json(...)` chính xác, không cần viết try-catch thủ công lặp lại.
   - Nâng cấp `fetchFromBff<T>` cho Server Components sử dụng `bffClient`.
2. **Refactor 4 API Route Handlers (`src/app/api/auth/*`)**:
   - `login-proxy/route.ts`: Rút gọn từ 56 dòng xuống chỉ còn 17 dòng nhờ `bffClient.post("/api/auth/login", body)`.
   - `set-session/route.ts`: Ủy quyền gọi `/api/auth/select-tenant` cho `bffClient.post(...)`, loại bỏ toàn bộ validate rườm rà vì .NET BFF và TypeScript đã đảm nhiệm.
   - `refresh/route.ts`: Thay thế `fetch` bằng `bffClient.post("/api/auth/refresh", { refreshToken })`.
   - `logout/route.ts`: Thay thế `fetch` bằng `bffClient.post("/api/auth/revoke", ...)`.
3. **Tạo mới `src/services/authService.ts`**:
   - Sử dụng `api` / `axiosClient` cung cấp các phương thức `login`, `setSession`, `refresh`, `logout`.
4. **Refactor `src/app/(auth)/login/page.tsx`**:
   - Thay thế toàn bộ các khối gọi `fetch(ROUTES.API.AUTH.LOGIN_PROXY, ...)` và `fetch(ROUTES.API.AUTH.SET_SESSION, ...)` bằng `authService.login(...)` và `authService.setSession(...)`.
5. **Hợp nhất `src/services/apiClient.ts`**:
   - Chuyển `apiClient.ts` sang re-export `api` và `axiosClient` từ `@/lib/axios`.
6. **Kiểm tra và Xác minh**:
   - `pnpm run build`: Thành công trong 2.7s, 0 lỗi TypeScript, 0 lỗi cú pháp.
   - `dotnet test`: 21/21 Unit tests Backend passed 100%.

### Quyết định kiến trúc & Kỹ thuật
* **Kiến trúc Axios 2 Đầu (Client-to-Next.js và Next.js-to-BFF)**:
  - Ở phía Trình duyệt (Client): `axiosClient` (`src/lib/axios.ts`) gọi tới `/api/*` của Next.js (hoặc backend công khai), tự động đính kèm HttpOnly Cookies, bắt lỗi 401 với hàng đợi Mutex và kích hoạt Silent Refresh.
  - Ở phía Máy chủ (Next.js Route Handlers / Server Components): `bffClient` (`src/lib/bff-client.ts`) gọi trực tiếp tới `http://localhost:5045` (.NET BFF) trong mạng nội bộ, tự động xử lý serialization, timeout và chuyển tiếp status code nguyên bản từ .NET sang Client thông qua `handleBffError`.

---

## [2026-10-19] Tích hợp Global SWR Provider (SWRConfig) Bọc Toàn Cây Ứng Dụng Client

### Mục tiêu trong phiên làm việc
* Thiết lập Global Provider cho SWR (`SWRConfig`) trong thư mục `client/src/providers/`.
* Tự động liên kết `api.get` (Axios) làm Default Fetcher cho SWR, loại bỏ nhu cầu truyền fetcher thủ công trong từng component.
* Cấu hình caching tối ưu: chống gọi trùng lặp (deduping interval), tự động revalidate on focus/reconnect.
* Chặn vòng lặp retry vô hạn đối với các mã lỗi xác thực (401, 403, 404).
* Bọc `<SwrProvider>` tại Root Layout (`src/app/layout.tsx`).

### Các công việc đã thực hiện
1. **Khởi tạo `src/providers/SwrProvider.tsx`**:
   - Sử dụng `"use client"`.
   - Cấu hình `swrGlobalConfig`:
     + `fetcher: async (url: string) => api.get(url)`: Sử dụng Axios instance đã cấu hình interceptor để tự động bắt và làm mới token khi fetch SWR.
     + `revalidateOnFocus: true`, `revalidateOnReconnect: true`.
     + `dedupingInterval: 5000`: Gom các request cùng endpoint trong 5 giây thành 1 lượt gọi duy nhất.
     + `shouldRetryOnError`: Trả về `false` nếu lỗi là `AppApiError` với status 401, 403 hoặc 404, ngăn SWR gửi retry dồn dập khi phiên đăng nhập hết hạn hoặc tài nguyên không tồn tại.
     + `onError`: Ghi log lỗi bằng tiếng Anh ở môi trường phát triển (`[SWR Error]`).
   - Tạo barrel export `src/providers/index.ts`.
2. **Bọc SWR Provider tại Root Layout (`src/app/layout.tsx`)**:
   - Tích hợp `<SwrProvider>` bên trong `<StoreProvider>` (Redux Toolkit) và bên trong `<Suspense fallback={null}>`:
     ```tsx
     <Suspense fallback={null}>
       <StoreProvider>
         <SwrProvider>{children}</SwrProvider>
       </StoreProvider>
     </Suspense>
     ```
3. **Chuẩn hóa Barrel Export & Comments**:
   - Tạo `src/hooks/index.ts` xuất khẩu toàn bộ custom hooks (`useDebounce`, `useExampleCourses`, `useExampleCourse`).
   - Dịch toàn bộ JSDoc comments trong `SwrProvider.tsx`, `exampleService.ts` và `useExampleCourses.ts` sang 100% tiếng Anh chuẩn.
4. **Kiểm tra và Xác minh chất lượng**:
   - `npx tsc --noEmit`: 0 lỗi TypeScript.
   - `pnpm run build`: Thành công 100% với Turbopack & App Router.
   - `dotnet test`: 21/21 Unit tests Backend đạt 100% Passed.

### Quyết định kiến trúc & Kỹ thuật
* **Thứ bậc Provider (Provider Hierarchy)**:
  - `<StoreProvider>` bọc ngoài cùng cung cấp state i18n / auth cho toàn bộ ứng dụng.
  - `<SwrProvider>` đặt ngay bên dưới, giúp mọi component con có thể gọi `useSWR(key)` trực tiếp mà không cần chỉ định fetcher, và tự động thừa hưởng cơ chế bắt lỗi 401 tự động xoay vòng refresh token của Axios.
* **Ngăn chặn Retry bão hòa đối với lỗi Auth (Retry Suppression)**:
  - Khi gặp 401, Axios Response Interceptor đã phụ trách việc refresh token hoặc chuyển hướng về `/login`. Nếu SWR tiếp tục retry song song, nó có thể gây ra xung đột phiên làm việc hoặc vi phạm Refresh Token Rotation. Việc chặn retry trên 401/403/404 ở cấp SWR Config giúp hệ thống vận hành ổn định và an toàn.

---

## [2026-10-19] Xây dựng Trọn bộ Khung Giao diện App Shell Layout (`[tenantSlug]/layout.tsx`)

### Mục tiêu trong phiên làm việc
* Xây dựng khung giao diện App Shell hiện đại cho không gian làm việc trung tâm đào tạo tại `client/src/app/[tenantSlug]/layout.tsx`.
* Tách biệt Sidebar điều hướng chuyên nghiệp, Header tích hợp chuyển ngữ & đăng xuất, và khu vực nội dung cuộn độc lập.
* Sử dụng 100% routes từ `src/constants/routes.ts`, không hardcode URLs.
* Tích hợp Redux i18n đa ngôn ngữ cho toàn bộ menu và nhãn giao diện.
* Không dùng emoji; dùng icon SVG theo chuẩn `ui-ux-pro-max`.

### Các công việc đã thực hiện
1. **Cập nhật Hằng số Định tuyến (`src/constants/routes.ts`)**:
   - Mở rộng `ROUTES.TENANT` gồm: `ROOT`, `DASHBOARD`, `COURSES`, `CLASSES`, `SCHEDULE`, `ATTENDANCE`.
2. **Bản địa hóa Thanh điều hướng (`src/locales/`)**:
   - Bổ sung interface `NavigationTranslations` vào `types.ts`.
   - Cung cấp toàn bộ bản dịch song ngữ Tiếng Việt và Tiếng Anh trong `vi.ts` và `en.ts`.
3. **Phát triển Components Layout (`src/components/layout/`)**:
   - `WorkspaceSidebar.tsx`:
     + Menu điều hướng: Tổng quan, Khóa học, Lớp học, Lịch học, Điểm danh.
     + Active highlighting theo `usePathname()` với style SaaS tinh tế.
     + Thu gọn linh hoạt trên Desktop (`w-64` <-> `w-20`).
     + Ngăn kéo trượt (Mobile Drawer) với lớp phủ mờ Backdrop, đóng mở mượt mà và hỗ trợ phím Escape.
   - `WorkspaceHeader.tsx`:
     + Nút mở mobile drawer trên màn hình nhỏ.
     + Huy hiệu trung tâm hiện tại (Workspace Badge) kèm đèn tín hiệu Live HttpOnly.
     + Tích hợp `LanguageSwitcher`, nút Đổi không gian (`ROUTES.AUTH.LOGIN`), và nút Đăng xuất (kết nối `authService.logout()` thu hồi refresh token DB trên Supabase).
   - `WorkspaceShell.tsx`: Quản lý state đóng/mở sidebar, chia khung 2 cột với thanh cuộn độc lập cho main content.
   - `WorkspaceSectionView.tsx`: Giao diện chung cao cấp cho các phân hệ chức năng.
4. **App Shell Layout (`src/app/[tenantSlug]/layout.tsx`)**:
   - Server Component nhận `params: Promise<{ tenantSlug: string }>` theo chuẩn Next.js 16 (`await params`).
5. **Tạo các Subpages**:
   - `courses/page.tsx`: Tích hợp danh sách khóa học SWR (`ExampleCourseList`).
   - `classes/page.tsx`, `schedule/page.tsx`, `attendance/page.tsx`: Hiển thị phân hệ tương ứng, chuyển trang mượt mà không bị 404.
6. **Kiểm tra và Xác minh**:
   - TypeScript `npx tsc --noEmit`: 0 lỗi.
   - `pnpm run build`: Hoàn thành 14/14 static & dynamic routes thành công.
   - `dotnet test`: 21/21 Unit tests Backend đạt 100% Passed.

### Quyết định kiến trúc & Kỹ thuật
* **Phân tách Server Layout & Client Shell (Hybrid Composition)**:
  - `layout.tsx` là async Server Component trích xuất `tenantSlug` từ route params mà không làm mất hiệu năng SSR/PPR.
  - `WorkspaceShell` là Client Component đóng vai trò điều phối các tương tác responsive (thu gọn sidebar, mobile drawer, đóng bằng phím ESC) mà không làm ô nhiễm Server Layout.
* **Độc lập luồng cuộn (Independent Scroll Container)**:
  - Khung bao ngoài cố định `h-screen overflow-hidden`.
  - Header `sticky top-0`.
  - Phần `<main>` có `overflow-y-auto`, giúp Sidebar và Header luôn cố định vị trí khi người dùng cuộn xem nội dung dài trên bảng dữ liệu hoặc khóa học.

---

## [2026-10-19] Khắc Phục Lỗi CORS & Đồng Bộ Định Tuyến Same-Origin BFF (Next.js 16 & .NET BFF)

### Mục tiêu trong phiên làm việc
* Điều tra và giải quyết triệt để lỗi: `Access to XMLHttpRequest at 'http://localhost:5045/api/api/auth/login-proxy' from origin 'http://localhost:3000' has been blocked by CORS policy`.
* Khôi phục tính nhất quán của kiến trúc BFF 2 đầu: Client gọi Next.js Same-Origin Route Handlers, Next.js gọi .NET BFF qua `bffClient`.
* Thiết lập chính sách CORS chuẩn trên .NET BFF (`Program.cs`) cho phép `http://localhost:3000`.

### Các công việc đã thực hiện
1. **Phân tích Nguyên nhân Gốc rễ (Root Cause)**:
   - **Frontend URL Resolution**: `NEXT_PUBLIC_API_URL` được cấu hình là `http://localhost:5045/api`. Khi `authService.login()` gọi endpoint `ROUTES.API.AUTH.LOGIN_PROXY` (`/api/auth/login-proxy`), Axios đã tự động ghép `baseURL` + `url` tạo ra URL `http://localhost:5045/api/api/auth/login-proxy`:
     + Gây lặp tiền tố `/api/api/`.
     + Bắn request thẳng sang Backend .NET (port 5045) thay vì gọi Next.js Route Handler cục bộ (port 3000).
     + Endpoint `login-proxy` vốn là Route Handler trung gian của Next.js (`src/app/api/auth/login-proxy/route.ts`), hoàn toàn không tồn tại trên .NET BFF (trên .NET là `/api/auth/login`).
     + Bỏ qua hoàn toàn tầng quản lý HttpOnly Cookies của Next.js.
   - **Backend .NET CORS**: File `Program.cs` ở .NET BFF chưa đăng ký dịch vụ `AddCors` và middleware `UseCors`, khiến request cross-origin từ trình duyệt bị từ chối do thiếu header `Access-Control-Allow-Origin`.
2. **Khắc phục ở Phía Frontend (Client)**:
   - Cập nhật `client/src/constants/config.ts`: Chuyển `PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || ""` thành chuỗi rỗng mặc định.
   - Cập nhật `client/.env.local` và `client/.env.example`: Đặt `NEXT_PUBLIC_API_URL=` rỗng để các request từ Axios Client tự động phân giải thành Relative URL (`/api/...`) tới chính Next.js server (Same-Origin).
   - Cập nhật `client/src/lib/axios.ts`: Gán `baseURL: ENV_CONFIG.PUBLIC_API_URL || undefined` để khi rỗng Axios hiểu là relative path chuẩn.
3. **Cấu hình CORS ở Phía Backend (.NET BFF)**:
   - Trong `BFF/LmsSaaS.Api/Program.cs`:
     + Đăng ký chính sách CORS `"AllowClient"` với `WithOrigins("http://localhost:3000")`, `AllowAnyHeader()`, `AllowAnyMethod()`, `AllowCredentials()`.
     + Đặt `app.UseCors("AllowClient");` ngay trước `app.UseAuthentication()`.
4. **Kiểm tra và Xác minh chất lượng**:
   - `pnpm run build`: Biên dịch 14/14 routes thành công 100%, 0 lỗi TypeScript, 0 lỗi cú pháp.
   - `dotnet test BFF/LmsSaaS.slnx`: 21/21 Unit tests Backend đạt 100% Passed.
   - Kiểm thử thực tế Next.js Route Handler `/api/auth/login-proxy`: Trả về dữ liệu đăng nhập sơ bộ và danh sách tenants thành công.

---

## [2026-10-19] Tối Ưu Hóa Prerendering & Streaming với Pattern `<Suspense>` Trên Các Subpages

### Mục tiêu trong phiên làm việc
* Áp dụng chuẩn kiến trúc Next.js App Router (Instant Navigation & Partial Prerendering): Tách logic đọc `await params` vào component con và bọc `<Suspense>` tại component cha.
* Đảm bảo component cha trả về static shell tức thì trong khi nội dung động (`tenantSlug`) được stream mượt mà.

### Các công việc đã thực hiện
1. **Refactor [classes/page.tsx](file:///d:/Project/SAAS/client/src/app/[tenantSlug]/classes/page.tsx)**:
   - Tách `ClassesContent` phụ trách `await params` và render `WorkspaceSectionView`.
   - `ClassesPage` bọc `ClassesContent` trong `<Suspense fallback={...}>`.
2. **Refactor [schedule/page.tsx](file:///d:/Project/SAAS/client/src/app/[tenantSlug]/schedule/page.tsx)**:
   - Áp dụng cấu trúc `ScheduleContent` bọc `<Suspense>` với fallback loading.
3. **Refactor [attendance/page.tsx](file:///d:/Project/SAAS/client/src/app/[tenantSlug]/attendance/page.tsx)**:
   - Áp dụng cấu trúc `AttendanceContent` bọc `<Suspense>` với fallback loading.
4. **Refactor [courses/page.tsx](file:///d:/Project/SAAS/client/src/app/[tenantSlug]/courses/page.tsx)**:
   - Áp dụng cấu trúc `CoursesContent` bọc `<Suspense>` với fallback loading.
5. **Kiểm tra và Xác minh**:
   - `pnpm run build`: Toàn bộ 5 route con (`dashboard`, `classes`, `schedule`, `attendance`, `courses`) được nhận diện là `◐ (Partial Prerender)` - prerendered static HTML với dynamic server-streamed content.
   - Kiểm thử thực tế tất cả các route đều trả về `200 OK`.

---

## [2026-10-19] Rà Soát Toàn Diện & Chuẩn Hóa Đa Ngôn Ngữ (i18n) Cho UI Phía Client

### Mục tiêu trong phiên làm việc
* Rà soát triệt để toàn bộ mã nguồn Frontend (`client/src/`) để phát hiện và loại bỏ tất cả text hardcode còn sót lại.
* Đảm bảo mọi chuỗi văn bản, nhãn giao diện, thông báo lỗi (error handling), định dạng tiền tệ và tiêu đề module tuân thủ 100% từ điển đa ngôn ngữ Redux (`state.language.t`).
* Đồng bộ động thuộc tính `lang` của thẻ `<html>` theo ngôn ngữ được chọn nhằm tối ưu Accessibility (a11y).

### Các công việc đã thực hiện
1. **Rà soát & Chuẩn hóa Từ điển Dịch thuật (`client/src/locales/`)**:
   - Cập nhật `workingInSpace` trong `vi.ts` và `en.ts` để phân tách câu rành mạch, kết hợp tự nhiên với `/{tenantSlug}` và `bffSecurityDesc`.
2. **Cập nhật Giao diện Dashboard ([DashboardView.tsx](file:///d:/Project/SAAS/client/src/components/dashboard/DashboardView.tsx))**:
   - Tinh chỉnh văn bản giới thiệu không gian: Ghép nối câu mượt mà `{t.dashboard.workingInSpace} /{tenantSlug}. {t.dashboard.bffSecurityDesc}` không bị trùng lặp.
   - Chuẩn hóa nhãn học viên hoạt động `{t.dashboard.statsActiveStudentsSub}: /{tenantSlug}`.
3. **Cập nhật Phân hệ Không gian Làm việc ([WorkspaceSectionView.tsx](file:///d:/Project/SAAS/client/src/components/layout/WorkspaceSectionView.tsx))**:
   - Sử dụng `currentLanguage` để định dạng tiêu đề module ngữ pháp tự nhiên: Tiếng Việt hiển thị `Phân hệ {meta.title}` (ví dụ: "Phân hệ Lớp học"), Tiếng Anh hiển thị `{meta.title} Module` (ví dụ: "Classes Module").
   - Nhấn mạnh và làm nổi bật `tenantSlug` trong chuỗi mô tả tích hợp.
4. **Cập nhật Trang Đăng nhập ([login/page.tsx](file:///d:/Project/SAAS/client/src/app/(auth)/login/page.tsx))**:
   - Bổ sung helper `getLocalizedAuthError`: Chuẩn hóa các thông báo lỗi phản hồi từ .NET BFF (như `"Invalid email or password."`, `"User not found"`, v.v.) và lỗi mạng sang thông báo bản địa hóa tương ứng (`t.auth.invalidCredentialsError`, `t.auth.sessionError`, `t.auth.networkError`).
   - Loại bỏ rò rỉ chuỗi tiếng Anh từ Axios `err.message` khi người dùng đang ở giao diện Tiếng Việt.
5. **Cập nhật Danh sách Khóa học ([ExampleCourseList.tsx](file:///d:/Project/SAAS/client/src/components/example/ExampleCourseList.tsx))**:
   - Thay thế lỗi thô Axios (`error?.message`) bằng `{t.courses.defaultErrorMessage}` đã được bản địa hóa.
   - Đồng bộ động hàm `formatCurrency`: Định dạng `VND` / `vi-VN` khi ở chế độ Tiếng Việt và `USD` / `en-US` khi ở chế độ Tiếng Anh.
6. **Đồng bộ Accessibility `<html> lang` ([StoreProvider.tsx](file:///d:/Project/SAAS/client/src/store/StoreProvider.tsx))**:
   - Tích hợp component `LanguageHtmlSync` tự động cập nhật `document.documentElement.lang` mỗi khi người dùng thay đổi ngôn ngữ trên giao diện.
7. **Kiểm tra và Xác minh chất lượng**:
   - `pnpm run build`: 14/14 routes biên dịch thành công 100% với Turbopack, 0 lỗi TypeScript, 0 cảnh báo ESLint.
   - `dotnet test BFF/LmsSaaS.slnx`: Toàn bộ 21/21 Unit tests phía Backend tiếp tục vượt qua 100%.

---

## [2026-10-19] Nâng Cấp Hệ Thống Typography: Tích Hợp Plus Jakarta Sans & JetBrains Mono (Hỗ Trợ Tiếng Việt Chuẩn)

### Mục tiêu trong phiên làm việc
* Khắc phục triệt để tình trạng font chữ bị lỗi hiển thị (vỡ dấu tiếng Việt, nhầm lẫn trọng số glyph, layout fallback thô về Arial).
* Lựa chọn và thiết lập font chữ hiện đại, cao cấp chuẩn EdTech / SaaS Dashboard, hiển thị sắc nét và đồng đều cho cả Tiếng Việt và Tiếng Anh.

### Các công việc đã thực hiện
1. **Phân tích Nguyên nhân Gốc rễ (Root Cause)**:
   - File [globals.css](file:///d:/Project/SAAS/client/src/app/globals.css) trước đó đang ép cứng: `body { font-family: Arial, Helvetica, sans-serif; }`, khiến toàn bộ ứng dụng bị hạ cấp xuống font hệ thống Arial thô cũ.
   - File [layout.tsx](file:///d:/Project/SAAS/client/src/app/layout.tsx) sử dụng `Geist` chỉ với `subsets: ["latin"]`. Font Geist chưa tối ưu cho bộ dấu Tiếng Việt (các ký tự ư, ơ, dấu hỏi, ngã, nặng bị vỡ hoặc lệch baseline).
2. **Nâng cấp Font Chuẩn EdTech & SaaS**:
   - **Font Sans Chính ([layout.tsx](file:///d:/Project/SAAS/client/src/app/layout.tsx))**: Chuyển sang **`Plus_Jakarta_Sans`** từ `next/font/google` với đầy đủ `subsets: ["latin", "vietnamese"]`, dải weight rộng từ 300 đến 800 và `display: "swap"`. Đây là font chữ chuẩn mực khuyến nghị trong Skill `ui-ux-pro-max`, sở hữu đường nét hình học hiện đại, độ dễ đọc (readability) cực cao cho cả tiêu đề bài giảng và văn bản tiếng Việt.
   - **Font Monospace**: Chuyển sang **`JetBrains_Mono`** từ `next/font/google` với `subsets: ["latin", "vietnamese"]` cho các khối mã nguồn, tenant slug `/{tenantSlug}` và badge mã hiệu.
3. **Đồng bộ Token & Theme ([globals.css](file:///d:/Project/SAAS/client/src/app/globals.css))**:
   - Cập nhật biến CSS `--font-sans: var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`.
   - Cập nhật biến CSS `--font-mono: var(--font-jetbrains-mono), monospace;`.
   - Gán `body { font-family: var(--font-sans); }` và thêm lớp `font-sans` vào thẻ `<body>`.
4. **Kiểm tra và Xác minh**:
   - `pnpm run build`: Turbopack tải và biên dịch font `Plus_Jakarta_Sans` và `JetBrains_Mono` hoàn tất thành công trong 1.4s, 14/14 routes đạt chuẩn `◐ (Partial Prerender)`.
   - Kiểm tra mã nguồn HTML render thực tế: Class font CSS module đã được đính kèm trực tiếp vào thẻ `<html>` và áp dụng kế thừa trơn tru cho toàn bộ cây DOM.

---

## [2026-10-20] Thiết lập Cấu hình Docker & Docker Compose cho Backend .NET 10 (BFF)

### Mục tiêu trong phiên làm việc
* Thiết lập toàn bộ hạ tầng container hóa chuẩn DevOps cho Backend BFF .NET 10 trong Monorepo LMS SaaS.
* Triển khai Multi-stage Dockerfile tối ưu hóa Docker Layer Caching và bảo mật runtime với Non-root User.
* Khai báo Docker Compose quản lý service `lms-bff` và cổng mạng nhất quán với môi trường dev host (`5045:8080`).
* Thiết lập quản lý bí mật (Secrets Management) an toàn thông qua `.env` và template `.env.example`, đảm bảo không rò rỉ credential lên Git.

### Các công việc đã thực hiện
1. **Thiết lập `BFF/.dockerignore`**:
   - Loại trừ triệt để thư mục cache `.vs/`, `.git/`, build outputs `bin/`, `obj/`, `out/`, user settings `*.user`, `*.suo`.
   - Loại trừ project kiểm thử `LmsSaaS.UnitTests/` không cần thiết trong production image.
   - Chặn các file cấu hình nhạy cảm chứa credential cục bộ (`appsettings.Development.json`, `appsettings.Local.json`).
2. **Xây dựng Multi-stage `BFF/Dockerfile` (.NET 10)**:
   - **Stage 1 (`build`)**: Sử dụng SDK image `mcr.microsoft.com/dotnet/sdk:10.0`.
     - Tối ưu Docker Layer Caching: Copy riêng 3 file `.csproj` (`LmsSaaS.Core`, `LmsSaaS.Infrastructure`, `LmsSaaS.Api`) vào đúng thư mục và chạy `dotnet restore "LmsSaaS.Api/LmsSaaS.Api.csproj"` trước. Nhờ đó, nếu chỉ sửa mã nguồn C# mà không đổi package/dependency, Docker sẽ tận dụng triệt để cached layer của bước restore, rút ngắn đáng kể thời gian build.
     - Copy toàn bộ mã nguồn còn lại và chạy `dotnet publish "LmsSaaS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false`.
   - **Stage 2 (`final`)**: Sử dụng ASP.NET Runtime image nhẹ `mcr.microsoft.com/dotnet/aspnet:10.0`.
     - Khai báo mở cổng nội bộ `EXPOSE 8080`.
     - Copy thành phẩm từ `--from=build /app/publish .`.
     - Kích hoạt `USER $APP_UID` (chạy container dưới user non-root mặc định của .NET 8/9/10 - UID 1654), triệt tiêu rủi ro đặc quyền root.
     - Cấu hình entrypoint: `ENTRYPOINT ["dotnet", "LmsSaaS.Api.dll"]`.
3. **Cấu hình `docker-compose.yml` tại thư mục gốc**:
   - Khai báo service `lms-bff` với tên container `lms-saas-bff`.
   - Ánh xạ cổng `"5045:8080"` (máy host truy cập cổng 5045 quen thuộc, container lắng nghe cổng 8080).
   - Truyền biến môi trường theo cơ chế ghi đè phân cấp của .NET:
     - `ASPNETCORE_ENVIRONMENT=Development`
     - `ASPNETCORE_HTTP_PORTS=8080`
     - `ConnectionStrings__DefaultConnection=${SUPABASE_CONNECTION_STRING}`
     - `Jwt__SecretKey=${JWT_SECRET_KEY}`
     - `Jwt__Issuer=LmsSaaS.BFF`
     - `Jwt__Audience=LmsSaaS.Client`
     - `Jwt__ExpiryHours=4.0`
     - `Jwt__RefreshTokenExpiryDays=7`
   - Cấu hình chính sách khởi động lại: `restart: unless-stopped`.
4. **Quản lý Biến Môi trường (.env & .env.example)**:
   - Trích xuất thông tin kết nối Supabase và JWT secret key từ `appsettings.Development.json` đưa vào `.env` tại thư mục gốc.
   - Tạo file `.env.example` với các giá trị placeholder mẫu minh bạch.
   - Xác nhận `.gitignore` đã chặn `**/.env`, `**/.env.*` và miễn trừ `!**/.env.example` (kiểm tra qua `git status` xác nhận `.env` không bị track).
5. **Rà soát `BFF/LmsSaaS.Api/Program.cs`**:
   - Xác nhận `app.UseHttpsRedirection()` đã được bao bọc trong điều kiện `if (!app.Environment.IsDevelopment())`, ngăn chặn việc container cố chuyển hướng HTTPS khi chỉ mở cổng HTTP 8080 trong Docker.
6. **Kiểm tra và Xác minh chất lượng**:
   - `dotnet build BFF/LmsSaaS.slnx`: 0 Warning, 0 Error, thời gian biên dịch thành công.
   - `dotnet test BFF/LmsSaaS.slnx`: 21/21 Unit tests passed (100%).
   - Tuyệt đối không chạy lệnh `docker build` hay `docker compose up` theo đúng nguyên tắc đề ra.

### Quyết định kiến trúc & Kỹ thuật
* **Docker Layer Caching cho .NET Solution**:
  - Trong kiến trúc Clean Architecture nhiều tầng (.NET), việc copy riêng các file `.csproj` và chạy `dotnet restore` trước khi chép toàn bộ source code là best practice DevOps quan trọng nhất. Nhờ cơ chế này, quá trình tải NuGet packages chỉ diễn ra khi có sự thay đổi trong dependencies, giúp tăng tốc độ build CI/CD và local build lên gấp nhiều lần.
* **Non-root Container Security (`USER $APP_UID`)**:
  - Việc cấu hình non-root user theo tiêu chuẩn mới của .NET ngăn ngừa các lỗ hổng container breakout hoặc leo thang đặc quyền (privilege escalation), đáp ứng chuẩn bảo mật cấp doanh nghiệp.
* **Hierarchical Environment Overrides (`__`)**:
  - Tận dụng quy ước phân cấp chuẩn của ASP.NET Core (`ConnectionStrings__DefaultConnection` ánh xạ vào `ConnectionStrings:DefaultConnection`, `Jwt__SecretKey` ánh xạ vào `Jwt:SecretKey`). Cơ chế này tách rời hoàn toàn mã nguồn khỏi cấu hình nhạy cảm, giúp ứng dụng sẵn sàng triển khai mượt mà trên bất kỳ nền tảng đám mây nào (AWS ECS, Kubernetes, Azure Container Apps).

---

## [2026-10-21] Chuẩn hóa Quy ước Next.js 16 Proxy (`proxy.ts`) & Cấu hình Toàn diện Cache Components

### Mục tiêu trong phiên làm việc
* Di chuyển và nâng cấp quy ước `middleware.ts` sang `proxy.ts` theo chuẩn chính thức của Next.js 16.
* Thiết lập hệ thống Cache Components đầy đủ với directive `"use cache"`, cấu hình các profiles `cacheLife`, mở rộng Type Augmentation cho TypeScript, quản lý `CACHE_TAGS` và Server Actions xoay vòng cache.
* Xây dựng Server Component mẫu `CachedCourseCatalog` và nút làm mới cache on-demand cho phân hệ LMS.

### Các công việc đã thực hiện
1. **Chuyển đổi sang Next.js 16 Proxy Convention (`src/proxy.ts`)**:
   - Chuyển `client/src/middleware.ts` thành `client/src/proxy.ts`.
   - Cập nhật hàm xử lý từ `middleware` sang `export async function proxy(request: NextRequest)` và `export default proxy`.
   - Xóa bỏ file `middleware.ts` cũ để tránh xung đột kép theo quy định của Next.js 16 (`Both middleware and proxy file detected`).
   - Kiểm tra build xác nhận Next.js 16 biên dịch thành công route handler: `ƒ Proxy (Middleware)` không cảnh báo deprecation.
2. **Cấu hình Cache Profiles (`client/next.config.ts`)**:
   - Bổ sung cấu hình `cacheLife` cho 4 hồ sơ nghiệp vụ chuyên biệt:
     + `frequent`: `{ stale: 15, revalidate: 30, expire: 300 }` (thông báo tức thời, dữ liệu điểm danh).
     + `dashboard`: `{ stale: 60, revalidate: 300, expire: 3600 }` (chỉ số thống kê, biểu đồ KPI).
     + `courses`: `{ stale: 300, revalidate: 900, expire: 86400 }` (danh mục khóa học, giáo trình).
     + `static`: `{ stale: 3600, revalidate: 86400, expire: 604800 }` (cấu hình trung tâm, branding).
   - Duy trì `cacheComponents: true` và `partialPrefetching: true`.
3. **Mở rộng Type Augmentation (`client/src/types/cache.d.ts`)**:
   - Sử dụng Declaration Merging trên module `"next/cache"` cho interface `CacheLifeProfiles`, đem lại gợi ý tự động (IntelliSense) và kiểm tra kiểu TypeScript 100% chặt chẽ khi gọi `cacheLife("courses")`.
4. **Quản lý Cache Tags Tập trung (`client/src/constants/cacheTags.ts`)**:
   - Khởi tạo hằng số `CACHE_TAGS` theo chuẩn DRY và Single Source of Truth cho các entities: `tenant`, `courses`, `courseDetail`, `dashboard`, `classes`, `settings`.
5. **Triển khai Server Actions Xoay vòng Cache (`client/src/actions/cacheActions.ts`)**:
   - Xây dựng các hàm Server Action `revalidateCoursesAction`, `revalidateDashboardAction` và `revalidateTagAction`.
   - Sử dụng API `updateTag(tag)` tối ưu riêng cho Server Actions trong Next.js 16, mang lại trải nghiệm cập nhật ngay lập tức (read-your-own-writes semantics).
6. **Xây dựng Cache Component & Tích hợp Trang Khóa Học**:
   - Tạo Server Component `client/src/components/courses/CachedCourseCatalog.tsx`: Sử dụng `"use cache"`, `cacheLife("courses")`, `cacheTag()`, hiển thị huy hiệu profile, timestamp cache và danh thiếp khóa học chuẩn UX không emoji.
   - Tạo Client Component `client/src/components/courses/RevalidateCacheButton.tsx`: Cho phép tương tác xoay vòng cache on-demand với SVG loading indicator.
   - Nâng cấp `client/src/app/[tenantSlug]/courses/page.tsx`: Kết hợp mượt mà giữa Cached Server Component và SWR Course Management trong cùng ranh giới `<Suspense>`.
7. **Kiểm tra và Xác minh Chất lượng**:
   - `pnpm --filter client run build`: Turbopack biên dịch trong 1.5s, TypeScript 0 lỗi, 14/14 static & dynamic routes đạt chuẩn `◐ (Partial Prerender)`.
   - `dotnet test BFF/LmsSaaS.slnx`: 21/21 Unit tests passed (100%).

### Quyết định kiến trúc & Kỹ thuật
* **Next.js 16 Proxy Convention**:
  - Việc chuyển từ `middleware.ts` sang `proxy.ts` phản ánh đúng bản chất kỹ thuật của tầng mạng này (Node/Edge forwarder & route filter), đón đầu chuẩn chính thức của Next.js 16 và loại bỏ hoàn toàn cảnh báo mã lỗi thời.
* **Component-Level Caching với `"use cache"` & PPR**:
  - Khác với cơ chế fetch cache cũ của Next.js 14/15 (`unstable_cache` hoặc fetch options), directive `"use cache"` hoạt động ở cấp độ JSX/component hoặc hàm tính toán độc lập, cho phép Next.js biên dịch trước (prerender) khung tĩnh của component và chỉ làm mới khi tag bị hủy hiệu lực hoặc hết hạn theo profile `cacheLife`.
* **Sự kết hợp giữa Server Cache & Client SWR**:
  - Trang khóa học được tổ chức phân tầng rõ rệt: phần giáo trình/chương trình đào tạo ít biến động được phục vụ siêu tốc qua Server Cache Component (`CachedCourseCatalog`), trong khi các tác vụ quản trị, tìm kiếm trực tiếp và phân trang tức thời vẫn được vận hành mượt mà bởi Client SWR (`ExampleCourseList`).
