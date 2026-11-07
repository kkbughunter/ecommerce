# Google sign-in

The login/register screen supports Google's Continue with Google button alongside the existing email/password and OTP flows. It signs users into this store; it does not request Gmail inbox access.

## Setup

1. In Google Cloud Console, configure the OAuth consent screen and create an OAuth client with application type **Web application**. Add the frontend origins (scheme, hostname and port, without a path) as **Authorized JavaScript origins**, for example `http://localhost:5173` and your production website. Add test users if your Google application is in testing mode.
2. Set these values in the backend `.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_ALLOWED_ORIGINS=http://localhost:5173,https://your-store.example
   GOOGLE_COOKIE_SECURE=false
   GOOGLE_COOKIE_SAME_SITE=Lax
   ```

   Set `GOOGLE_COOKIE_SECURE=true` for production HTTPS. Keep `Lax` when the frontend and API are on the same site. If they are on different sites, use `None` with `Secure=true`; browsers that block third-party cookies may still prevent login. Hosting the API on the same site is recommended. Use the same hostname for both local services (do not mix localhost with 127.0.0.1).

3. Apply `google-auth-migration.sql` to an existing database if schema updates are managed manually. Restart the backend and frontend. No frontend environment value or Google client secret is required: the public client ID is returned by the backend. An empty client ID disables the button.
4. Test with a real Google account: new account creation, existing verified email/password login, Google login to that same account, logout, and login again. Confirm existing staff roles remain unchanged.

## Behavior and security

- New Gmail and Google Workspace accounts receive only the normal customer/user role and a customer profile. They can use the existing Forgot password flow to establish an email/password credential.
- Verified existing accounts with the same authoritative email are linked without changing passwords or roles. Unverified existing registrations must complete their email OTP verification first; inactive accounts remain blocked.
- Google `sub` is stored as the stable provider identity with a unique database constraint. Once linked, subsequent logins resolve by that identity. Google email changes do not silently rewrite the store email.
- Third-party email Google accounts cannot create/link a store account using this button; use email/password instead. Google is authoritative for Gmail and verified Workspace email ownership.
- The backend verifies RS256 signatures against Google's rotating public keys, issuer, audience, authorized party, expiry, verified email, a recent issue time, and a nonce bound to an HttpOnly browser cookie. Google endpoints additionally enforce an exact frontend Origin allowlist. Cookies expire after five minutes; reload the login page if the sign-in challenge expires. Tokens are exchanged for the existing local access/refresh tokens.
- This uses the Google Identity Services popup button, not the redirect-based OAuth authorization-code flow. Google may show an account chooser or consent prompt; silent automatic login is disabled.

Official references: [Display the Google sign-in button](https://developers.google.com/identity/gsi/web/guides/display-button), [verify Google ID tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [JavaScript API](https://developers.google.com/identity/gsi/web/reference/js-reference).
