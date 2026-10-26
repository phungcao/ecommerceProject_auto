import userData from '../data/user.data.json';
import { AccountDetails } from '../../pages/signup.page';
import {
  CreateAccountPayload,
  MandatoryAccountFields,
  MandatoryAccountFieldKey,
  MandatoryFieldConfig,
  MANDATORY_ACCOUNT_FIELDS,
  UserAccount,
} from '../../api/models/api.types';

export {
  MandatoryAccountFields,
  MandatoryAccountFieldKey,
  MandatoryFieldConfig,
  MANDATORY_ACCOUNT_FIELDS,
  UserAccount,
};

export const USER_TITLES = userData.titles as readonly ('Mr' | 'Mrs')[];
export const USER_COUNTRIES = userData.countries as readonly string[];
export const USER_DAYS = userData.day as readonly string[];
export const USER_MONTHS = userData.month as readonly string[];
export const USER_MONTH_NAMES = userData.monthNames as readonly string[];
export const USER_YEARS = userData.year as readonly string[];
export const USER_FIRST_NAMES = userData.firstNames as readonly string[];
export const USER_LAST_NAMES = userData.lastNames as readonly string[];
export const USER_LOCATIONS = userData.locationsByCountry as Record<
  string,
  { state: string; city: string; zipcode: string }[]
>;
export const USER_SEARCH_TERMS = userData.searchTerms as readonly string[];

/**
 * Chọn ngẫu nhiên 1 phần tử trong mảng
 */
export function getRandomItem<T>(items: readonly T[] | T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Chọn ngẫu nhiên danh xưng ('Mr' hoặc 'Mrs')
 */
export function getRandomTitle(): 'Mr' | 'Mrs' {
  return getRandomItem(USER_TITLES);
}

/**
 * Chọn ngẫu nhiên quốc gia từ danh sách dropdown / API
 */
export function getRandomCountry(): string {
  return getRandomItem(USER_COUNTRIES);
}

/**
 * Kiểm tra một năm có phải là năm nhuận (Leap Year) hay không
 * - Chia hết cho 4 và không chia hết cho 100
 * - HOẶC chia hết cho 400
 */
export function isLeapYear(year: number | string): boolean {
  const y = Number(year);
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Lấy số ngày tối đa chính xác của một tháng cụ thể trong năm:
 * - Tháng 2 năm thường: 28 ngày
 * - Tháng 2 năm nhuận (ví dụ: 2020, 2016, 2000): 29 ngày
 * - Tháng 4, 6, 9, 11: 30 ngày
 * - Tháng 1, 3, 5, 7, 8, 10, 12: 31 ngày
 * @param month Tháng (1-12)
 * @param year Năm (ví dụ: 2020, 2021)
 */
export function getDaysInMonth(month: number | string, year: number | string): number {
  const m = Number(month);
  const y = Number(year);
  return new Date(y, m, 0).getDate();
}

/**
 * Lấy danh sách các ngày hợp lệ trong dropdown theo tháng và năm cụ thể
 * @param month Tháng (1-12)
 * @param year Năm (mặc định lấy 2021 nếu không truyền)
 */
export function getValidDaysForMonth(
  month: number | string,
  year: number | string = '2021',
): string[] {
  const maxDays = getDaysInMonth(month, year);
  return USER_DAYS.slice(0, maxDays);
}

/**
 * Tạo ngày sinh ngẫu nhiên chuẩn xác 100%:
 * - Kiểm tra chính xác năm nhuận cho Tháng 2 (28 vs 29 ngày)
 * - Kiểm tra chính xác các tháng 30 ngày (4, 6, 9, 11) và 31 ngày (1, 3, 5, 7, 8, 10, 12)
 * - Đảm bảo ngày được sinh ra luôn nằm trong khoảng hợp lệ [1, maxDays] của tháng và năm đó
 * @param specifiedMonth Tháng muốn chọn (ví dụ: '2', '4'...)
 * @param specifiedYear Năm muốn chọn (ví dụ: '2020', '2021'...)
 */
export function getRandomDateOfBirth(
  specifiedMonth?: string,
  specifiedYear?: string,
): { day: string; month: string; year: string } {
  const year = specifiedYear ?? getRandomItem(USER_YEARS);
  const month = specifiedMonth ?? getRandomItem(USER_MONTHS);
  const validDays = getValidDaysForMonth(month, year);
  const day = getRandomItem(validDays);

  return {
    day,
    month,
    year,
  };
}

/**
 * Lấy ngày sinh cập nhật theo thời gian hiện tại
 */
export function getCurrentDateOfBirth(customDate = new Date()): {
  day: string;
  month: string;
  year: string;
} {
  const day = String(customDate.getDate());
  const month = String(customDate.getMonth() + 1);
  const currentYear = String(customDate.getFullYear());

  const year = USER_YEARS.includes(currentYear) ? currentYear : USER_YEARS[0];

  return { day, month, year };
}

/**
 * Sinh ngẫu nhiên họ và tên thực tế kèm hậu tố duy nhất
 */
export function getRandomFullName(randomSuffix = true): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const firstName = getRandomItem(USER_FIRST_NAMES);
  const suffix = randomSuffix ? `_${Math.random().toString(16).substring(2, 6)}` : '';
  const lastName = `${getRandomItem(USER_LAST_NAMES)}${suffix}`;

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
  };
}

/**
 * Lấy ngẫu nhiên địa chỉ và thông tin vị trí tương thích với quốc gia
 */
export function getRandomLocation(countryInput?: string): {
  country: string;
  state: string;
  city: string;
  zipcode: string;
  address1: string;
  address2: string;
} {
  const country = countryInput ?? getRandomCountry();
  const locations =
    USER_LOCATIONS[country] ?? USER_LOCATIONS['United States'] ?? [];
  const loc =
    locations.length > 0
      ? getRandomItem(locations)
      : { state: 'California', city: 'San Francisco', zipcode: '94103' };

  const streetNumber = Math.floor(Math.random() * 899 + 100);
  const suiteNumber = Math.floor(Math.random() * 89 + 10);

  return {
    country,
    state: loc.state,
    city: loc.city,
    zipcode: loc.zipcode,
    address1: `${streetNumber} Automation Way`,
    address2: `Suite ${suiteNumber}`,
  };
}

/**
 * Sinh email duy nhất và traceable
 */
export function generateUniqueEmail(prefix: string = 'user'): string {
  const timestamp = Date.now();
  const randomHex = Math.random().toString(16).substring(2, 6);
  return `auto_${prefix}_${timestamp}_${randomHex}@testdomain.com`;
}

/**
 * Sinh ngẫu nhiên số điện thoại 10 chữ số (đầu 09...)
 */
export function generatePhoneNumber(): string {
  return `09${Math.floor(10000000 + Math.random() * 90000000)}`;
}

/**
 * Lấy ngẫu nhiên từ khóa tìm kiếm sản phẩm
 */
export function getRandomSearchTerm(): string {
  return getRandomItem(USER_SEARCH_TERMS);
}

/**
 * Options cho generateUserAccount:
 * - useCurrentDate: dùng ngày hiện tại làm ngày sinh
 * - overrides: ghi đè bất kỳ trường nào trong UserAccount
 */
export interface DynamicAccountOptions {
  useCurrentDate?: boolean;
  overrides?: Partial<UserAccount>;
}

/**
 * Chuyển đổi UserAccount thành CreateAccountPayload cho API
 */
export function toApiPayload(user: UserAccount): CreateAccountPayload {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    title: user.title,
    birth_date: user.day,
    birth_month: user.month,
    birth_year: user.year,
    firstname: user.firstName,
    lastname: user.lastName,
    company: user.company,
    address1: user.address1,
    address2: user.address2,
    country: user.country,
    zipcode: user.zipcode,
    state: user.state,
    city: user.city,
    mobile_number: user.mobileNumber,
  };
}

/**
 * Single Source of Truth để tạo tài khoản người dùng hoàn chỉnh.
 * Luôn đảm bảo 11 trường bắt buộc (Mandatory Fields) đều có dữ liệu hợp lệ:
 * 1. Name  2. Email  3. Password  4. First Name  5. Last Name
 * 6. Address  7. Country  8. State  9. City  10. Zipcode  11. Mobile Number
 *
 * Nhận vào DynamicAccountOptions hoặc Partial<UserAccount> làm overrides.
 */
export function generateUserAccount(
  options?: DynamicAccountOptions | Partial<UserAccount>,
): UserAccount {
  const isOptions =
    options !== undefined &&
    ('useCurrentDate' in options || 'overrides' in options);
  const opt = isOptions ? (options) : undefined;
  const overrides: Partial<UserAccount> | undefined = isOptions
    ? (opt?.overrides)
    : (options as Partial<UserAccount>);

  const dob = opt?.useCurrentDate
    ? getCurrentDateOfBirth()
    : getRandomDateOfBirth(overrides?.month, overrides?.year);

  const name = getRandomFullName();
  const location = getRandomLocation(overrides?.country);
  const randomHex = Math.random().toString(16).substring(2, 6);

  return {
    name: overrides?.name ?? name.fullName,
    email: overrides?.email ?? generateUniqueEmail('user'),
    password:
      overrides?.password ??
      process.env.TEST_USER_PASSWORD ??
      userData.newAccountTemplate.password,
    title: overrides?.title ?? getRandomTitle(),
    day: overrides?.day ?? dob.day,
    month: overrides?.month ?? dob.month,
    year: overrides?.year ?? dob.year,
    newsletter: overrides?.newsletter ?? true,
    specialOffers: overrides?.specialOffers ?? true,
    firstName: overrides?.firstName ?? name.firstName,
    lastName: overrides?.lastName ?? name.lastName,
    company: overrides?.company ?? `Company_${randomHex} Corp`,
    address1: overrides?.address1 ?? location.address1,
    address2: overrides?.address2 ?? location.address2,
    country: overrides?.country ?? location.country,
    state: overrides?.state ?? location.state,
    city: overrides?.city ?? location.city,
    zipcode: overrides?.zipcode ?? location.zipcode,
    mobileNumber: overrides?.mobileNumber ?? generatePhoneNumber(),
    ...overrides,
  };
}

/**
 * Tạo dữ liệu tài khoản hoàn chỉnh cho UI — alias của generateUserAccount.
 * UserAccount thỏa mãn AccountDetails (name/email optional theo type).
 */
export function generateDynamicAccountDetails(
  options?: DynamicAccountOptions | Partial<AccountDetails>,
): AccountDetails {
  return generateUserAccount(options);
}

/**
 * Sinh dữ liệu tài khoản người dùng cho API - Tái sử dụng generateUserAccount
 */
export function generateUserPayload(
  overrides?: Partial<UserAccount>,
): CreateAccountPayload {
  return toApiPayload(generateUserAccount(overrides));
}

/**
 * Sinh payload thiếu một trường cụ thể cho API testing
 */
export function generatePayloadMissingField(
  paramToOmit: string,
  overrides?: Partial<UserAccount>,
): Record<string, string> {
  const full = generateUserPayload(overrides);
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(full)) {
    if (key !== paramToOmit && value !== undefined) {
      record[key] = String(value);
    }
  }
  return record;
}

/**
 * Sinh UserAccount thiếu một trường bắt buộc cụ thể cho UI / E2E testing
 */
export function generateAccountMissingField(
  fieldToOmit: MandatoryAccountFieldKey,
  overrides?: Partial<UserAccount>,
): Partial<UserAccount> {
  const account = generateUserAccount(overrides);
  const copy: Partial<UserAccount> = { ...account };
  delete copy[fieldToOmit];
  return copy;
}

/**
 * Sinh dữ liệu cập nhật (Update payload) ngẫu nhiên khác với dữ liệu cũ cho API
 */
export function generateUpdatePayload(existing: CreateAccountPayload): CreateAccountPayload {
  const updateHex = Math.random().toString(16).substring(2, 6);
  const newName = getRandomFullName();
  const newLocation = getRandomLocation(existing.country);

  return {
    ...existing,
    name: newName.fullName,
    firstname: newName.firstName,
    lastname: newName.lastName,
    company: `Upgraded_${updateHex} Tech Group`,
    address1: `${Math.floor(Math.random() * 899 + 100)} Innovation Blvd`,
    city: newLocation.city,
    mobile_number: generatePhoneNumber(),
  };
}
