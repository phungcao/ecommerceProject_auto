import { APIRequestContext } from '@playwright/test';
import { ApiResponseWrapper } from '../models/api.types';

export class BaseApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseUrl: string = '',
  ) {}

  protected async execute<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: {
      form?: Record<string, string | number | boolean>;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
    },
  ): Promise<ApiResponseWrapper<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.request.fetch(url, {
          method,
          form: options?.form,
          params: options?.params,
          headers: {
            Accept: 'application/json, text/html, */*',
            ...options?.headers,
          },
        });

        const durationMs = Date.now() - startTime;
        const rawText = await response.text();
        let body: T;
        let isJson = true;
        try {
          body = JSON.parse(rawText) as T;
        } catch {
          body = { rawText } as unknown as T;
          isJson = false;
        }

        // Tự động thử lại (retry) nếu server trả về lỗi 5xx hoặc trang lỗi HTML tạm thời (do server quá tải)
        const isServerGlitch =
          response.status() >= 500 ||
          (!isJson && (rawText.includes('<html') || rawText.includes('<!DOCTYPE') || rawText.trim() === ''));

        if (isServerGlitch && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          continue;
        }

        return {
          httpStatus: response.status(),
          headers: response.headers(),
          durationMs,
          body,
        };
      } catch (err) {
        if (attempt === maxAttempts) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }

    throw new Error(`Failed to execute request to ${url} after ${maxAttempts} attempts`);
  }
}
