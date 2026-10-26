import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';

export class CartPage extends BasePage {
  readonly path = '/view_cart';

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;
  readonly cartBreadcrumb: Locator;
  readonly cartInfoTable: Locator;
  readonly cartItemRows: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly emptyCartSpan: Locator;
  readonly firstItemDeleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.cartBreadcrumb = page.locator(
      "//ol[contains(@class, 'breadcrumb')]//li[contains(@class, 'active')]",
    );
    this.cartInfoTable = page.locator("//table[@id='cart_info_table']");
    this.cartItemRows = page.locator("//table[@id='cart_info_table']//tbody/tr");
    this.proceedToCheckoutButton = page.locator("//a[contains(@class, 'check_out')]");
    this.emptyCartSpan = page.locator("//span[@id='empty_cart']");
    this.firstItemDeleteButton = page.locator("(//a[contains(@class, 'cart_quantity_delete')])[1]");
  }

  // ===== Dynamic Locators =====
  cartRow(productId: string | number): Locator {
    return this.cartInfoTable.locator(`//tr[@id='product-${productId}']`);
  }

  cartRowByIndex(index: number): Locator {
    return this.cartItemRows.nth(index);
  }

  rowName(row: Locator): Locator {
    return row.locator('.cart_description h4 a');
  }

  rowDescription(row: Locator): Locator {
    return row.locator('.cart_description p');
  }

  rowImage(row: Locator): Locator {
    return row.locator('.cart_product img');
  }

  rowPrice(row: Locator): Locator {
    return row.locator('.cart_price p');
  }

  rowQuantity(row: Locator): Locator {
    return row.locator('.cart_quantity button');
  }

  rowTotalPrice(row: Locator): Locator {
    return row.locator('.cart_total_price');
  }

  rowDeleteButton(row: Locator): Locator {
    return row.locator('.cart_quantity_delete');
  }

  async getRowDetails(row: Locator): Promise<{
    name: string;
    price: string;
    quantity: string;
    totalPrice: string;
  }> {
    return {
      name: (await this.rowName(row).innerText()).trim(),
      price: (await this.rowPrice(row).innerText()).trim(),
      quantity: (await this.rowQuantity(row).innerText()).trim(),
      totalPrice: (await this.rowTotalPrice(row).innerText()).trim(),
    };
  }

  async getTotalCartPrice(): Promise<number> {
    const count = await this.cartItemRows.count();
    let total = 0;
    for (let i = 0; i < count; i++) {
      const text = await this.rowTotalPrice(this.cartItemRows.nth(i)).innerText();
      total += parseInt(text.replace(/[^0-9]/g, ''), 10);
    }
    return total;
  }

  async getTotalQuantity(): Promise<number> {
    const count = await this.cartItemRows.count();
    let total = 0;
    for (let i = 0; i < count; i++) {
      const text = await this.rowQuantity(this.cartItemRows.nth(i)).innerText();
      total += parseInt(text.replace(/[^0-9]/g, ''), 10);
    }
    return total;
  }

  async getRowProductNames(): Promise<string[]> {
    const count = await this.cartItemRows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push((await this.rowName(this.cartItemRows.nth(i)).innerText()).trim());
    }
    return names;
  }

  // ===== Actions =====
  async deleteFirstItem(): Promise<void> {
    await this.waitForJQueryEvent('.cart_quantity_delete', 'click');
    await this.firstItemDeleteButton.click();
  }

  async deleteItemByProductId(productId: string | number): Promise<void> {
    await this.waitForJQueryEvent(
      `a.cart_quantity_delete[data-product-id='${productId}']`,
      'click',
    );
    await this.rowDeleteButton(this.cartRow(productId)).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedToCheckoutButton.click();
  }
}
