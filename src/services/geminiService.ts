
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QueueState, AIInsight, StaffOptimization, ServiceType, AppSettings, TokenStatus } from "../types";

// --- Global Rate Limiting & Caching Logic ---

let lastRequestEndTime = 0;
const GLOBAL_MIN_INTERVAL = 5000;
const CACHE_TTL = 60000; // 1 minute cache for wait times

interface CacheEntry {
  data: any;
  timestamp: number;
  stateKey: string;
}

const aiCache: Record<string, CacheEntry> = {};
let requestQueue: Promise<any> = Promise.resolve();

const getQueueStateKey = (state: QueueState, context: string): string => {
  const waiting = state.tokens.filter(t => t.status === TokenStatus.WAITING).length;
  const busy = state.tokens.filter(t => t.status === TokenStatus.IN_PROGRESS).length;
  const online = state.counters.filter(c => c.status === 'ONLINE').length;
  const waitingBlock = Math.floor(waiting / 2) * 2;
  return `${context}-${waitingBlock}-${busy}-${online}-${state.settings.aiPersona}`;
};

const enqueueThrottledRequest = async <T>(
  fn: () => Promise<T>,
  stateKey: string,
  retries = 3,
  delay = 3000
): Promise<T> => {
  const cached = aiCache[stateKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const result = await (requestQueue = requestQueue.then(async () => {
    const innerCached = aiCache[stateKey];
    if (innerCached && Date.now() - innerCached.timestamp < CACHE_TTL) {
      return innerCached.data;
    }

    const now = Date.now();
    const timeSinceLast = now - lastRequestEndTime;
    if (timeSinceLast < GLOBAL_MIN_INTERVAL) {
      const wait = GLOBAL_MIN_INTERVAL - timeSinceLast;
      await new Promise(resolve => setTimeout(resolve, wait));
    }

    try {
      const data = await fn();
      lastRequestEndTime = Date.now();

      aiCache[stateKey] = {
        data,
        timestamp: Date.now(),
        stateKey
      };

      return data;
    } catch (error: any) {
      lastRequestEndTime = Date.now();
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
      if (retries > 0 && isRateLimit) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return enqueueThrottledRequest(fn, stateKey, retries - 1, delay * 2);
      }
      throw error;
    }
  }));

  return result;
};

// --- Service Exports ---

/**
 * Generates a hyper-contextual notification message using Gemini.
 */
export const getAutomatedNotification = async (
  type: 'SUMMONS' | 'DELAY',
  citizenName: string,
  serviceName: string,
  currentPosition?: number,
  persona: AppSettings['aiPersona'] = 'Professional'
): Promise<string> => {
  const ai = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || "");
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const context = type === 'SUMMONS'
    ? `Citizen ${citizenName} is at position #${currentPosition} for ${serviceName}.`
    : `Citizen ${citizenName} is experiencing a delay for ${serviceName}.`;

  const prompt = `
    You are an AI Communications Officer with a ${persona} persona.
    Generate a short ${type === 'SUMMONS' ? 'summons' : 'delay apology'} message.
    Target: ${citizenName} | Service: ${serviceName}
    Tone Guidance: 
    - Professional: Efficient, clear, respectful.
    - Friendly: Warm, welcoming, informal.
    - Empathetic: Understanding, patient, supportive.
    
    Context: ${context}
    Constraint: Max 140 characters. No hashtags. Return ONLY the message string.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text()?.trim() || `Update for ${citizenName}: Regarding your ${serviceName} request, please stand by.`;
  } catch (error) {
    return `Update for ${citizenName}: Please check your position in the ${serviceName} queue.`;
  }
};

/**
 * AI-Driven Wait Time Prediction.
 * Analyzes queue state, historical throughput (average), and specific token metadata.
 */
export const getWaitTimePrediction = async (state: QueueState, userTokenId: string): Promise<number> => {
  const ai = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || "");
  const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
  const userToken = state.tokens.find(t => t.id === userTokenId);
  const waitingTokens = state.tokens.filter(t => t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN);
  const onlineCounters = state.counters.filter(c => c.status === 'ONLINE').length || 1;

  const prompt = `
    Task: Calculate precise arrival time (minutes) for CivicFlow Token #${userToken?.tokenNumber}.
    
    Data Hierarchy:
    - Service Area: ${userToken?.serviceCategory}
    - Priority Protocol: ${userToken?.priorityLevel} (${userToken?.priorityStatus})
    - Current Active Backlog: ${waitingTokens.filter(t => t.serviceCategory === userToken?.serviceCategory).length} units
    - Fleet Capacity: ${onlineCounters} active counters
    - System Efficiency Baseline: ${state.averageServiceTime} min/unit
    - Dept Load Distribution: ${state.tokens.filter(t => t.status === TokenStatus.IN_PROGRESS).length} in processing
    
    Considering real-world factors like service variety and priority interrupts, return an integer forecast.
    
    Return ONLY numerical value. No text.
  `;

  const stateKey = `wait-${userTokenId}-${waitingTokens.length}-${onlineCounters}`;

  try {
    const response = await enqueueThrottledRequest<string>(
      async () => {
        const result = await model.generateContent(prompt);
        const res = await result.response;
        return res.text();
      },
      stateKey
    );
    const minutes = parseInt(response.trim().replace(/\D/g, ''));
    return isNaN(minutes) ? Math.max(5, waitingTokens.length * 2) : minutes;
  } catch (error) {
    return Math.max(5, Math.ceil((waitingTokens.length * state.averageServiceTime) / onlineCounters));
  }
};

export const getSmartInsights = async (state: QueueState): Promise<AIInsight[]> => {
  const ai = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || "");
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  const stateKey = getQueueStateKey(state, 'insights');

  const prompt = `Provide 3 insights for ${state.settings.departmentName}. Queue: ${state.tokens.length}. Return JSON: [{title, description, recommendation, impactLevel}]`;

  return enqueueThrottledRequest<AIInsight[]>(async () => {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || '[]');
  }, stateKey);
};

export const getStaffOptimization = async (state: QueueState): Promise<StaffOptimization[]> => {
  const ai = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || "");
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  const stateKey = getQueueStateKey(state, 'optimize');
  const prompt = `Staff re-allocation JSON for ${state.settings.departmentName}. Return JSON: [{counterId, officerName, suggestedService, justification, priority}]`;

  return enqueueThrottledRequest<StaffOptimization[]>(async () => {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text() || '[]');
  }, stateKey);
};

