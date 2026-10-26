import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base.client';
import {
  ApiResponseWrapper,
  BaseApiResponse,
  CreateAccountPayload,
  DeleteAccountPayload,
  UserDetailResponse,
  VerifyLoginPayload,
} from '../models/api.types';

export class UserApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, baseUrl?: string) {
    super(request, baseUrl);
  }

  /**
   * API 11: POST To Create/Register User Account
   * Accepts full CreateAccountPayload or partial/raw record for negative testing
   */
  async createAccount(
    payload: CreateAccountPayload | Record<string, unknown>,
  ): Promise<ApiResponseWrapper<BaseApiResponse>> {
    return this.execute<BaseApiResponse>('POST', '/api/createAccount', {
      form: payload as unknown as Record<string, string>,
    });
  }

  /**
   * API 7, 8, 10: POST To Verify Login
   */
  async verifyLogin(payload: VerifyLoginPayload): Promise<ApiResponseWrapper<BaseApiResponse>> {
    const form: Record<string, string> = {};
    if (payload.email !== undefined) form.email = payload.email;
    if (payload.password !== undefined) form.password = payload.password;

    return this.execute<BaseApiResponse>('POST', '/api/verifyLogin', { form });
  }

  /**
   * API 9: DELETE To Verify Login (Unsupported Method)
   */
  async deleteVerifyLogin(): Promise<ApiResponseWrapper<BaseApiResponse>> {
    return this.execute<BaseApiResponse>('DELETE', '/api/verifyLogin');
  }

  /**
   * API 13: PUT METHOD To Update User Account
   */
  async updateAccount(payload: CreateAccountPayload): Promise<ApiResponseWrapper<BaseApiResponse>> {
    return this.execute<BaseApiResponse>('PUT', '/api/updateAccount', {
      form: payload as unknown as Record<string, string>,
    });
  }

  /**
   * API 14: GET user account detail by email
   */
  async getUserDetailByEmail(email: string): Promise<ApiResponseWrapper<UserDetailResponse>> {
    return this.execute<UserDetailResponse>('GET', '/api/getUserDetailByEmail', {
      params: { email },
    });
  }

  /**
   * API 12: DELETE METHOD To Delete User Account
   */
  async deleteAccount(payload: DeleteAccountPayload): Promise<ApiResponseWrapper<BaseApiResponse>> {
    const form: Record<string, string> = {};
    if (payload.email !== undefined) form.email = payload.email;
    if (payload.password !== undefined) form.password = payload.password;

    return this.execute<BaseApiResponse>('DELETE', '/api/deleteAccount', { form });
  }
}
