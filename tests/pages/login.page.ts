import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';

export class LoginPage extends BasePage {
  readonly path = '/login';

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;

  // Login
  readonly loginHeading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  // Signup
  readonly signupHeading: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  readonly signupErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.loginHeading = page.locator(
      "//div[contains(@class, 'login-form')]//h2[text()='Login to your account']",
    );
    this.emailInput = page.locator("//input[@data-qa='login-email']");
    this.passwordInput = page.locator("//input[@data-qa='login-password']");
    this.submitButton = page.locator("//button[@data-qa='login-button']");
    this.errorMessage = page.locator("//form[@action='/login']//p");

    this.signupHeading = page.locator(
      "//div[contains(@class, 'signup-form')]//h2[text()='New User Signup!']",
    );
    this.signupNameInput = page.locator("//input[@data-qa='signup-name']");
    this.signupEmailInput = page.locator("//input[@data-qa='signup-email']");
    this.signupButton = page.locator("//button[@data-qa='signup-button']");
    this.signupErrorMessage = page.locator("//form[@action='/signup']//p");
  }

  // ===== Actions =====
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async signup(name?: string, email?: string): Promise<void> {
    if (name !== undefined) {
      await this.signupNameInput.fill(name);
    }
    if (email !== undefined) {
      await this.signupEmailInput.fill(email);
    }
    await this.signupButton.click();
  }
}
