import { test, expect } from '../../fixtures';

test.describe('API - Brands Management (@api @brands)', () => {
  /**
   * API 3: Get All Brands List
   * Method: GET
   * URL: /api/brandsList
   * Expected: HTTP 200, responseCode: 200, non-empty brands list
   */
  test('[API-03] GET /api/brandsList - Get All Brands List', async ({ brandsApi }) => {
    const res = await brandsApi.getAllBrands();

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Code & Structure
    expect(res.body.responseCode).toBe(200);
    expect(Array.isArray(res.body.brands)).toBe(true);
    expect(res.body.brands!.length).toBeGreaterThan(0);

    // 3. Schema & Key Fields Verification
    const firstBrand = res.body.brands![0];
    expect(firstBrand).toHaveProperty('id');
    expect(firstBrand).toHaveProperty('brand');
    expect(typeof firstBrand.id).toBe('number');
    expect(typeof firstBrand.brand).toBe('string');
  });

  /**
   * API 4: PUT To All Brands List
   * Method: PUT
   * URL: /api/brandsList
   * Expected: responseCode: 405, message: "This request method is not supported."
   */
  test('[API-04] PUT /api/brandsList - PUT to All Brands List (Unsupported Method)', async ({
    brandsApi,
  }) => {
    const res = await brandsApi.putAllBrands();

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Code & Error Message
    expect(res.body.responseCode).toBe(405);
    expect(res.body.message).toBe('This request method is not supported.');
  });
});
