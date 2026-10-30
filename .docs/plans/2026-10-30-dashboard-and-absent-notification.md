# Dashboard Thống Kê & Kích Hoạt Sự Kiện Cảnh Báo Vắng Mặt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai bảng điều khiển thống kê thời gian thực cho trung tâm (`/[tenantSlug]/dashboard`) kèm thanh giám sát hạn ngạch gói cước SaaS (`Subscription Quota`), đồng thời kích hoạt sự kiện `StudentAbsentIntegrationEvent` qua MassTransit khi học viên bị đánh dấu vắng mặt trong sổ điểm danh.

**Architecture:** Sử dụng Clean Architecture với CQS (không hậu tố `Dto`) ở tầng .NET 10 BFF, tối ưu truy vấn EF Core `AsNoTracking()` trong 1 network roundtrip `GET /api/dashboard`; tích hợp MassTransit Publisher trong `AttendancesController`; phía Client Next.js 16 dùng 100% Material UI (MUI v9) với SWR caching và hỗ trợ song ngữ (`vi.ts` / `en.ts`).

**Tech Stack:** .NET 10, ASP.NET Core API, EF Core, MassTransit 8, Next.js 16 (App Router), React 19, Material UI (MUI v9), SWR, Axios, TypeScript, xUnit.

**Spec:** [.docs/2026-10-30-dashboard-and-absent-notification-design.md](file:///d:/Project/SAAS/.docs/2026-10-30-dashboard-and-absent-notification-design.md)

## Global Constraints
- CQS Naming: Tuyệt đối không dùng hậu tố `Dto`. Dùng các tên tường minh: `DashboardSummaryResponse`, `SubscriptionQuotaResponse`, `TodaySessionItemResponse`.
- 100% Material UI: Đồng bộ hệ sinh thái `@mui/material` và `@mui/icons-material`, không dùng raw emoji, không để lộ thuật ngữ kỹ thuật hạ tầng lên UI.
- Song ngữ: Toàn bộ chuỗi hiển thị phải có đầy đủ trong `locales/vi.ts` và `locales/en.ts`.
- Multi-tenancy: Mọi truy vấn phải cách ly tuyệt đối theo TenantId hiện tại.

---

### Task 1: Kích hoạt Sự kiện Cảnh báo Vắng mặt trong `AttendancesController.cs`

**Files:**
- Modify: `BFF/LmsSaaS.Api/Controllers/AttendancesController.cs`
- Test: `BFF/LmsSaaS.UnitTests/Tests/AttendanceControllerTests.cs`

**Interfaces:**
- Consumes: `IPublishEndpoint` (MassTransit), `StudentAbsentIntegrationEvent` (`LmsSaaS.Core.Events`).
- Produces: `publishEndpoint.Publish(new StudentAbsentIntegrationEvent(...))` khi học viên bị chấm `Absent`.

- [ ] **Step 1: Viết failing test kiểm tra phát sự kiện vắng mặt trong `AttendanceControllerTests.cs`**
  Thêm unit test `SaveSessionAttendances_WhenStudentMarkedAbsent_ShouldPublishStudentAbsentIntegrationEvent` sử dụng `Mocks.TestPublishEndpoint`.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  Lệnh: `dotnet test BFF/LmsSaaS.slnx --filter FullyQualifiedName~SaveSessionAttendances_WhenStudentMarkedAbsent`
  Kỳ vọng: FAIL vì `AttendancesController` chưa inject `publishEndpoint` và chưa bắn sự kiện.

- [ ] **Step 3: Mở rộng `AttendancesController.cs`**
  Inject `IPublishEndpoint? publishEndpoint`, bổ sung constructor phụ tương thích ngược:
  ```csharp
  public class AttendancesController : ControllerBase
  {
      private readonly AppDbContext dbContext;
      private readonly IPublishEndpoint? publishEndpoint;

      public AttendancesController(AppDbContext dbContext, IPublishEndpoint publishEndpoint)
      {
          this.dbContext = dbContext;
          this.publishEndpoint = publishEndpoint;
      }

      public AttendancesController(AppDbContext dbContext) : this(dbContext, null!) { }
      ...
  }
  ```
  Trong `SaveSessionAttendances`, nạp `Class.Tenant` để lấy `TenantSlug`, phát hiện `newlyAbsentStudentIds` và publish sự kiện sau `transaction.CommitAsync()`.

- [ ] **Step 4: Chạy lại test để xác nhận test pass**
  Lệnh: `dotnet test BFF/LmsSaaS.slnx --filter FullyQualifiedName~AttendanceControllerTests`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit thay đổi Task 1**
  ```bash
  git add BFF/LmsSaaS.Api/Controllers/AttendancesController.cs BFF/LmsSaaS.UnitTests/Tests/AttendanceControllerTests.cs
  git commit -m "feat: publish StudentAbsentIntegrationEvent on absent attendance"
  ```

---

### Task 2: CQS Models & API `DashboardController.cs` ở tầng BFF

**Files:**
- Create: `BFF/LmsSaaS.Core/DTOs/Dashboard/TodaySessionItemResponse.cs`
- Create: `BFF/LmsSaaS.Core/DTOs/Dashboard/SubscriptionQuotaResponse.cs`
- Create: `BFF/LmsSaaS.Core/DTOs/Dashboard/DashboardSummaryResponse.cs`
- Create: `BFF/LmsSaaS.Api/Controllers/DashboardController.cs`
- Test: `BFF/LmsSaaS.UnitTests/Tests/DashboardControllerTests.cs`

**Interfaces:**
- Consumes: `AppDbContext`, `ICurrentTenantService`.
- Produces: `GET /api/dashboard` trả về `ApiResponse<DashboardSummaryResponse>`.

- [ ] **Step 1: Tạo các CQS record trong `BFF/LmsSaaS.Core/DTOs/Dashboard/`**
  - `TodaySessionItemResponse(SessionId, ClassId, ClassName, CourseTitle, TeacherName, RoomName, SessionNumber, Topic, StartTime, EndTime)`
  - `SubscriptionQuotaResponse(PlanName, MonthlyPrice, CurrentClassesCount, MaxClassesLimit, CurrentStudentsCount, MaxStudentsLimit)`
  - `DashboardSummaryResponse(TotalActiveCourses, TotalOngoingClasses, TotalActiveTeachers, TotalActiveStudents, AttendanceRatePercent, Quota, TodaySessions)`

- [ ] **Step 2: Viết test cho `DashboardController` trong `DashboardControllerTests.cs`**
  Bao gồm các test case:
  - `GetDashboard_ReturnsCorrectKpiStats`: Kiểm tra đếm chuẩn xác khóa học, lớp học, giảng viên, học viên.
  - `GetDashboard_CalculatesAttendanceRateCorrectly`: Kiểm tra tỷ lệ chuyên cần `(Present + Late) / Total * 100`, và mặc định `100.0` nếu chưa có bản ghi nào.
  - `GetDashboard_ReturnsCorrectSubscriptionQuota`: Kiểm tra số lượng lớp học và học viên thực tế so với gói cước.
  - `GetDashboard_RoleBasedSessionsScoping`: Admin thấy toàn bộ lịch, Teacher chỉ thấy lớp mình, Student chỉ thấy lớp đã ghi danh.
  - `GetDashboard_FallbackToUpcomingSessionsWhenNoTodaySessions`: Fallback 5 buổi học sắp tới khi hôm nay không có lịch.

- [ ] **Step 3: Hiện thực hóa `DashboardController.cs`**
  Cài đặt `GET /api/dashboard` tổng hợp đầy đủ số liệu theo spec.

- [ ] **Step 4: Chạy toàn bộ test solution**
  Lệnh: `dotnet test BFF/LmsSaaS.slnx`
  Kỳ vọng: PASS 100%, 0 failures.

- [ ] **Step 5: Commit thay đổi Task 2**
  ```bash
  git add BFF/LmsSaaS.Core/DTOs/Dashboard/ BFF/LmsSaaS.Api/Controllers/DashboardController.cs BFF/LmsSaaS.UnitTests/Tests/DashboardControllerTests.cs
  git commit -m "feat: implement DashboardController and CQS response models in BFF"
  ```

---

### Task 3: Client Route, Proxy Rewrite & SWR Data Layer

**Files:**
- Modify: `client/next.config.ts`
- Modify: `client/src/constants/routes.ts`
- Create: `client/src/types/dashboard.ts`
- Modify: `client/src/types/index.ts`
- Create: `client/src/services/dashboardService.ts`
- Create: `client/src/hooks/useDashboard.ts`
- Modify: `client/src/hooks/index.ts`

**Interfaces:**
- Consumes: `ROUTES.API.DASHBOARD.ROOT`, `api` (Axios).
- Produces: `useDashboard(tenantSlug)` hook trả về `{ dashboard, isLoading, isError, error, mutate }`.

- [ ] **Step 1: Cấu hình `next.config.ts` và `routes.ts`**
  - Thêm rewrite rule cho `/api/dashboard/:path*`.
  - Bổ sung `DASHBOARD: { ROOT: "/api/dashboard" }` trong `ROUTES.API`.

- [ ] **Step 2: Khởi tạo TypeScript interfaces trong `client/src/types/dashboard.ts`**
  Định nghĩa `TodaySessionItemResponse`, `SubscriptionQuotaResponse`, `DashboardSummaryResponse` khớp chính xác với BFF. Re-export trong `types/index.ts`.

- [ ] **Step 3: Tạo service `client/src/services/dashboardService.ts`**
  Phương thức `getDashboardSummary()` gọi API BFF qua Axios instance.

- [ ] **Step 4: Tạo hook `client/src/hooks/useDashboard.ts`**
  Sử dụng SWR với key `[ROUTES.API.DASHBOARD.ROOT, tenantSlug ?? "default"]`. Export trong `hooks/index.ts`.

- [ ] **Step 5: Kiểm tra type check**
  Lệnh: `pnpm --dir client exec tsc --noEmit`
  Kỳ vọng: Exit code 0, không có lỗi type.

- [ ] **Step 6: Commit thay đổi Task 3**
  ```bash
  git add client/next.config.ts client/src/constants/routes.ts client/src/types/ client/src/services/dashboardService.ts client/src/hooks/
  git commit -m "feat: add client dashboard routes, types, service and SWR hook"
  ```

---

### Task 4: Client Song Ngữ (`locales/`) & Tái Cấu Trúc `DashboardView.tsx` 100% MUI

**Files:**
- Modify: `client/src/locales/types.ts`
- Modify: `client/src/locales/vi.ts`
- Modify: `client/src/locales/en.ts`
- Modify: `client/src/components/dashboard/DashboardView.tsx`

**Interfaces:**
- Consumes: `useDashboard`, `useCurrentRole`, `useAppSelector` (Redux `language.t`).
- Produces: Giao diện Dashboard hoàn chỉnh 100% Material UI.

- [ ] **Step 1: Bổ sung bộ từ khóa song ngữ cho Dashboard trong `locales/`**
  Thêm các khóa mới vào `DashboardTranslations`:
  - `activeCourses`, `ongoingClasses`, `totalMembersCount`, `attendanceRate`
  - `subscriptionQuotaTitle`, `subscriptionQuotaDesc`, `planClassesUsed`, `planStudentsUsed`, `upgradePlan`
  - `todaySessionsTitle`, `todaySessionsDesc`, `upcomingSessionsBadge`, `noSessionsToday`, `noSessionsDesc`
  - `takeAttendanceAction`, `viewScheduleAction`, `quickActionsTitle`
  - `roomPrefix`, `instructorPrefix`, `topicPrefix`

- [ ] **Step 2: Xây dựng lại `DashboardView.tsx` với 100% MUI**
  - Hero Welcome Banner (MUI `Paper`, gradient, thông điệp cá nhân hóa).
  - 4 Thẻ KPI Thống kê (MUI `Paper` Grid 4 cột, `Skeleton` khi loading, icon màu tương ứng).
  - Thẻ Hạn ngạch SaaS `Subscription Quota` (Hiển thị cho `CenterAdmin`): 2 thanh `<LinearProgress>` cho Lớp học và Học viên, đổi màu linh hoạt `primary` ($\le 70\%$), `warning` ($70-85\%$), `error` ($> 85\%$).
  - Card Lịch học Hôm nay / Sắp tới: Danh sách các buổi học kèm nút "Điểm danh" (Admin/Teacher) hoặc "Xem lịch" (Student).
  - Thanh Thao tác nhanh (Quick Actions).

- [ ] **Step 3: Kiểm tra biên dịch Next.js client**
  Lệnh: `pnpm --dir client exec tsc --noEmit` và `pnpm --dir client run build`
  Kỳ vọng: Compile thành công 100% tất cả các route.

- [ ] **Step 4: Commit thay đổi Task 4**
  ```bash
  git add client/src/locales/ client/src/components/dashboard/DashboardView.tsx
  git commit -m "feat: upgrade DashboardView to 100% MUI with live KPI and Quota progress"
  ```

---

### Task 5: Xác Minh Tổng Thể, Cập Nhật Tài Liệu & Đẩy Mã Nguồn

**Files:**
- Modify: `.docs/FEATURES_DONE.md`
- Modify: `.docs/DIARY.md`

- [ ] **Step 1: Chạy toàn bộ test suite Backend**
  Lệnh: `dotnet test BFF/LmsSaaS.slnx`
  Kỳ vọng: 100% passed (tất cả các test case đều xanh).

- [ ] **Step 2: Chạy kiểm thử Build Frontend**
  Lệnh: `pnpm --dir client run build`
  Kỳ vọng: Biên dịch thành công toàn bộ static và dynamic routes.

- [ ] **Step 3: Cập nhật nhật ký tài liệu**
  - `.docs/FEATURES_DONE.md`: Cập nhật tiến độ phân hệ Dashboard & Absent Notification.
  - `.docs/DIARY.md`: Ghi chép chi tiết các quyết định kiến trúc và kết quả thực hiện.

- [ ] **Step 4: Commit và Push lên GitHub**
  ```bash
  git add .docs/
  git commit -m "docs: update FEATURES_DONE and DIARY for dashboard and absent notification"
  git push origin main
  ```
