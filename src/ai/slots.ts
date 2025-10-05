import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Slots = {
  intent: string;
  title?: string;
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:mm
  duration_min?: number;
  attendees?: string[];
  phone?: string;
  target_lang?: string;
  confirm?: boolean;
  location?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // YYYY-MM-DD for tasks
};

export async function extractSlots(
  plainText: string, 
  intent: string, 
  userLocale = 'en', 
  userTz = 'Europe/Berlin'
): Promise<Slots> {
  if (!plainText || plainText.trim().length === 0) {
    return { intent, confirm: false };
  }

  try {
    const prompt = `Extract structured information from this text for intent "${intent}".

User timezone: ${userTz}
User locale: ${userLocale}
Current date: ${new Date().toISOString().split('T')[0]}

Return JSON with these fields (only include fields that are clearly specified):
{
  "intent": "${intent}",
  "title": "meeting/task title if mentioned",
  "date": "YYYY-MM-DD format (convert relative dates like 'tomorrow', 'next week')",
  "time": "HH:mm format (24-hour)",
  "duration_min": number in minutes (default 30 for meetings),
  "attendees": ["email@example.com", "name@company.com"],
  "phone": "+1234567890",
  "target_lang": "language code (ru/de/en/zh/es/fr)",
  "location": "meeting location if mentioned",
  "description": "additional details",
  "priority": "low|medium|high",
  "due_date": "YYYY-MM-DD for tasks",
  "confirm": false
}

Text: """${plainText}"""

JSON:`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { intent, confirm: false };
    }

    const extracted = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the extracted data
    const slots: Slots = {
      intent,
      confirm: false,
    };

    if (extracted.title && typeof extracted.title === 'string') {
      slots.title = extracted.title.trim();
    }

    if (extracted.date && typeof extracted.date === 'string') {
      // Validate date format
      if (/^\d{4}-\d{2}-\d{2}$/.test(extracted.date)) {
        slots.date = extracted.date;
      }
    }

    if (extracted.time && typeof extracted.time === 'string') {
      // Validate time format
      if (/^\d{1,2}:\d{2}$/.test(extracted.time)) {
        slots.time = extracted.time;
      }
    }

    if (extracted.duration_min && typeof extracted.duration_min === 'number') {
      slots.duration_min = Math.max(5, Math.min(480, extracted.duration_min)); // 5min to 8h
    }

    if (extracted.attendees && Array.isArray(extracted.attendees)) {
      slots.attendees = extracted.attendees
        .filter((email: any) => typeof email === 'string' && email.includes('@'))
        .slice(0, 10); // Max 10 attendees
    }

    if (extracted.phone && typeof extracted.phone === 'string') {
      // Basic phone validation
      if (/^\+?[\d\s\-\(\)]+$/.test(extracted.phone)) {
        slots.phone = extracted.phone;
      }
    }

    if (extracted.target_lang && typeof extracted.target_lang === 'string') {
      const validLangs = ['ru', 'de', 'en', 'zh', 'es', 'fr', 'it', 'pt', 'ja', 'ko'];
      if (validLangs.includes(extracted.target_lang.toLowerCase())) {
        slots.target_lang = extracted.target_lang.toLowerCase();
      }
    }

    if (extracted.location && typeof extracted.location === 'string') {
      slots.location = extracted.location.trim();
    }

    if (extracted.description && typeof extracted.description === 'string') {
      slots.description = extracted.description.trim();
    }

    if (extracted.priority && ['low', 'medium', 'high'].includes(extracted.priority)) {
      slots.priority = extracted.priority;
    }

    if (extracted.due_date && typeof extracted.due_date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(extracted.due_date)) {
        slots.due_date = extracted.due_date;
      }
    }

    return slots;
  } catch (error) {
    console.error('[SLOT EXTRACTION ERROR]', error);
    return { intent, confirm: false };
  }
}

export function formatSlotsForDisplay(slots: Slots): string {
  const parts: string[] = [];
  
  if (slots.title) parts.push(`Title: ${slots.title}`);
  if (slots.date) parts.push(`Date: ${slots.date}`);
  if (slots.time) parts.push(`Time: ${slots.time}`);
  if (slots.duration_min) parts.push(`Duration: ${slots.duration_min} min`);
  if (slots.attendees?.length) parts.push(`Attendees: ${slots.attendees.join(', ')}`);
  if (slots.location) parts.push(`Location: ${slots.location}`);
  if (slots.phone) parts.push(`Phone: ${slots.phone}`);
  if (slots.target_lang) parts.push(`Target language: ${slots.target_lang}`);
  if (slots.priority) parts.push(`Priority: ${slots.priority}`);
  if (slots.due_date) parts.push(`Due: ${slots.due_date}`);
  
  return parts.join('\n');
}
