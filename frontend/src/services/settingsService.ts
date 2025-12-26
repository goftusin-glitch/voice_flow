import { apiClient } from './api';
import { User } from '../types/user';

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class SettingsService {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>(
      '/settings/profile'
    );
    return response.data.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<{ success: boolean; data: User }>(
      '/settings/profile',
      data
    );
    return response.data.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/settings/change-password', data);
  }
}

export const settingsService = new SettingsService();
