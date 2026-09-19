import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, usernameToEmail } from "../lib/login-identity";

test("username normalization and account mapping", () => {
  const previous = process.env.AUTH_USERNAME_EMAIL_MAP;
  try {
    process.env.AUTH_USERNAME_EMAIL_MAP = '{"existing":"account@example.com"}';
    assert.equal(usernameToEmail(" Existing "), "account@example.com");
    assert.equal(usernameToEmail("New.User"), "new.user@admin.example.com");
    assert.equal(
      loginSchema.parse({ username: " CHAIYA ", password: " x " }).password,
      " x ",
    );
    for (const username of ["ab", "a@b.com", "a b", "a".repeat(33)]) {
      assert.equal(
        loginSchema.safeParse({ username, password: "secret" }).success,
        false,
      );
    }
  } finally {
    if (previous === undefined) delete process.env.AUTH_USERNAME_EMAIL_MAP;
    else process.env.AUTH_USERNAME_EMAIL_MAP = previous;
  }
});
