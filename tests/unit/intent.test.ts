import { describe, it, expect, vi } from 'vitest';
import { OpenAIService } from '../../src/services/llm/openaiClient';

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('Intent Classification', () => {
  it('should classify calendar intent correctly', async () => {
    const openaiService = new OpenAIService();
    
    // Mock the OpenAI response
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            intent: 'calendar',
            confidence: 0.9,
            entities: {
              date: 'tomorrow',
              time: '2:00 PM',
              duration: '1 hour'
            }
          })
        }
      }]
    };

    // @ts-ignore
    vi.mocked(openaiService.client.chat.completions.create).mockResolvedValue(mockResponse);

    const result = await openaiService.classifyIntent('Create a meeting tomorrow at 2 PM for 1 hour');
    
    expect(result.intent).toBe('calendar');
    expect(result.confidence).toBe(0.9);
    expect(result.entities).toHaveProperty('date');
    expect(result.entities).toHaveProperty('time');
  });

  it('should classify email intent correctly', async () => {
    const openaiService = new OpenAIService();
    
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            intent: 'email',
            confidence: 0.85,
            entities: {
              action: 'read',
              sender: 'john@example.com'
            }
          })
        }
      }]
    };

    // @ts-ignore
    vi.mocked(openaiService.client.chat.completions.create).mockResolvedValue(mockResponse);

    const result = await openaiService.classifyIntent('Check my emails from John');
    
    expect(result.intent).toBe('email');
    expect(result.confidence).toBe(0.85);
    expect(result.entities).toHaveProperty('action');
  });

  it('should handle invalid JSON response gracefully', async () => {
    const openaiService = new OpenAIService();
    
    const mockResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    };

    // @ts-ignore
    vi.mocked(openaiService.client.chat.completions.create).mockResolvedValue(mockResponse);

    const result = await openaiService.classifyIntent('Some random text');
    
    expect(result.intent).toBe('information');
    expect(result.confidence).toBe(0.5);
    expect(result.entities).toEqual({});
  });
});





