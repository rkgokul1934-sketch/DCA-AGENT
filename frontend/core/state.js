/**
 * DCA Enterprise: Global State Management
 */
export const state = {
    sessionId: null,
    currentLead: null,
    currentRep: null,
    leadScore: 0,
    status: 'idle', // idle, thinking, qualified, booking, completed
    dashboard: {
        totalBookings: 0,
        avgLeadScore: 0,
        conversionRate: 0
    },
    notifications: [],
    logs: [],
    
    update(key, value) {
        this[key] = value;
        window.dispatchEvent(new CustomEvent('state-update', { detail: { key, value } }));
    },

    addNotification(notification) {
        this.notifications.push(notification);
        window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
    }
};
