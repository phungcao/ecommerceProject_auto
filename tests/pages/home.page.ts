import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';

export class HomePage extends BasePage {
  readonly path = '/';

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly sliderCarousel: Locator;
  readonly featuresTitle: Locator;
  readonly categoryAccordion: Locator;
  readonly categoryWomen: Locator;
  readonly brandsSidebar: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.sliderCarousel = page.locator("//div[@id='slider-carousel']");
    this.featuresTitle = page.locator(
      "//h2[contains(@class, 'title') and contains(text(), 'Features Items')]",
    );
    this.categoryAccordion = page.locator("//div[@id='accordian']");
    this.categoryWomen = page.locator("//a[contains(@href, '#Women')]");
    this.brandsSidebar = page.locator("//div[contains(@class, 'brands_products')]");
  }

  // ===== Actions =====
  async subscribe(email: string): Promise<void> {
    await this.footer.subscribe(email);
  }
}
