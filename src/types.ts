
export type ServiceType = string;

export type UserRole = 'ADMIN' | 'OFFICER' | 'STAFF' | 'CITIZEN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  prefix: string;
  description: string;
  avgTimeMinutes: number;
  isActive: boolean;
  // UI helper fields (can be mapped from DB)
  icon?: string;
  color?: string;
  subServices?: string[];
}

export enum TokenStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
  CHECKED_IN = 'CHECKED_IN',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export type PriorityStatus = 'NONE' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export interface AppSettings {
  departmentName: string;
  officeStartTime: string;
  officeEndTime: string;
  aiThinkingBudget: number;
  aiPersona: 'Professional' | 'Friendly' | 'Empathetic';
  language: 'EN' | 'TE' | 'KN' | 'HI';
  securityLevel: 'Standard' | 'Strict' | 'Critical';
  enableHaptics: boolean;
  notificationThresholds: {
    nearingFront: number;
    delayMinutes: number;
  };
}

export interface TokenNotification {
  id: string;
  message: string;
  timestamp: number;
  type: 'SMS' | 'EMAIL' | 'APP' | 'AUTO' | 'SYSTEM_ALERT' | 'AI_INSIGHT' | 'MISSED_TURN';
  channel?: 'SMS' | 'EMAIL' | 'PUSH' | 'SYSTEM';
  deliveryStatus?: 'Pending' | 'Dispatched' | 'Failed';
}

export interface Token {
  id: string; // UUID
  tokenNumber: string; // e.g. A-101
  number: number; // Numeric part for sorting/display
  serviceId: string;
  serviceCategory: string; // Display category name
  serviceType: string; // Alias for serviceCategory or specific subservice
  citizenName: string;
  phone?: string;
  dob?: string;
  status: TokenStatus;
  priorityLevel: 'NORMAL' | 'SENIOR' | 'EMERGENCY';
  priorityStatus: PriorityStatus;

  // Timestamps (ISO strings from DB)
  createdAt: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  serviceStartTime?: number; // Epoch for timers

  // Assignment
  counterId?: number;
  officerId?: string;

  // Local/Legacy fields
  estimatedWaitTime?: number;
  notifications?: TokenNotification[];
  feedback?: {
    rating: number;
    timestamp: number;
  };
  skipCount?: number;
  assignedCounter?: string;
  isPriority?: boolean;
  isEmergency?: boolean;
  isSenior?: boolean;
  email?: string;
  userId?: string; // Associated user account ID
  idProof?: string;
  medicalProof?: string;
  skipReason?: string;
  rejectionReason?: string;
  notificationPreferences?: {
    sms: boolean;
    email: boolean;
  };
}

export interface Counter {
  id: number;
  name: string;
  officerName?: string; // Derived from current_officer_id profile
  currentOfficerId?: string;
  status: 'ONLINE' | 'OFFLINE' | 'BREAK';
  assignedServices: string[];
  currentTokenId?: string;
  isActive: boolean;
  isOnline?: boolean;
}

export interface GlobalPolicy {
  autoPriorityForSeniors: boolean;
  enableAutoEscalation: boolean;
  escalationThresholdMinutes: number;
}

export interface QueueState {
  tokens: Token[];
  counters: Counter[];
  services: ServiceDefinition[];
  averageServiceTime: number;
  policies: GlobalPolicy;
  settings: AppSettings;
  blacklistedPhones: string[];
  isLoading: boolean;
}

export interface QueueContextType {
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
  // Policies and Settings kept sync for now or async if DB backed
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
  rejectPriority: (tokenId: string) => Promise<void>;
  rejoinQueue: (tokenId: string) => Promise<void>;
  recallToken: (tokenId: string, counterId: number) => Promise<void>;
}
export interface AIInsight {
  title: string;
  description: string;
  recommendation: string;
  impactLevel: string;
}

export interface StaffOptimization {
  counterId: number;
  officerName: string;
  suggestedService: string;
  justification: string;
  priority: string;
}
