import jwt from 'jsonwebtoken';

export function authenticate(jwtSecret) {
  return (request, response, next) => {
    const authorization = request.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Authentication is required.' });
    }

    const token = authorization.slice(7);

    try {
      const payload = jwt.verify(token, jwtSecret);
      request.auth = { userId: payload.sub };
      return next();
    } catch {
      return response.status(401).json({ error: 'Authentication token is invalid or expired.' });
    }
  };
}
