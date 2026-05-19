import { api } from './core/api.js';
import { state } from './core/state.js';
import { polling } from './core/polling.js';
import { events } from './core/events.js';
import { demoScenarios } from './core/demo-scenarios.js';

// Components
import { DiscoveryPanel } from './components/discovery-panel.js';
import { CockpitPanel } from './components/cockpit-panel.js';
import { SchedulerPanel } from './components/scheduler-panel.js';
import { JourneyStream } from './components/journey-stream.js';

class CommandCenter {
    constructor() {
        this.init();
    }

    async init() {
        console.log("💎 DCA Enterprise Elite Initializing...");
        
        // 1. Core Logic
        this.discovery = new DiscoveryPanel();
        this.cockpit = new CockpitPanel();
        this.scheduler = new SchedulerPanel();
        this.journey = new JourneyStream();

        // 2. Services
        polling.initDashboardPolling();

        // 3. Event Handling
        events.on('new-notification', (data) => this.renderToast(data));
        
        events.on('system-degraded', (service) => {
            const el = document.querySelector(`[data-service="${service.toLowerCase()}"] .pulse`);
            if (el) el.className = 'pulse yellow';
        });

        events.on('system-recovered', (service) => {
            const el = document.querySelector(`[data-service="${service.toLowerCase()}"] .pulse`);
            if (el) el.className = 'pulse green';
        });

        // Global Simulation Access
        window.runSim = (scenario) => demoScenarios.run(scenario);

        console.log("✅ RevOps Platform Ready.");
    }

    renderToast(data) {
        const container = document.getElementById('notification-center');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.borderLeft = `4px solid var(--${data.type === 'success' ? 'success' : 'accent-blue'})`;
        toast.innerHTML = `
            <div style="font-weight: 800; font-size: 0.7rem; margin-bottom: 4px;">SYSTEM ALERT</div>
            <div style="font-size: 0.85rem;">${data.message}</div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    }
}

// Boot
window.commandCenter = new CommandCenter();
