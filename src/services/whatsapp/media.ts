import fs from 'fs';
import path from 'path';
import https from 'https';

const TWILIO_SID = process.env['TWILIO_ACCOUNT_SID'] || '';
const TWILIO_AUTH = process.env['TWILIO_AUTH_TOKEN'] || '';

export function downloadTwilioMedia(mediaUrl: string, filenameHint = 'audio') : Promise<string> {
  return new Promise((resolve, reject) => {
    if (!TWILIO_SID || !TWILIO_AUTH) {
      return reject(new Error('Twilio creds missing'));
    }
    const url = new URL(mediaUrl);
    const auth = `${TWILIO_SID}:${TWILIO_AUTH}`;

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const basePath = path.join(tmpDir, `${filenameHint}-${Date.now()}.bin`);

    const opts: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(auth).toString('base64')
      }
    };

    const req = https.request(opts, (res) => {
      const ct = res.headers['content-type'] || '';
      let ext = '.bin';
      if (typeof ct === 'string') {
        if (ct.includes('ogg')) ext = '.ogg';
        else if (ct.includes('mpeg')) ext = '.mp3';
        else if (ct.includes('wav')) ext = '.wav';
        else if (ct.includes('webm')) ext = '.webm';
        else if (ct.includes('opus')) ext = '.opus';
      }
      const finalPath = basePath.replace('.bin', ext);
      const file = fs.createWriteStream(finalPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(finalPath)));
    });

    req.on('error', reject);
    req.end();
  });
}

