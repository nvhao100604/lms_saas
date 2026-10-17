# WORKSPACE CODING RULES & CONVENTIONS

Tài liệu này định nghĩa toàn bộ quy chuẩn lập trình, kiến trúc mã nguồn và nguyên tắc làm việc mà AI Agent và các lập trình viên bắt buộc phải tuân thủ trong dự án **LMS SaaS**.

---

## 1. QUY CHUẨN ĐẶT TÊN FILE & THƯ MỤC

### 1.1. File Markdown (.md)
* **Quy tắc tuyệt đối**: **TẤT CẢ** các file `.md` trong toàn bộ dự án phải được đặt tên bằng chữ **IN HOA**.
* Ví dụ hợp lệ: `RULES.md`, `FEATURES_DONE.md`, `DIARY.md`, `SKILL.md`, `README.md`, `.AGENT.md`.
* Nghiêm cấm: `rules.md`, `features-done.md`, `diary.md`.

### 1.2. Mã nguồn Frontend (Next.js / TypeScript)
* **React Components**: Dùng `PascalCase.tsx`.
  * Ví dụ: `Button.tsx`, `HeaderBar.tsx`, `CourseCard.tsx`.
* **Next.js App Router**: Tuân thủ nghiêm ngặt quy ước chuẩn của Next.js (chữ thường):
  * Ví dụ: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
* **Hooks**: Bắt đầu bằng `use` và theo kiểu `camelCase.ts`.
  * Ví dụ: `useAuth.ts`, `useCourseProgress.ts`.
* **Utils & Helpers**: Dùng `camelCase.ts` hoặc `kebab-case.ts`.
  * Ví dụ: `formatCurrency.ts`, `apiClient.ts`.
* **Types / Interfaces**: Dùng `PascalCase.ts`.
  * Ví dụ: `User.ts`, `Course.ts`, `ApiResponse.ts`.
* **Constants**: Dùng `SCREAMING_SNAKE_CASE` cho biến hằng số, tên file dùng `camelCase.ts` hoặc `kebab-case.ts`.
  * Ví dụ: `const DEFAULT_PAGE_SIZE = 10;`.

---

## 2. NGUYÊN TẮC THIẾT KẾ KIẾN TRÚC & CODE CHUẨN

### 2.1. SOLID Principles
* **S - Single Responsibility Principle (Đơn trách nhiệm)**:
  * Mỗi file, component hoặc function chỉ đảm nhận một trách nhiệm duy nhất.
  * Tách biệt UI (trưng bày giao diện), State/Logic (Custom Hooks) và Gọi API (Services/Clients).
* **O - Open/Closed Principle (Mở để mở rộng, Đóng để sửa đổi)**:
  * Thiết kế components và modules có khả năng mở rộng thông qua props, composition (`children`, slots) mà không phải thay đổi code hiện hữu.
* **L - Liskov Substitution Principle (Thay thế Liskov)**:
  * Các component con hoặc implementation thay thế phải tương thích hoàn toàn về mặt hành vi với component/interface gốc.
* **I - Interface Segregation Principle (Phân tách Interface)**:
  * Tránh tạo interface hoặc props quá cồng kềnh. Chỉ yêu cầu component nhận đúng những dữ liệu nó thực sự cần.
* **D - Dependency Inversion Principle (Đảo ngược phụ thuộc)**:
  * Phụ thuộc vào abstractions (Types, Interfaces, Callbacks), không phụ thuộc cứng vào các implementation cụ thể.

### 2.2. Dễ mở rộng, Dễ bảo trì & Dễ Debug (Extensible, Maintainable, Debuggable)
* **Dễ mở rộng (Extensibility)**:
  * Cấu trúc module hóa cao (Feature-based hoặc Domain-based khi dự án lớn).
  * Tránh hardcode giá trị (magic numbers, hardcoded strings), gom vào file cấu hình hoặc constants.
* **Dễ bảo trì (Maintainability)**:
  * Viết code tự tường minh (Self-documenting code), đặt tên biến và hàm thể hiện rõ ý nghĩa.
  * Type-safety tuyệt đối với TypeScript: Không sử dụng `any`, luôn định nghĩa kiểu tường minh.
* **Dễ Debug (Debuggability)**:
  * Bắt lỗi chủ động với Error Boundaries và try/catch tại các điểm gọi bất đồng bộ.
  * Bắn thông điệp lỗi rõ ràng, có ngữ cảnh để nhanh chóng khoanh vùng nguyên nhân.

### 2.3. Nguyên tắc Tái Sử Dụng & Dùng Chung (Reusability & DRY)
* **Ưu tiên tạo file dùng chung**:
  * Khi bất kỳ component, logic, hook, helper, hoặc type nào được sử dụng **từ 2 nguồn/file trở lên**, **BẮT BUỘC PHẢI TÁCH THÀNH FILE RIÊNG**.
  * Đặt tại các thư mục dùng chung tương ứng:
    * `src/components/common/`: Cho các UI components tái sử dụng (Button, Modal, Input, Badge...).
    * `src/hooks/`: Cho các custom hooks dùng chung.
    * `src/lib/` hoặc `src/utils/`: Cho các hàm xử lý logic, định dạng, tính toán.
    * `src/types/`: Cho các data models và interfaces toàn cục.
* Không copy-paste code giữa các trang hoặc các component.

### 2.4. Quy tắc Không Dùng Emoji & Sử Dụng Icon Thư Viện (No Emoji in Code & UI)
* **Tuyệt đối không dùng Emoji**:
  * Khi sinh mã nguồn (code generation), **KHÔNG ĐƯỢC PHÉP** chèn các ký tự emoji trực tiếp vào JSX, HTML, strings, thẻ tiêu đề hay comment code.
* **Bắt buộc dùng Icon từ Thư viện**:
  * Mọi vị trí cần biểu tượng trực quan (icon biểu thị hành động, trạng thái, điều hướng) trên UI **bắt buộc phải import và sử dụng từ thư viện icon chuẩn** (sẽ được thống nhất tích hợp vào dự án sau), không tự ý chèn emoji hay ký tự đặc biệt thô sơ.
  * Giúp đảm bảo chuẩn thiết kế SaaS chuyên nghiệp, độ tương phản nhất quán và khả năng tiếp cận (Accessibility / screen reader) đúng chuẩn.

---

## 3. PHÂN ĐỊNH RANH GIỚI HỆ THỐNG

### 3.1. Phân định Backend (BFF - .NET)
* Toàn bộ mã nguồn Backend trong thư mục [BFF](file:///d:/Project/SAAS/BFF) do **Người dùng (User) tự code và kiểm soát**.
* **AI Agent KHÔNG tự ý**:
  * Sửa đổi, sinh mã backend hoặc can thiệp vào cấu trúc .NET trừ khi người dùng yêu cầu rõ ràng.
  * Agent chỉ hỗ trợ định nghĩa DTOs, Type contracts cho Frontend để kết nối đồng bộ với API của BFF.

### 3.2. Trách nhiệm Frontend (Client - Next.js)
* Frontend đặt tại [client](file:///d:/Project/SAAS/client), dùng App Router, TypeScript và Tailwind CSS v4.
* Đảm bảo giao diện hiện đại, chuẩn thẩm mỹ, tuân thủ hướng dẫn thiết kế trong skill `ui-ux-pro-max`.

---

## 4. QUY TRÌNH LÀM VIỆC & CẬP NHẬT TÀI LIỆU CỦA AGENT

1. **Trước khi bắt đầu task**:
   * Luôn tham chiếu [RULES.md](file:///d:/Project/SAAS/.docs/RULES.md) và [.AGENT.md](file:///d:/Project/SAAS/.AGENT.md).
   * Kích hoạt các skill tương ứng (ví dụ: `ui-ux-pro-max` khi dựng UI).
2. **Sau khi hoàn thành task**:
   * Cập nhật trạng thái tính năng trong [.docs/FEATURES_DONE.md](file:///d:/Project/SAAS/.docs/FEATURES_DONE.md).
   * Ghi nhận công việc, quyết định kiến trúc vào [.docs/DIARY.md](file:///d:/Project/SAAS/.docs/DIARY.md).
