import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './base.client';
import { ApiResponseWrapper, BaseApiResponse, ProductsListResponse } from '../models/api.types';

export class ProductsApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, baseUrl?: string) {
    super(request, baseUrl);
  }

  /**
   * API 1: Get All Products List
   */
  async getAllProducts(): Promise<ApiResponseWrapper<ProductsListResponse>> {
    return this.execute<ProductsListResponse>('GET', '/api/productsList');
  }

  /**
   * API 2: POST To All Products List (Unsupported Method)
   */
  async postAllProducts(
    formPayload?: Record<string, string>,
  ): Promise<ApiResponseWrapper<BaseApiResponse>> {
    return this.execute<BaseApiResponse>('POST', '/api/productsList', {
      form: formPayload ?? {},
    });
  }

  /**
   * API 5 & 6: POST To Search Product
   */
  async searchProduct(searchTerm?: string): Promise<ApiResponseWrapper<ProductsListResponse>> {
    const form = searchTerm !== undefined ? { search_product: searchTerm } : undefined;
    return this.execute<ProductsListResponse>('POST', '/api/searchProduct', {
      form,
    });
  }
}
