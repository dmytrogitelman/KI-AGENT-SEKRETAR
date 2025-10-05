import { classifyIntent } from './intents';
import { detectLanguage, translate, getLanguageName } from './lang';
import { extractSlots, formatSlotsForDisplay } from './slots';
import { findFreeSlots, createEvent, formatEventTime } from '../services/calendar/calendar';
import { createTask, getTasks, getTaskStats, formatTaskList } from '../services/tasks/taskService';
import { getPending, setPending, clearPending, incrementRetry } from '../state/pending';

export type OrchestratorResponse = { 
  text: string; 
  tts?: boolean;
  language?: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    slots?: any;
  };
};

function dtToISO(date: string, time: string, tz = 'Europe/Berlin', durMin = 30): {start: string, end: string} {
  try {
    const [Y, M, D] = date.split('-').map(Number);
    const [h, m] = time.split(':').map(Number);
    
    // Create date in user's timezone
    const start = new Date();
    start.setFullYear(Y, M-1, D);
    start.setHours(h, m, 0, 0);
    
    const end = new Date(start.getTime() + durMin * 60000);
    
    return { 
      start: start.toISOString(), 
      end: end.toISOString() 
    };
  } catch (error) {
    console.error('[DATE TIME CONVERSION ERROR]', error);
    // Fallback to current time + duration
    const now = new Date();
    const end = new Date(now.getTime() + durMin * 60000);
    return {
      start: now.toISOString(),
      end: end.toISOString()
    };
  }
}

export async function processMessage(userId: string, text: string): Promise<OrchestratorResponse> {
  try {
    console.log(`[ORCHESTRATOR] Processing message from user ${userId}: "${text}"`);

    // 0) Check for pending session
    const pending = await getPending(userId);
    if (pending) {
      console.log(`[ORCHESTRATOR] Found pending session: ${pending.intent}`);
      
      // Handle confirmation
      if (/^\s*(да|yes|ок|okay|подтверждаю|confirm|ja|sí|oui|是|はい)\s*$/i.test(text)) {
        return await handleConfirmation(userId, pending);
      }
      
      // Handle cancellation
      if (/^\s*(нет|no|cancel|отмена|отменить|nein|non|不|いいえ)\s*$/i.test(text)) {
        await clearPending(userId);
        return { text: 'Действие отменено. Чем еще могу помочь?', tts: true };
      }
      
      // Handle additional information
      return await handleAdditionalInfo(userId, pending, text);
    }

    // 1) Detect language
    const detectedLang = await detectLanguage(text).catch(() => 'en');
    console.log(`[ORCHESTRATOR] Detected language: ${detectedLang}`);

    // 2) Classify intent
    const intentResult = await classifyIntent(text, detectedLang);
    console.log(`[ORCHESTRATOR] Intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`);

    // 3) Process by intent
    switch (intentResult.intent) {
      case 'translate':
        return await handleTranslate(text, detectedLang);
        
      case 'create_task':
        return await handleCreateTask(userId, text, detectedLang);
        
      case 'create_meeting':
        return await handleCreateMeeting(userId, text, detectedLang);
        
      case 'call_someone':
        return await handleCallSomeone(text, detectedLang);
        
      case 'summarize':
        return await handleSummarize(text, detectedLang);
        
      case 'small_talk':
        return await handleSmallTalk(text, detectedLang);
        
      default:
        return await handleUnknown(text, detectedLang);
    }
  } catch (error) {
    console.error('[ORCHESTRATOR ERROR]', error);
    return { 
      text: 'Извините, произошла ошибка. Попробуйте еще раз.', 
      tts: true,
      language: 'ru'
    };
  }
}

async function handleConfirmation(userId: string, pending: any): Promise<OrchestratorResponse> {
  try {
    if (pending.intent === 'create_meeting') {
      const slots = pending.slots;
      const dt = dtToISO(slots.date, slots.time, 'Europe/Berlin', slots.duration_min || 30);
      
      const result = await createEvent(userId, {
        title: slots.title || 'Встреча',
        startISO: dt.start,
        endISO: dt.end,
        attendees: slots.attendees,
        zoom: true,
        location: slots.location,
        description: slots.description,
      });
      
      await clearPending(userId);
      
      if (result.ok) {
        const timeStr = formatEventTime(dt.start, dt.end);
        let response = `✅ Встреча создана!\n📅 ${timeStr}\n📝 ${slots.title || 'Встреча'}`;
        
        if (result.joinUrl) {
          response += `\n🔗 Zoom: ${result.joinUrl}`;
        }
        
        if (slots.attendees?.length) {
          response += `\n👥 Участники: ${slots.attendees.join(', ')}`;
        }
        
        return { text: response, tts: true };
      } else {
        return { text: `❌ Не удалось создать встречу: ${result.error}`, tts: true };
      }
    }
    
    if (pending.intent === 'create_task') {
      const slots = pending.slots;
      const result = await createTask(userId, {
        title: slots.title || 'Задача',
        description: slots.description,
        dueAt: slots.due_date,
        priority: slots.priority || 'medium',
        tags: slots.tags,
      });
      
      await clearPending(userId);
      
      if (result.ok && result.task) {
        return { text: `✅ Задача создана: ${result.task.title}`, tts: true };
      } else {
        return { text: `❌ Не удалось создать задачу: ${result.error}`, tts: true };
      }
    }
    
    await clearPending(userId);
    return { text: 'Подтверждение обработано.', tts: true };
  } catch (error) {
    console.error('[CONFIRMATION ERROR]', error);
    await clearPending(userId);
    return { text: 'Ошибка при обработке подтверждения.', tts: true };
  }
}

async function handleAdditionalInfo(userId: string, pending: any, text: string): Promise<OrchestratorResponse> {
  try {
    // Try to extract additional slots from the new text
    const additionalSlots = await extractSlots(text, pending.intent, 'en');
    
    // Merge with existing slots
    const mergedSlots = { ...pending.slots, ...additionalSlots };
    
    // Update pending session
    await setPending(userId, {
      step: pending.step,
      intent: pending.intent,
      slots: mergedSlots,
    });
    
    // Generate updated summary
    if (pending.intent === 'create_meeting') {
      const slots = mergedSlots;
      if (!slots.date || !slots.time) {
        return { text: 'Уточни дату и время встречи (например: завтра в 15:00 на 30 минут).', tts: true };
      }
      
      const summary = `Создать встречу "${slots.title || 'Встреча'}" ${slots.date} в ${slots.time} на ${slots.duration_min || 30} мин${slots.attendees?.length ? ' с ' + slots.attendees.join(', ') : ''}. Подтверди? (да/нет)`;
      return { text: summary, tts: true };
    }
    
    if (pending.intent === 'create_task') {
      const slots = mergedSlots;
      if (!slots.title) {
        return { text: 'Как сформулировать задачу?', tts: true };
      }
      
      const summary = `Создать задачу "${slots.title}"${slots.due_date ? ' до ' + slots.due_date : ''}${slots.priority ? ' (приоритет: ' + slots.priority + ')' : ''}. Подтверди? (да/нет)`;
      return { text: summary, tts: true };
    }
    
    return { text: 'Информация обновлена. Подтверди? (да/нет)', tts: true };
  } catch (error) {
    console.error('[ADDITIONAL INFO ERROR]', error);
    return { text: 'Не удалось обработать дополнительную информацию.', tts: true };
  }
}

async function handleTranslate(text: string, detectedLang: string): Promise<OrchestratorResponse> {
  try {
    // Extract target language and text to translate
    const langPatterns = [
      { re: /на\s+(русский|немецкий|английский|китайский|испанский|французский)/i, lang: 'ru' },
      { re: /на\s+(de|en|ru|zh|es|fr)/i, lang: 'en' },
      { re: /to\s+(russian|german|english|chinese|spanish|french)/i, lang: 'en' },
      { re: /ins\s+(russische|deutsche|englische|chinesische|spanische|französische)/i, lang: 'de' },
    ];
    
    let targetLang = 'en'; // Default
    let textToTranslate = text;
    
    for (const pattern of langPatterns) {
      const match = text.match(pattern.re);
      if (match) {
        const langMap: Record<string, string> = {
          'русский': 'ru', 'немецкий': 'de', 'английский': 'en', 'китайский': 'zh', 'испанский': 'es', 'французский': 'fr',
          'russian': 'ru', 'german': 'de', 'english': 'en', 'chinese': 'zh', 'spanish': 'es', 'french': 'fr',
          'russische': 'ru', 'deutsche': 'de', 'englische': 'en', 'chinesische': 'zh', 'spanische': 'es', 'französische': 'fr',
        };
        
        targetLang = langMap[match[1].toLowerCase()] || match[1].toLowerCase();
        textToTranslate = text.replace(pattern.re, '').trim();
        break;
      }
    }
    
    if (textToTranslate.length === 0) {
      textToTranslate = text;
    }
    
    const translation = await translate(textToTranslate, targetLang, detectedLang);
    const targetLangName = getLanguageName(targetLang);
    
    return { 
      text: `🌐 Перевод на ${targetLangName}:\n\n${translation}`, 
      tts: true,
      language: targetLang
    };
  } catch (error) {
    console.error('[TRANSLATE ERROR]', error);
    return { text: 'Не удалось выполнить перевод.', tts: true };
  }
}

async function handleCreateTask(userId: string, text: string, detectedLang: string): Promise<OrchestratorResponse> {
  try {
    const slots = await extractSlots(text, 'create_task', detectedLang);
    
    if (!slots.title) {
      return { text: 'Как сформулировать задачу? Опиши, что нужно сделать.', tts: true };
    }
    
    // For simple tasks, create immediately
    if (slots.title && !slots.due_date && !slots.priority) {
      const result = await createTask(userId, {
        title: slots.title,
        description: slots.description,
      });
      
      if (result.ok) {
        return { text: `✅ Задача создана: ${slots.title}`, tts: true };
      } else {
        return { text: `❌ Не удалось создать задачу: ${result.error}`, tts: true };
      }
    }
    
    // For complex tasks, ask for confirmation
    const summary = `Создать задачу "${slots.title}"${slots.due_date ? ' до ' + slots.due_date : ''}${slots.priority ? ' (приоритет: ' + slots.priority + ')' : ''}. Подтверди? (да/нет)`;
    
    await setPending(userId, {
      step: 'confirm',
      intent: 'create_task',
      slots,
    });
    
    return { text: summary, tts: true };
  } catch (error) {
    console.error('[CREATE TASK ERROR]', error);
    return { text: 'Не удалось создать задачу.', tts: true };
  }
}

async function handleCreateMeeting(userId: string, text: string, detectedLang: string): Promise<OrchestratorResponse> {
  try {
    const slots = await extractSlots(text, 'create_meeting', detectedLang);
    
    if (!slots.date || !slots.time) {
      return { text: 'Уточни дату и время встречи (например: завтра в 15:00 на 30 минут).', tts: true };
    }
    
    const summary = `Создать встречу "${slots.title || 'Встреча'}" ${slots.date} в ${slots.time} на ${slots.duration_min || 30} мин${slots.attendees?.length ? ' с ' + slots.attendees.join(', ') : ''}${slots.location ? ' в ' + slots.location : ''}. Подтверди? (да/нет)`;
    
    await setPending(userId, {
      step: 'confirm',
      intent: 'create_meeting',
      slots,
    });
    
    return { text: summary, tts: true };
  } catch (error) {
    console.error('[CREATE MEETING ERROR]', error);
    return { text: 'Не удалось создать встречу.', tts: true };
  }
}

async function handleCallSomeone(text: string, detectedLang: string): Promise<OrchestratorResponse> {
  const responses = [
    'Могу предложить: создать встречу/напоминание о звонке, или отправить контакт. Что предпочитаешь?',
    'Для звонка могу: создать встречу в календаре, поставить напоминание, или сохранить контакт. Что нужно?',
    'Могу помочь с организацией звонка: создать встречу, напомнить о звонке, или сохранить контактную информацию.',
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return { text: randomResponse, tts: true };
}

async function handleSummarize(text: string, detectedLang: string): Promise<OrchestratorResponse> {
  return { 
    text: 'Пришли мне текст/подборку пунктов — сделаю краткую выжимку. Пока что могу помочь с другими задачами: создать встречу, задачу, перевести текст.', 
    tts: true 
  };
}

async function handleSmallTalk(text: string, detectedLang: string): Promise<OrchestratorResponse> {
  const greetings = [
    'Привет! Я твой AI-секретарь. Могу помочь с организацией встреч, созданием задач, переводом текста и другими делами. Что нужно сделать?',
    'Здравствуй! Готов помочь с планированием и организацией. Могу создать встречу, задачу, перевести текст. Чем займемся?',
    'Привет! Я здесь, чтобы помочь с твоими задачами. Могу организовать встречу, создать напоминание, перевести текст. Что делаем?',
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  return { text: randomGreeting, tts: true };
}

async function handleUnknown(text: string, detectedLang: string): Promise<OrchestratorResponse> {
  const responses = [
    'Понял. Могу помочь: создать встречу, задачу, перевести текст, подытожить информацию. Что нужно сделать?',
    'Не совсем понял, что нужно. Могу: организовать встречу, создать задачу, перевести текст. Опиши подробнее?',
    'Готов помочь! Доступные функции: планирование встреч, создание задач, перевод текста. Что выберешь?',
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return { text: randomResponse, tts: true };
}
