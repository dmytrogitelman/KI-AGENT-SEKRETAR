import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.TWILIO_ACCOUNT_SID = 'test-sid';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';
});

afterAll(async () => {
  // Cleanup after all tests
  // Add any cleanup logic here
});





