import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../../src/server/routes';

describe('End-to-End WhatsApp Flow', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    setupRoutes(app);
  });

  it('should handle complete message flow', async () => {
    // Step 1: Verify webhook
    const verificationResponse = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'whatsapp:+14155238886',
        'hub.challenge': 'test-challenge'
      });

    expect(verificationResponse.status).toBe(200);

    // Step 2: Send text message
    const textMessagePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messages: [{
              id: 'text-message-id',
              from: '1234567890',
              timestamp: '1234567890',
              type: 'text',
              text: {
                body: 'Create a meeting tomorrow at 2 PM'
              }
            }]
          }
        }]
      }]
    };

    const textResponse = await request(app)
      .post('/webhook')
      .send(textMessagePayload);

    expect(textResponse.status).toBe(200);

    // Step 3: Send audio message
    const audioMessagePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messages: [{
              id: 'audio-message-id',
              from: '1234567890',
              timestamp: '1234567890',
              type: 'audio',
              audio: {
                id: 'audio-file-id'
              }
            }]
          }
        }]
      }]
    };

    const audioResponse = await request(app)
      .post('/webhook')
      .send(audioMessagePayload);

    expect(audioResponse.status).toBe(200);

    // Step 4: Check health status
    const healthResponse = await request(app)
      .get('/health/detailed');

    expect(healthResponse.status).toBe(200);
    expect(healthResponse.body).toHaveProperty('status');
    expect(healthResponse.body).toHaveProperty('dependencies');
  });

  it('should handle multiple messages from same user', async () => {
    const messages = [
      'Hello, AI secretary!',
      'What can you help me with?',
      'Create a task for tomorrow',
      'Thank you!'
    ];

    for (let i = 0; i < messages.length; i++) {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              messages: [{
                id: `message-${i}`,
                from: '1234567890',
                timestamp: `${1234567890 + i}`,
                type: 'text',
                text: {
                  body: messages[i]
                }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook')
        .send(payload);

      expect(response.status).toBe(200);
    }
  });

  it('should handle different message types', async () => {
    const messageTypes = [
      { type: 'text', content: { text: { body: 'Hello!' } } },
      { type: 'image', content: { image: { id: 'image-id' } } },
      { type: 'document', content: { document: { id: 'doc-id' } } },
      { type: 'audio', content: { audio: { id: 'audio-id' } } }
    ];

    for (const messageType of messageTypes) {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              messages: [{
                id: `${messageType.type}-message-id`,
                from: '1234567890',
                timestamp: '1234567890',
                type: messageType.type,
                ...messageType.content
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook')
        .send(payload);

      expect(response.status).toBe(200);
    }
  });
});





