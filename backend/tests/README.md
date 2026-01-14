## Test Coverage with Jest & Supertest

We use **Jest** with **Supertest** to ensure API correctness for the following key modules:

---

### `auth.test.js`

**Purpose:** Verifies user authentication flows (`signup` and `signin`).

#### Tests:

- **Register a new user**
  ✅ Sends a `POST /user/signup` request with user details.
  ✅ Asserts that registration succeeds with a valid `token`.

- **Login the user**
  ✅ Sends a `POST /user/signin` request with previously registered credentials.
  ✅ Confirms login success and receipt of a valid `token`.

---

### `account.test.js`

**Purpose:** Verifies balance checking, money transfer, and currency exchange between accounts.

#### Tests:

- **Get user balance**
  ✅ Sends `GET /account/balance` with `Authorization` header.
  ✅ Expects a 200 status and valid `balances` object.

- **Transfer money**
  ✅ Creates a second user (receiver).
  ✅ Sends `POST /account/transfer` with receiver ID, currency, and amount.
  ✅ Expects success and updated balances.

- **Exchange currency**
  ✅ Sends `POST /account/exchange` converting from one currency to another.
  ✅ Expects success message and updated multi-currency balances.

---

### `transaction.test.js`

**Purpose:** Validates transaction history visibility and access control.

#### Tests:

- **Fetch transaction history without token**
  🚫 Sends `GET /transaction/history` without token.
  ✅ Expects `401 Unauthorized`.

- **Fetch non-existent transaction**
  🚫 Sends `GET /transaction/history/<invalid_id>` with valid token.
  ✅ Expects `404 Not Found`.

---

## Setup & Run Tests

```bash
npm install
npm test
```

> All tests use `supertest` to make real HTTP requests to your Express app in-memory.

---

## Notes

- Tests are isolated and connect to the real database.
- `dropDatabase()` is **disabled** to avoid accidental data loss.
- Tokens are generated dynamically by calling real `/signup` routes.
