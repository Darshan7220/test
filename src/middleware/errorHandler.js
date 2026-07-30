export function notFound(request, response) {
  response.status(404).json({ error: `Route ${request.method} ${request.path} was not found.` });
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' });
  }

  console.error(error);
  return response.status(500).json({ error: 'An unexpected server error occurred.' });
}
