import { apiClient } from './api';
import { AuthResponse, User } from '../types/user';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      { email, password }
    );

    const { access_token, refresh_token } = response.data.data;
    this.setTokens(access_token, refresh_token);

    return response.data.data;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    invitationToken?: string
  ): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        invitation_token: invitationToken,
      }
    );

    const { access_token, refresh_token } = response.data.data;
    this.setTokens(access_token, refresh_token);

    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getTokens()?.refresh_token;

    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearTokens();
  }

  async refreshToken(): Promise<void> {
    const refreshToken = this.getTokens()?.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{
      success: boolean;
      data: { access_token: string; refresh_token: string };
    }>('/auth/refresh', { refresh_token: refreshToken });

    const { access_token, refresh_token: newRefreshToken } = response.data.data;
    this.setTokens(access_token, newRefreshToken);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  getTokens(): { access_token: string; refresh_token: string } | null {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return this.getTokens() !== null;
  }
}

export const authService = new AuthService();
