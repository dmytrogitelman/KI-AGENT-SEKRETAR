import Redis from 'ioredis';

export type Pending = { 
  step: string; 
  intent: string; 
  slots: any; 
  expiresAt: number;
  userId: string;
  createdAt: number;
  retryCount?: number;
};

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;

const redisUrl = process.env['REDIS_URL'] || '';
const memory = new Map<string, Pending>();
let redis: Redis | null = null;

// Initialize Redis connection
if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    
    redis.on('error', (err) => {
      console.error('[REDIS ERROR]', err);
      redis = null; // Fallback to memory
    });
    
    redis.on('connect', () => {
      console.log('[REDIS] Connected successfully');
    });
  } catch (error) {
    console.error('[REDIS INIT ERROR]', error);
    redis = null;
  }
}

export async function setPending(userId: string, data: Omit<Pending, 'expiresAt' | 'userId' | 'createdAt'>): Promise<void> {
  const pending: Pending = { 
    ...data, 
    userId,
    expiresAt: Date.now() + TTL_MS,
    createdAt: Date.now(),
    retryCount: data.retryCount || 0,
  };

  try {
    if (redis) {
      await redis.setex(
        `pending:${userId}`, 
        TTL_MS / 1000, 
        JSON.stringify(pending)
      );
    } else {
      memory.set(userId, pending);
    }
    console.log(`[PENDING] Set for user ${userId}:`, data.intent);
  } catch (error) {
    console.error('[PENDING SET ERROR]', error);
    // Fallback to memory
    memory.set(userId, pending);
  }
}

export async function getPending(userId: string): Promise<Pending | null> {
  try {
    if (redis) {
      const raw = await redis.get(`pending:${userId}`);
      if (!raw) return null;
      
      const pending = JSON.parse(raw) as Pending;
      
      // Check if expired
      if (pending.expiresAt < Date.now()) {
        await clearPending(userId);
        return null;
      }
      
      return pending;
    } else {
      const pending = memory.get(userId);
      if (!pending) return null;
      
      // Check if expired
      if (pending.expiresAt < Date.now()) {
        memory.delete(userId);
        return null;
      }
      
      return pending;
    }
  } catch (error) {
    console.error('[PENDING GET ERROR]', error);
    return null;
  }
}

export async function updatePending(userId: string, updates: Partial<Omit<Pending, 'userId' | 'createdAt' | 'expiresAt'>>): Promise<boolean> {
  const existing = await getPending(userId);
  if (!existing) return false;

  const updated: Pending = {
    ...existing,
    ...updates,
    expiresAt: Date.now() + TTL_MS, // Reset expiration
  };

  try {
    if (redis) {
      await redis.setex(
        `pending:${userId}`, 
        TTL_MS / 1000, 
        JSON.stringify(updated)
      );
    } else {
      memory.set(userId, updated);
    }
    return true;
  } catch (error) {
    console.error('[PENDING UPDATE ERROR]', error);
    return false;
  }
}

export async function clearPending(userId: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(`pending:${userId}`);
    } else {
      memory.delete(userId);
    }
    console.log(`[PENDING] Cleared for user ${userId}`);
  } catch (error) {
    console.error('[PENDING CLEAR ERROR]', error);
    // Fallback to memory
    memory.delete(userId);
  }
}

export async function incrementRetry(userId: string): Promise<boolean> {
  const pending = await getPending(userId);
  if (!pending) return false;

  const newRetryCount = (pending.retryCount || 0) + 1;
  
  if (newRetryCount >= MAX_RETRIES) {
    await clearPending(userId);
    return false;
  }

  return await updatePending(userId, { retryCount: newRetryCount });
}

export async function getAllPending(): Promise<Pending[]> {
  try {
    if (redis) {
      const keys = await redis.keys('pending:*');
      const values = await redis.mget(...keys);
      
      return values
        .filter((v): v is string => v !== null)
        .map(v => JSON.parse(v))
        .filter((p: Pending) => p.expiresAt > Date.now());
    } else {
      const now = Date.now();
      return Array.from(memory.values())
        .filter(p => p.expiresAt > now);
    }
  } catch (error) {
    console.error('[PENDING GET ALL ERROR]', error);
    return [];
  }
}

export async function cleanupExpired(): Promise<number> {
  const now = Date.now();
  let cleaned = 0;

  try {
    if (redis) {
      const keys = await redis.keys('pending:*');
      const values = await redis.mget(...keys);
      
      const expiredKeys: string[] = [];
      values.forEach((v, i) => {
        if (v) {
          const pending = JSON.parse(v) as Pending;
          if (pending.expiresAt <= now) {
            const key = keys[i];
            if (key) {
              expiredKeys.push(key);
            }
          }
        }
      });

      if (expiredKeys.length > 0) {
        await redis.del(...expiredKeys);
        cleaned = expiredKeys.length;
      }
    } else {
      for (const [userId, pending] of memory.entries()) {
        if (pending.expiresAt <= now) {
          memory.delete(userId);
          cleaned++;
        }
      }
    }
  } catch (error) {
    console.error('[PENDING CLEANUP ERROR]', error);
  }

  if (cleaned > 0) {
    console.log(`[PENDING] Cleaned up ${cleaned} expired sessions`);
  }

  return cleaned;
}

// Cleanup expired sessions every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);

