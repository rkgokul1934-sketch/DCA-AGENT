import { events } from '../core/events.js';

export class JourneyStream {
    constructor() {
        this.timeline = document.getElementById('journey-timeline');
        this.renderedLogIds = new Set();
        this.setupListeners();
        console.log("🛤️ Journey Stream Activated");
    }

    setupListeners() {
        events.on('ai-message', (text) => this.addEvent('bot', 'AI Interaction', text));
        events.on('lead-qualified', (data) => this.addEvent('award', 'Lead Qualified', `Score: ${data.lead_score}% | Intent: High`));
        events.on('booking-confirmed', (data) => this.addEvent('calendar', 'Demo Booked', `Slot confirmed for ${data.time}`));
        events.on('simulation-start', (scenario) => this.addEvent('zap', 'Simulation Triggered', `Scenario: ${scenario} activated`));
        
        // Listen to logs state changes for backend cross-tab updates
        window.addEventListener('state-update', (e) => {
            if (e.detail.key === 'logs') {
                this.updateFromLogs(e.detail.value);
            }
        });

        // Add an initial heartbeat event
        this.addEvent('activity', 'Engine Live', 'Orchestration node connected and monitoring lead intent.');
    }

    updateFromLogs(logs) {
        if (!logs || logs.length === 0) return;
        
        const userStr = localStorage.getItem('dca_user');
        let myName = "";
        if (userStr) {
            try {
                myName = JSON.parse(userStr).name;
            } catch(e) {}
        }

        const mappedLogs = logs.map(log => {
            let details = log.details || '';
            if (myName) {
                details = details.replace(/Sarah Jenkins/g, myName);
                details = details.replace(/Bob/g, myName);
            }
            return { ...log, details };
        });

        // Filter logs we haven't rendered yet
        const newLogs = mappedLogs.filter(log => !this.renderedLogIds.has(log.id));
        if (newLogs.length === 0) return;
        
        // Render newest at top (since we use prepend in addEvent, process oldest first)
        newLogs.reverse().forEach(log => {
            this.renderedLogIds.add(log.id);
            
            let icon = 'activity';
            let title = 'System Event';
            
            const eventType = log.type || '';
            const actionDetails = log.details || '';
            const actionDetailsLower = actionDetails.toLowerCase();
            
            if (eventType === 'simulation') {
                icon = 'zap';
                title = 'Simulation Triggered';
            } else if (eventType === 'booking_created') {
                icon = 'calendar';
                title = 'Meeting Scheduled';
            } else if (eventType === 'booking_rescheduled') {
                icon = 'calendar';
                title = 'Meeting Rescheduled';
            } else if (eventType === 'lead_qualified') {
                icon = 'award';
                title = 'AI Lead Scoring';
            } else if (eventType === 'meeting_analyzed') {
                icon = 'bot';
                title = 'Meeting Analyzed';
            } else if (actionDetailsLower.includes('calendar') && actionDetailsLower.includes('sync')) {
                icon = 'bot';
                title = 'OAuth Calendar Synced';
            }
            
            this.addEvent(icon, title, actionDetails);
        });
    }

    addEvent(icon, title, details) {
        if (!this.timeline) return;

        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        entry.style.cssText = `
            display: flex;
            gap: 15px;
            padding: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            opacity: 0;
            transform: translateY(10px);
            animation: timeline-in 0.4s ease-out forwards;
        `;

        entry.innerHTML = `
            <div style="background: rgba(99, 102, 241, 0.1); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--accent-blue); flex-shrink: 0;">
                <i data-lucide="${this.mapIcon(icon)}" size="16"></i>
            </div>
            <div>
                <div style="font-size: 0.75rem; font-weight: 800; color: #f8fafc; margin-bottom: 2px;">${title}</div>
                <div style="font-size: 0.7rem; color: #94a3b8; line-height: 1.4;">${details}</div>
                <div style="font-size: 0.55rem; color: #475569; margin-top: 4px;">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        this.timeline.prepend(entry);
        
        // Re-initialize icons for the new entry
        if (window.lucide) window.lucide.createIcons();
    }

    mapIcon(type) {
        const icons = {
            'bot': 'bot',
            'award': 'award',
            'calendar': 'calendar',
            'zap': 'zap',
            'activity': 'activity'
        };
        return icons[type] || 'circle';
    }
}
