import { Locator, Page } from '@playwright/test';
import { handleHeavyLoad } from '../base.page';

export class HeaderComponent {
  // ===== Locators =====
  readonly root: Locator;
  readonly logo: Locator;
  readonly navHome: Locator;
  readonly navProducts: Locator;
  readonly navCart: Locator;
  readonly navLogin: Locator;
  readonly navContactUs: Locator;
  readonly navTestCases: Locator;
  readonly navLogout: Locator;
  readonly navDeleteAccount: Locator;
  readonly loggedInUser: Locator;

  constructor(protected readonly page: Page) {
    this.root = page.locator("//header[@id='header']");
    this.logo = this.root.locator("//div[contains(@class, 'logo')]//img");
    this.navHome = this.root.locator("//ul[contains(@class, 'navbar-nav')]//a[@href='/']");
    this.navProducts = this.root.locator(
      "//ul[contains(@class, 'navbar-nav')]//a[@href='/products']",
    );
    this.navCart = this.root.locator("//ul[contains(@class, 'navbar-nav')]//a[@href='/view_cart']");
    this.navLogin = this.root.locator("//ul[contains(@class, 'navbar-nav')]//a[@href='/login']");
    this.navContactUs = this.root.locator(
      "//ul[contains(@class, 'navbar-nav')]//a[@href='/contact_us']",
    );
    this.navTestCases = this.root.locator(
      "//ul[contains(@class, 'navbar-nav')]//a[@href='/test_cases']",
    );
    this.navLogout = this.root.locator("//ul[contains(@class, 'navbar-nav')]//a[@href='/logout']");
    this.navDeleteAccount = this.root.locator(
      "//ul[contains(@class, 'navbar-nav')]//a[@href='/delete_account']",
    );
    this.loggedInUser = this.root.locator(
      "//ul[contains(@class, 'navbar-nav')]//li[contains(., 'Logged in as')]",
    );
  }

  // ===== Actions =====
  async navigateToHome(): Promise<void> {
    await this.navHome.click();
  }

  async navigateToProducts(): Promise<void> {
    await this.navProducts.click();
  }

  async navigateToCart(): Promise<void> {
    await this.navCart.click();
  }

  async navigateToLogin(): Promise<void> {
    await this.navLogin.click();
    await handleHeavyLoad(this.page);
  }

  async navigateToContactUs(): Promise<void> {
    await this.navContactUs.click();
  }

  async logout(): Promise<void> {
    await this.navLogout.click();
    try {
      await this.page.waitForURL(/.*login/, { timeout: 7000 });
    } catch {
      await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
    }
  }

  async deleteAccount(): Promise<void> {
    await this.navDeleteAccount.click();
    await handleHeavyLoad(this.page);
  }
}
