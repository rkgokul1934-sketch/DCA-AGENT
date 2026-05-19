/**
 * DCA Enterprise: Data Normalization Layer
 */
export const mappers = {
    mapLead: (raw) => ({
        id: raw.id || 0,
        name: raw.name || "Unknown Prospect",
        email: raw.email || "",
        company: raw.company || raw.company_name || "N/A",
        designation: raw.designation || "Executive",
        icpScore: raw.icp_score || raw.score || 0,
        intentScore: raw.intent_score || 0,
        status: raw.status || "new",
        notes: raw.qualification_notes || "",
        lastAction: raw.next_action || "Awaiting contact"
    }),

    mapRep: (raw) => ({
        name: raw.name || "N/A",
        leads: raw.assigned_leads || 0,
        meetings: raw.meetings_today || 0,
        utilization: raw.utilization || 0,
        status: raw.status || "Available",
        conversionRate: raw.conversion_rate || 0,
        isOverloaded: (raw.utilization || 0) > 85
    }),

    mapAudit: (raw) => ({
        id: raw.id,
        timestamp: raw.created_at || new Date().toISOString(),
        actor: raw.actor || "System",
        type: raw.event_type || "info",
        details: raw.action_details || "",
        meta: raw.metadata_json || {}
    }),

    mapNotification: (raw) => ({
        id: Date.now() + Math.random(),
        type: raw.type || "info",
        message: raw.message || "",
        time: new Date().toLocaleTimeString(),
        severity: raw.severity || "low"
    }),

    mapTrend: (raw) => ({
        date: raw.date,
        leads: raw.leads || 0,
        bookings: raw.bookings || 0
    }),

    mapAIExplanation: (raw) => ({
        rationale: raw.rationale || "Processing data...",
        confidence: (raw.confidence || 0) * 100,
        trace: raw.logic_trace || []
    })
};
