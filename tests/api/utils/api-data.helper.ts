/**
 * API test data helpers — re-exports từ user.helper.ts và api.types.ts.
 * Đây là namespace chung cho API specs; không thêm logic mới ở đây.
 * Single source of truth nằm ở tests/test-data/helpers/user.helper.ts.
 */
export {
  generateUniqueEmail,
  generatePhoneNumber,
  getRandomSearchTerm,
  generateUserAccount,
  toApiPayload,
  generateUserPayload,
  generatePayloadMissingField,
  generateAccountMissingField,
  generateUpdatePayload,
  isLeapYear,
  getDaysInMonth,
  getValidDaysForMonth,
  getRandomDateOfBirth,
} from '../../test-data/helpers/user.helper';

export { MANDATORY_ACCOUNT_FIELDS as MANDATORY_FIELDS } from '../models/api.types';
export type { MandatoryFieldConfig, UserAccount, CreateAccountPayload } from '../models/api.types';

// ---------------------------------------------------------------------------
// ApiDataHelper: backward-compatible class wrapper.
// Giữ lại để các spec đang import ApiDataHelper.X không cần sửa.
// ---------------------------------------------------------------------------
import {
  generateUniqueEmail,
  generatePhoneNumber,
  getRandomSearchTerm,
  generateUserAccount,
  toApiPayload,
  generateUserPayload,
  generatePayloadMissingField,
  generateAccountMissingField,
  generateUpdatePayload,
  isLeapYear,
  getDaysInMonth,
  getValidDaysForMonth,
  getRandomDateOfBirth,
} from '../../test-data/helpers/user.helper';
import {
  MANDATORY_ACCOUNT_FIELDS,
  MandatoryFieldConfig,
  UserAccount,
} from '../models/api.types';
import type { MandatoryAccountFieldKey } from '../models/api.types';

export class ApiDataHelper {
  static readonly MANDATORY_FIELDS: readonly MandatoryFieldConfig[] = MANDATORY_ACCOUNT_FIELDS;

  static generateUniqueEmail = generateUniqueEmail;
  static generatePhoneNumber = generatePhoneNumber;
  static getRandomSearchTerm = getRandomSearchTerm;
  static generateUserAccount = generateUserAccount;
  static toApiPayload = toApiPayload;
  static generateUserPayload = generateUserPayload;
  static generatePayloadMissingField = generatePayloadMissingField;
  static generateAccountMissingField(
    fieldToOmit: MandatoryAccountFieldKey,
    overrides?: Partial<UserAccount>,
  ) {
    return generateAccountMissingField(fieldToOmit, overrides);
  }
  static generateUpdatePayload = generateUpdatePayload;
  static isLeapYear = isLeapYear;
  static getDaysInMonth = getDaysInMonth;
  static getValidDaysForMonth = getValidDaysForMonth;
  static getRandomDateOfBirth = getRandomDateOfBirth;
}
