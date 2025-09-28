# Sign-In & Authentication Guidelines

## Entry Points
- `/auth/signin` (email/password form).
- Social login placeholders (optional future enhancement).
- Invite-based deep links (company/specialist) redirect to sign-in with context.

## Credential Rules
- Identify user by email (unique).
- Password requirements: minimum length 8, encourage complex passwords.
- Failed attempts lockout policy (TBD) – currently log attempts.

## Session Handling
- Use NextAuth session cookies.
- On sign-in success:
  - Check user role (`SUPER_ADMIN`, `COMPANY`, `SPECIALIST`, `SUBSCRIBER`).
  - Check status (active, pending, suspended).
- Redirect rules:
  - Super admin → `/admin`
  - Company → `/company`
  - Specialist → `/specialist`
  - Subscriber → homepage or personal dashboard
- Suspended users see alert screen and are blocked from dashboards.

## Role Context
- Store `role`, `companyId`, `status` in JWT/session.
- Company & Specialist routes gate on session role and status.
- Super admin can impersonate (requires audit log entry).

## Security Guardrails
- CSRF protection from NextAuth (handled by form).
- Enforce HTTPS in production.
- Refresh token rotation (if configured).
- Log sign-in/out events for audit.

## Error Messaging
- Invalid credentials → generic “Email or password incorrect.”
- Suspended account → “Account suspended. Contact support.”
- Pending approval → “Awaiting approval. We’ll notify you via email.”

## Future Considerations
- MFA/2FA support.
- Password reset workflow (`/auth/reset`).
- Social login provider support.


