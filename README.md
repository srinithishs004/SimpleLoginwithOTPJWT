# Simple Login with OTP + JWT

## Step-by-step flow

1. User enters phone number or email.
2. Backend validates format.
3. OTP is generated (random 4–6 digits).
4. OTP is stored temporarily with expiry (e.g., 2–5 mins).
5. OTP is sent via SMS or Email.
6. User enters OTP.
7. Backend verifies OTP.
8. If valid → login success.
9. JWT / session token issued.
10. User is authenticated.

## Quick start

```bash
npm install
npm run dev
```

### Environment variables

- `PORT` (default: `3000`)
- `JWT_SECRET` (default: `change-me-in-prod`)
- `OTP_EXPIRY_MS` (default: `120000`)
- `OTP_MAX_ATTEMPTS` (default: `3`)

## OTP logic (core concept)

Generate OTP → Store (hashed) → Send → Verify → Expire.

### Important rules

- OTP must expire.
- Max retry attempts (e.g., 3).
- OTP should be hashed in DB (never store plain).

## Tools needed (simple stack)

### Frontend options

| Platform | Tools |
| --- | --- |
| Web | React, HTML/CSS, Axios |
| Mobile | React Native / Expo |
| Android | Kotlin + XML |

#### Frontend responsibilities

- Phone/email input.
- OTP input UI.
- API calls.
- Error handling.
- Token storage.

### Backend (recommended)

| Purpose | Tool |
| --- | --- |
| Runtime | Node.js |
| Framework | Express.js |
| OTP logic | Custom function |
| Auth token | JWT |
| Validation | Zod / Joi |

### Database (pick one)

| DB | Use |
| --- | --- |
| MongoDB | Store users + OTP |
| PostgreSQL | Structured auth |
| Redis | Best for OTP (auto-expiry) |

#### OTP table / collection

```json
{
  "identifier": "phone/email",
  "otp_hash": "hashed_otp",
  "expires_at": "timestamp",
  "attempts": 0
}
```

## OTP sending services

### SMS OTP

| Service | Notes |
| --- | --- |
| Twilio | Most popular |
| AWS SNS | Cheap & scalable |
| Fast2SMS | India-friendly |
| MSG91 | Widely used in India |

### Email OTP

| Service | Notes |
| --- | --- |
| Nodemailer | Simple SMTP |
| SendGrid | Production-grade |
| AWS SES | Scalable |

## Authentication flow (after OTP)

OTP verified → Generate JWT → Send to client.

### JWT payload example

```json
{
  "userId": "123",
  "role": "user",
  "exp": "24h"
}
```

### Client token storage

- Web → LocalStorage / Cookies.
- Mobile → Secure Storage.

## Minimal API endpoints

- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `GET /user/profile` (protected)

## Security must-haves (non-negotiable)

- Rate limiting (OTP spam protection).
- OTP expiry (2–5 min).
- Hash OTP (bcrypt / crypto).
- HTTPS only.
- Max OTP attempts.
- Do NOT expose OTP in logs.

## Optional enhancements

- Resend OTP timer.
- OTP auto-read (Android).
- CAPTCHA before OTP.
- Device binding.
- Login history.

## Testing

- Wrong OTP.
- Expired OTP.
- Multiple resend.
- Brute force attempt.
- Network failure.
