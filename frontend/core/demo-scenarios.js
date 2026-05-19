import { api } from './api.js';
import { state } from './state.js';
import { events } from './events.js';

/**
 * DCA Enterprise: Orchestrated Demo Storyteller
 */
export const demoScenarios = {
    async run(scenario) {
        console.log(`🎬 Triggering Scenario: ${scenario}`);
        events.emit('simulation-start', scenario);
        
        try {
            await api.runSimulation(scenario);
            
            switch(scenario) {
                case 'hot-lead':
                    this.playHotLead();
                    break;
                case 'reschedule':
                    this.playReschedule();
                    break;
                case 'api-failure':
                    this.playRecovery();
                    break;
            }
        } catch (err) {
            events.emit('new-notification', { type: 'error', message: 'Simulation Sync Error' });
        }
    },

    playHotLead() {
        // 1. Notification
        events.emit('new-notification', { type: 'success', message: '🔥 HIGH INTENT LEAD: 92% ICP Match!' });
        
        // 2. Chat Injection
        events.emit('ai-message', "Lead 'Sarah Jenkins' (Acme Corp) detected. Lead intent score is 94%. ICP Match: Tier 1. Recommending direct booking.");
        
        // 3. State Update
        state.update('leadScore', 94);
        
        // 4. Trigger Scheduler
        events.emit('lead-qualified', { lead_score: 94 });
        
        // 5. Update Metrics
        state.update('dashboard', { ...state.dashboard, totalBookings: state.dashboard.totalBookings + 1 });
    },

    playRecovery() {
        events.emit('new-notification', { type: 'warning', message: '⚠️ CRM Sync Timeout Detected...' });
        events.emit('system-degraded', 'CRM Sync');
        
        setTimeout(() => {
            events.emit('new-notification', { type: 'success', message: '✅ Self-Healing: CRM Synced via Fallback Gateway' });
            events.emit('system-recovered', 'CRM Sync');
        }, 4000);
    }
};
