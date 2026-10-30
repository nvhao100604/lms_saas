# Thiết Kế Chi Tiết: Bảng Điều Khiển Thống Kê Trung Tâm (Dashboard) & Kích Hoạt Sự Kiện Cảnh Báo Vắng Mặt

- **Ngày ban hành**: 2026-10-30
- **Tác giả**: Senior Fullstack Architect (.NET 10 Clean Architecture & Next.js 16 App Router)
- **Trạng thái**: Đã phê duyệt (Approved)
- **Vị trí tài liệu**: `.docs/2026-10-30-dashboard-and-absent-notification-design.md`

---

## 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU NGHIỆP VỤ

### 1.1. Bối cảnh
Hệ thống LMS SaaS hiện tại đã hoàn thiện các phân hệ cốt lõi: Khóa học, Lớp học, Điểm danh, Thông báo Event-Driven qua RabbitMQ/MassTransit và Quản lý Thành viên. Tuy nhiên:
1. Trang tổng quan trung tâm (`/[tenantSlug]/dashboard`) ở tầng Client hiện vẫn dùng dữ liệu mẫu tĩnh (hardcoded Tailwind HTML), chưa kết nối dữ liệu thực tế từ tầng BFF.
2. Quản trị viên trung tâm (`CenterAdmin`) cần một bảng điều khiển thời gian thực để nắm bắt các chỉ số vận hành quan trọng: Khóa học đang tuyển sinh, Lớp học đang mở, Số lượng giảng viên & học viên, và Tỷ lệ chuyên cần toàn trung tâm.
3. Cần có cơ chế trực quan giám sát **Hạn ngạch gói cước SaaS (`Subscription Quota`)** để quản trị viên biết được trung tâm đã sử dụng bao nhiêu phần trăm hạn mức lớp học và học viên, kèm các cảnh báo ngưỡng (>80%).
4. Trong quy trình điểm danh (`AttendancesController`), sự kiện tích hợp `StudentAbsentIntegrationEvent` cần được kích hoạt tự động qua MassTransit khi học viên bị đánh dấu vắng mặt (`AttendanceStatus.Absent`), đảm bảo thông báo cảnh báo tức thì được gửi đến quả chuông thông báo của học viên.

### 1.2. Mục tiêu kỹ thuật
- **Kiến trúc CQS**: Toàn bộ mô hình Request/Response không dùng hậu tố `Dto`.
- **Giao diện 100% Material UI (MUI v9)**: Đồng bộ thiết kế với toàn hệ thống, tuân thủ `ui-ux-pro-max`, loại bỏ toàn bộ emoji, không để lộ thuật ngữ kỹ thuật hạ tầng lên UI.
- **Hỗ trợ Song ngữ hoàn chỉnh**: Mọi chuỗi ký tự đều được dịch đồng bộ trong `locales/vi.ts` và `locales/en.ts`.
- **Chất lượng code tuyệt đối**: Đạt 0 Warning, 0 Error trên cả .NET 10 solution và Next.js 16 App Router.

---

## 2. THIẾT KẾ CHI TIẾT TẦNG BACKEND (.NET 10 BFF)

### 2.1. Kích hoạt Sự kiện Vắng mặt trong `AttendancesController.cs`
- **File**: `BFF/LmsSaaS.Api/Controllers/AttendancesController.cs`
- **Dependency Injection**:
  - Inject `IPublishEndpoint publishEndpoint` từ MassTransit vào controller.
  - Cung cấp constructor phụ nhận `AppDbContext` để tương thích với các bài unit test hiện hữu.
- **Logic phát hiện học viên vắng mặt mới (`Newly Absent Detection`)**:
  - Tại endpoint `PUT /api/sessions/{sessionId:guid}/attendances`:
    - Truy vấn `ClassSession` kèm quan hệ `Include(cs => cs.Class).ThenInclude(c => c.Tenant)` để có `TenantSlug`, `Class.Name`, `SessionNumber`.
    - Đọc trạng thái điểm danh trước đó từ DB: `existingAttendances`.
    - Nhận diện các học viên chuyển sang trạng thái `AttendanceStatus.Absent`:
      ```csharp
      var newlyAbsentStudentIds = new List<Guid>();
      foreach (var item in request.Attendances)
      {
          if (item.Status == AttendanceStatus.Absent)
          {
              if (!existingAttendances.TryGetValue(item.StudentId, out var existing) || existing.Status != AttendanceStatus.Absent)
              {
                  newlyAbsentStudentIds.Add(item.StudentId);
              }
          }
      }
      ```
    - Ngay sau khi `await transaction.CommitAsync()` thành công:
      ```csharp
      if (publishEndpoint != null)
      {
          foreach (var studentId in newlyAbsentStudentIds)
          {
              await publishEndpoint.Publish(new StudentAbsentIntegrationEvent(
                  session.TenantId,
                  session.Class.Tenant?.Slug ?? string.Empty,
                  session.ClassId,
                  session.Class.Name,
                  session.Id,
                  session.SessionNumber,
                  studentId,
                  session.StartTime
              ));
          }
      }
      ```

### 2.2. DTOs Phân hệ Dashboard (`BFF/LmsSaaS.Core/DTOs/Dashboard/`)
Tạo các record CQS tường minh:
1. `TodaySessionItemResponse.cs`:
   ```csharp
   namespace LmsSaaS.Core.DTOs.Dashboard;

   public record TodaySessionItemResponse(
       Guid SessionId,
       Guid ClassId,
       string ClassName,
       string CourseTitle,
       string TeacherName,
       string? RoomName,
       int SessionNumber,
       string? Topic,
       DateTimeOffset StartTime,
       DateTimeOffset EndTime
   );
   ```
2. `SubscriptionQuotaResponse.cs`:
   ```csharp
   namespace LmsSaaS.Core.DTOs.Dashboard;

   public record SubscriptionQuotaResponse(
       string PlanName,
       decimal MonthlyPrice,
       int CurrentClassesCount,
       int MaxClassesLimit,
       int CurrentStudentsCount,
       int MaxStudentsLimit
   );
   ```
3. `DashboardSummaryResponse.cs`:
   ```csharp
   namespace LmsSaaS.Core.DTOs.Dashboard;

   public record DashboardSummaryResponse(
       int TotalActiveCourses,
       int TotalOngoingClasses,
       int TotalActiveTeachers,
       int TotalActiveStudents,
       double AttendanceRatePercent,
       SubscriptionQuotaResponse Quota,
       IReadOnlyList<TodaySessionItemResponse> TodaySessions
   );
   ```

### 2.3. Controller `DashboardController.cs`
- **File**: `BFF/LmsSaaS.Api/Controllers/DashboardController.cs`
- **Thuộc tính Controller**: `[ApiController]`, `[Route("api/dashboard")]`, `[Authorize]`.
- **Dependencies**: `AppDbContext dbContext`, `ICurrentTenantService currentTenantService`.
- **Endpoint `GET /api/dashboard`**:
  1. **Xác thực Tenant**: Đọc `tenantId = currentTenantService.TenantId ?? dbContext.CurrentTenantId`. Nếu rỗng trả về `401 Unauthorized`.
  2. **Tổng hợp KPI**:
     - `TotalActiveCourses`: `await dbContext.Courses.CountAsync(c => c.IsActive)`
     - `TotalOngoingClasses`: `await dbContext.Classes.CountAsync(c => c.Status == ClassStatus.Upcoming || c.Status == ClassStatus.Ongoing)`
     - `TotalActiveTeachers`: `await dbContext.TenantMembers.CountAsync(tm => tm.Role == RoleInTenant.Teacher && tm.IsActive)`
     - `TotalActiveStudents`: `await dbContext.TenantMembers.CountAsync(tm => tm.Role == RoleInTenant.Student && tm.IsActive)`
     - `AttendanceRatePercent`:
       ```csharp
       var totalAttendances = await dbContext.Attendances.CountAsync();
       var attendedCount = await dbContext.Attendances.CountAsync(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
       var attendanceRatePercent = totalAttendances > 0
           ? Math.Round((double)attendedCount * 100.0 / totalAttendances, 1)
           : 100.0;
       ```
  3. **Hạn ngạch gói cước (`Quota`)**:
     - Truy vấn `Tenants.IgnoreQueryFilters().Include(t => t.SubscriptionPlan).FirstOrDefaultAsync(t => t.Id == tenantId.Value)`.
     - `CurrentClassesCount`: `await dbContext.Classes.CountAsync()`.
     - `CurrentStudentsCount`: `await dbContext.TenantMembers.CountAsync(tm => tm.Role == RoleInTenant.Student && tm.IsActive)`.
     - Tạo `SubscriptionQuotaResponse(tenant.SubscriptionPlan.Name, tenant.SubscriptionPlan.Price, currentClasses, maxClasses, currentStudents, maxStudents)`.
  4. **Lịch học Hôm nay / Sắp tới (`TodaySessions`)**:
     - Đọc vai trò người dùng và `currentUserId`.
     - Tạo truy vấn cơ sở từ `dbContext.ClassSessions.Include(cs => cs.Class).ThenInclude(c => c.Course).Include(cs => cs.Class).ThenInclude(c => c.Teacher)`.
     - Áp dụng phân quyền:
       + Nếu là `Teacher`: lọc `cs.Class.TeacherId == currentUserId`.
       + Nếu là `Student`: lọc `cs.Class.Enrollments.Any(e => e.StudentId == currentUserId)`.
       + Nếu là `CenterAdmin`: xem tất cả lịch trong trung tâm.
     - Lọc buổi học trong ngày hôm nay: `todayStart <= cs.StartTime < todayEnd`.
     - Nếu hôm nay có buổi học: sắp xếp theo `StartTime` tăng dần và lấy toàn bộ trong ngày.
     - Nếu hôm nay không có buổi học: fallback lấy **5 buổi học sắp tới gần nhất** (`cs.StartTime >= now`, sắp xếp theo `StartTime` tăng dần, `Take(5)`).
     - Map sang `TodaySessionItemResponse`.

---

## 3. THIẾT KẾ CHI TIẾT TẦNG FRONTEND (NEXT.JS 16 & MUI)

### 3.1. Cấu hình Routes & Proxy
1. `client/next.config.ts`: Thêm rewrite rule:
   ```typescript
   {
     source: "/api/dashboard/:path*",
     destination: `${backendUrl}/api/dashboard/:path*`,
   }
   ```
2. `client/src/constants/routes.ts`: Thêm vào `ROUTES.API`:
   ```typescript
   DASHBOARD: {
     ROOT: "/api/dashboard",
   }
   ```

### 3.2. Types, Service & SWR Hook
1. `client/src/types/dashboard.ts`:
   - `TodaySessionItemResponse`
   - `SubscriptionQuotaResponse`
   - `DashboardSummaryResponse`
   - Export trong `client/src/types/index.ts`.
2. `client/src/services/dashboardService.ts`:
   - `getDashboardSummary(): Promise<DashboardSummaryResponse>` gọi `api.get(ROUTES.API.DASHBOARD.ROOT)`.
3. `client/src/hooks/useDashboard.ts`:
   - `useDashboard(tenantSlug?: string)` với SWR key `[ROUTES.API.DASHBOARD.ROOT, tenantSlug ?? "default"]`.

### 3.3. Tái cấu trúc Giao diện `DashboardView.tsx` (100% Material UI)
1. **Hero Welcome Banner**:
   - Sử dụng MUI `Paper` với gradient `from indigo-900 to slate-900`, bo góc tròn, hiệu ứng chiều sâu cao cấp.
   - Hiển thị tên trung tâm, huy hiệu "Trung tâm đào tạo", văn bản chào mừng song ngữ.
2. **4 Thẻ KPI Thống kê (MUI `Paper` Grid)**:
   - Khóa học tuyển sinh (`TotalActiveCourses`): Icon `MenuBookRounded`, tông màu Indigo.
   - Lớp học đang mở (`TotalOngoingClasses`): Icon `GroupsRounded`, tông màu Sky.
   - Thành viên trung tâm (`TotalActiveStudents` học viên / `TotalActiveTeachers` giảng viên): Icon `SchoolRounded`, tông màu Emerald.
   - Tỷ lệ chuyên cần toàn trung tâm (`AttendanceRatePercent%`): Icon `FactCheckRounded`, kèm màu sắc trạng thái (Xanh lá > 85%, Cam 70-85%, Đỏ < 70%).
3. **Thanh Hạn ngạch Gói cước SaaS (`Subscription Quota Card` - CenterAdmin)**:
   - Hiển thị tên gói cước (FREE, PRO, ENTERPRISE) kèm chip và giá tiền tháng.
   - 2 thanh `<LinearProgress>`:
     - Số lớp học: `{CurrentClassesCount} / {MaxClassesLimit} lớp`.
     - Số học viên: `{CurrentStudentsCount} / {MaxStudentsLimit} học viên`.
   - **Quy tắc cảnh báo ngưỡng**:
     - Tỷ lệ $\le 70\%$: màu `primary`.
     - Tỷ lệ $> 70\%$ và $\le 85\%$: màu `warning` (cam).
     - Tỷ lệ $> 85\%$: màu `error` (đỏ), kèm nút bấm nhanh "Nâng cấp gói cước".
4. **Lịch học Hôm nay & Kế tiếp (`Today & Upcoming Sessions Card`)**:
   - Khung danh sách các buổi học: Giờ học, Thứ/Ngày, Tên lớp, Khóa học, Phòng học, Giảng viên phụ trách, Chủ đề bài giảng.
   - Nút hành động nhanh:
     - Giảng viên / Quản trị viên: Nút "Điểm danh" dẫn thẳng tới `/[tenantSlug]/attendance?sessionId=...`.
     - Học viên: Nút "Xem lịch" dẫn tới `/[tenantSlug]/schedule`.
   - Trạng thái trống (Empty State) với minh họa icon và thông điệp thân thiện khi không có buổi học.
5. **Cụm Thao tác nhanh (`Quick Actions Toolbar`)**:
   - Nút Tạo khóa học mới $\rightarrow$ `/[tenantSlug]/courses`.
   - Nút Quản lý lớp học $\rightarrow$ `/[tenantSlug]/classes`.
   - Nút Quản lý thành viên $\rightarrow$ `/[tenantSlug]/members`.
   - Nút Xem thời khóa biểu $\rightarrow$ `/[tenantSlug]/schedule`.
6. **Bổ sung Từ điển Song ngữ**:
   - Cập nhật `locales/types.ts`, `locales/vi.ts`, `locales/en.ts` với đầy đủ các nhãn giao diện mới.

---

## 4. CHIẾN LƯỢC KIỂM THỬ & XÁC MINH (TESTING)

### 4.1. Unit Tests Backend (`BFF/LmsSaaS.UnitTests/`)
1. `AttendanceControllerTests.cs`:
   - Test kiểm tra việc chấm điểm danh với trạng thái `Absent` sẽ publish sự kiện `StudentAbsentIntegrationEvent` qua `TestPublishEndpoint`.
   - Test kiểm tra học viên đã là `Absent` từ trước khi cập nhật lại không bị bắn event trùng lặp.
2. `DashboardControllerTests.cs`:
   - Test tính toán chuẩn xác 4 chỉ số KPI từ dữ liệu mẫu.
   - Test tỷ lệ chuyên cần: tính chuẩn trên công thức `(Present + Late) / Total * 100`, và trả về `100.0` khi chưa có điểm danh.
   - Test hạn ngạch gói cước: hiển thị đúng số lớp và học viên thực tế so với giới hạn của `SubscriptionPlan`.
   - Test lấy lịch học theo phân quyền (Admin thấy hết, Teacher chỉ thấy lớp mình, Student chỉ thấy lớp ghi danh).
   - Test fallback: khi hôm nay không có lịch, hệ thống tự động trả về 5 buổi học sắp tới gần nhất.

### 4.2. Kiểm tra Biên dịch & Build
- `dotnet build BFF/LmsSaaS.slnx`: 0 Warning, 0 Error.
- `dotnet test BFF/LmsSaaS.slnx`: Toàn bộ tests passed 100%.
- `pnpm --dir client exec tsc --noEmit`: 0 lỗi TypeScript.
- `pnpm --dir client run build`: Toàn bộ 16+ routes static & dynamic (PPR) biên dịch thành công.

---

## 5. KẾ HOẠCH BÀN GIAO & PHÂN CHIA NHIỆM VỤ
- **Giai đoạn 1**: Backend Events & DTOs & Controller (`AttendancesController.cs`, `DashboardSummaryResponse.cs`, `DashboardController.cs`).
- **Giai đoạn 2**: Backend Unit Tests (`AttendanceControllerTests.cs`, `DashboardControllerTests.cs`).
- **Giai đoạn 3**: Frontend Routes, Types, Services, SWR Hook, Next.js rewrite.
- **Giai đoạn 4**: Frontend UI (`DashboardView.tsx` 100% MUI, KPI Cards, Quota Progress Bar, Today Sessions, i18n).
- **Giai đoạn 5**: Xác minh chất lượng & Cập nhật nhật ký tài liệu (`FEATURES_DONE.md`, `DIARY.md`).
