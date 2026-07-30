export function getConfig(environment = process.env) {
  const port = Number(environment.PORT || 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port number.');
  }

  if (!environment.JWT_SECRET || environment.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  return {
    port,
    jwtExpiresIn: environment.JWT_EXPIRES_IN || '1h',
    jwtSecret: environment.JWT_SECRET
  };
}
