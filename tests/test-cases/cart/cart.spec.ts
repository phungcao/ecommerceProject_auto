import { test, expect } from '../../fixtures';

/**
 * Tiện ích chuyển đổi chuỗi giá tiền dạng "Rs. 500" sang số nguyên (500)
 */
function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
}

/**
 * Tiện ích định dạng số nguyên sang chuỗi giá tiền dạng "Rs. 500"
 */
function formatPrice(amount: number): string {
  return `Rs. ${amount}`;
}

test.describe('Cart Feature (TC-11, TC-12, TC-13, TC-17)', () => {
  test('[TC-11] Xác nhận tính năng Subscription tại trang Cart (Verify Subscription in Cart page)', async ({
    homePage,
    cartPage,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4. Bấm 'Cart'
    await homePage.header.navigateToCart();

    // 5-6. Cuộn xuống footer và xác nhận tiêu đề 'SUBSCRIPTION'
    await cartPage.footer.subscriptionHeading.scrollIntoViewIfNeeded();
    await expect(cartPage.footer.subscriptionHeading).toBeVisible();

    // 7-8. Nhập email và xác nhận thông báo thành công
    const dynamicEmail = `cart_sub_${Date.now()}@testdomain.com`;
    await cartPage.footer.subscribe(dynamicEmail);
    await expect(cartPage.footer.subscriptionSuccessMsg).toBeVisible();
    await expect(cartPage.footer.subscriptionSuccessMsg).toContainText(
      'You have been successfully subscribed!',
    );
  });

  test('[TC-12] Thêm nhiều sản phẩm vào giỏ hàng và kiểm tra thông tin chi tiết (Add Products in Cart)', async ({
    homePage,
    productsPage,
    cartPage,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4. Bấm 'Products'
    await homePage.header.navigateToProducts();
    await expect(productsPage.allProductsTitle).toBeVisible();

    // 5-6. Lấy thông tin sản phẩm thứ nhất, thêm vào giỏ 2 lần (số lượng = 2)
    const name0 = await productsPage.getProductName(0);
    const price0 = await productsPage.getProductPrice(0);
    await productsPage.hoverProduct(0);
    await productsPage.addProductToCartByIndex(0);
    await productsPage.continueShoppingFromModal();
    await productsPage.hoverProduct(0);
    await productsPage.addProductToCartByIndex(0);
    await productsPage.continueShoppingFromModal();

    // 7-8. Lấy thông tin sản phẩm thứ hai, thêm vào giỏ 1 lần (số lượng = 1)
    const name1 = await productsPage.getProductName(1);
    const price1 = await productsPage.getProductPrice(1);
    await productsPage.hoverProduct(1);
    await productsPage.addProductToCartByIndex(1);
    await productsPage.continueShoppingFromModal();

    // 9-10. Lấy thông tin sản phẩm thứ ba, thêm vào giỏ 1 lần và bấm 'View Cart'
    const name2 = await productsPage.getProductName(2);
    const price2 = await productsPage.getProductPrice(2);
    await productsPage.hoverProduct(2);
    await productsPage.addProductToCartByIndex(2);
    await productsPage.viewCartFromModal();

    // Danh sách kỳ vọng hiển thị trên Cart
    const expectedCartItems = [
      { name: name0, price: price0, quantity: 2, totalPrice: formatPrice(parsePrice(price0) * 2) },
      { name: name1, price: price1, quantity: 1, totalPrice: formatPrice(parsePrice(price1) * 1) },
      { name: name2, price: price2, quantity: 1, totalPrice: formatPrice(parsePrice(price2) * 1) },
    ];

    // 11. Xác nhận giỏ hàng hiển thị đúng 3 dòng sản phẩm
    await expect(cartPage.cartBreadcrumb).toBeVisible();
    await expect(cartPage.cartItemRows).toHaveCount(expectedCartItems.length);

    // 12. Xác nhận chi tiết từng dòng: đúng sản phẩm (tên), đúng đơn giá, đúng số lượng và thành tiền
    for (let i = 0; i < expectedCartItems.length; i++) {
      const expected = expectedCartItems[i];
      const row = cartPage.cartRowByIndex(i);

      await expect(cartPage.rowName(row)).toHaveText(expected.name);
      await expect(cartPage.rowPrice(row)).toHaveText(expected.price);
      await expect(cartPage.rowQuantity(row)).toHaveText(String(expected.quantity));
      await expect(cartPage.rowTotalPrice(row)).toHaveText(expected.totalPrice);
    }
  });

  test('[TC-13] Xác nhận số lượng sản phẩm trong giỏ hàng khi tăng số lượng từ trang chi tiết (Verify Product quantity in Cart)', async ({
    homePage,
    productsPage,
    productDetailPage,
    cartPage,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4. Bấm 'View Product' của sản phẩm đầu tiên từ trang Products
    await homePage.header.navigateToProducts();
    await expect(productsPage.allProductsTitle).toBeVisible();
    await productsPage.viewProductDetailsByIndex(0);

    // 5. Xác nhận trang chi tiết sản phẩm hiển thị và lưu thông tin sản phẩm
    await expect(productDetailPage.productName).toBeVisible();
    const expectedName = (await productDetailPage.productName.innerText()).trim();
    const expectedPrice = (await productDetailPage.productPrice.innerText()).trim();
    const unitPriceNum = parsePrice(expectedPrice);

    // 6. Tăng số lượng lên 4 (nhiều hơn 1)
    const targetQuantity = 4;
    await productDetailPage.setQuantity(targetQuantity);

    // 7-8. Bấm 'Add to cart' và chuyển đến trang Cart
    await productDetailPage.addToCart();
    await productDetailPage.viewCartFromModal();

    // 9. Xác nhận sản phẩm hiển thị trong giỏ hàng với đúng tên, giá, số lượng (4) và thành tiền
    await expect(cartPage.cartBreadcrumb).toBeVisible();
    const row = cartPage.cartRowByIndex(0);

    await expect(cartPage.rowName(row)).toHaveText(expectedName);
    await expect(cartPage.rowPrice(row)).toHaveText(expectedPrice);
    await expect(cartPage.rowQuantity(row)).toHaveText(String(targetQuantity));
    await expect(cartPage.rowTotalPrice(row)).toHaveText(
      formatPrice(unitPriceNum * targetQuantity),
    );
  });

  test('[TC-17] Xóa sản phẩm khỏi giỏ hàng và kiểm tra cập nhật số lượng, tổng tiền (Remove Products From Cart)', async ({
    homePage,
    productsPage,
    cartPage,
  }) => {
    // 1-3. Đi đến trang chủ và xác nhận hiển thị
    await homePage.goto();
    await expect(homePage.sliderCarousel).toBeVisible();

    // 4. Đi đến trang Products
    await homePage.header.navigateToProducts();
    await expect(productsPage.allProductsTitle).toBeVisible();

    // Thêm sản phẩm thứ nhất (1 lần: số lượng = 1)
    const name0 = await productsPage.getProductName(0);
    const price0 = await productsPage.getProductPrice(0);
    const unitPrice0 = parsePrice(price0);
    const total0 = unitPrice0 * 1;

    await productsPage.hoverProduct(0);
    await productsPage.addProductToCartByIndex(0);
    await productsPage.continueShoppingFromModal();

    // Thêm sản phẩm thứ hai (2 lần: số lượng = 2)
    const name1 = await productsPage.getProductName(1);
    const price1 = await productsPage.getProductPrice(1);
    const unitPrice1 = parsePrice(price1);
    const total1 = unitPrice1 * 2;

    await productsPage.hoverProduct(1);
    await productsPage.addProductToCartByIndex(1);
    await productsPage.continueShoppingFromModal();
    await productsPage.hoverProduct(1);
    await productsPage.addProductToCartByIndex(1);
    await productsPage.viewCartFromModal();

    // 5. Xác nhận trạng thái ban đầu của giỏ hàng trước khi xóa
    await expect(cartPage.cartBreadcrumb).toBeVisible();
    await expect(cartPage.cartItemRows).toHaveCount(2);

    // Xác nhận tổng số lượng (1 + 2 = 3) và tổng tiền ban đầu của toàn bộ giỏ hàng
    expect(await cartPage.getTotalQuantity()).toBe(3);
    expect(await cartPage.getTotalCartPrice()).toBe(total0 + total1);

    // 6. Xóa sản phẩm thứ nhất khỏi giỏ hàng
    await cartPage.deleteFirstItem();
    await expect(cartPage.cartItemRows).toHaveCount(1);

    // 7. Xác nhận số lượng, sản phẩm và tổng tiền được CẬP NHẬT CHÍNH XÁC sau khi xóa:
    // 7.1. Sản phẩm thứ nhất (đã xóa) không còn tồn tại trong giỏ hàng
    const currentProductNames = await cartPage.getRowProductNames();
    expect(currentProductNames).not.toContain(name0);

    // 7.2. Sản phẩm còn lại (sản phẩm 2) hiển thị đúng thông tin, số lượng (2) và thành tiền
    const remainingRow = cartPage.cartRowByIndex(0);
    await expect(cartPage.rowName(remainingRow)).toHaveText(name1);
    await expect(cartPage.rowPrice(remainingRow)).toHaveText(price1);
    await expect(cartPage.rowQuantity(remainingRow)).toHaveText('2');
    await expect(cartPage.rowTotalPrice(remainingRow)).toHaveText(formatPrice(total1));

    // 7.3. Tổng số lượng toàn giỏ hàng cập nhật chính xác (từ 3 giảm xuống 2)
    expect(await cartPage.getTotalQuantity()).toBe(2);

    // 7.4. Tổng tiền toàn giỏ hàng cập nhật chính xác (giảm đúng bằng giá trị sản phẩm 1 đã xóa)
    expect(await cartPage.getTotalCartPrice()).toBe(total1);

    // 8. Xóa nốt sản phẩm còn lại và xác nhận giỏ hàng cập nhật về 0 và rỗng
    await cartPage.deleteFirstItem();
    await expect(cartPage.cartItemRows).toHaveCount(0);
    await expect(cartPage.emptyCartSpan).toBeVisible({ timeout: 10000 });

    // Xác nhận số lượng và tổng tiền cập nhật về 0
    expect(await cartPage.getTotalQuantity()).toBe(0);
    expect(await cartPage.getTotalCartPrice()).toBe(0);
  });
});
