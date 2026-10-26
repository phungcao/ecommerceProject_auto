import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';
import { UserAccount } from '../api/models/api.types';

/**
 * AccountDetails = UserAccount với name và email là optional
 * (vì 2 trường này đã được điền ở bước signup trước đó trên /login)
 */
export type AccountDetails = Partial<Pick<UserAccount, 'name' | 'email'>> &
  Omit<UserAccount, 'name' | 'email'>;

export class SignupPage extends BasePage {
  readonly path = '/signup';

  // ===== Locators =====
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;

  readonly enterAccountInfoHeading: Locator;
  readonly titleMrRadio: Locator;
  readonly titleMrsRadio: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly daysSelect: Locator;
  readonly monthsSelect: Locator;
  readonly yearsSelect: Locator;
  readonly newsletterCheckbox: Locator;
  readonly specialOffersCheckbox: Locator;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly companyInput: Locator;
  readonly address1Input: Locator;
  readonly address2Input: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly createAccountButton: Locator;

  readonly accountCreatedHeading: Locator;
  readonly accountDeletedHeading: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);

    this.enterAccountInfoHeading = page.locator(
      "//h2[contains(., 'Enter Account Information') or contains(., 'ENTER ACCOUNT INFORMATION')]",
    );
    this.titleMrRadio = page.locator("//input[@id='id_gender1']");
    this.titleMrsRadio = page.locator("//input[@id='id_gender2']");
    this.nameInput = page.locator("//input[@id='name']");
    this.emailInput = page.locator("//input[@id='email']");
    this.passwordInput = page.locator("//input[@id='password']");
    this.daysSelect = page.locator("//select[@id='days']");
    this.monthsSelect = page.locator("//select[@id='months']");
    this.yearsSelect = page.locator("//select[@id='years']");
    this.newsletterCheckbox = page.locator("//input[@id='newsletter']");
    this.specialOffersCheckbox = page.locator("//input[@id='optin']");

    this.firstNameInput = page.locator("//input[@id='first_name']");
    this.lastNameInput = page.locator("//input[@id='last_name']");
    this.companyInput = page.locator("//input[@id='company']");
    this.address1Input = page.locator("//input[@id='address1']");
    this.address2Input = page.locator("//input[@id='address2']");
    this.countrySelect = page.locator("//select[@id='country']");
    this.stateInput = page.locator("//input[@id='state']");
    this.cityInput = page.locator("//input[@id='city']");
    this.zipcodeInput = page.locator("//input[@id='zipcode']");
    this.mobileNumberInput = page.locator("//input[@id='mobile_number']");
    this.createAccountButton = page.locator("//button[@data-qa='create-account']");

    this.accountCreatedHeading = page.locator("//h2[@data-qa='account-created']");
    this.accountDeletedHeading = page.locator("//h2[@data-qa='account-deleted']");
    this.continueButton = page.locator("//a[@data-qa='continue-button']");
  }

  // ===== Actions =====
  async fillAccountDetails(details: Partial<AccountDetails>): Promise<void> {
    await this.enterAccountInfoHeading.waitFor({ state: 'visible' });

    if (details.title) {
      if (details.title === 'Mrs') {
        await this.titleMrsRadio.check();
      } else {
        await this.titleMrRadio.check();
      }
    }

    if (details.name !== undefined) {
      const currentVal = await this.nameInput.inputValue();
      if (details.name === '' || !currentVal) {
        await this.nameInput.fill(details.name);
      }
    }

    if (details.password !== undefined) {
      await this.passwordInput.fill(details.password);
    }

    if (details.day) {
      await this.daysSelect.selectOption(details.day);
    }
    if (details.month) {
      await this.monthsSelect.selectOption(details.month);
    }
    if (details.year) {
      await this.yearsSelect.selectOption(details.year);
    }

    if (details.newsletter) {
      await this.newsletterCheckbox.check();
    }
    if (details.specialOffers) {
      await this.specialOffersCheckbox.check();
    }

    if (details.firstName !== undefined) {
      await this.firstNameInput.fill(details.firstName);
    }
    if (details.lastName !== undefined) {
      await this.lastNameInput.fill(details.lastName);
    }
    if (details.company !== undefined) {
      await this.companyInput.fill(details.company);
    }
    if (details.address1 !== undefined) {
      await this.address1Input.fill(details.address1);
    }
    if (details.address2 !== undefined) {
      await this.address2Input.fill(details.address2);
    }
    if (details.country !== undefined) {
      if (details.country) {
        await this.countrySelect.selectOption(details.country);
      } else {
        await this.countrySelect.evaluate((el: HTMLSelectElement) => {
          el.selectedIndex = -1;
        });
      }
    }
    if (details.state !== undefined) {
      await this.stateInput.fill(details.state);
    }
    if (details.city !== undefined) {
      await this.cityInput.fill(details.city);
    }
    if (details.zipcode !== undefined) {
      await this.zipcodeInput.fill(details.zipcode);
    }
    if (details.mobileNumber !== undefined) {
      await this.mobileNumberInput.fill(details.mobileNumber);
    }
  }

  getFieldLocator(fieldName: string): Locator {
    const map: Record<string, Locator> = {
      name: this.nameInput,
      email: this.emailInput,
      password: this.passwordInput,
      firstName: this.firstNameInput,
      lastName: this.lastNameInput,
      address1: this.address1Input,
      country: this.countrySelect,
      state: this.stateInput,
      city: this.cityInput,
      zipcode: this.zipcodeInput,
      mobileNumber: this.mobileNumberInput,
    };
    return map[fieldName] ?? this.page.locator(`//input[@id='${fieldName}']`);
  }

  async submitAccountCreation(): Promise<void> {
    await this.createAccountButton.click();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }
}
