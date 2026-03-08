# Ecommerce Frontend Rules

## Purpose
This document defines the implementation rules for this frontend codebase.  
Follow these rules for all new features and refactors.

## 1) Architecture Rules
- Use feature-based structure only.
- Keep global/app-wide logic in `src/core/`.
- Keep reusable page wrappers in `src/layouts/`.
- Keep domain code inside `src/features/<feature-name>/`.
- Keep app routing in root `src/router.jsx`.
- Keep app entry only in `src/main.jsx`.

## 2) Folder Contract
- `src/core/`
  - `api/` for API clients and service wrappers.
  - `auth/` for auth session, JWT parsing, route guards.
  - `config/` for environment and endpoint constants.
  - `utils/` for generic utilities.
  - `assets/` for global static assets and CSS.
- `src/layouts/`
  - Shared page structure components (header, full layout, wrappers).
- `src/features/<name>/`
  - `views/` for page-level UI.
  - `hooks/` for feature state and logic.
  - `components/` for feature-local reusable UI.
  - `routes.jsx` for feature route definitions.

## 3) Routing & Role Rules
- `/login` is a shared login page for all users.
- Redirect after login by role from JWT:
  - `ADMIN` -> `/admin`
  - `SUPER_ADMIN` -> `/superadmin/customers`
  - `USER` -> `/client`
- Protect feature routes using auth guards.
- Unauthorized role access must redirect to user’s valid home route.
- Unknown routes must redirect to `/`.

## 4) Auth & Security Rules
- Do not store user roles in `localStorage`.
- Read roles only from `accessToken` JWT payload.
- Store only required session data (`accessToken`, `refreshToken`, minimal auth meta if needed).
- Attach `Authorization: Bearer <token>` via API client interceptor.
- On invalid/expired token, clear session and force login flow.

## 5) API Integration Rules
- Never hardcode API URLs in features.
- Use endpoint constants from `src/core/config/endpoints.js`.
- Use shared API client from `src/core/api/apiClient.js`.
- Keep feature API calls in `core/api/*` or feature-scoped service modules.
- Standardize API error mapping using one utility (`core/utils/apiError.js`).

## 6) UI/UX Rules
- Preserve the existing visual language/theme unless explicitly changed.
- Reuse layout components instead of duplicating page wrappers.
- Keep components focused and small.
- Move complex logic out of views into hooks.
- Show actionable error and loading states for all API-backed actions.

## 7) Code Quality Rules
- Use consistent naming and import paths.
- Remove dead code and duplicate modules during refactors.
- Keep files scoped to one responsibility.
- Run validation before finishing:
  - `npm run lint`
  - `npm run build`

## 8) Implementation Checklist (Every Feature)
1. Add/update endpoint constants.
2. Add API integration in core/feature service layer.
3. Add/extend feature hook for logic.
4. Add/extend feature view/components.
5. Add/extend feature routes.
6. Add route guards if role/auth sensitive.
7. Validate lint + build.

## 9) Non-Negotiables
- No role persistence in localStorage.
- No feature logic inside `main.jsx`.
- No direct API calls in random components without shared client.
- No new root-level architecture outside `core/`, `layouts/`, `features/`.
