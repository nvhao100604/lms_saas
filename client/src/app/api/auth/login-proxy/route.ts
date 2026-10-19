import { NextRequest, NextResponse } from "next/server";
import { bffClient, handleBffError } from "@/lib/bff-client";
import type { LoginRequest, AuthApiResponse, LoginResponse } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const response = await bffClient.post<AuthApiResponse<LoginResponse>>(
      "/api/auth/login",
      body
    );
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    return handleBffError(error);
  }
}
