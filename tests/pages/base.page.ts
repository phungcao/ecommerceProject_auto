import { Locator, Page } from '@playwright/test';

/**
 * Xử lý popup tải nặng ("This website is under heavy load") và Cloudflare Verification của automationexercise.com
 */
export async function handleHeavyLoad(page: Page): Promise<void> {
  // 1. Xử lý màn hình xác thực Cloudflare / Bot Verification nếu có
  const title = await page.title().catch(() => '');
  if (title.includes('One moment') || title.includes('Just a moment')) {
    await page
      .waitForFunction(
        () =>
          !document.title.includes('One moment') &&
          !document.title.includes('Just a moment') &&
          !document.body?.innerText?.includes('Please wait while your request is being verified'),
        { timeout: 15000 },
      )
      .catch(() => {});
  }

  // 2. Xử lý thông báo tải nặng ("This website is under heavy load")
  const isHeavyLoad = await page
    .locator("//h2[contains(., 'This website is under heavy load')]")
    .isVisible()
    .catch(() => false);
  if (isHeavyLoad) {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
}

export abstract class BasePage {
  abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async handleHeavyLoad(): Promise<void> {
    await handleHeavyLoad(this.page);
  }

  async goto(customPath?: string): Promise<void> {
    await this.page.goto(customPath ?? this.path, { waitUntil: 'domcontentloaded' });
    await this.handleHeavyLoad();
  }

  /**
   * Chờ jQuery gắn event handler lên element cụ thể (tránh click khi script jQuery chưa bind xong)
   */
  async waitForJQueryEvent(selector: string, eventName: string): Promise<void> {
    await this.page.waitForFunction(
      ({ sel, ev }) => {
        const win = window as unknown as {
          $?: {
            _data?: (el: Element | null, key: string) => Record<string, unknown> | undefined;
          };
        };
        const el = document.querySelector(sel);
        return Boolean(win.$?._data?.(el, 'events')?.[ev]);
      },
      { sel: selector, ev: eventName },
    );
  }

  /**
   * Kiểm tra trạng thái HTML5 Constraint Validation của một input/select element.
   * Dùng chung cho tất cả Page Objects (Login, Signup, Contact, v.v.)
   */
  async checkFieldValidity(locator: Locator): Promise<{
    valid: boolean;
    valueMissing: boolean;
    typeMismatch: boolean;
    validationMessage: string;
  }> {
    return locator.evaluate((el: HTMLInputElement | HTMLSelectElement) => ({
      valid: el.checkValidity(),
      valueMissing: el.validity.valueMissing,
      typeMismatch:
        'typeMismatch' in el.validity ? (el as HTMLInputElement).validity.typeMismatch : false,
      validationMessage: el.validationMessage,
    }));
  }
}
