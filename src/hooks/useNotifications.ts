import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { notificationsApi } from '@/lib/notifications';
import { useAuth } from '@/auth/AuthProvider';

export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch notifications
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => notificationsApi.getNotifications(),
        enabled: !!user,
    });

    // 2. Mark as read mutation
    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationsApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    // 3. Mark all read mutation
    const markAllReadMutation = useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    // 4. Set up Realtime listener
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (_payload) => {
                    // Play a soft sound if needed or just invalidate
                    queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                    // Optionally show a toast or browser notification here
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead: (id: string) => markReadMutation.mutate(id),
        markAllAsRead: () => markAllReadMutation.mutate(),
    };
}
