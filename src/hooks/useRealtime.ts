import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3008', { autoConnect: true });

export function useRealtimeSubscription(tableName: string, queryKeys: any[]) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleDbChange = (data: any) => {
            if (data.table === tableName) {
                console.log(`Change received via Socket.io on ${tableName}`);
                queryClient.invalidateQueries({ queryKey: queryKeys });
            }
        };

        socket.on('db_change', handleDbChange);

        return () => {
            socket.off('db_change', handleDbChange);
        };
    }, [tableName, queryKeys, queryClient]);
}
