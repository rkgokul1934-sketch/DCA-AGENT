import { api } from '../core/api.js';
import { events } from '../core/events.js';

export class SchedulerPanel {
    constructor() {
        this.grid = document.getElementById('slot-grid');
        this.dateInput = document.getElementById('scheduler-date');
        this.currentLead = {
            name: "GTM Prospect",
            email: "prospect@demo.com",
            company_name: "Discovery Corp"
        };
        this.setupListeners();
        console.log("📅 Scheduler Panel Initialized");
    }

    setupListeners() {
        events.on('lead-sync', (data) => {
            console.log("🔄 Real-time Identity Sync:", data);
            this.currentLead = {
                name: data.name || this.currentLead.name,
                email: data.email || this.currentLead.email,
                company_name: data.company_name || this.currentLead.company_name
            };
        });

        events.on('lead-qualified', (data) => {
            console.log("🎯 Lead Qualified - Final Sync:", data.lead_data);
            if (data.lead_data) {
                this.currentLead = {
                    name: data.lead_data.name || this.currentLead.name,
                    email: data.lead_data.email || this.currentLead.email,
                    company_name: data.lead_data.company_name || this.currentLead.company_name
                };
            }
            this.loadAvailableSlots();
        });

        this.dateInput?.addEventListener('change', () => {
            this.loadAvailableSlots();
        });

        // Also listen for manual simulation triggers
        events.on('simulation-start', (scenario) => {
            if (scenario === 'hot-lead') {
                this.loadAvailableSlots();
            }
        });
    }

    async loadAvailableSlots() {
        if (!this.grid) return;
        const selectedDate = this.dateInput?.value || "2026-06-01";
        
        console.log("🔍 Loading slots for:", selectedDate);
        this.grid.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #6366f1;">Analyzing global availability...</div>';
        
        try {
            const slots = await api.checkSlots({
                date: selectedDate,
                timezone: "Asia/Kolkata",
                meeting_type_slug: "demo"
            });

            if (!slots || slots.length === 0) {
                this.grid.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #f59e0b; font-size: 0.8rem; padding: 20px;">No available slots for this date. Select another date or check Sales Rep availability.</div>';
                return;
            }

            this.grid.innerHTML = '';
            slots.forEach(slot => {
                const card = document.createElement('div');
                card.className = `slot-card ${slot.is_recommended ? 'recommended' : ''}`;
                card.innerHTML = `
                    <div style="font-weight: 700; font-size: 1.1rem">${slot.start_time || slot.user_time}</div>
                    <div style="font-size: 0.6rem; color: #94a3b8; margin-top: 4px;">${slot.recommendation_reason || 'AI Recommended'}</div>
                `;
                card.onclick = () => this.bookSlot(slot.start_time || slot.user_time);
                this.grid.appendChild(card);
            });
        } catch (err) {
            console.error("❌ Slot Fetch Error:", err);
            this.grid.innerHTML = '<div style="color: #ef4444; padding: 20px;">Connection error while fetching slots.</div>';
        }
    }

    async bookSlot(time) {
        const selectedDate = this.dateInput?.value || "2026-06-01";
        
        // Final validation to prevent 422
        if (!this.currentLead.name || !this.currentLead.email) {
            events.emit('new-notification', { type: 'error', message: 'Lead identity missing. Please use chat first.' });
            return;
        }

        if (!confirm(`Book demo for ${this.currentLead.name} on ${selectedDate} at ${time}?`)) return;
        
        try {
            const res = await api.createBooking({
                name: this.currentLead.name,
                email: this.currentLead.email,
                company_name: this.currentLead.company_name || "Enterprise Lead",
                meeting_title: `Strategic Demo: ${this.currentLead.company_name || 'Enterprise'}`,
                booking_date: selectedDate,
                booking_time: time,
                timezone: "Asia/Kolkata",
                meeting_type_slug: "demo"
            });

            if (res.success) {
                events.emit('new-notification', { type: 'success', message: `✅ Booking Confirmed for ${selectedDate} at ${time}!` });
                events.emit('booking-confirmed', { time, date: selectedDate });
                this.grid.innerHTML = `<div style="grid-column: span 2; text-align: center; color: #10b981; padding: 40px;">
                    <i data-lucide="check-circle" style="display: block; margin: 0 auto 10px;"></i>
                    Confirmed for ${selectedDate}
                </div>`;
                if (window.lucide) window.lucide.createIcons();
            } else {
                throw new Error(res.message);
            }
        } catch (err) {
            console.error("❌ Booking Error:", err);
            events.emit('new-notification', { type: 'error', message: err.message || 'Failed to create booking.' });
        }
    }
}
