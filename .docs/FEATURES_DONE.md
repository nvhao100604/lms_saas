# FEATURES DONE & ROADMAP TRACKING

Tài liệu này theo dõi toàn bộ tiến độ tính năng của dự án **LMS SaaS**, phân chia rõ ràng các hạng mục đã hoàn thành, đang tiến hành và kế hoạch sắp tới.

---

## 1. TỔNG QUAN TIẾN ĐỘ

| Trạng thái | Số lượng | Tỷ lệ |
| :--- | :--- | :--- |
| **Đã hoàn thành (Done)** | 20 | 100% (BFF Auth, Refresh Token Rotation, Swagger Transformers, Next.js Silent Refresh, Axios API Layer, SWR Provider, App Shell Layout, Full i18n & Typography System, Docker BFF .NET 10, Next 16 Proxy Migration & Cache Components, Courses & Classes Management BFF API) |
| **Đang tiến hành (In Progress)** | 0 | 0% |
| **Kế hoạch sắp tới (Todo)** | 0 | - |

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
### [2026-10-19] Triển khai Xác thực BFF Cookie, Chọn Trung tâm & Route Handlers
* **Mô tả**: Xây dựng kiến trúc BFF cho Next.js Client, lưu trữ token an toàn trong HttpOnly Cookie phía server, hỗ trợ chọn trung tâm 2 giai đoạn và chuyển hướng an toàn.
* **Kết quả**:
  * Tạo Route Handlers `/api/auth/login-proxy` và `/api/auth/set-session`.
  * Ghi nhận cookie `access_token` với `httpOnly: true, sameSite: 'lax', path: '/', maxAge: 14400`.
  * Xây dựng giao diện Login 2 giai đoạn (`/login`) với tự động chọn khi chỉ có 1 trung tâm và giao diện chọn trung tâm chuẩn SaaS.
  * Xây dựng Server Component Dashboard mẫu theo slug `/[tenantSlug]/dashboard`.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Triển khai Next.js Edge Middleware bảo vệ Route &[tenantSlug]/* & Redux Toolkit i18n
* **Mô tả**: Thiết lập `middleware.ts` bảo vệ toàn diện các dynamic routes của trung tâm, giải mã nhẹ nhàng Base64 JWT Payload trên Edge Runtime, chặn truy cập chéo và hỗ trợ song ngữ Redux Toolkit.
* **Kết quả**:
  * Tạo `src/middleware.ts` giải mã Base64URL JWT không phụ thuộc thư viện ngoài, kiểm tra `exp`, chặn context mismatch giữa URL và `tenant_slug`.
  * Bổ sung điều hướng quay lại (`redirectPath`) trên trang Login.
  * Cài đặt và cấu hình Redux Toolkit (`@reduxjs/toolkit`, `react-redux`), tạo `languageSlice`, `StoreProvider` và component dùng chung `LanguageSwitcher`.
  * Đồng bộ hằng số định tuyến trong `src/constants/routes.ts`, loại bỏ hoàn toàn hardcode route strings.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Triển khai Refresh Token Rotation theo Ngữ cảnh Trung tâm & OpenAPI Transformers
* **Mô tả**: Xây dựng cơ chế Refresh Token Rotation gắn chặt với `ITenantEntity`, nâng cấp endpoint xác thực trong .NET 10 BFF và cấu hình Swagger UI tích hợp nút Authorize JWT cùng Header `X-Tenant-Slug` tự động bằng OpenAPI Transformers thuần (không dùng Scalar).
* **Kết quả**:
  * Cập nhật `JwtOptions` với `RefreshTokenExpiryDays: 7` áp dụng Options Pattern.
  * Tạo thực thể `RefreshToken` kế thừa `ITenantEntity`, lưu vết chuỗi token ngẫu nhiên 64 bytes (`RandomNumberGenerator`), `ExpiresAt`, `RevokedAt`, `ReplacedByToken` cùng các computed properties `IsActive`, `IsExpired`, `IsRevoked`.
  * Cập nhật `AppDbContext` với unique index trên `Token`, khóa ngoại Cascade cho `Tenant` và Restrict cho `User`.
  * Nâng cấp `POST /api/auth/select-tenant` sinh và lưu Refresh Token kèm Access Token; thêm mới `POST /api/auth/refresh` thực hiện xoay vòng token (rotation) với `.IgnoreQueryFilters()`; thêm `POST /api/auth/revoke` (`[Authorize]`) thu hồi token an toàn.
  * Triển khai `BearerSecuritySchemeTransformer` (`IOpenApiDocumentTransformer`) và `TenantHeaderOperationTransformer` (`IOpenApiOperationTransformer`) nạp tự động Header `X-Tenant-Slug` (mặc định `"apex-english"`), bỏ qua các endpoint auth/health.
  * Tạo migration EF Core `AddRefreshTokensTable` và áp dụng thành công lên Supabase PostgreSQL.
  * Bổ sung unit tests cho `GenerateRefreshToken` và luồng rotation, 100% test case pass (21/21).
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Đồng bộ Thời hạn Cookie Động (Single Source of Truth) & Silent Refresh Token Rotation trên Next.js Client
* **Mô tả**: Thiết lập cơ chế đồng bộ thời hạn token tập trung từ Backend .NET BFF sang Next.js App Router, loại bỏ hoàn toàn hardcode `maxAge` ở Client và triển khai Silent Refresh Token Rotation tự động trong Edge Middleware.
* **Kết quả**:
  * Cập nhật `.NET BFF` (`AuthController`): Bổ sung `accessTokenExpiresIn` và `refreshTokenExpiresIn` (tính theo giây từ `IOptions<JwtOptions>`) trong response của cả 2 endpoints `/api/auth/select-tenant` và `/api/auth/refresh`.
  * Cập nhật TypeScript types tại `src/types/auth.ts`: `SelectTenantResponse` và `RefreshTokenResponse` phản ánh chuẩn xác các trường thời hạn từ Backend.
  * Cập nhật hằng số định tuyến `src/constants/routes.ts`: Bổ sung `API.AUTH.REFRESH` và `API.AUTH.LOGOUT`.
  * Nâng cấp Route Handler `src/app/api/auth/set-session/route.ts`: Thiết lập cookie `access_token` và `refresh_token` với `maxAge` động theo `data.accessTokenExpiresIn` và `data.refreshTokenExpiresIn`.
  * Tạo mới Route Handler `src/app/api/auth/refresh/route.ts`: Nhận yêu cầu làm mới token từ cookie, xoay vòng cặp token mới và cập nhật lại HttpOnly Cookies với thời hạn động.
  * Tạo mới Route Handler `src/app/api/auth/logout/route.ts`: Gọi sang `.NET BFF` (`/api/auth/revoke`) thu hồi token trên Database và xóa sạch toàn bộ session cookies trên trình duyệt.
  * Nâng cấp `src/middleware.ts`: Thực hiện Silent Refresh ngay tại Edge Middleware khi `access_token` hết hạn nhưng còn `refresh_token`, tự động xin token mới từ .NET BFF, gắn Set-Cookie với thời hạn động và cho phép người dùng tiếp tục mà không bị vỡ phiên.
  * Tạo tiện ích `src/lib/bff-client.ts`: Hàm `fetchFromBff<T>` hỗ trợ Server Components và Server Actions tự động gắn header `Authorization: Bearer ...` và `X-Tenant-Slug`.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Thiết lập Tầng gọi API Tập trung Axios & Tích hợp SWR (Thin API Layer)
* **Mô tả**: Xây dựng Axios Client Instance chuẩn doanh nghiệp kết hợp SWR (Stale-While-Revalidate), tự động bắt lỗi 401 với hàng đợi mutex để Silent Refresh, chuẩn hóa lỗi `AppApiError` và cung cấp Thin API Layer không cần `try-catch` thủ công.
* **Kết quả**:
  * Cài đặt `axios` (v1.20) và `swr` (v2.5) vào dự án `client`.
  * Tạo `src/lib/axios.ts`: Cấu hình `baseURL`, `withCredentials: true`, Interceptor tự động gắn Header `X-Tenant-Slug`, Response Interceptor bắt 401 với hàng đợi Mutex (`failedQueue`), gọi `/api/auth/refresh` và replay request ban đầu; chuẩn hóa toàn bộ lỗi thành `AppApiError`.
  * Tạo `src/services/exampleService.ts`: Thin Service Layer định nghĩa các thao tác CRUD mẫu (`getCourses`, `getCourseById`, `createCourse`, `updateCourse`, `deleteCourse`) hoàn toàn không cần `try-catch`.
  * Tạo `src/hooks/useExampleCourses.ts`: Custom Hook chuẩn hóa việc lấy dữ liệu với SWR, hỗ trợ caching, tự động refetch theo params và các mutation helpers.
  * Tạo `src/components/example/ExampleCourseList.tsx`: Component mẫu hoàn chỉnh xử lý 3 trạng thái `isLoading`, `isError`, và `data` kèm tìm kiếm, phân trang và nút revalidate SWR `mutate()`.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Triệt tiêu Hardcoded Text, Bản địa hóa Đa ngôn ngữ Tập trung (Redux i18n) & Chuẩn hóa Log/Exception 100% Tiếng Anh
* **Mô tả**: Rà soát và loại bỏ 100% văn bản hardcoded trên toàn bộ giao diện Client, chuyển toàn bộ vào từ điển đa ngôn ngữ (`src/locales/` với TypeScript strict interfaces) phản ứng trực tiếp qua Redux state; đồng thời chuẩn hóa toàn bộ log, thông báo lỗi exception và response API ở tầng server sang tiếng Anh.
* **Kết quả**:
  * Mở rộng từ điển ngôn ngữ `src/locales/` (`types.ts`, `vi.ts`, `en.ts`): Bổ sung đầy đủ các schema validation (`validation`), các section `dashboard`, `courses`, `home` và các aria labels chuẩn a11y.
  * Cập nhật `src/lib/validations/authSchema.ts`: Chuyển sang sử dụng từ điển ngôn ngữ động `createLoginSchema(t)` và `createRegisterSchema(t)` thay vì hardcode thông báo tiếng Việt.
  * Tách và nâng cấp các Component giao diện sang Client Components kết nối Redux Store:
    * `src/components/dashboard/DashboardView.tsx`: Thay thế toàn bộ banner, thống kê, badges, thẻ bảo mật sang `t.dashboard` và `t.common`.
    * `src/components/home/HomeView.tsx`: Hiển thị trang chủ và điều hướng kèm `LanguageSwitcher` không hardcode text.
    * `src/components/example/ExampleCourseList.tsx`: Kết nối `t.courses`, hỗ trợ tìm kiếm, phân trang và trạng thái rỗng/lỗi đa ngôn ngữ.
    * `src/components/common/LanguageSwitcher.tsx`: Cập nhật aria-label và nhãn ngôn ngữ động.
    * `src/app/(auth)/login/page.tsx`: Cập nhật aria-label đóng lỗi, ẩn/hiện mật khẩu và footer badge qua Redux `t`.
  * Chuẩn hóa 100% thông báo lỗi / exceptions / log sang Tiếng Anh:
    * Next.js Route Handlers (`src/app/api/auth/*`): Toàn bộ thông báo lỗi và phản hồi chuyển sang tiếng Anh.
    * Client Utilities (`src/lib/axios.ts`, `src/lib/bff-client.ts`): Toàn bộ thông báo lỗi ngoại lệ chuyển sang tiếng Anh.
    * .NET BFF (`AuthController.cs`, `TenantResolutionMiddleware.cs`, `OpenApi` transformers): Toàn bộ response messages và mô tả OpenAPI chuyển sang tiếng Anh.
  * Kiểm định chất lượng: `pnpm run build` vượt qua 100% kiểm tra kiểu TypeScript/Next.js; `dotnet test` vượt qua 21/21 unit test cases.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Tối ưu hóa Toàn diện các API Route & Tầng Dịch vụ Xác thực với Axios
* **Mô tả**: Tái cấu trúc loại bỏ hoàn toàn mã nguồn rườm rà (fetch thủ công, JSON.stringify, response.json, bắt lỗi phân mảnh) tại toàn bộ các Next.js API Route Handlers và Login Component; chuyển sang dùng Axios tập trung qua `bffClient` (Server) và `authService` (Client).
* **Kết quả**:
  * Nâng cấp `src/lib/bff-client.ts`: Khởi tạo `bffClient` (Axios Instance cấu hình `baseURL: ENV_CONFIG.DOTNET_API_URL`, timeout, headers), hàm chuẩn hóa lỗi `handleBffError`, và hàm `fetchFromBff<T>` hỗ trợ Server Components.
  * Tái cấu trúc 4 Route Handlers (`src/app/api/auth/*`):
    * `login-proxy/route.ts`: Rút gọn từ 56 dòng xuống 17 dòng, ủy quyền toàn bộ cho `bffClient.post("/api/auth/login", body)`.
    * `set-session/route.ts`: Gọi `bffClient.post("/api/auth/select-tenant", body)` cực kỳ tinh gọn, đồng bộ Set-Cookie `maxAge` tự động.
    * `refresh/route.ts`: Sử dụng `bffClient.post("/api/auth/refresh", { refreshToken })` kèm cơ chế dọn dẹp cookie nếu token hỏng.
    * `logout/route.ts`: Gọi `bffClient.post("/api/auth/revoke", ...)` và xóa cookies an toàn.
  * Tạo mới Client Service `src/services/authService.ts`: Cung cấp các hàm `login`, `setSession`, `refresh`, `logout` thông qua `api` / `axiosClient`.
  * Cập nhật `src/app/(auth)/login/page.tsx`: Loại bỏ triệt để các khối `fetch` và `JSON.stringify` thủ công, chuyển sang gọi trực tiếp `authService.login()` và `authService.setSession()`.
  * Hợp nhất `src/services/apiClient.ts`: Chuyển sang re-export `api` / `axiosClient` để thống nhất 1 chuẩn HTTP client duy nhất trên toàn dự án.
  * Kiểm định: `pnpm run build` thành công trong 2.7s (0 errors), `dotnet test` đạt 21/21 passed.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Tích hợp Global SWR Provider cho Toàn bộ Ứng dụng Client
* **Mô tả**: Thiết lập `SwrProvider` bao bọc toàn bộ cây giao diện Next.js App Router với `SWRConfig` tập trung, chuẩn hóa fetcher ngầm qua Axios, chính sách chống gọi API trùng lặp và loại trừ retry vô hạn với lỗi xác thực.
* **Kết quả**:
  * Tạo `src/providers/SwrProvider.tsx`:
    * Cấu hình `fetcher` mặc định qua `api.get(url)`.
    * Cấu hình caching tối ưu: `revalidateOnFocus: true`, `revalidateOnReconnect: true`, `dedupingInterval: 5000` (giới hạn refetch trùng lặp trong 5 giây).
    * Bộ lọc retry thông minh (`shouldRetryOnError`): Tự động ngăn chặn retry khi gặp lỗi `401 Unauthorized`, `403 Forbidden`, `404 Not Found` để tránh nghẽn luồng auth refresh.
    * Tích hợp logging lỗi bằng tiếng Anh ở môi trường development.
  * Xuất chuẩn qua barrel export `src/providers/index.ts`.
  * Bao bọc `<SwrProvider>` trực tiếp bên trong `<StoreProvider>` tại Root Layout (`src/app/layout.tsx`).
  * Chuẩn hóa barrel export cho custom hooks tại `src/hooks/index.ts` (`useDebounce`, `useExampleCourses`).
  * Toàn bộ mã nguồn, comments và logs đều tuân thủ 100% tiếng Anh, không chứa emoji.
  * Kiểm định chất lượng: TypeScript `npx tsc --noEmit` đạt 0 lỗi; `pnpm run build` (Turbopack) thành công 100%; `dotnet test` đạt 21/21 passed.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Xây dựng Trọn bộ Khung Giao diện App Shell Layout cho Không gian Làm việc (Workspace)
* **Mô tả**: Thiết lập layout App Shell hoàn chỉnh tại `client/src/app/[tenantSlug]/layout.tsx` bao bọc mọi trang làm việc của trung tâm đào tạo, phân tách rõ ràng Sidebar điều hướng, Header thao tác tập trung và vùng hiển thị nội dung cuộn độc lập.
* **Kết quả**:
  * Cập nhật `src/constants/routes.ts`: Bổ sung toàn diện các route `DASHBOARD`, `COURSES`, `CLASSES`, `SCHEDULE`, `ATTENDANCE` cho `ROUTES.TENANT`, triệt tiêu hardcoded URLs.
  * Mở rộng từ điển `src/locales/` (`types.ts`, `vi.ts`, `en.ts`): Bổ sung `navigation` translations cho tất cả các menu, nhãn header, nút thu gọn và aria-labels.
  * Xây dựng `src/components/layout/WorkspaceSidebar.tsx`:
    * Tô đậm mục active theo `usePathname()`.
    * Icon SVG chuyên nghiệp chuẩn `ui-ux-pro-max`, không dùng emoji.
    * Hỗ trợ nút thu gọn (Desktop Collapse `w-64` <-> `w-20`) và ngăn kéo trượt trên di động (Mobile Drawer with Backdrop & Escape key).
  * Xây dựng `src/components/layout/WorkspaceHeader.tsx`:
    * Nút mở mobile drawer trên màn hình nhỏ.
    * Huy hiệu trung tâm hiện tại (Workspace Badge) kèm đèn tín hiệu Live HttpOnly.
    * Tích hợp `LanguageSwitcher`, nút "Đổi không gian" (Switch Workspace) và nút "Đăng xuất" (Logout) gọi `authService.logout()` thu hồi token trên Database Supabase rồi chuyển hướng an toàn về `/login`.
  * Xây dựng `src/components/layout/WorkspaceShell.tsx`: Quản lý trạng thái tương tác và chia tách 2 cột (Sidebar + Work Area).
  * Xây dựng `src/app/[tenantSlug]/layout.tsx`: Server Component tiếp nhận `params: Promise<{ tenantSlug: string }>` theo chuẩn Next.js 16.
  * Xây dựng các trang con: `courses/page.tsx` (tích hợp SWR `ExampleCourseList`), `classes/page.tsx`, `schedule/page.tsx`, `attendance/page.tsx` (sử dụng component chuẩn `WorkspaceSectionView`), đảm bảo chuyển trang mượt mà không 404.
  * Tinh giản `DashboardView.tsx`: Loại bỏ header trùng lặp, tối ưu thẻ ngữ nghĩa HTML5.
  * Kiểm định chất lượng: TypeScript `npx tsc --noEmit` đạt 0 lỗi; `pnpm run build` (Turbopack) thành công 14/14 static & dynamic routes; `dotnet test` đạt 21/21 passed (100%).
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Khắc Phục Lỗi CORS & Đồng Bộ Định Tuyến Same-Origin BFF & Streaming Suspense trên Subpages
* **Mô tả**: Sửa triệt để lỗi CORS khi Axios gọi nhầm `/api/api/auth/login-proxy`, cấu hình chính sách CORS `AllowClient` trên .NET BFF và tái cấu trúc các subpages (`classes`, `schedule`, `attendance`, `courses`) sang streaming pattern `<Suspense>` của Next.js App Router.
* **Kết quả**:
  * Đặt `NEXT_PUBLIC_API_URL=""` và `baseURL: undefined` để Axios phân giải relative paths chuẩn xác tới Next.js Same-Origin Route Handlers.
  * Cấu hình chính sách CORS `AllowClient` với `WithOrigins("http://localhost:3000")` trên .NET BFF `Program.cs`.
  * Tách component con `*Content` và bọc `<Suspense fallback={<SectionLoadingFallback />}>` trên toàn bộ 4 subpages, đưa toàn bộ route sang `◐ (Partial Prerender)`.
* **Người thực hiện**: AI Agent & User.

### [2026-10-19] Rà Soát Toàn Diện Đa Ngôn Ngữ (i18n) & Nâng Cấp Hệ Thống Typography (Plus Jakarta Sans)
* **Mô tả**: Loại bỏ triệt để văn bản hardcoded, chuẩn hóa thông báo lỗi xác thực & mạng theo Redux `state.language.t`, đồng bộ động `lang` trên thẻ `<html>` và thay thế font Geist/Arial lỗi bằng `Plus_Jakarta_Sans` và `JetBrains_Mono` hỗ trợ trọn vẹn dấu tiếng Việt.
* **Kết quả**:
  * Cập nhật `WorkspaceSectionView`: Đổi tiêu đề module đúng ngữ pháp song ngữ ("Phân hệ Lớp học" / "Classes Module").
  * Tinh chỉnh `DashboardView`: Câu nối mạch lạc với `bffSecurityDesc` và tenant slug.
  * Bản địa hóa `login/page.tsx`: Thêm `getLocalizedAuthError` ánh xạ thông báo lỗi backend sang tiếng Việt/tiếng Anh tương ứng; không làm rò rỉ chuỗi tiếng Anh của Axios khi đang chọn tiếng Việt.
  * Bản địa hóa `ExampleCourseList`: Định dạng tiền tệ tự động theo ngôn ngữ (`VND` / `USD`), chuẩn hóa lỗi về `{t.courses.defaultErrorMessage}`.
  * Tích hợp `LanguageHtmlSync`: Tự động cập nhật `document.documentElement.lang` khi chuyển đổi ngôn ngữ.
  * Tích hợp Google Fonts `Plus_Jakarta_Sans` & `JetBrains_Mono` với `subsets: ["latin", "vietnamese"]` trên toàn bộ giao diện, xóa bỏ triệt để tình trạng vỡ dấu tiếng Việt.
  * Kiểm định: `pnpm run build` thành công 14/14 routes, `dotnet test` đạt 21/21 passed.
* **Người thực hiện**: AI Agent & User.

### [2026-10-20] Thiết lập Cấu hình Docker & Docker Compose cho Backend .NET 10 (BFF)
* **Mô tả**: Thiết lập toàn bộ hạ tầng container hóa chuẩn DevOps cho Backend BFF .NET 10 trong Monorepo LMS SaaS với Multi-stage Dockerfile, Docker Layer Caching, Non-root User, Docker Compose và quản lý biến môi trường an toàn.
* **Kết quả**:
  * Tạo mới `BFF/.dockerignore`: Loại trừ triệt để cache, file tạm, artifacts build (`bin/`, `obj/`, `out/`, `.vs/`, `.git/`), project unit tests `LmsSaaS.UnitTests/` và các file cấu hình nhạy cảm cục bộ (`appsettings.Development.json`, `appsettings.Local.json`).
  * Tạo mới `BFF/Dockerfile`:
    * Multi-stage build với image chuẩn `mcr.microsoft.com/dotnet/sdk:10.0` và `mcr.microsoft.com/dotnet/aspnet:10.0`.
    * Tối ưu hóa Docker Layer Caching: Copy riêng 3 file `.csproj` (`LmsSaaS.Core`, `LmsSaaS.Infrastructure`, `LmsSaaS.Api`) và chạy `dotnet restore` trước khi chép mã nguồn và thực hiện `dotnet publish`.
    * Bảo mật runtime với `USER $APP_UID` (non-root) và cổng lắng nghe chuẩn `8080`.
  * Tạo mới `docker-compose.yml` tại thư mục gốc:
    * Định nghĩa service `lms-bff` (container name `lms-saas-bff`), map cổng `5045:8080`.
    * Nạp cấu hình thông qua biến môi trường phân cấp của .NET (`ConnectionStrings__DefaultConnection`, `Jwt__SecretKey`, `Jwt__Issuer`, `Jwt__Audience`, `Jwt__ExpiryHours`, `Jwt__RefreshTokenExpiryDays`).
  * Quản lý Secrets an toàn:
    * Tạo `.env` tại thư mục gốc nạp `SUPABASE_CONNECTION_STRING` và `JWT_SECRET_KEY` thực tế (được `.gitignore` chặn an toàn).
    * Tạo `.env.example` với dữ liệu mẫu cho Git tracking.
  * Tối ưu `Program.cs`: Kiểm soát `app.UseHttpsRedirection()` chỉ chạy ngoài môi trường Development, tránh cảnh báo thiếu cổng HTTPS khi container lắng nghe HTTP 8080.
  * Kiểm định chất lượng: `dotnet build BFF/LmsSaaS.slnx` thành công 100% (0 errors, 0 warnings); `dotnet test` vượt qua 21/21 unit test cases.
* **Người thực hiện**: AI Agent & User.
 
### [2026-10-21] Chuẩn hóa Quy ước Next.js 16 Proxy (`proxy.ts`) & Cấu hình Toàn diện Cache Components
* **Mô tả**: Chuyển đổi file middleware sang quy ước chuẩn mới của Next.js 16 (`src/proxy.ts`), cấu hình hệ thống Cache Components với hồ sơ thời gian sống `cacheLife`, quản lý cache tags tập trung (`CACHE_TAGS`), Server Actions làm mới cache (`updateTag`, `revalidateTag`) và xây dựng Server Component mẫu `CachedCourseCatalog` cho phân hệ LMS.
* **Kết quả**:
  * Chuyển đổi `client/src/middleware.ts` ➔ `client/src/proxy.ts`, export hàm `proxy` và `default proxy`, loại bỏ triệt để cảnh báo deprecation của Next.js 16.
  * Cập nhật `client/next.config.ts`: Bổ sung cấu hình `cacheLife` với 4 profile tối ưu:
    - `frequent`: `{ stale: 15, revalidate: 30, expire: 300 }` (thông báo, điểm danh).
    - `dashboard`: `{ stale: 60, revalidate: 300, expire: 3600 }` (chỉ số thống kê KPI).
    - `courses`: `{ stale: 300, revalidate: 900, expire: 86400 }` (danh mục khóa học, giáo trình).
    - `static`: `{ stale: 3600, revalidate: 86400, expire: 604800 }` (branding, cài đặt tenant).
  * Mở rộng Type Definition tại `client/src/types/cache.d.ts`: Augmentation interface `CacheLifeProfiles` trong `"next/cache"` đảm bảo type-safety 100% khi gọi `cacheLife()`.
  * Tạo hằng số `client/src/constants/cacheTags.ts`: Quản lý tập trung các cache tag theo tenant (`courses`, `courseDetail`, `dashboard`, `classes`, `settings`).
  * Tạo Server Actions `client/src/actions/cacheActions.ts`: Hỗ trợ `revalidateCoursesAction`, `revalidateDashboardAction` và `revalidateTagAction` sử dụng hàm `updateTag` chuẩn xác của Next.js 16 cho Server Actions.
  * Xây dựng Server Component `client/src/components/courses/CachedCourseCatalog.tsx`: Ứng dụng directive `"use cache"`, `cacheLife("courses")`, `cacheTag()`, hiển thị huy hiệu profile cache, timestamp kết xuất và thẻ khóa học chuẩn UX không emoji.
  * Xây dựng Client Component `client/src/components/courses/RevalidateCacheButton.tsx`: Kích hoạt Server Action xoay vòng cache on-demand với trạng thái loading spinner và hiển thị thời điểm revalidated.
  * Tích hợp vào `client/src/app/[tenantSlug]/courses/page.tsx`: Kết hợp mượt mà giữa Cached Server Component và SWR Course Management trong ranh giới `<Suspense>`.
  * Kiểm định chất lượng: `pnpm --filter client run build` thành công 100% (Turbopack, TypeScript 0 lỗi, nhận diện `ƒ Proxy (Middleware)`); `dotnet test` đạt 21/21 passed (100%).
### [2026-10-25] Triển khai Phân hệ Quản lý Khóa học (Courses) & Lớp học (Classes) trên Backend .NET 10 (BFF)
* **Mô tả**: Thiết lập toàn bộ API quản lý Khóa học (`Courses`) và Lớp học (`Classes`) trong tầng Backend BFF (.NET 10, Clean Architecture) với cơ chế HTTP PATCH tự động bằng Reflection Dictionary, kiểm soát hạn ngạch gói cước (`MaxClassesLimit Enforcement`), thuật toán sinh buổi học tự động (`ClassSessions`), phát hiện va chạm lịch dạy của giảng viên (`Conflict Detection`) và bảo vệ toàn vẹn bằng Database Transaction.
* **Kết quả**:
  * Bổ sung trạng thái `Cancelled = 4` cho enum [ClassStatus.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/Enums/ClassStatus.cs).
  * Xây dựng extension method reflection [PatchExtensions.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/Common/PatchExtensions.cs) hỗ trợ `ToPatchDictionary()` tự động loại trừ `null`, `.Trim()` chuỗi và tích hợp trực tiếp với `db.Entry(entity).CurrentValues.SetValues(patchDictionary)`.
  * Xóa bỏ quy ước `Dto` cũ, chuẩn hóa 100% mô hình request/response theo vai trò:
    - Khóa học: [CourseResponse.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Courses/CourseResponse.cs), [CreateCourseRequest.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Courses/CreateCourseRequest.cs), [PatchCourseRequest.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Courses/PatchCourseRequest.cs).
    - Lớp học: [ClassResponse.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Classes/ClassResponse.cs), [ClassSessionResponse.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Classes/ClassSessionResponse.cs), [ClassScheduleConfigRequest.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Classes/ClassScheduleConfigRequest.cs), [CreateClassRequest.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Classes/CreateClassRequest.cs), [PatchClassRequest.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/DTOs/Classes/PatchClassRequest.cs).
  * Định nghĩa interface [IScheduleGeneratorService.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Core/Common/IScheduleGeneratorService.cs) và triển khai [ScheduleGeneratorService.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Infrastructure/Services/ScheduleGeneratorService.cs) đăng ký vào DI Container qua `AddScoped`.
  * Xây dựng [CoursesController.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Api/Controllers/CoursesController.cs) (`[Route("api/courses")]`):
    - `GET /api/courses`, `GET /api/courses/{id:guid}`: Yêu cầu xác thực token trung tâm (`[Authorize]`).
    - `POST /api/courses`, `PATCH /api/courses/{id:guid}`, `DELETE /api/courses/{id:guid}`: Phân quyền `[Authorize(Roles = "CenterAdmin")]`. Chặn xóa khóa học nếu đã có lớp học trực thuộc.
  * Xây dựng [ClassesController.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.Api/Controllers/ClassesController.cs) (`[Route("api/classes")]`):
    - `GET /api/classes`, `GET /api/classes/{id:guid}`: Đọc dữ liệu lớp kèm quan hệ `Course`, `Teacher`, và `Sessions`.
    - `POST /api/classes`: Thực thi nghiêm ngặt 4 quy tắc nghiệp vụ lõi: kiểm tra hạn ngạch `tenant.SubscriptionPlan.MaxClassesLimit`, sinh buổi học theo thứ trong tuần, phát hiện xung đột lịch dạy giảng viên (`newStart < existingEnd && newEnd > existingStart`), và bọc toàn bộ trong `db.Database.BeginTransactionAsync()` đảm bảo tính toàn vẹn (All-or-Nothing).
    - `PATCH /api/classes/{id:guid}`: Cập nhật thông tin lớp học qua `ToPatchDictionary()`.
  * Mở rộng kiểm thử tự động xUnit:
    - [PatchExtensionsTests.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.UnitTests/Tests/PatchExtensionsTests.cs): 5 bài test xác minh trích xuất non-null, tự động trim, xử lý null request và cập nhật `CurrentValues.SetValues()`.
    - [ScheduleGeneratorServiceTests.cs](file:///d:/Project/SAAS/BFF/LmsSaaS.UnitTests/Tests/ScheduleGeneratorServiceTests.cs): 13 bài test xác minh sinh lịch đúng số buổi, bắt lỗi dữ liệu đầu vào và kiểm định thuật toán phát hiện va chạm thời gian.
  * Kiểm định chất lượng: `dotnet build BFF/LmsSaaS.slnx` thành công 100% (0 errors, 0 warnings); `dotnet test BFF/LmsSaaS.slnx` vượt qua 39/39 unit test cases (tăng từ 21 lên 39 tests passed).
* **Người thực hiện**: AI Agent & User.

---

## 3. TÍNH NĂNG ĐANG TIẾN HÀNH (IN PROGRESS)
*(Hiện chưa có task nào đang chạy)*

---

## 4. KẾ HOẠCH SẮP TỚI (TODO / ROADMAP)

### Giai đoạn 1: Xây dựng Core UI & Design System (Client)
- [x] Thiết lập thư mục components dùng chung `src/components/common/` (Button, index...).
- [x] Xây dựng App Shell Layout (Sidebar điều hướng, Header Bar, Switch Workspace, Logout, Mobile Drawer).
- [x] Định nghĩa Design Tokens (Theme colors, Spacing, Typography với Plus Jakarta Sans & JetBrains Mono) chuẩn theo `ui-ux-pro-max`.

### Giai đoạn 2: Tích hợp Xác thực (Authentication)
- [x] Tích hợp API xác thực từ Backend (BFF .NET) / Supabase.
- [x] Quản lý trạng thái phiên đăng nhập Backend (JWT token, middleware bảo vệ tenant).
- [x] Màn hình Đăng nhập (Sign In) & Chọn trung tâm trên Client (BFF HttpOnly Cookie).
- [x] Client Auth context/middleware quản lý token lưu trữ và route protection.

### Giai đoạn 3: Phân hệ Quản trị & Khóa học (LMS Core)
- [ ] Dashboard tổng quan (Thống kê học viên, doanh thu, khóa học).
- [x] Backend API Quản lý Khóa học & Lớp học (`/api/courses`, `/api/classes`, kiểm soát hạn ngạch, sinh lịch học, chống trùng lịch).
- [ ] Giao diện Client Quản lý Khóa học & Lớp học (Tạo khóa học, chương trình học, upload bài giảng).
- [ ] Giao diện người học (Trang chi tiết khóa học, trình phát video bài giảng, theo dõi tiến độ).

### Giai đoạn 4: Đánh giá & Thanh toán
- [ ] Hệ thống làm bài trắc nghiệm / nộp bài tập.
- [ ] Cổng thanh toán khóa học.
