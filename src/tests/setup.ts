// Setup para testes — define env vars necessárias antes dos imports
process.env.AUTH_SECRET = "test-secret-that-is-at-least-32-chars-long";
process.env.DATABASE_URL = "file:./test.db";
