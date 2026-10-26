import { Locator, Page } from '@playwright/test';

export class FooterComponent {
  // ===== Locators =====
  readonly root: Locator;
  readonly subscriptionHeading: Locator;
  readonly subscriptionEmailInput: Locator;
  readonly subscriptionButton: Locator;
  readonly subscriptionSuccessMsg: Locator;

  constructor(page: Page) {
    this.root = page.locator("//footer[@id='footer']");
    this.subscriptionHeading = this.root.locator(
      "//div[contains(@class, 'single-widget')]//h2[text()='Subscription']",
    );
    this.subscriptionEmailInput = this.root.locator("//input[@id='susbscribe_email']");
    this.subscriptionButton = this.root.locator("//button[@id='subscribe']");
    this.subscriptionSuccessMsg = this.root.locator("//div[@id='success-subscribe']");
  }

  // ===== Actions =====
  async subscribe(email: string): Promise<void> {
    await this.subscriptionEmailInput.fill(email);
    await this.subscriptionButton.click();
  }
}
