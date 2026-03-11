
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  useTokens, useServices, useCounters,
  useIssueToken, useUpdateTokenStatus, useUpdateCounterStatus,
  useUpdateToken, useAddCounter, useRemoveCounter, useUpdateCounter,
  useAddService, useUpdateService, useRemoveService, QUERY_KEYS
} from '../hooks/useQueue';
import { useRealtimeSubscription } from '../hooks/useRealtime';
import { Token, Counter, TokenStatus, ServiceType, QueueState, GlobalPolicy, AppSettings, ServiceDefinition, TokenNotification } from '../types';
import { DEFAULT_SERVICES, INITIAL_COUNTERS } from '../constants';
import { IS_MOCK } from '../lib/firebase';
import { useToast } from './ToastContext';

interface QueueContextType {
  state: QueueState;
  issueToken: (params: {
    name: string;
    category: string;
    service: ServiceType;
    isPriority: boolean;
    isSenior?: boolean;
    dob?: string;
    userId?: string;
    idProof?: string;
    medicalProof?: string;
    contact?: { phone?: string; email?: string; prefs: { sms: boolean; email: boolean } }
  }) => Promise<Token>;
  callNext: (counterId: number) => Promise<Token | null>;
  serveToken: (tokenId: string, counterId: number) => Promise<boolean>;
  checkInToken: (tokenId: string, counterId: number) => Promise<boolean>;
  completeCurrent: (counterId: number) => Promise<void>;
  cancelToken: (tokenId: string) => Promise<void>;
  skipToken: (counterId: number, reason: string) => Promise<void>;
  transferToken: (tokenId: string, targetCategory: string, targetService: ServiceType) => Promise<void>;
  elevateToEmergency: (tokenId: string) => Promise<void>;
  submitFeedback: (tokenId: string, rating: number) => Promise<void>;
  updateCounterStatus: (counterId: number, isOnline: boolean) => Promise<void>;
  updateCounterName: (counterId: number, name: string) => Promise<void>;
  addCounter: (name: string, officer: string) => Promise<void>;
  removeCounter: (id: number) => Promise<void>;
  updateCounterServices: (counterId: number, services: string[]) => Promise<void>;
  updatePolicy: (policy: Partial<GlobalPolicy>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addService: (service: ServiceDefinition) => Promise<void>;
  updateService: (id: string, service: Partial<ServiceDefinition>) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  sendNotification: (tokenId: string, message: string, type?: TokenNotification['type'], channel?: TokenNotification['channel']) => void;
  broadcastAlert: (message: string, type: TokenNotification['type'], serviceTarget?: string | 'ALL') => void;
  getCountersForService: (category: string) => Counter[];
  updateTokenWaitTime: (tokenId: string, minutes: number) => void;
  approvePriority: (tokenId: string) => Promise<void>;
  rejectPriority: (tokenId: string, reason?: string) => Promise<void>;
  rejoinQueue: (tokenId: string) => Promise<void>;
  recallToken: (tokenId: string, counterId: number) => Promise<void>;
  verifyToken: (tokenId: string) => Promise<void>;
  rejectToken: (tokenId: string, reason: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const getSafeStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  // Local State fallback
  const [localServices, setLocalServices] = useState<ServiceDefinition[]>(() => getSafeStorage('civicflow_local_services', DEFAULT_SERVICES));
  const [localCounters, setLocalCounters] = useState<Counter[]>(() => {
    const cached = getSafeStorage<Counter[]>('civicflow_local_counters', []);
    if (cached.length > 0) {
      // Sync names and services from INITIAL_COUNTERS to ensure strict filtering is applied
      return cached.map(c => {
        const initial = INITIAL_COUNTERS.find(ic => ic.id === c.id);
        if (initial) {
          return {
            ...c,
            name: initial.name,
            assignedServices: (initial as any).assignedServices
          };
        }
        return c;
      });
    }
    return INITIAL_COUNTERS.map((c: any) => ({
      id: c.id,
      name: c.name,
      officerName: c.officerName,
      status: 'ONLINE',
      isOnline: true,
      assignedServices: c.assignedServices || DEFAULT_SERVICES.map((s: any) => s.name),
      isActive: true
    } as Counter));
  });
  const [localTokens, setLocalTokens] = useState<Token[]>(() => getSafeStorage('civicflow_local_tokens', []));

  useEffect(() => {
    localStorage.setItem('civicflow_local_services', JSON.stringify(localServices));
    localStorage.setItem('civicflow_local_counters', JSON.stringify(localCounters));
    localStorage.setItem('civicflow_local_tokens', JSON.stringify(localTokens));
  }, [localServices, localCounters, localTokens]);

  // Master Sync: Ensure localServices matches DEFAULT_SERVICES exactly in Mock Mode
  useEffect(() => {
    if (IS_MOCK) {
      const hasMismatch = localServices.length !== DEFAULT_SERVICES.length ||
        DEFAULT_SERVICES.some(ds => {
          const ls = localServices.find(l => l.id === ds.id);
          return !ls || ls.name !== ds.name || ls.icon !== ds.icon;
        });

      if (hasMismatch) {
        setLocalServices(DEFAULT_SERVICES);
      }
    }
  }, [localServices]);

  const { data: firebaseTokens, isLoading: isLoadingTokens } = useTokens();
  const { data: servicesData = [], isLoading: isLoadingServices } = useServices();
  const { data: countersData = [], isLoading: isLoadingCounters } = useCounters();

  const tokens = IS_MOCK ? localTokens : (firebaseTokens || []);
  const services = IS_MOCK ? localServices : (servicesData.length > 0 ? servicesData : DEFAULT_SERVICES);
  const counters = IS_MOCK ? localCounters : (countersData.length > 0 ? (countersData as Counter[]) : INITIAL_COUNTERS.map((c: any) => ({
    id: c.id,
    name: c.name,
    officerName: c.officerName,
    status: 'ONLINE',
    isOnline: true,
    assignedServices: c.assignedServices || DEFAULT_SERVICES.map((s: any) => s.name),
    isActive: true
  } as Counter)));

  const allTokens = tokens;
  const isLoading = !IS_MOCK && (isLoadingTokens || isLoadingServices || isLoadingCounters);

  const issueTokenMutation = useIssueToken();
  const updateTokenStatusMutation = useUpdateTokenStatus();
  const updateCounterStatusMutation = useUpdateCounterStatus();
  const updateTokenMutation = useUpdateToken();
  const addCounterMutation = useAddCounter();
  const removeCounterMutation = useRemoveCounter();
  const updateCounterMutation = useUpdateCounter();
  const addServiceMutation = useAddService();
  const updateServiceMutation = useUpdateService();
  const removeServiceMutation = useRemoveService();

  // Real-time Subscriptions
  useRealtimeSubscription('tokens', QUERY_KEYS.tokens);
  useRealtimeSubscription('counters', QUERY_KEYS.counters);
  useRealtimeSubscription('services', QUERY_KEYS.services);

  // Local State (Settings/Policies) - could also be moved to DB later
  const initialSettings = getSafeStorage<AppSettings>('civicflow_settings', {
    departmentName: 'CivicFlow General Office',
    officeStartTime: '09:00',
    officeEndTime: '17:00',
    aiThinkingBudget: 15000,
    aiPersona: 'Professional',
    language: 'EN',
    securityLevel: 'Standard',
    enableHaptics: true,
    notificationThresholds: { nearingFront: 3, delayMinutes: 20 }
  });

  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [policies, setPolicies] = useState<GlobalPolicy>({
    autoPriorityForSeniors: true,
    enableAutoEscalation: false,
    escalationThresholdMinutes: 30
  });
  const [blacklistedPhones] = useState<string[]>(() => getSafeStorage('civicflow_blacklist', []));
  const [averageServiceTime] = useState(10);

  // Persistence for local settings
  useEffect(() => {
    localStorage.setItem('civicflow_settings', JSON.stringify(settings));
    localStorage.setItem('civicflow_blacklist', JSON.stringify(blacklistedPhones));
  }, [settings, blacklistedPhones]);

  // Cross-tab synchronization for Mock Mode
  useEffect(() => {
    if (!IS_MOCK) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'civicflow_local_tokens' && e.newValue) {
        setLocalTokens(JSON.parse(e.newValue));
      }
      if (e.key === 'civicflow_local_counters' && e.newValue) {
        setLocalCounters(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Actions
  const issueToken = async (params: any) => {
    // Validation
    if (params.contact?.phone && blacklistedPhones.includes(params.contact.phone)) {
      throw new Error("Registry Error: This mobile contact is currently flagged for policy violations.");
    }

    const localId = crypto.randomUUID();
    const tokenNum = Math.floor(100 + Math.random() * 900);
    const serviceName = services.find((s: any) => s.id === params.category || s.id === params.service || s.name === params.category)?.name || params.category;

    const calculateAge = (dobString?: string) => {
      if (!dobString) return 0;
      const today = new Date();
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return 0;
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const age = params.dob ? calculateAge(params.dob) : 0;
    const isEligibleSenior = age >= 60;
    const isEmergency = !!params.medicalProof || params.priorityLevel === 'EMERGENCY' || params.category === 'EMERGENCY';
    const needsVerification = isEligibleSenior || !!params.medicalProof || !!params.idProof;

    const newToken: Token = {
      id: localId,
      citizenName: params.name,
      dob: params.dob,
      phone: params.contact?.phone,
      serviceId: params.service,
      serviceCategory: serviceName,
      serviceType: params.service,
      status: needsVerification ? TokenStatus.PENDING_VERIFICATION : TokenStatus.WAITING,
      priorityLevel: (isEligibleSenior && isEmergency) ? 'EMERGENCY' : (isEligibleSenior ? 'SENIOR' : (isEmergency ? 'EMERGENCY' : 'NORMAL')),
      priorityStatus: needsVerification ? 'PENDING_VERIFICATION' : 'NONE',
      tokenNumber: `${serviceName.charAt(0).toUpperCase()}-${tokenNum}`,
      number: tokenNum,
      createdAt: new Date().toISOString(),
      notificationPreferences: params.contact?.prefs || { sms: true, email: false },
      notifications: [],
      skipCount: 0,
      isPriority: needsVerification || !!params.isPriority,
      isEmergency: isEmergency,
      isSenior: isEligibleSenior,
      userId: params.userId,
      idProof: params.idProof,
      medicalProof: params.medicalProof,
      assignedCounter: undefined,
      estimatedWaitTime: 5
    };

    if (IS_MOCK) {
      setLocalTokens(prev => [...prev, newToken]);
      showToast(`Token ${newToken.tokenNumber} issued successfully!`, 'success');
      return newToken;
    }

    try {
      // Pass full token data to Supabase (mapping is handled in the hook)
      const result = await issueTokenMutation.mutateAsync(newToken);
      showToast(`Token ${newToken.tokenNumber} issued to database!`, 'success');
      // Map back to our full Token type if needed
      return { ...newToken, id: (result as any).id || newToken.id };
    } catch (e) {
      console.warn("Supabase issueToken failed, using local fallback:", e);
      setLocalTokens(prev => [...prev, newToken]);
      showToast("Backend connection issue. Token saved locally.", "warning");
      return newToken;
    }
  };

  const getPriorityWeight = (token: Token) => {
    let weight = 0;
    const isEmergency = token.priorityLevel === 'EMERGENCY' || token.isEmergency;
    const isSenior = token.priorityLevel === 'SENIOR' || token.isSenior;

    if (isSenior && isEmergency) weight = 100;
    else if (isEmergency) weight = 75;
    else if (isSenior) weight = 50;
    else weight = 25;

    // Small bonus for checked-in tokens to push them ahead of same-priority waiting tokens
    if (token.status === TokenStatus.CHECKED_IN) weight += 10;

    return weight;
  };

  const callNext = async (counterId: number) => {
    const counter = counters.find(c => c.id === counterId);
    if (!counter) return null;

    // Logic to find next eligible token
    const eligibleTokens = allTokens
      .filter((t: Token) =>
        (t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN) &&
        counter.assignedServices.includes(t.serviceCategory)
      )
      .sort((a: Token, b: Token) => {
        const weightA = getPriorityWeight(a);
        const weightB = getPriorityWeight(b);
        if (weightA !== weightB) return weightB - weightA;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    if (eligibleTokens.length === 0) return null;
    const nextToken = eligibleTokens[0];

    // Update token status
    if (IS_MOCK || localTokens.some((lt: Token) => lt.id === nextToken.id)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === nextToken.id ? { ...t, status: TokenStatus.IN_PROGRESS, counterId, serviceStartTime: Date.now() } : t));
      setLocalCounters((prev: Counter[]) => prev.map((c: Counter) => c.id === counterId ? { ...c, currentTokenId: nextToken.id } : c));
    } else {
      await updateTokenStatusMutation.mutateAsync({
        id: nextToken.id,
        status: TokenStatus.IN_PROGRESS,
        counterId
      });
      await updateCounterMutation.mutateAsync({
        id: counterId,
        updates: { currentTokenId: nextToken.id }
      });
    }

    return nextToken;
  };

  const serveToken = async (tokenId: string, counterId: number) => {
    if (IS_MOCK || localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: TokenStatus.IN_PROGRESS, counterId, serviceStartTime: Date.now() } : t));
      setLocalCounters(prev => prev.map(c => c.id === counterId ? { ...c, currentTokenId: tokenId } : c));
    } else {
      await updateTokenStatusMutation.mutateAsync({ id: tokenId, status: TokenStatus.IN_PROGRESS, counterId });
      await updateCounterMutation.mutateAsync({ id: counterId, updates: { currentTokenId: tokenId } });
    }
    return true;
  };

  const completeCurrent = async (counterId: number) => {
    const activeToken = allTokens.find((t: Token) => t.counterId === counterId && t.status === TokenStatus.IN_PROGRESS);
    if (activeToken) {
      if (IS_MOCK || localTokens.some(lt => lt.id === activeToken.id)) {
        setLocalTokens(prev => prev.map(t => t.id === activeToken.id ? { ...t, status: TokenStatus.COMPLETED } : t));
        setLocalCounters(prev => prev.map(c => c.id === counterId ? { ...c, currentTokenId: undefined } : c));
      } else {
        await updateTokenStatusMutation.mutateAsync({ id: activeToken.id, status: TokenStatus.COMPLETED });
        await updateCounterMutation.mutateAsync({ id: counterId, updates: { currentTokenId: null } });
      }
    }
  };

  const checkInToken = async (tokenId: string, counterId: number) => {
    if (IS_MOCK || localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: TokenStatus.CHECKED_IN, counterId } : t));
    } else {
      await updateTokenStatusMutation.mutateAsync({ id: tokenId, status: TokenStatus.CHECKED_IN, counterId });
    }
    return true;
  };

  const cancelToken = async (tokenId: string) => {
    if (IS_MOCK || localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: TokenStatus.CANCELLED } : t));
    } else {
      await updateTokenStatusMutation.mutateAsync({ id: tokenId, status: TokenStatus.CANCELLED });
    }
  };

  const skipToken = async (counterId: number, reason: string) => {
    const activeToken = allTokens.find((t: Token) => t.counterId === counterId && t.status === TokenStatus.IN_PROGRESS);
    if (activeToken) {
      const newSkipCount = (activeToken.skipCount || 0) + 1;
      const isLiquidated = newSkipCount >= 3;

      if (IS_MOCK || localTokens.some(lt => lt.id === activeToken.id)) {
        setLocalTokens(prev => prev.map(t => t.id === activeToken.id ? {
          ...t,
          status: isLiquidated ? TokenStatus.CANCELLED : TokenStatus.SKIPPED,
          skipCount: newSkipCount,
          skipReason: reason
        } : t));
        setLocalCounters(prev => prev.map(c => c.id === counterId ? { ...c, currentTokenId: undefined } : c));
      } else {
        await updateTokenMutation.mutateAsync({
          id: activeToken.id,
          updates: {
            status: isLiquidated ? TokenStatus.CANCELLED : TokenStatus.SKIPPED,
            skip_count: newSkipCount,
            skip_reason: reason
          }
        });
        await updateCounterMutation.mutateAsync({ id: counterId, updates: { currentTokenId: null } });
      }

      if (isLiquidated) {
        await sendNotification(activeToken.id, "Registry Notice: Your token has been cancelled due to excessive skips. Please book a new token for tomorrow.", 'SYSTEM_ALERT');
        showToast(`Token ${activeToken.tokenNumber} cancelled (3 skips reached).`, 'error');
      } else {
        await sendNotification(activeToken.id, `Registry Notice: Your turn was skipped for: ${reason}. You have ${3 - newSkipCount} attempts remaining. Re-join the queue via portal.`, 'SYSTEM_ALERT');
        showToast(`Token ${activeToken.tokenNumber} skipped.`, 'info');
      }
    }
  };

  const transferToken = async (tokenId: string, targetCategory: string, targetService: ServiceType) => {
    if (IS_MOCK || localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, serviceId: targetService, status: TokenStatus.WAITING } : t));
    } else {
      await updateTokenMutation.mutateAsync({ id: tokenId, updates: { service_id: targetService, status: TokenStatus.WAITING } });
    }
    console.log(`Transferred token ${tokenId} to category ${targetCategory}`);
  };

  const elevateToEmergency = async (tokenId: string) => {
    if (IS_MOCK || localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, priorityLevel: 'EMERGENCY' } : t));
    } else {
      await updateTokenMutation.mutateAsync({ id: tokenId, updates: { priority_level: 'EMERGENCY' } });
    }
  };

  const submitFeedback = async (tokenId: string, rating: number) => {
    if (localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, feedback: { rating, timestamp: Date.now() } } : t));
    } else {
      console.log(`Feedback received for ${tokenId}: ${rating}/5`);
      // await updateTokenMutation.mutateAsync({ id: tokenId, updates: { feedback_rating: rating } }); 
    }
  };

  const updateCounterStatus = async (id: number, isOnline: boolean) => {
    const status = isOnline ? 'ONLINE' : 'OFFLINE';
    if (IS_MOCK) {
      setLocalCounters(prev => prev.map(c => c.id === id ? { ...c, status: status as any, isOnline } : c));
    } else {
      await updateCounterStatusMutation.mutateAsync({ id, status });
    }
  };

  const updateCounterName = async (counterId: number, name: string) => {
    if (IS_MOCK) {
      setLocalCounters(prev => prev.map(c => c.id === counterId ? { ...c, name } : c));
    } else {
      await updateCounterMutation.mutateAsync({ id: counterId, updates: { name } });
    }
  };

  const addCounter = async (name: string, officer: string) => {
    if (IS_MOCK) {
      const nextId = Math.max(0, ...localCounters.map(c => c.id)) + 1;
      const newCounter: Counter = {
        id: nextId,
        name,
        officerName: officer,
        status: 'OFFLINE',
        assignedServices: localServices.map(s => s.name),
        isActive: true
      };
      setLocalCounters(prev => [...prev, newCounter]);
    } else {
      await addCounterMutation.mutateAsync({ name, officer });
    }
  };

  const removeCounter = async (id: number) => {
    if (IS_MOCK) {
      setLocalCounters(prev => prev.filter(c => c.id !== id));
    } else {
      await removeCounterMutation.mutateAsync(id);
    }
  };

  const updateCounterServices = async (counterId: number, services: string[]) => {
    if (IS_MOCK) {
      setLocalCounters(prev => prev.map(c => c.id === counterId ? { ...c, assignedServices: services } : c));
    } else {
      await updateCounterMutation.mutateAsync({ id: counterId, updates: { assigned_services: services } });
    }
  };

  const addService = async (service: ServiceDefinition) => {
    if (IS_MOCK) {
      setLocalServices(prev => [...prev, service]);
    } else {
      await addServiceMutation.mutateAsync(service);
    }
  };

  const updateService = async (id: string, service: Partial<ServiceDefinition>) => {
    if (IS_MOCK) {
      setLocalServices(prev => prev.map(s => s.id === id ? { ...s, ...service } : s));
    } else {
      await updateServiceMutation.mutateAsync({ id, updates: service });
    }
  };

  const removeService = async (id: string) => {
    if (IS_MOCK) {
      setLocalServices(prev => prev.filter(s => s.id !== id));
    } else {
      await removeServiceMutation.mutateAsync(id);
    }
  };

  const updateTokenWaitTime = (tokenId: string, minutes: number) => {
    if (localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens(prev => prev.map(t => t.id === tokenId ? { ...t, estimatedWaitTime: minutes } : t));
    } else {
      updateTokenMutation.mutate({ id: tokenId, updates: { estimated_wait_time: minutes } });
    }
  };

  const sendNotification = async (tokenId: string, message: string, type: TokenNotification['type'] = 'SYSTEM_ALERT', channel: TokenNotification['channel'] = 'PUSH') => {
    try {
      const notification: TokenNotification = {
        id: crypto.randomUUID(),
        message,
        timestamp: Date.now(),
        type,
        channel,
        deliveryStatus: 'Dispatched'
      };

      if (IS_MOCK || localTokens.some((lt: Token) => lt.id === tokenId)) {
        setLocalTokens((prev: Token[]) => {
          const updated = prev.map((t: Token) => t.id === tokenId ? {
            ...t,
            notifications: [notification, ...(t.notifications || [])]
          } : t);
          localStorage.setItem('civicflow_local_tokens', JSON.stringify(updated));
          return updated;
        });
      } else {
        const token = allTokens.find((t: Token) => t.id === tokenId);
        if (token) {
          const updatedNotifications = [notification, ...(token.notifications || [])];
          await updateTokenMutation.mutateAsync({
            id: tokenId,
            updates: { notifications: updatedNotifications }
          });
          console.log(`[NOTIFY DB] Sent to ${tokenId}: ${message}`);
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const broadcastAlert = async (message: string, type: TokenNotification['type'], serviceTarget: string | 'ALL' = 'ALL') => {
    const targetTokens = allTokens.filter((t: Token) =>
      serviceTarget === 'ALL' || t.serviceCategory === serviceTarget
    );
    targetTokens.forEach((t: Token) => sendNotification(t.id, message, type));
  };

  const rejoinQueue = async (tokenId: string) => {
    const token = allTokens.find((t: Token) => t.id === tokenId);
    if (!token) return;

    // Calculate "2-3 positions back" timestamp
    const waitingTokens = allTokens
      .filter((t: Token) => (t.status === TokenStatus.WAITING || t.status === TokenStatus.CHECKED_IN) && t.serviceCategory === token.serviceCategory)
      .sort((a: Token, b: Token) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let newTimestamp: string;
    if (waitingTokens.length >= 2) {
      // Put between 2nd and 3rd token if possible, or after 2nd
      const targetToken = waitingTokens.length >= 3 ? waitingTokens[2] : waitingTokens[1];
      const prevToken = waitingTokens[1];
      const timeDiff = Math.abs(new Date(targetToken.createdAt).getTime() - new Date(prevToken.createdAt).getTime());
      newTimestamp = new Date(new Date(prevToken.createdAt).getTime() + (timeDiff / 2) + 1).toISOString();
    } else {
      // Just put at the end if fewer than 2 tokens
      newTimestamp = new Date().toISOString();
    }

    if (IS_MOCK || localTokens.some(lt => lt.id === tokenId)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === tokenId ? {
        ...t,
        status: TokenStatus.WAITING,
        createdAt: newTimestamp
      } : t));
    } else {
      await updateTokenMutation.mutateAsync({
        id: tokenId,
        updates: {
          status: TokenStatus.WAITING,
          created_at: newTimestamp
        }
      });
    }
    showToast(`Token ${token.tokenNumber} rejoined at position 2-3.`, 'success');
  };

  const recallToken = async (tokenId: string, counterId: number) => {
    if (localTokens.some((lt: Token) => lt.id === tokenId)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === tokenId ? { ...t, status: TokenStatus.CALLED, counterId } : t));
    } else {
      await updateTokenStatusMutation.mutateAsync({ id: tokenId, status: TokenStatus.CALLED, counterId });
    }
  };

  const approvePriority = async (tokenId: string) => {
    if (IS_MOCK || localTokens.some((lt: Token) => lt.id === tokenId)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === tokenId ? {
        ...t,
        status: TokenStatus.WAITING,
        priorityStatus: 'APPROVED',
        isPriority: true,
        priorityLevel: (t.isSenior && t.isEmergency) ? 'EMERGENCY' : (t.isEmergency ? 'EMERGENCY' : (t.isSenior ? 'SENIOR' : 'NORMAL'))
      } : t));
    } else {
      await updateTokenMutation.mutateAsync({
        id: tokenId,
        updates: {
          status: TokenStatus.WAITING,
          priorityStatus: 'APPROVED',
          isPriority: true
        }
      });
    }
    sendNotification(tokenId, "Your priority status has been APPROVED. You have been moved up in the queue.", 'SYSTEM_ALERT');
  };

  const rejectPriority = async (tokenId: string, reason: string = "Documentation insufficient") => {
    if (IS_MOCK || localTokens.some((lt: Token) => lt.id === tokenId)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === tokenId ? {
        ...t,
        status: TokenStatus.WAITING,
        priorityStatus: 'REJECTED',
        isPriority: false,
        isEmergency: false,
        isSenior: false,
        priorityLevel: 'NORMAL',
        rejectionReason: reason
      } : t));
    } else {
      await updateTokenMutation.mutateAsync({
        id: tokenId,
        updates: {
          status: TokenStatus.WAITING,
          priorityStatus: 'REJECTED',
          isPriority: false,
          isEmergency: false,
          isSenior: false,
          priorityLevel: 'NORMAL',
          rejectionReason: reason
        }
      });
    }
    sendNotification(tokenId, `Your priority claim was REJECTED: ${reason}. You will be served in the standard queue.`, 'SYSTEM_ALERT');
  };

  const verifyToken = async (tokenId: string) => {
    if (IS_MOCK || localTokens.some((lt: Token) => lt.id === tokenId)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === tokenId ? { ...t, status: TokenStatus.WAITING } : t));
      showToast('Identity Verified: Unit moved to waiting pipeline.', 'success');
    } else {
      await updateTokenStatusMutation.mutateAsync({ id: tokenId, status: TokenStatus.WAITING });
    }
  };

  const rejectToken = async (tokenId: string, reason: string) => {
    if (IS_MOCK || localTokens.some((lt: Token) => lt.id === tokenId)) {
      setLocalTokens((prev: Token[]) => prev.map((t: Token) => t.id === tokenId ? { ...t, status: TokenStatus.CANCELLED, priorityStatus: 'REJECTED' } : t));
      showToast(`Unit Rejected: ${reason}`, 'error');
    } else {
      await updateTokenStatusMutation.mutateAsync({ id: tokenId, status: TokenStatus.CANCELLED });
    }
  };

  return (
    <QueueContext.Provider value={{
      state: { tokens: allTokens, counters, services, averageServiceTime, policies, settings, blacklistedPhones, isLoading },
      issueToken, callNext, serveToken, checkInToken, completeCurrent,
      cancelToken, skipToken, transferToken, elevateToEmergency, submitFeedback,
      updateCounterStatus, updateCounterName, addCounter, removeCounter, updateCounterServices,
      updatePolicy: (p) => setPolicies(prev => ({ ...prev, ...p })),
      updateSettings: (s) => setSettings(prev => ({ ...prev, ...s })),
      addService, updateService, removeService,
      sendNotification, broadcastAlert, getCountersForService: () => counters,
      updateTokenWaitTime, approvePriority, rejectPriority, rejoinQueue, recallToken,
      verifyToken, rejectToken
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used within QueueProvider');
  return context;
};
