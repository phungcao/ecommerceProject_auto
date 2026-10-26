import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base.client';
import { ApiResponseWrapper, BaseApiResponse, BrandsListResponse } from '../models/api.types';

export class BrandsApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, baseUrl?: string) {
    super(request, baseUrl);
  }

  /**
   * API 3: Get All Brands List
   */
  async getAllBrands(): Promise<ApiResponseWrapper<BrandsListResponse>> {
    return this.execute<BrandsListResponse>('GET', '/api/brandsList');
  }

  /**
   * API 4: PUT To All Brands List (Unsupported Method)
   */
  async putAllBrands(
    formPayload?: Record<string, string>,
  ): Promise<ApiResponseWrapper<BaseApiResponse>> {
    return this.execute<BaseApiResponse>('PUT', '/api/brandsList', {
      form: formPayload ?? {},
    });
  }
}
