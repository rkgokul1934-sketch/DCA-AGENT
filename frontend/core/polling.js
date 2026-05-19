import { api } from './api.js';
import { state } from './state.js';
import { events } from './events.js';

/**
 * DCA Enterprise: Real-time Polling Engine
 */
export const polling = {
    intervals: {},

    start(name, fn, ms) {
        if (this.intervals[name]) clearInterval(this.intervals[name]);
        this.intervals[name] = setInterval(fn, ms);
        fn(); // Initial call
    },

    stop(name) {
        if (this.intervals[name]) {
            clearInterval(this.intervals[name]);
            delete this.intervals[name];
        }
    },

    initDashboardPolling() {
        this.start('dashboard', async () => {
            const data = await api.getDashboard();
            state.update('dashboard', {
                totalBookings: data.stats.total_bookings,
                avgLeadScore: data.stats.avg_lead_score,
                conversionRate: data.stats.conversion_rate
            });
        }, 30000);

        this.start('audit', async () => {
            try {
                const logs = await api.getAuditLogs();
                state.update('logs', logs);
            } catch (err) {}
        }, 10000);
    }
};

/**
 * DCA Enterprise: Orchestrated Demo Scenarios
 */
export const demoScenarios = {
    async run(scenario) {
        events.emit('simulation-start', scenario);
        
        try {
            await api.runSimulation(scenario);
            
            // UI-only orchestration logic for the demo
            switch(scenario) {
                case 'hot-lead':
                    events.emit('new-notification', { type: 'success', message: '🔥 HIGH INTENT LEAD: 92% Match detected!' });
                    break;
                case 'api-failure':
                    events.emit('system-degraded', 'CRM Sync Timeout Detected');
                    setTimeout(() => events.emit('system-recovered', 'Recovery Successful'), 3000);
                    break;
            }
            
            events.emit('simulation-complete', scenario);
        } catch (err) {
            events.emit('simulation-error', err.message);
        }
    }
};
