import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../../src/server/routes';

describe('WhatsApp Webhook Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    setupRoutes(app);
  });

  it('should verify webhook with correct token', async () => {
    const response = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'whatsapp:+14155238886',
        'hub.challenge': 'test-challenge'
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe('test-challenge');
  });

  it('should reject webhook with incorrect token', async () => {
    const response = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': 'test-challenge'
      });

    expect(response.status).toBe(403);
  });

  it('should handle incoming text message', async () => {
    const messagePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messages: [{
              id: 'test-message-id',
              from: '1234567890',
              timestamp: '1234567890',
              type: 'text',
              text: {
                body: 'Hello, AI secretary!'
              }
            }]
          }
        }]
      }]
    };

    const response = await request(app)
      .post('/webhook')
      .send(messagePayload);

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  it('should handle incoming audio message', async () => {
    const messagePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messages: [{
              id: 'test-message-id',
              from: '1234567890',
              timestamp: '1234567890',
              type: 'audio',
              audio: {
                id: 'test-audio-id'
              }
            }]
          }
        }]
      }]
    };

    const response = await request(app)
      .post('/webhook')
      .send(messagePayload);

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  it('should handle webhook errors gracefully', async () => {
    const invalidPayload = {
      invalid: 'payload'
    };

    const response = await request(app)
      .post('/webhook')
      .send(invalidPayload);

    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});





