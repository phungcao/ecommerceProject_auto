/**
 * DTOs & Interfaces for Automation Exercise API
 * Compliant with .agent/rules/api_rules.md
 */

export interface BaseApiResponse {
  responseCode: number;
  message?: string;
}

export interface ProductCategory {
  usertype: {
    usertype: string;
  };
  category: string;
}

export interface ProductItem {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: ProductCategory;
}

export interface ProductsListResponse extends BaseApiResponse {
  products?: ProductItem[];
}

export interface BrandItem {
  id: number;
  brand: string;
}

export interface BrandsListResponse extends BaseApiResponse {
  brands?: BrandItem[];
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  title?: string;
  birth_day?: string;
  birth_month?: string;
  birth_year?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  country?: string;
  state?: string;
  city?: string;
  zipcode?: string;
}

export interface UserDetailResponse extends BaseApiResponse {
  user?: UserDetail;
}

/**
 * 11 Mandatory fields required to create an account
 * Unified across API (/api/createAccount) and UI (/login + /signup)
 */
export interface MandatoryAccountFields {
  name: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address1: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
}

/**
 * Optional fields for account creation
 */
export interface OptionalAccountFields {
  title?: 'Mr' | 'Mrs' | 'Miss';
  day?: string;
  month?: string;
  year?: string;
  company?: string;
  address2?: string;
  newsletter?: boolean;
  specialOffers?: boolean;
}

/**
 * Unified User Account model combining mandatory and optional attributes
 */
export interface UserAccount extends MandatoryAccountFields, OptionalAccountFields {}

export type MandatoryAccountFieldKey = keyof MandatoryAccountFields;

export interface MandatoryFieldConfig {
  key: MandatoryAccountFieldKey;
  apiParam: string;
  uiStage: 'login' | 'signup';
  uiLocatorName: string;
  label: string;
}

/**
 * Metadata definition of the 11 mandatory fields.
 * Reused across both API and E2E test suites for negative testing.
 */
export const MANDATORY_ACCOUNT_FIELDS: readonly MandatoryFieldConfig[] = [
  { key: 'name', apiParam: 'name', uiStage: 'login', uiLocatorName: 'signupNameInput', label: 'Name' },
  { key: 'email', apiParam: 'email', uiStage: 'login', uiLocatorName: 'signupEmailInput', label: 'Email' },
  { key: 'password', apiParam: 'password', uiStage: 'signup', uiLocatorName: 'passwordInput', label: 'Password' },
  { key: 'firstName', apiParam: 'firstname', uiStage: 'signup', uiLocatorName: 'firstNameInput', label: 'First Name' },
  { key: 'lastName', apiParam: 'lastname', uiStage: 'signup', uiLocatorName: 'lastNameInput', label: 'Last Name' },
  { key: 'address1', apiParam: 'address1', uiStage: 'signup', uiLocatorName: 'address1Input', label: 'Address' },
  { key: 'country', apiParam: 'country', uiStage: 'signup', uiLocatorName: 'countrySelect', label: 'Country' },
  { key: 'state', apiParam: 'state', uiStage: 'signup', uiLocatorName: 'stateInput', label: 'State' },
  { key: 'city', apiParam: 'city', uiStage: 'signup', uiLocatorName: 'cityInput', label: 'City' },
  { key: 'zipcode', apiParam: 'zipcode', uiStage: 'signup', uiLocatorName: 'zipcodeInput', label: 'Zipcode' },
  { key: 'mobileNumber', apiParam: 'mobile_number', uiStage: 'signup', uiLocatorName: 'mobileNumberInput', label: 'Mobile Number' },
] as const;

export interface CreateAccountPayload {
  name: string;
  email: string;
  password: string;
  title?: 'Mr' | 'Mrs' | 'Miss';
  birth_date?: string;
  birth_month?: string;
  birth_year?: string;
  firstname: string;
  lastname: string;
  company?: string;
  address1: string;
  address2?: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobile_number: string;
}

export interface VerifyLoginPayload {
  email?: string;
  password?: string;
}

export interface DeleteAccountPayload {
  email?: string;
  password?: string;
}

export interface ApiResponseWrapper<T> {
  httpStatus: number;
  headers: Record<string, string>;
  durationMs: number;
  body: T;
}
