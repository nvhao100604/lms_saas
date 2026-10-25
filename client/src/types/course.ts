export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  tuitionFee: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string | null;
  tuitionFee: number;
}

// Tận dụng Partial<T> cho HTTP PATCH khớp với Backend ToPatchDictionary
export type PatchCourseRequest = Partial<CreateCourseRequest> & {
  isActive?: boolean;
};
