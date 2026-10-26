import { Locator, Page } from '@playwright/test';

export class CartModalComponent {
  readonly root: Locator;
  readonly addedTitle: Locator;
  readonly viewCartLink: Locator;
  readonly continueShoppingButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator("//div[@id='cartModal']");
    this.addedTitle = page.locator("//div[@id='cartModal']//h4[contains(text(), 'Added!')]");
    this.viewCartLink = page.locator("//div[@id='cartModal']//a[@href='/view_cart']");
    this.continueShoppingButton = page.locator(
      "//div[@id='cartModal']//button[contains(@class, 'close-modal')]",
    );
  }

  async waitForVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async waitForHidden(): Promise<void> {
    await this.root.waitFor({ state: 'hidden' });
  }

  async viewCart(): Promise<void> {
    await this.viewCartLink.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await this.waitForHidden();
  }
}
