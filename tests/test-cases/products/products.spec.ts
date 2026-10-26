import { test, expect } from '../../fixtures';
import { getRandomSearchKeyword, getRandomEmptySearchKeyword } from '../../test-data';

test.describe('Products Feature (TC-08, TC-09, Search Empty)', () => {
  test('[TC-08] Kiểm tra danh sách sản phẩm và trang chi tiết sản phẩm (Verify All Products and product detail page)', async ({
    homePage,
    productsPage,
    productDetailPage,
    page,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm vào 'Products' và xác nhận điều hướng đến ALL PRODUCTS
    await homePage.header.navigateToProducts();
    await expect(page).toHaveURL(/.*products/);
    await expect(productsPage.allProductsTitle).toBeVisible();

    // 6. Xác nhận danh sách sản phẩm hiển thị
    await expect(productsPage.productCards.first()).toBeVisible();
    expect(await productsPage.productCards.count()).toBeGreaterThan(0);

    // 7-8. Bấm 'View Product' của một sản phẩm ngẫu nhiên và xác nhận tới trang chi tiết
    await productsPage.viewRandomProductDetails();
    await expect(page).toHaveURL(productDetailPage.urlPattern);

    // 9. Xác nhận các thông tin chi tiết: tên, danh mục, giá, tình trạng còn hàng, điều kiện, thương hiệu
    await expect(productDetailPage.productName).toBeVisible();
    await expect(productDetailPage.productCategory).toBeVisible();
    await expect(productDetailPage.productPrice).toBeVisible();
    await expect(productDetailPage.productAvailability).toBeVisible();
    await expect(productDetailPage.productCondition).toBeVisible();
    await expect(productDetailPage.productBrand).toBeVisible();
  });

  test('[TC-09] Tìm kiếm sản phẩm (Search Product)', async ({ homePage, productsPage, page }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm vào 'Products' và xác nhận điều hướng đến ALL PRODUCTS
    await homePage.header.navigateToProducts();
    await expect(page).toHaveURL(/.*products/);
    await expect(productsPage.allProductsTitle).toBeVisible();

    // 6. Nhập tên sản phẩm cần tìm (bốc ngẫu nhiên từ searchResult) và bấm nút tìm kiếm
    const keyword = getRandomSearchKeyword();
    await productsPage.searchProduct(keyword);

    // 7. Xác nhận tiêu đề 'SEARCHED PRODUCTS' hiển thị
    await expect(productsPage.searchedProductsTitle).toBeVisible();

    // 8. Xác nhận tất cả các sản phẩm liên quan đến từ khóa tìm kiếm hiển thị
    const count = await productsPage.productCards.count();
    expect(count).toBeGreaterThan(0);

    const productNames: string[] = [];
    for (let i = 0; i < count; i++) {
      const card = productsPage.productCard(i);
      await expect(card).toBeVisible();
      const productName = await card.locator('.productinfo p').innerText();
      expect(productName.trim().length).toBeGreaterThan(0);
      productNames.push(productName.toLowerCase());
    }

    // Xác thực các sản phẩm trả về có chứa từ khóa tìm kiếm (chuẩn hóa không phân biệt hoa thường và số ít/nhiều)
    const normalizedKeyword = keyword.toLowerCase().replace(/s$/, '');
    const hasMatchingProducts = productNames.some(
      (name) => name.includes(normalizedKeyword) || name.includes(keyword.toLowerCase()),
    );
    expect(hasMatchingProducts).toBe(true);
  });

  test('[TC-SEARCH-EMPTY] Tìm kiếm sản phẩm không tồn tại (Search Product with empty result)', async ({
    homePage,
    productsPage,
    page,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4-5. Bấm vào 'Products' và xác nhận điều hướng đến ALL PRODUCTS
    await homePage.header.navigateToProducts();
    await expect(page).toHaveURL(/.*products/);
    await expect(productsPage.allProductsTitle).toBeVisible();

    // 6. Nhập từ khóa quần áo không tồn tại (bốc ngẫu nhiên từ emptySearchResult) và bấm tìm kiếm
    const emptyKeyword = getRandomEmptySearchKeyword();
    await productsPage.searchProduct(emptyKeyword);

    // 7. Xác nhận tiêu đề 'SEARCHED PRODUCTS' hiển thị
    await expect(productsPage.searchedProductsTitle).toBeVisible();

    // 8. Xác nhận không có bất kỳ sản phẩm nào hiển thị theo từ khóa tìm kiếm
    await expect(productsPage.productCards).toHaveCount(0);
  });
});
