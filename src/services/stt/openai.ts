import fs from 'fs';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

export async function transcribeAudio(filePath: string, languageHint?: string): Promise<string> {
  const file = fs.createReadStream(filePath);
  const resp = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: languageHint || undefined,
  });
  const text = (resp as any).text || (resp as any).data?.text || '';
  return text || '';
}

