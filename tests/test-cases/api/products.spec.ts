import { test, expect } from '../../fixtures';
import { ApiDataHelper } from '../../api/utils/api-data.helper';

test.describe('API - Products Management (@api @products)', () => {
  /**
   * API 1: Get All Products List
   * Method: GET
   * URL: /api/productsList
   * Expected: HTTP 200, responseCode: 200, non-empty products list
   */
  test('[API-01] GET /api/productsList - Get All Products List', async ({ productsApi }) => {
    const res = await productsApi.getAllProducts();

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Code & Structure
    expect(res.body.responseCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products!.length).toBeGreaterThan(0);

    // 3. Schema & Key Fields Verification
    const firstProduct = res.body.products![0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('brand');
    expect(firstProduct).toHaveProperty('category');
    expect(typeof firstProduct.id).toBe('number');
    expect(typeof firstProduct.name).toBe('string');
  });

  /**
   * API 2: POST To All Products List
   * Method: POST
   * URL: /api/productsList
   * Expected: responseCode: 405, message: "This request method is not supported."
   */
  test('[API-02] POST /api/productsList - POST to All Products List (Unsupported Method)', async ({
    productsApi,
  }) => {
    const res = await productsApi.postAllProducts();

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Body Check
    expect(res.body.responseCode).toBe(405);
    expect(res.body.message).toBe('This request method is not supported.');
  });

  /**
   * API 5: POST To Search Product
   * Method: POST
   * URL: /api/searchProduct
   * Form param: search_product
   * Expected: responseCode: 200, searched products list
   */
  test('[API-05] POST /api/searchProduct - Search product with valid search term', async ({
    productsApi,
  }) => {
    const searchTerm = ApiDataHelper.getRandomSearchTerm();
    const res = await productsApi.searchProduct(searchTerm);

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Code & Array validation
    expect(res.body.responseCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products!.length).toBeGreaterThan(0);

    // 3. Verify results match search term
    const hasMatchingProduct = res.body.products!.some((p) =>
      p.name.toLowerCase().includes(searchTerm),
    );
    expect(hasMatchingProduct).toBe(true);
  });

  /**
   * API 6: POST To Search Product without search_product parameter
   * Method: POST
   * URL: /api/searchProduct
   * Expected: responseCode: 400, message: "Bad request, search_product parameter is missing in POST request."
   */
  test('[API-06] POST /api/searchProduct - Search product without parameter (Negative)', async ({
    productsApi,
  }) => {
    const res = await productsApi.searchProduct();

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Code & Error Detail
    expect(res.body.responseCode).toBe(400);
    expect(res.body.message).toBe(
      'Bad request, search_product parameter is missing in POST request.',
    );
  });
});
