import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';

export class ContactUsPage extends BasePage {
  readonly path = '/contact_us';

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly getInTouchHeading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectInput: Locator;
  readonly messageTextarea: Locator;
  readonly uploadFileInput: Locator;
  readonly submitButton: Locator;
  readonly successAlert: Locator;
  readonly homeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.getInTouchHeading = page.locator(
      "//h2[contains(@class, 'title') and contains(text(), 'Get In Touch')]",
    );
    this.nameInput = page.locator("//input[@data-qa='name']");
    this.emailInput = page.locator("//input[@data-qa='email']");
    this.subjectInput = page.locator("//input[@data-qa='subject']");
    this.messageTextarea = page.locator("//textarea[@data-qa='message']");
    this.uploadFileInput = page.locator("//input[@name='upload_file']");
    this.submitButton = page.locator("//input[@data-qa='submit-button']");
    this.successAlert = page.locator(
      "//div[@id='contact-page']//div[contains(@class, 'status') and contains(@class, 'alert-success')]",
    );
    this.homeButton = page.locator("//div[@id='contact-page']//a[contains(@class, 'btn-success')]");
  }

  // ===== Actions =====
  async submitContactForm(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    filePath?: string;
  }): Promise<void> {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.subjectInput.fill(data.subject);
    await this.messageTextarea.fill(data.message);

    if (data.filePath) {
      await this.uploadFileInput.setInputFiles(data.filePath);
    }

    await this.waitForJQueryEvent('#contact-us-form', 'submit');

    this.page.once('dialog', (dialog) => {
      dialog.accept().catch(() => {});
    });

    await this.submitButton.click();
  }

  async clickHome(): Promise<void> {
    await this.homeButton.click();
  }
}
