import fs from 'fs';
import path from 'path';
import https from 'https';

const ELEVEN_KEY = process.env['ELEVENLABS_API_KEY'] || '';
const VOICE_ID = process.env['ELEVENLABS_VOICE_ID'] || '21m00Tcm4TlvDq8ikWAM'; // Rachel

export async function ttsElevenLabs(text: string, filenameHint='reply'): Promise<string> {
  if (!ELEVEN_KEY) throw new Error('ELEVENLABS_API_KEY missing');

  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, `${filenameHint}-${Date.now()}.mp3`);

  const data = JSON.stringify({
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.8 }
  });

  const options: https.RequestOptions = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${VOICE_ID}`,
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
      'Content-Length': Buffer.byteLength(data),
    }
  };

  return await new Promise<string>((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        let body = '';
        res.on('data', (c) => (body += c.toString()));
        res.on('end', () => reject(new Error(`ElevenLabs error ${res.statusCode}: ${body}`)));
        return;
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(outPath)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

