import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return 'en';
  
  try {
    const prompt = `Detect the language of this text and return only the BCP47 language code (e.g., "ru", "de", "en", "zh", "es", "fr").
    
Text: """${text}"""

Answer only the 2-letter language code:`;
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 10,
    });
    
    const detected = (response.choices[0]?.message?.content || 'en').trim().toLowerCase();
    
    // Validate and map common variations
    const langMap: Record<string, string> = {
      'russian': 'ru', 'русский': 'ru',
      'german': 'de', 'deutsch': 'de', 'немецкий': 'de',
      'english': 'en', 'английский': 'en',
      'chinese': 'zh', 'китайский': 'zh',
      'spanish': 'es', 'испанский': 'es',
      'french': 'fr', 'французский': 'fr',
    };
    
    return langMap[detected] || detected.slice(0, 2);
  } catch (error) {
    console.error('[LANGUAGE DETECTION ERROR]', error);
    return 'en';
  }
}

export async function translate(text: string, target: string, source?: string): Promise<string> {
  if (!text || text.trim().length === 0) return '';
  
  try {
    const sourceHint = source ? ` from ${source}` : '';
    const prompt = `Translate the following text to ${target}${sourceHint}. 
Keep proper names, email addresses, phone numbers, and technical terms unchanged.
Maintain the original tone and formality level.

Text: """${text}"""

Translation:`;
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });
    
    return (response.choices[0]?.message?.content || '').trim();
  } catch (error) {
    console.error('[TRANSLATION ERROR]', error);
    return text; // Return original text if translation fails
  }
}

export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'ru': 'Russian',
    'de': 'German', 
    'en': 'English',
    'zh': 'Chinese',
    'es': 'Spanish',
    'fr': 'French',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'ko': 'Korean',
  };
  return names[code] || code.toUpperCase();
}
