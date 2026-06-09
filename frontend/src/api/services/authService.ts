// ============================================================
// DevTrace — Authentication API Service
// ============================================================

import { axiosClient } from "../client/axiosClient";

export interface UserResponse {
  authenticated: boolean;
  username: string | null;
  avatarUrl: string | null;
  name: string | null;
}

export interface GithubRepo {
  name: string;
  owner: string;
  private: boolean;
  cloneUrl: string;
  updatedAt?: string;
  language?: string;
}

export const authService = {
  /**
   * Fetch current authenticated user state.
   */
  async getMe(): Promise<UserResponse> {
    const response = await axiosClient.get<UserResponse>("/api/auth/me");
    return response.data;
  },

  /**
   * Log out the current user session.
   */
  async logout(): Promise<void> {
    await axiosClient.post("/api/auth/logout");
  },

  /**
   * Fetch OAuth accessible repositories for the user.
   */
  async getRepositories(): Promise<GithubRepo[]> {
    const response = await axiosClient.get<GithubRepo[]>("/api/github/repositories");
    return response.data;
  },
};
export default authService;
