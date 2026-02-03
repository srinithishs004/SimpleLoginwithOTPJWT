const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const OTP_EXPIRY_MS = Number(process.env.OTP_EXPIRY_MS || 2 * 60 * 1000);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 3);

const otpStore = new Map();

const identifierSchema = z
  .string()
  .min(3)
  .refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    },
    { message: 'Identifier must be a valid email or phone number.' }
  );

const sendOtpSchema = z.object({
  identifier: identifierSchema
});

const verifyOtpSchema = z.object({
  identifier: identifierSchema,
  otp: z.string().min(4).max(6)
});

const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

const sendOtp = async ({ identifier }) => {
  // Placeholder for SMS/Email integration.
  // Intentionally do not log or return the OTP.
  return { identifier };
};

const issueJwt = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

app.post('/auth/send-otp', async (req, res) => {
  const parseResult = sendOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid input.', errors: parseResult.error.errors });
  }

  const { identifier } = parseResult.data;
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(identifier, {
    otpHash,
    expiresAt,
    attempts: 0
  });

  await sendOtp({ identifier, otp });

  return res.json({ message: 'OTP sent.', expiresAt });
});

app.post('/auth/verify-otp', async (req, res) => {
  const parseResult = verifyOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid input.', errors: parseResult.error.errors });
  }

  const { identifier, otp } = parseResult.data;
  const record = otpStore.get(identifier);

  if (!record) {
    return res.status(400).json({ message: 'OTP not found or expired.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(identifier);
    return res.status(400).json({ message: 'OTP expired.' });
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);

  if (!isMatch) {
    record.attempts += 1;
    otpStore.set(identifier, record);
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  otpStore.delete(identifier);

  const token = issueJwt({ userId: identifier, role: 'user' });
  return res.json({ message: 'Login successful.', token });
});

app.get('/user/profile', authMiddleware, (req, res) => {
  return res.json({
    userId: req.user.userId,
    role: req.user.role,
    message: 'Protected profile data.'
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
