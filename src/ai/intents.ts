import OpenAI from 'openai';

export type Intent =
  | 'create_meeting'
  | 'call_someone'
  | 'create_task'
  | 'summarize'
  | 'translate'
  | 'small_talk'
  | 'unknown';

export type IntentResult = { intent: Intent; confidence: number; language?: string };

const client = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

const RULES: Array<{ re: RegExp; intent: Intent }> = [
  // RU
  { re: /\b(создай|поставь|добавь|запланируй|организуй)\s+(встречу|митинг|звонок|созвон|конференцию)\b/i, intent: 'create_meeting' },
  { re: /\b(позвони|созвонись|набери|перезвони|свяжись)\b/i, intent: 'call_someone' },
  { re: /\b(задачу|напоминание|напомни|зафиксируй|запиши|добавь задачу)\b/i, intent: 'create_task' },
  { re: /\b(подытож|суммаризируй|кратко|итоги|выжимка|резюме)\b/i, intent: 'summarize' },
  { re: /\b(переведи|перевод|переведи на)\b/i, intent: 'translate' },
  { re: /\b(привет|здравствуй|как дела|что делаешь|спасибо|пока)\b/i, intent: 'small_talk' },
  
  // DE
  { re: /\b(termin|meeting|besprechung)\s*(erstellen|machen|planen|organisieren|einrichten)\b/i, intent: 'create_meeting' },
  { re: /\b(anrufen|ruf\s+an|telefonat|telefonieren|kontaktieren)\b/i, intent: 'call_someone' },
  { re: /\b(aufgabe|todo|erinnerung|termin|notiz)\s*(erstellen|machen|hinzufügen)\b/i, intent: 'create_task' },
  { re: /\b(zusammenfassung|kurz\s+zusammen|zusammenfassen|resümee)\b/i, intent: 'summarize' },
  { re: /\b(übersetze|übersetzung|übersetzen)\b/i, intent: 'translate' },
  { re: /\b(hallo|guten\s+tag|wie\s+geht|danke|tschüss)\b/i, intent: 'small_talk' },
  
  // EN
  { re: /\b(create|schedule|set|plan|organize)\s+(a\s+)?(meeting|call|conference|appointment)\b/i, intent: 'create_meeting' },
  { re: /\b(call|dial|ring|phone|contact)\b/i, intent: 'call_someone' },
  { re: /\b(task|todo|remind|reminder|note)\s*(create|add|make)\b/i, intent: 'create_task' },
  { re: /\b(summarize|summary|tl;dr|brief|overview)\b/i, intent: 'summarize' },
  { re: /\b(translate|translation|convert)\b/i, intent: 'translate' },
  { re: /\b(hello|hi|how\s+are|what\s+up|thanks|bye)\b/i, intent: 'small_talk' },
  
  // ZH (erweitert)
  { re: /(创建|安排|组织|计划).*(会议|通话|电话|约会)/i, intent: 'create_meeting' },
  { re: /(打电话|致电|呼叫|联系|通话)/i, intent: 'call_someone' },
  { re: /(任务|待办|提醒|笔记|记录)/i, intent: 'create_task' },
  { re: /(总结|概述|摘要|简要)/i, intent: 'summarize' },
  { re: /(翻译|转换)/i, intent: 'translate' },
  { re: /(你好|您好|怎么样|谢谢|再见)/i, intent: 'small_talk' },
];

export function classifyByRules(text: string): IntentResult {
  for (const r of RULES) {
    if (r.re.test(text)) return { intent: r.intent, confidence: 0.8 };
  }
  return { intent: 'unknown', confidence: 0.0 };
}

export async function classifyIntent(text: string): Promise<IntentResult> {
  const rule = classifyByRules(text);
  if (rule.intent !== 'unknown') return rule;

  try {
    const prompt = `You are an intent classifier for a WhatsApp AI secretary. 
Supported intents: create_meeting, call_someone, create_task, summarize, translate, small_talk, unknown.

Classify the user's intent from this text. Consider context and implied actions.
Return JSON: {"intent":"...","confidence":0.0-1.0}

Text: """${text}"""`;
    
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 100,
    });
    
    const content = res.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { intent: 'unknown', confidence: 0.0 };
    
    const json = JSON.parse(jsonMatch[0]);
    if (!json.intent || !['create_meeting', 'call_someone', 'create_task', 'summarize', 'translate', 'small_talk', 'unknown'].includes(json.intent)) {
      return { intent: 'unknown', confidence: 0.0 };
    }
    
    return {
      intent: json.intent,
      confidence: Math.min(Math.max(json.confidence || 0.5, 0.0), 1.0)
    };
  } catch (error) {
    console.error('[INTENT CLASSIFICATION ERROR]', error);
    return rule;
  }
}

