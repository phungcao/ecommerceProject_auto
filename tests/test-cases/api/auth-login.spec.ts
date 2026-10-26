import { test, expect } from '../../fixtures';
import { ApiDataHelper } from '../../api/utils/api-data.helper';
import { CreateAccountPayload } from '../../api/models/api.types';

test.describe('API - Authentication & Login (@api @auth)', () => {
  let activeUser: CreateAccountPayload;

  test.beforeAll(async ({ userApi }) => {
    // Seed a dedicated user account for valid login tests
    activeUser = ApiDataHelper.generateUserPayload();
    const createRes = await userApi.createAccount(activeUser);
    expect(createRes.body.responseCode).toBe(201);
  });

  test.afterAll(async ({ userApi }) => {
    // Teardown: Clean up the seeded account
    if (activeUser?.email) {
      await userApi.deleteAccount({
        email: activeUser.email,
        password: activeUser.password,
      });
    }
  });

  /**
   * API 7: POST To Verify Login with valid details
   * Method: POST
   * URL: /api/verifyLogin
   * Expected: responseCode: 200, message: "User exists!"
   */
  test('[API-07] POST /api/verifyLogin - Verify Login with valid details', async ({ userApi }) => {
    const res = await userApi.verifyLogin({
      email: activeUser.email,
      password: activeUser.password,
    });

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Verification
    expect(res.body.responseCode).toBe(200);
    expect(res.body.message).toBe('User exists!');
  });

  /**
   * API 8: POST To Verify Login without email parameter
   * Method: POST
   * URL: /api/verifyLogin
   * Expected: responseCode: 400, message: "Bad request, email or password parameter is missing in POST request."
   */
  test('[API-08] POST /api/verifyLogin - Missing email parameter (Negative)', async ({ userApi }) => {
    const res = await userApi.verifyLogin({
      password: activeUser.password,
    });

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Error Detail
    expect(res.body.responseCode).toBe(400);
    expect(res.body.message).toBe(
      'Bad request, email or password parameter is missing in POST request.',
    );
  });

  /**
   * API 9: DELETE To Verify Login
   * Method: DELETE
   * URL: /api/verifyLogin
   * Expected: responseCode: 405, message: "This request method is not supported."
   */
  test('[API-09] DELETE /api/verifyLogin - DELETE Method Not Allowed', async ({ userApi }) => {
    const res = await userApi.deleteVerifyLogin();

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Body Check
    expect(res.body.responseCode).toBe(405);
    expect(res.body.message).toBe('This request method is not supported.');
  });

  /**
   * API 10: POST To Verify Login with invalid details
   * Method: POST
   * URL: /api/verifyLogin
   * Expected: responseCode: 404, message: "User not found!"
   */
  test('[API-10] POST /api/verifyLogin - Login with non-existent user (Negative)', async ({
    userApi,
  }) => {
    const nonExistentEmail = ApiDataHelper.generateUniqueEmail('non_existent');
    const res = await userApi.verifyLogin({
      email: nonExistentEmail,
      password: 'IncorrectPassword999!',
    });

    // 1. HTTP Status & SLA Check
    expect(res.httpStatus).toBe(200);
    expect(res.durationMs).toBeLessThan(5000);

    // 2. Response Body Check
    expect(res.body.responseCode).toBe(404);
    expect(res.body.message).toBe('User not found!');
  });
});
