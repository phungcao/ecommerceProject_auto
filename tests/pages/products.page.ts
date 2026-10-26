import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';

export class ProductsPage extends BasePage {
  readonly path = '/products';

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly allProductsTitle: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchedProductsTitle: Locator;
  readonly productCards: Locator;
  readonly firstProductAddToCartBtn: Locator;
  readonly firstProductViewDetailsLink: Locator;

  // Modal
  readonly cartModal: Locator;
  readonly modalAddedTitle: Locator;
  readonly modalViewCartLink: Locator;
  readonly modalContinueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.allProductsTitle = page.locator(
      "//h2[contains(@class, 'title') and contains(text(), 'All Products')]",
    );
    this.searchInput = page.locator("//input[@id='search_product']");
    this.searchButton = page.locator("//button[@id='submit_search']");
    this.searchedProductsTitle = page.locator(
      "//h2[contains(@class, 'title') and contains(text(), 'Searched Products')]",
    );
    this.productCards = page.locator(
      "//div[contains(@class, 'features_items')]//div[contains(@class, 'col-sm-4') and .//div[contains(@class, 'productinfo')]]",
    );
    this.firstProductAddToCartBtn = page.locator(
      "(//div[contains(@class, 'productinfo')]//a[contains(@class, 'add-to-cart')])[1]",
    );
    this.firstProductViewDetailsLink = page.locator(
      "(//a[contains(@href, '/product_details/')])[1]",
    );

    this.cartModal = page.locator("//div[@id='cartModal']");
    this.modalAddedTitle = page.locator("//div[@id='cartModal']//h4[contains(text(), 'Added!')]");
    this.modalViewCartLink = page.locator("//div[@id='cartModal']//a[@href='/view_cart']");
    this.modalContinueShoppingButton = page.locator(
      "//div[@id='cartModal']//button[contains(@class, 'close-modal')]",
    );
  }

  // ===== Dynamic Locators =====
  productCard(index: number): Locator {
    return this.productCards.nth(index);
  }

  productAddToCartButton(index: number): Locator {
    return this.page
      .locator(
        "//div[contains(@class, 'features_items')]//div[contains(@class, 'productinfo')]//a[contains(@class, 'add-to-cart')]",
      )
      .nth(index);
  }

  productOverlayAddToCartButton(index: number): Locator {
    return this.page
      .locator(
        "//div[contains(@class, 'features_items')]//div[contains(@class, 'product-overlay')]//a[contains(@class, 'add-to-cart')]",
      )
      .nth(index);
  }

  productViewDetailsLink(index: number): Locator {
    return this.page.locator("//a[contains(@href, '/product_details/')]").nth(index);
  }

  // ===== Actions =====
  async searchProduct(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
    await this.page.waitForFunction(() => {
      const win = window as unknown as {
        $?: {
          _data?: (el: Element | null, key: string) => Record<string, unknown> | undefined;
        };
      };
      return Boolean(win.$?._data?.(document.getElementById('submit_search'), 'events')?.['click']);
    });
    await this.searchButton.click();
    await this.searchedProductsTitle.waitFor({ state: 'visible' });
  }

  async hoverProduct(index: number): Promise<void> {
    await this.productCards.nth(index).hover();
  }

  async getProductName(index: number): Promise<string> {
    return (await this.productCards.nth(index).locator('.productinfo p').innerText()).trim();
  }

  async getProductPrice(index: number): Promise<string> {
    return (await this.productCards.nth(index).locator('.productinfo h2').innerText()).trim();
  }

  async addProductToCartByIndex(index: number): Promise<void> {
    await this.hoverProduct(index);
    await this.productOverlayAddToCartButton(index).click();
    await this.cartModal.waitFor({ state: 'visible' });
  }

  async addProductWithInfo(index: number): Promise<{ index: number; name: string; price: string }> {
    const name = await this.getProductName(index);
    const price = await this.getProductPrice(index);
    await this.addProductToCartByIndex(index);
    return { index, name, price };
  }

  async addFirstProductToCart(): Promise<void> {
    await this.addProductToCartByIndex(0);
  }

  async viewProductDetailsByIndex(index: number): Promise<void> {
    const link = this.productViewDetailsLink(index);
    await link.scrollIntoViewIfNeeded();
    await link.click();
  }

  async viewFirstProductDetails(): Promise<void> {
    await this.viewProductDetailsByIndex(0);
  }

  async viewRandomProductDetails(): Promise<{ index: number; productId: string | null }> {
    const count = await this.productCards.count();
    if (count === 0) {
      throw new Error('No products found on the page to view details.');
    }
    const randomIndex = Math.floor(Math.random() * count);
    const link = this.productViewDetailsLink(randomIndex);
    const href = await link.getAttribute('href');
    const productId = href ? (href.split('/').pop() ?? null) : null;
    await link.scrollIntoViewIfNeeded();
    await link.click();
    return { index: randomIndex, productId };
  }

  async viewCartFromModal(): Promise<void> {
    await this.modalViewCartLink.click();
  }

  async continueShoppingFromModal(): Promise<void> {
    await this.modalContinueShoppingButton.click();
    await this.cartModal.waitFor({ state: 'hidden' });
  }
}
