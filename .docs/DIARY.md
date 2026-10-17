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

