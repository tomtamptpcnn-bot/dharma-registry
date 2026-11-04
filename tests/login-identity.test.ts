import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, usernameToEmail } from "../lib/login-identity";

test("username normalization and dharma email mapping", () => {
    assert.equal(usernameToEmail(" Existing "), "existing@dharma.com");
    assert.equal(usernameToEmail("New.User"), "new.user@dharma.com");
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
});
