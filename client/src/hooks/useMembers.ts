import useSWR, { type SWRConfiguration } from "swr";
import { memberService } from "@/services/memberService";
import { ROUTES } from "@/constants/routes";
import type {
  TenantMemberResponse,
  CreateTenantMemberRequest,
  PatchTenantMemberRequest,
  MemberFilterParams,
} from "@/types/member";
import type { AppApiError } from "@/lib/axios";

export function useMembers(
  tenantSlug?: string,
  filterParams?: MemberFilterParams,
  config?: SWRConfiguration<TenantMemberResponse[], AppApiError>
) {
  const role = filterParams?.role || "";
  const search = filterParams?.search || "";
  const key = [ROUTES.API.MEMBERS.ROOT, tenantSlug ?? "default", role, search];

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TenantMemberResponse[],
    AppApiError
  >(
    key,
    () =>
      memberService.getMembers({
        role: role ? role : undefined,
        search: search ? search : undefined,
      }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      ...config,
    }
  );

  const createMember = async (payload: CreateTenantMemberRequest) => {
    const newMember = await memberService.createMember(payload);
    await mutate();
    return newMember;
  };

  const patchMember = async (
    memberId: string,
    payload: PatchTenantMemberRequest
  ) => {
    const updated = await memberService.patchMember(memberId, payload);
    await mutate(
      (current) =>
        current?.map((m) => (m.memberId === memberId ? updated : m)) ?? [],
      { revalidate: false }
    );
    return updated;
  };

  return {
    members: data ?? [],
    totalMembers: data?.length ?? 0,
    isLoading,
    isValidating,
    isError: Boolean(error),
    error,
    mutate,
    createMember,
    patchMember,
  };
}

