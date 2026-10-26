import { test as base } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { ProductsPage } from '../pages/products.page';
import { CartPage } from '../pages/cart.page';
import { LoginPage } from '../pages/login.page';
import { SignupPage } from '../pages/signup.page';
import { ProductDetailPage } from '../pages/product-detail.page';
import { ContactUsPage } from '../pages/contact-us.page';
import { ProductsApiClient } from '../api/clients/products.client';
import { BrandsApiClient } from '../api/clients/brands.client';
import { UserApiClient } from '../api/clients/user.client';

type Pages = {
  homePage: HomePage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  productDetailPage: ProductDetailPage;
  contactUsPage: ContactUsPage;
};

type ApiClients = {
  productsApi: ProductsApiClient;
  brandsApi: BrandsApiClient;
  userApi: UserApiClient;
};

export const test = base.extend<Pages & ApiClients>({
  page: async ({ page }, use) => {
    await page.route(/googlesyndication|googleadservices|doubleclick|adnxs|adsystem/, (route) =>
      route.abort(),
    );
    await use(page);
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  contactUsPage: async ({ page }, use) => {
    await use(new ContactUsPage(page));
  },
  productsApi: async ({ request, baseURL }, use) => {
    await use(new ProductsApiClient(request, baseURL));
  },
  brandsApi: async ({ request, baseURL }, use) => {
    await use(new BrandsApiClient(request, baseURL));
  },
  userApi: async ({ request, baseURL }, use) => {
    await use(new UserApiClient(request, baseURL));
  },
});

export { expect } from '@playwright/test';
