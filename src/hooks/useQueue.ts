import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Token, TokenStatus, ServiceDefinition } from '../types';
import { IS_MOCK } from '../lib/firebase';

const API_URL = 'http://localhost:3008/api';

export const QUERY_KEYS = {
    tokens: ['tokens'],
    services: ['services'],
    counters: ['counters'],
    userProfile: (id: string) => ['user', id],
};

const mapTokenFromDb = (data: any): Token => ({
    ...data,
    id: data.id,
    tokenNumber: data.token_number,
    number: data.number,
    serviceId: data.service_id,
    serviceCategory: data.service_category,
    serviceType: data.service_type,
    citizenName: data.citizen_name,
    phone: data.phone,
    status: data.status,
    priorityLevel: data.priority_level,
    priorityStatus: data.priority_status,
    createdAt: data.created_at,
    calledAt: data.called_at,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    serviceStartTime: data.service_start_time,
    counterId: data.counter_id,
    officerId: data.officer_id,
    estimatedWaitTime: data.estimated_wait_time,
    isPriority: data.is_priority,
    isEmergency: data.is_emergency,
    isSenior: data.is_senior,
    idProof: data.id_proof,
    medicalProof: data.medical_proof,
    rejectionReason: data.rejection_reason,
    skipReason: data.skip_reason,
    notifications: data.notifications || [],
});

export function useTokens() {
    return useQuery({
        queryKey: QUERY_KEYS.tokens,
        queryFn: async () => {
            if (IS_MOCK) return [];
            const response = await axios.get(`${API_URL}/tokens`);
            return response.data.map(mapTokenFromDb);
        },
        enabled: !IS_MOCK,
        refetchInterval: 30000,
    });
}

export function useServices() {
    return useQuery({
        queryKey: QUERY_KEYS.services,
        queryFn: async () => {
            if (IS_MOCK) return [];
            const response = await axios.get(`${API_URL}/services`);
            return response.data;
        },
        enabled: !IS_MOCK,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useCounters() {
    return useQuery({
        queryKey: QUERY_KEYS.counters,
        queryFn: async () => {
            if (IS_MOCK) return [];
            const response = await axios.get(`${API_URL}/counters`);
            return response.data;
        },
        enabled: !IS_MOCK,
    });
}

export function useIssueToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newToken: Partial<Token>) => {
            if (IS_MOCK) return newToken;

            const payload = {
                id: newToken.id,
                citizen_name: newToken.citizenName,
                phone: newToken.phone,
                service_id: newToken.serviceId,
                service_category: newToken.serviceCategory,
                status: newToken.status || 'WAITING',
                priority_level: newToken.priorityLevel || 'NORMAL',
                priority_status: newToken.priorityStatus || 'NONE',
                token_number: newToken.tokenNumber,
                id_proof: newToken.idProof,
                medical_proof: newToken.medicalProof,
                is_senior: newToken.isSenior,
                is_emergency: newToken.isEmergency,
                is_priority: newToken.isPriority,
            };

            const response = await axios.post(`${API_URL}/tokens`, payload);
            return mapTokenFromDb(response.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tokens });
        },
    });
}

export function useUpdateTokenStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, counterId }: { id: string; status: TokenStatus; counterId?: number }) => {
            if (IS_MOCK) return { id, status, counterId };
            const updates: any = { status };
            if (status === 'CALLED') updates.called_at = new Date();
            if (status === 'IN_PROGRESS') updates.started_at = new Date();
            if (status === 'COMPLETED') updates.completed_at = new Date();
            if (counterId !== undefined) updates.counter_id = counterId;

            const response = await axios.patch(`${API_URL}/tokens/${id}`, updates);
            return mapTokenFromDb(response.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tokens });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.counters });
        },
    });
}

export function useUpdateCounterStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            await axios.patch(`${API_URL}/counters/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.counters });
        },
    });
}

export function useUpdateToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            const dbUpdates: any = { ...updates };
            if (updates.citizenName) { dbUpdates.citizen_name = updates.citizenName; delete dbUpdates.citizenName; }
            if (updates.priorityLevel) { dbUpdates.priority_level = updates.priorityLevel; delete dbUpdates.priorityLevel; }
            if (updates.priorityStatus) { dbUpdates.priority_status = updates.priorityStatus; delete dbUpdates.priorityStatus; }
            if (updates.isSenior !== undefined) { dbUpdates.is_senior = updates.isSenior; delete dbUpdates.isSenior; }
            if (updates.isEmergency !== undefined) { dbUpdates.is_emergency = updates.isEmergency; delete dbUpdates.isEmergency; }
            if (updates.isPriority !== undefined) { dbUpdates.is_priority = updates.isPriority; delete dbUpdates.isPriority; }
            if (updates.rejectionReason) { dbUpdates.rejection_reason = updates.rejectionReason; delete dbUpdates.rejectionReason; }

            const response = await axios.patch(`${API_URL}/tokens/${id}`, dbUpdates);
            return mapTokenFromDb(response.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tokens });
        },
    });
}

export function useAddCounter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newCounter: { name: string; officer: string }) => {
            await axios.post(`${API_URL}/counters`, {
                id: Date.now(),
                name: newCounter.name,
                current_officer_id: newCounter.officer,
                status: 'OFFLINE',
                is_active: true,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.counters });
        },
    });
}

export function useRemoveCounter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`${API_URL}/counters/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.counters });
        },
    });
}

export function useUpdateCounter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
            await axios.patch(`${API_URL}/counters/${id}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.counters });
        }
    });
}

export function useAddService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (service: ServiceDefinition) => {
            await axios.post(`${API_URL}/services`, {
                id: service.id || String(Date.now()),
                name: service.name,
                prefix: service.prefix,
                description: service.description,
                avg_time_minutes: service.avgTimeMinutes,
                is_active: service.isActive
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
        },
    });
}

export function useUpdateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceDefinition> }) => {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.prefix) dbUpdates.prefix = updates.prefix;
            if (updates.description) dbUpdates.description = updates.description;
            if (updates.avgTimeMinutes) dbUpdates.avg_time_minutes = updates.avgTimeMinutes;
            if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

            await axios.patch(`${API_URL}/services/${id}`, dbUpdates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
        },
    });
}

export function useRemoveService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`${API_URL}/services/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
        },
    });
}
