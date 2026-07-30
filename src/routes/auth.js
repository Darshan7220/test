import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/authenticate.js';

const { Router } = express;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateCredentials(body) {
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  const errors = [];
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.push('email must be a valid email address.');
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`);
  }

  return { email, password, errors };
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

function issueToken(user, config) {
  return jwt.sign({}, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
    subject: user.id
  });
}

export function createAuthRouter({ config, userStore }) {
  const router = Router();

  router.post('/register', asyncHandler(async (request, response) => {
    const { email, password, errors } = validateCredentials(request.body || {});
    if (errors.length > 0) {
      return response.status(400).json({ error: 'Validation failed.', details: errors });
    }

    if (await userStore.findByEmail(email)) {
      return response.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userStore.create({ email, passwordHash });
    const token = issueToken(user, config);

    return response.status(201).json({ token, user: publicUser(user) });
  }));

  router.post('/login', asyncHandler(async (request, response) => {
    const email = normalizeEmail(request.body?.email);
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const user = await userStore.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }

    return response.json({ token: issueToken(user, config), user: publicUser(user) });
  }));

  router.get('/me', authenticate(config.jwtSecret), asyncHandler(async (request, response) => {
    const user = await userStore.findById(request.auth.userId);
    if (!user) {
      return response.status(401).json({ error: 'Authentication token is no longer valid.' });
    }

    return response.json({ user: publicUser(user) });
  }));

  return router;
}
