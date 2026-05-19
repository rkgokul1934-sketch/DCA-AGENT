import { api } from '../core/api.js';
import { state } from '../core/state.js';
import { events } from '../core/events.js';

export class DiscoveryPanel {
    constructor() {
        this.viewport = document.getElementById('chat-viewport');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.intelCard = document.querySelector('.intelligence-card');
        this.setupListeners();
        console.log("🧬 Discovery Panel Ready");
    }

    setupListeners() {
        if (!this.input) return;
        this.intelCard?.addEventListener('click', () => this.openDossier());
        // Enter Key Listener
        this.input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && this.input.value.trim()) {
                this.submitInput();
            }
        });

        // Click Listener for Send Button
        this.sendBtn?.addEventListener('click', () => {
            if (this.input.value.trim()) {
                this.submitInput();
            }
        });

        // Listen for orchestrated simulation messages
        events.on('ai-message', (text) => {
            this.addMessage('agent', text);
        });

        events.on('simulation-start', (scenario) => {
            this.addMessage('agent', `[SYSTEM] Initiating ${scenario} scenario...`);
        });
    }

    async submitInput() {
        const msg = this.input.value;
        this.input.value = '';
        await this.handleMessage(msg);
    }

    async handleMessage(text) {
        this.addMessage('user', text);
        this.showThinking();

        try {
            const res = await api.respondChat(text, state.sessionId);
            if (res.session_id) state.sessionId = res.session_id;

            this.hideThinking();
            this.addMessage('agent', res.answer.message);
            
            // Real-time Identity Sync
            if (res.answer.lead_data) {
                events.emit('lead-sync', res.answer.lead_data);
            }

            if (res.answer.lead_score) {
                this.updateIntel(res.answer.lead_score);
            }

            if (res.answer.recommendation === 'direct_booking' || res.answer.recommendation === 'direct_booking_vip') {
                events.emit('lead-qualified', res.answer);
            }
        } catch (err) {
            this.hideThinking();
            this.addMessage('agent', 'Connectivity error. Please check if the backend is running.');
        }
    }

    addMessage(side, text) {
        const div = document.createElement('div');
        div.className = side === 'user' ? 'user-msg' : 'ai-msg';
        div.innerHTML = `<p>${text}</p>`;
        this.viewport.appendChild(div);
        
        // Use requestAnimationFrame + small timeout for absolute reliability
        setTimeout(() => {
            this.viewport.scrollTo({
                top: this.viewport.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    showThinking() {
        this.thinking = document.createElement('div');
        this.thinking.className = 'ai-msg thinking';
        this.thinking.innerHTML = '<p>AI is analyzing...</p>';
        this.viewport.appendChild(this.thinking);
        
        requestAnimationFrame(() => {
            this.viewport.scrollTop = this.viewport.scrollHeight;
        });
    }

    hideThinking() {
        if (this.thinking) this.thinking.remove();
    }

    updateIntel(score) {
        document.getElementById('score-intent').textContent = `${score}%`;
        document.getElementById('score-icp').textContent = `${Math.min(100, score + 10)}%`;
        const grade = document.querySelector('.grade-badge');
        if (grade) {
            grade.textContent = score > 80 ? 'A+' : 'B';
            grade.style.color = score > 80 ? '#10b981' : '#f59e0b';
        }
    }

    async openDossier() {
        const drawer = document.getElementById('prospect-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        const content = document.getElementById('drawer-content');
        
        drawer.classList.add('open');
        backdrop.classList.add('active');
        content.innerHTML = '<div style="padding: 2rem; color: #6366f1;">Fetching deep intelligence...</div>';

        try {
            const dossier = await api.getLeadProfile(1); // Demo ID
            content.innerHTML = `
                <div style="padding: 2rem;">
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 2.5rem; background: rgba(99, 102, 241, 0.05); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.2);">
                        <div style="position: relative;">
                            <img src="https://i.pravatar.cc/150?u=${dossier.email}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--accent-blue); box-shadow: 0 0 20px var(--accent-glow);">
                            <div style="position: absolute; bottom: 0; right: 0; background: #0077b5; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; border: 2px solid #0d1117;">in</div>
                        </div>
                        <div style="flex: 1;">
                            <h2 style="font-size: 1.3rem; margin-bottom: 4px;">${dossier.name}</h2>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <img src="https://logo.clearbit.com/${dossier.company.toLowerCase().replace(' ', '')}.com" onerror="this.src='https://ui-avatars.com/api/?name=${dossier.company}'" style="width: 16px; height: 16px; border-radius: 2px;">
                                <p style="color: #94a3b8; font-size: 0.8rem; font-weight: 600;">${dossier.designation} @ ${dossier.company}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 16px; border: 1px solid var(--glass-border); text-align: center;">
                            <div style="font-size: 0.6rem; color: #94a3b8; margin-bottom: 8px; letter-spacing: 1px;">ICP ALIGNMENT</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">${dossier.icpScore}%</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 16px; border: 1px solid var(--glass-border); text-align: center;">
                            <div style="font-size: 0.6rem; color: #94a3b8; margin-bottom: 8px; letter-spacing: 1px;">INTENT SCORE</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: #6366f1;">${dossier.intentScore}%</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 2.5rem;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                            <div style="width: 4px; height: 16px; background: var(--accent-blue); border-radius: 2px;"></div>
                            <h4 style="font-size: 0.75rem; color: #f8fafc; text-transform: uppercase; letter-spacing: 1px;">AI Qualification Summary</h4>
                        </div>
                        <p style="font-size: 0.9rem; line-height: 1.7; color: #94a3b8; background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 16px; border: 1px solid var(--glass-border);">${dossier.notes}</p>
                    </div>

                    <div style="background: linear-gradient(90deg, rgba(99, 102, 241, 0.2), transparent); padding: 1.5rem; border-radius: 18px; border-left: 4px solid var(--accent-blue); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -10px; right: -10px; opacity: 0.1;"><i data-lucide="zap" size="60"></i></div>
                        <h4 style="font-size: 0.7rem; color: var(--accent-blue); margin-bottom: 8px; text-transform: uppercase; font-weight: 800;">Recommended Next Best Action</h4>
                        <p style="font-size: 1rem; font-weight: 700; color: white;">${dossier.lastAction}</p>
                    </div>
                </div>
            `;
        } catch (err) {
            content.innerHTML = '<div style="padding: 2rem; color: #ef4444;">Failed to load lead intelligence.</div>';
        }

        // Close logic
        const closeBtn = drawer.querySelector('.close-drawer');
        const close = () => {
            drawer.classList.remove('open');
            backdrop.classList.remove('active');
        };
        closeBtn.onclick = close;
        backdrop.onclick = close;
    }
}
