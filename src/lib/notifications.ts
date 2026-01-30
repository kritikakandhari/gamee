import { supabase } from '@/lib/supabaseClient';

export type NotificationType = 'FRIEND_REQUEST' | 'MATCH_INVITE' | 'MESSAGE' | 'DISPUTE' | 'TRANSACTION' | 'ALERT';

export type Notification = {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    content: string;
    metadata: any;
    is_read: boolean;
    created_at: string;
};

export const notificationsApi = {
    // Fetch all notifications for current user
    getNotifications: async (): Promise<Notification[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data as Notification[];
    },

    // Mark a notification as read
    markAsRead: async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
    },

    // Mark all as read
    markAllAsRead: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
    },

    // Delete a notification
    deleteNotification: async (notificationId: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
    }
};
