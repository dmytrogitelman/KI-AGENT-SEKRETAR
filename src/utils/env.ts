import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),

  // TTS Configuration
  ELEVENLABS_API_KEY: z.string().optional(),
  AZURE_TTS_KEY: z.string().optional(),
  AZURE_TTS_REGION: z.string().optional(),

  // Twilio WhatsApp Configuration
  TWILIO_ACCOUNT_SID: z.string().min(1, 'Twilio Account SID is required'),
  TWILIO_AUTH_TOKEN: z.string().min(1, 'Twilio Auth Token is required'),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1, 'Twilio WhatsApp Number is required'),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // Microsoft OAuth Configuration
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  MS_REDIRECT_URI: z.string().optional(),
  MS_TENANT: z.string().default('common'),

  // Zoom OAuth Configuration
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  ZOOM_ACCOUNT_ID: z.string().optional(),
  ZOOM_REDIRECT_URI: z.string().optional(),

  // Third-party API Keys
  TODOIST_TOKEN: z.string().optional(),
  NOTION_TOKEN: z.string().optional(),

  // Database Configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Redis Configuration
  REDIS_URL: z.string().min(1, 'Redis URL is required'),

  // Security
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),

  // Webhook Configuration
  WEBHOOK_BASE_URL: z.string().optional(),
});

export const config = envSchema.parse(process.env);

export type Config = z.infer<typeof envSchema>;

