import { mappers } from './mappers.js';

/**
 * DCA Enterprise: Centralized & Verified API Service
 * 
 * Verfied Endpoints:
 * - /agent/chat/respond [POST]
 * - /bookings/check-slots [POST]
 * - /legacy-bookings/ [POST]
 * - /analytics/dashboard [GET]
 * - /analytics/audit [GET]
 * - /analytics/health [GET]
 * - /enterprise/rep/workload [GET]
 * - /enterprise/lead/profile/{id} [GET]
 * - /enterprise/ai/explain [GET]
 * - /enterprise/trends/history [GET]
 * - /enterprise/simulation/run [POST]
 */
export const api = {
    baseUrl: '/api/v1',

    async fetch(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('dca_token');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`Fetch failed for ${endpoint}:`, err);
            window.dispatchEvent(new CustomEvent('api-error', { detail: err.message }));
            throw err;
        }
    },

    // --- AGENT POD ---
    async respondChat(message, sessionId) {
        return await this.fetch('/agent/chat/respond', {
            method: 'POST',
            body: JSON.stringify({ message, session_id: sessionId })
        });
    },

    // --- SCHEDULER POD ---
    async checkSlots(data) {
        return await this.fetch('/bookings/check-slots', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async createBooking(bookingData) {
        return await this.fetch('/legacy-bookings/', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    // --- ANALYTICS COCKPIT ---
    async getDashboard() {
        return await this.fetch('/analytics/dashboard');
    },

    async getAuditLogs() {
        const raw = await this.fetch('/analytics/audit');
        return raw.map(mappers.mapAudit);
    },

    async getSystemHealth() {
        return await this.fetch('/analytics/health');
    },

    // --- ENTERPRISE INTELLIGENCE ---
    async getWorkload() {
        const raw = await this.fetch('/enterprise/rep/workload');
        return raw.map(mappers.mapRep);
    },

    async getLeadProfile(id) {
        const raw = await this.fetch(`/enterprise/lead/profile/${id}`);
        return mappers.mapLead(raw);
    },

    async getAIExplanation() {
        const raw = await this.fetch('/enterprise/ai/explain');
        return mappers.mapAIExplanation(raw);
    },

    async getTrends() {
        const raw = await this.fetch('/enterprise/trends/history');
        return raw.map(mappers.mapTrend);
    },

    async runSimulation(scenario) {
        return await this.fetch('/enterprise/simulation/run', {
            method: 'POST',
            body: JSON.stringify({ scenario })
        });
    }
};
