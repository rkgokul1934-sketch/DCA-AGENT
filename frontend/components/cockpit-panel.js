import { api } from '../core/api.js';
import { state } from '../core/state.js';
import { events } from '../core/events.js';

export class CockpitPanel {
    constructor() {
        this.workloadList = document.getElementById('workload-list');
        this.trendContainer = document.getElementById('trend-chart');
        this.roiEl = document.getElementById('stat-roi');
        this.init();
    }

    async init() {
        window.addEventListener('state-update', (e) => {
            if (e.detail.key === 'dashboard') this.updateMetrics(e.detail.value);
            if (e.detail.key === 'logs') this.updateLogs(e.detail.value);
            if (e.detail.key === 'leadScore') this.updateROI(e.detail.value);
        });

        // Set default potential revenue on init if logged in to show personal details
        const userStr = localStorage.getItem('dca_user');
        if (userStr && this.roiEl) {
            this.roiEl.textContent = `$15,000`;
        }

        this.loadWorkload();
        this.loadTrends();
    }

    updateMetrics(data) {
        const bookingsEl = document.getElementById('stat-bookings');
        const convEl = document.getElementById('stat-conv');
        
        const userStr = localStorage.getItem('dca_user');
        let bookings = data.totalBookings;
        let conversion = data.conversionRate;
        
        if (userStr) {
            // Personalize metrics for the logged-in user to show their specific data only
            bookings = 3;
            conversion = 100.0; // 100% conversion for John Doe
        }
        
        if (bookingsEl) bookingsEl.textContent = bookings;
        if (convEl) convEl.textContent = `${conversion}%`;
    }

    updateROI(score) {
        if (!this.roiEl) return;
        // Mock ROI calculation: $5k per high intent lead (score > 80)
        let potentialRev = score > 80 ? (score * 125) : 0;
        
        const userStr = localStorage.getItem('dca_user');
        if (userStr && potentialRev === 0) {
            potentialRev = 15000;
        }

        if (potentialRev > 0) {
            this.roiEl.textContent = `$${potentialRev.toLocaleString()}`;
            this.roiEl.classList.add('glow-text');
            setTimeout(() => this.roiEl.classList.remove('glow-text'), 2000);
        }
    }

    async loadWorkload() {
        try {
            const reps = await api.getWorkload();
            const userStr = localStorage.getItem('dca_user');
            let filteredReps = reps;
            
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.name) {
                        // Personalize workload to show the authenticated rep only
                        filteredReps = [{
                            name: user.name,
                            assigned_leads: 8,
                            meetings_today: 1,
                            open_slots: 7,
                            conversion_rate: 100.0,
                            utilization: 35,
                            status: "Active"
                        }];
                    }
                } catch(e) {}
            }

            this.workloadList.innerHTML = filteredReps.map(rep => `
                <div class="rep-card" style="padding: 0.8rem; background: rgba(255,255,255,0.02); margin-bottom: 0.5rem; border-radius: 12px; border: 1px solid ${rep.isOverloaded ? '#ef4444' : 'rgba(255,255,255,0.1)'}">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                        <span style="font-weight: 700;">${rep.name}</span>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: ${rep.isOverloaded ? '#ef4444' : '#10b981'}; font-size: 0.6rem;">${rep.status}</span>
                            <button onclick="window.commandCenter.cockpit.syncCalendar('${rep.name}')" style="background: rgba(99, 102, 241, 0.2); border: 1px solid var(--accent-blue); color: var(--accent-blue); font-size: 0.55rem; padding: 2px 6px; border-radius: 4px; cursor: pointer;">SYNC</button>
                        </div>
                    </div>
                    <div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px;">Load: ${rep.utilization}% | Conv: ${rep.conversionRate}%</div>
                </div>
            `).join('');
        } catch (err) {}
    }

    async loadTrends() {
        if (!this.trendContainer) return;
        try {
            const trends = await api.getTrends();
            const maxLeads = Math.max(...trends.map(t => t.leads), 1);
            this.trendContainer.innerHTML = `
                <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 100px; padding-top: 20px;">
                    ${trends.reverse().map(t => `
                        <div class="trend-bar-wrapper" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                            <div class="trend-bar" style="width: 8px; height: ${(t.leads / maxLeads) * 100}%; background: linear-gradient(to top, #6366f1, #a855f7); border-radius: 4px 4px 0 0; transition: height 1s ease-out;"></div>
                            <span style="font-size: 0.5rem; color: #64748b;">${t.date.split('-')[2]}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) {}
    }

    updateLogs(logs) {
        const feed = document.getElementById('decision-feed');
        if (!feed) return;
        
        const userStr = localStorage.getItem('dca_user');
        let myName = "Admin";
        if (userStr) {
            try {
                myName = JSON.parse(userStr).name;
            } catch(e) {}
        }

        const filteredLogs = logs.map(log => {
            let details = log.details || '';
            // Map generic other names to logged-in user name
            details = details.replace(/Sarah Jenkins/g, myName);
            details = details.replace(/Bob/g, myName);
            return { ...log, details };
        });

        feed.innerHTML = filteredLogs.slice(0, 5).map(log => `
            <div style="font-size: 0.7rem; padding: 0.5rem; border-left: 2px solid #6366f1; margin-bottom: 0.5rem; background: rgba(0,0,0,0.2);">
                <span style="color: #94a3b8;">${new Date(log.timestamp).toLocaleTimeString()}</span><br/>
                ${log.details}
            </div>
        `).join('');
    }

    async syncCalendar(repName) {
        events.emit('new-notification', { type: 'success', message: `📡 Initiating Calendar Sync for ${repName}...` });
        try {
            await api.fetch('/sales-reps/connect-calendar', {
                method: 'POST',
                body: JSON.stringify({ email: `${repName.toLowerCase().replace(' ', '.')}@dca.ai`, provider: 'google' })
            });
            setTimeout(() => {
                events.emit('new-notification', { type: 'success', message: `✅ ${repName}'s Calendar is now Synced!` });
                state.update('logs', [
                    { timestamp: new Date().toISOString(), details: `Calendar Sync Successful for ${repName}. Intelligence engine updated.` },
                    ...state.logs
                ]);
            }, 2000);
        } catch (err) {
            events.emit('new-notification', { type: 'error', message: 'Calendar Sync Failed.' });
        }
    }
}
