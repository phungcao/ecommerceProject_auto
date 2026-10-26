import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';
import { CartModalComponent } from './components/cart-modal.component';

export class ProductDetailPage extends BasePage {
  readonly path = '/product_details';
  readonly urlPattern = /.*product_details\/\d+/;
  private currentProductId?: number | string;

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly cartModalComponent: CartModalComponent;

  readonly productInformationContainer: Locator;
  readonly productName: Locator;
  readonly productCategory: Locator;
  readonly productPrice: Locator;
  readonly productAvailability: Locator;
  readonly productCondition: Locator;
  readonly productBrand: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;

  // Modal compatibility getters
  get cartModal(): Locator {
    return this.cartModalComponent.root;
  }
  get modalViewCartLink(): Locator {
    return this.cartModalComponent.viewCartLink;
  }
  get modalContinueShoppingButton(): Locator {
    return this.cartModalComponent.continueShoppingButton;
  }

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
    this.cartModalComponent = new CartModalComponent(page);

    this.productInformationContainer = page.locator(
      "//div[contains(@class, 'product-information')]",
    );
    this.productName = this.productInformationContainer.locator('//h2');
    this.productCategory = this.productInformationContainer.locator(
      "//p[contains(text(), 'Category:')]",
    );
    this.productPrice = this.productInformationContainer.locator("//span[contains(text(), 'Rs.')]");
    this.productAvailability = this.productInformationContainer.locator(
      "//p[contains(., 'Availability:')]",
    );
    this.productCondition = this.productInformationContainer.locator(
      "//p[contains(., 'Condition:')]",
    );
    this.productBrand = this.productInformationContainer.locator("//p[contains(., 'Brand:')]");
    this.quantityInput = this.productInformationContainer.locator("//input[@id='quantity']");
    this.addToCartButton = this.productInformationContainer.locator(
      "//button[contains(@class, 'cart')]",
    );
  }

  // ===== Actions =====
  /**
   * Điều hướng trực tiếp đến trang chi tiết sản phẩm theo ID động
   * @param productId ID của sản phẩm (mặc định: 1 nếu không truyền)
   */
  override async goto(productId: number | string = 1): Promise<void> {
    this.currentProductId = productId;
    await super.goto(`${this.path}/${productId}`);
  }

  /**
   * Lấy đường dẫn URL tương đối theo ID sản phẩm
   * @param productId ID của sản phẩm (nếu không truyền sẽ dùng ID đã set hoặc mặc định 1)
   */
  getProductPath(productId?: number | string): string {
    const id = productId ?? this.currentProductId ?? 1;
    return `${this.path}/${id}`;
  }

  async setQuantity(qty: number | string): Promise<void> {
    await this.quantityInput.fill(String(qty));
  }

  async addToCart(): Promise<void> {
    await this.waitForJQueryEvent('button.cart', 'click');
    await this.addToCartButton.click();
    await this.cartModalComponent.waitForVisible();
  }

  async viewCartFromModal(): Promise<void> {
    await this.cartModalComponent.viewCart();
  }

  async continueShoppingFromModal(): Promise<void> {
    await this.cartModalComponent.continueShopping();
  }
}
