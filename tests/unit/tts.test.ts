import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElevenLabsTTS } from '../../src/services/tts/elevenlabs';
import { AzureTTS } from '../../src/services/tts/azure';

// Mock axios
vi.mock('axios');

describe('TTS Services', () => {
  describe('ElevenLabsTTS', () => {
    it('should synthesize text to audio', async () => {
      const tts = new ElevenLabsTTS();
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      // Mock axios response
      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.post).mockResolvedValue({
        data: mockAudioBuffer,
        status: 200,
      });

      const result = await tts.synthesize('Hello world');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(mockAudioBuffer.length);
    });

    it('should handle API errors gracefully', async () => {
      const tts = new ElevenLabsTTS();
      
      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.post).mockRejectedValue(new Error('API Error'));

      await expect(tts.synthesize('Hello world')).rejects.toThrow('API Error');
    });
  });

  describe('AzureTTS', () => {
    it('should synthesize text to audio', async () => {
      const tts = new AzureTTS();
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.post).mockResolvedValue({
        data: mockAudioBuffer,
        status: 200,
      });

      const result = await tts.synthesize('Hello world');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(mockAudioBuffer.length);
    });

    it('should use correct voice for language', async () => {
      const tts = new AzureTTS();
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      const mockAxios = await import('axios');
      vi.mocked(mockAxios.default.post).mockResolvedValue({
        data: mockAudioBuffer,
        status: 200,
      });

      await tts.synthesize('Hallo Welt', 'de-DE-KatjaNeural');
      
      expect(mockAxios.default.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('de-DE-KatjaNeural'),
        expect.any(Object)
      );
    });
  });
});





