import { test, expect } from '../../fixtures';
import { ApiDataHelper } from '../../api/utils/api-data.helper';
import { CreateAccountPayload } from '../../api/models/api.types';

test.describe('API - User Account Management (@api @user)', () => {
  let createdUser: CreateAccountPayload;

  test.afterEach(async ({ userApi }) => {
    // Ensure cleanup of any leftover user from test cases
    if (createdUser?.email) {
      try {
        await userApi.deleteAccount({
          email: createdUser.email,
          password: createdUser.password,
        });
      } catch {
        // Teardown cleanup failure should not fail the test
      }
      createdUser = null as unknown as CreateAccountPayload;
    }
  });

  /**
   * API 11: POST To Create/Register User Account
   * Method: POST
   * URL: /api/createAccount
   * Expected: responseCode: 201, message: "User created!"
   */
  test('[API-11] POST /api/createAccount - Register new user account successfully with all fields', async ({
    userApi,
  }) => {
    createdUser = ApiDataHelper.generateUserPayload();
    const res = await userApi.createAccount(createdUser);

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(10000);

    // 2. Response Verification
    expect(res.body.responseCode).toBe(201);
    expect(res.body.message).toBe('User created!');
  });

  /**
   * Positive test: Register new user account with ONLY the 11 mandatory fields
   * Verifies that all optional fields (title, dob, company, address2) can be omitted
   */
  test('[API-11-POS] POST /api/createAccount - Register with ONLY 11 mandatory fields (omitting optional fields)', async ({
    userApi,
  }) => {
    const full = ApiDataHelper.generateUserPayload();
    // Keep only the 11 mandatory fields
    const mandatoryOnly: Record<string, string> = {
      name: full.name,
      email: full.email,
      password: full.password,
      firstname: full.firstname,
      lastname: full.lastname,
      address1: full.address1,
      country: full.country,
      state: full.state,
      city: full.city,
      zipcode: full.zipcode,
      mobile_number: full.mobile_number,
    };
    createdUser = full; // For cleanup in afterEach

    const res = await userApi.createAccount(mandatoryOnly);

    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(10000);
    expect(res.body.responseCode).toBe(201);
    expect(res.body.message).toBe('User created!');
  });

  /**
   * Negative test: Register user with an existing email
   * Expected: responseCode: 400, message: "Email already exists!"
   */
  test('[API-11-NEG] POST /api/createAccount - Fail when email already exists', async ({
    userApi,
  }) => {
    // 1. Precondition: Register user
    createdUser = ApiDataHelper.generateUserPayload();
    const firstRes = await userApi.createAccount(createdUser);
    expect(firstRes.body.responseCode).toBe(201);

    // 2. Attempt duplicate registration with the same email
    const duplicatePayload = ApiDataHelper.generateUserPayload({ email: createdUser.email });
    const duplicateRes = await userApi.createAccount(duplicatePayload);

    // 3. Response Verification
    expect(duplicateRes.httpStatus).toBe(200);
    expect(duplicateRes.durationMs).toBeLessThan(10000);
    expect(duplicateRes.body.responseCode).toBe(400);
    expect(duplicateRes.body.message).toBe('Email already exists!');
  });

  /**
   * Parameterized Negative Tests: Omit each of the 11 mandatory fields
   * Reuses the unified MANDATORY_FIELDS metadata
   * Expected: responseCode: 400, message: "Bad request, {param} parameter is missing in POST request."
   */
  test.describe('POST /api/createAccount - Negative Cases: Missing Mandatory Fields', () => {
    for (const field of ApiDataHelper.MANDATORY_FIELDS) {
      test(`[API-11-NEG] Missing mandatory field: ${field.label} (${field.apiParam}) returns 400`, async ({
        userApi,
      }) => {
        const payloadMissingField = ApiDataHelper.generatePayloadMissingField(field.apiParam);
        const res = await userApi.createAccount(payloadMissingField);

        expect(res.httpStatus).toBe(200);
        expect(res.durationMs).toBeLessThan(10000);
        expect(res.body.responseCode).toBe(400);
        expect(res.body.message).toBe(
          `Bad request, ${field.apiParam} parameter is missing in POST request.`,
        );
      });
    }
  });

  /**
   * API 14: GET user account detail by email
   * Method: GET
   * URL: /api/getUserDetailByEmail
   * Expected: responseCode: 200, user detail object matching registered data
   */
  test('[API-14] GET /api/getUserDetailByEmail - Retrieve user details by email', async ({
    userApi,
  }) => {
    // 1. Precondition: Create user
    createdUser = ApiDataHelper.generateUserPayload();
    const createRes = await userApi.createAccount(createdUser);
    expect(createRes.body.responseCode).toBe(201);

    // 2. Fetch user detail
    const res = await userApi.getUserDetailByEmail(createdUser.email);

    // 3. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(10000);

    // 4. Schema & Data Verification
    expect(res.body.responseCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user!.email).toBe(createdUser.email);
    expect(res.body.user!.name).toBe(createdUser.name);
    expect(res.body.user!.company).toBe(createdUser.company);
    expect(res.body.user!.city).toBe(createdUser.city);
    expect(res.body.user!.country).toBe(createdUser.country);
  });

  /**
   * API 13: PUT METHOD To Update User Account
   * Method: PUT
   * URL: /api/updateAccount
   * Expected: responseCode: 200, message: "User updated!"
   */
  test('[API-13] PUT /api/updateAccount - Update existing user profile', async ({ userApi }) => {
    // 1. Precondition: Create user
    createdUser = ApiDataHelper.generateUserPayload();
    const createRes = await userApi.createAccount(createdUser);
    expect(createRes.body.responseCode).toBe(201);

    // 2. Update user profile with fully dynamic data
    const updatedPayload = ApiDataHelper.generateUpdatePayload(createdUser);

    const updateRes = await userApi.updateAccount(updatedPayload);

    // 3. Status & SLA Check
    expect(updateRes.httpStatus).toBe(200);
    expect(updateRes.durationMs).toBeLessThan(10000);
    expect(updateRes.body.responseCode).toBe(200);
    expect(updateRes.body.message).toBe('User updated!');

    // 4. Verify persistence with GET
    const getRes = await userApi.getUserDetailByEmail(createdUser.email);
    expect(getRes.body.responseCode).toBe(200);
    expect(getRes.body.user!.name).toBe(updatedPayload.name);
    expect(getRes.body.user!.company).toBe(updatedPayload.company);
    expect(getRes.body.user!.city).toBe(updatedPayload.city);
  });

  /**
   * API 12: DELETE METHOD To Delete User Account
   * Method: DELETE
   * URL: /api/deleteAccount
   * Expected: responseCode: 200, message: "Account deleted!"
   */
  test('[API-12] DELETE /api/deleteAccount - Delete user account', async ({ userApi }) => {
    // 1. Precondition: Create user
    const tempUser = ApiDataHelper.generateUserPayload();
    const createRes = await userApi.createAccount(tempUser);
    expect(createRes.body.responseCode).toBe(201);

    // 2. Delete user
    const deleteRes = await userApi.deleteAccount({
      email: tempUser.email,
      password: tempUser.password,
    });

    // 3. Status & Message Check
    expect(deleteRes.httpStatus).toBe(200);
    expect(deleteRes.durationMs).toBeLessThan(10000);
    expect(deleteRes.body.responseCode).toBe(200);
    expect(deleteRes.body.message).toBe('Account deleted!');

    // 4. Verify user no longer exists via Login
    const loginRes = await userApi.verifyLogin({
      email: tempUser.email,
      password: tempUser.password,
    });
    expect(loginRes.body.responseCode).toBe(404);
    expect(loginRes.body.message).toBe('User not found!');
  });

  /**
   * Complete E2E Lifecycle of User Account
   * Flow: Create -> Login -> Get Detail -> Update -> Verify Update -> Delete -> Verify Deletion
   */
  test('[API-E2E] Full User Lifecycle E2E: Create -> Verify -> Update -> Delete', async ({
    userApi,
  }) => {
    const user = ApiDataHelper.generateUserPayload();

    // Step 1: Create
    const createRes = await userApi.createAccount(user);
    expect(createRes.body.responseCode).toBe(201);
    expect(createRes.body.message).toBe('User created!');

    // Step 2: Verify Login
    const loginRes = await userApi.verifyLogin({ email: user.email, password: user.password });
    expect(loginRes.body.responseCode).toBe(200);
    expect(loginRes.body.message).toBe('User exists!');

    // Step 3: Get Details
    const detailRes = await userApi.getUserDetailByEmail(user.email);
    expect(detailRes.body.responseCode).toBe(200);
    expect(detailRes.body.user!.email).toBe(user.email);

    // Step 4: Update Profile with dynamic data
    const updatedUser = ApiDataHelper.generateUpdatePayload(user);
    const updateRes = await userApi.updateAccount(updatedUser);
    expect(updateRes.body.responseCode).toBe(200);
    expect(updateRes.body.message).toBe('User updated!');

    // Step 5: Verify Updated Details
    const updatedDetailRes = await userApi.getUserDetailByEmail(user.email);
    expect(updatedDetailRes.body.user!.name).toBe(updatedUser.name);
    expect(updatedDetailRes.body.user!.company).toBe(updatedUser.company);

    // Step 6: Delete
    const deleteRes = await userApi.deleteAccount({ email: user.email, password: user.password });
    expect(deleteRes.body.responseCode).toBe(200);
    expect(deleteRes.body.message).toBe('Account deleted!');

    // Step 7: Verify Deleted
    const postDeleteLogin = await userApi.verifyLogin({
      email: user.email,
      password: user.password,
    });
    expect(postDeleteLogin.body.responseCode).toBe(404);
  });
});
