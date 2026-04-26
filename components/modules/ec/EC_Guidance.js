export const EC_Guidance = {
    showGistModal() {
        if (!window.modal) return;

        const gistHTML = `
            <div style="padding: 10px;">
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--indigo-700); margin-bottom: 8px;">Logistics Backbone Overview</h3>
                    <p style="font-size: 14px; line-height: 1.6; color: var(--slate-600);">The Equipment Coordinator (EC) ensures materials and machinery flow from storage silos to active construction sites without delay.</p>
                </div>

                <div style="display: grid; gap: 16px;">
                    <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                        <div style="font-size: 20px; color: var(--indigo-600);"><i class="fas fa-chart-line"></i></div>
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">Logistics Command (Dashboard)</div>
                            <div style="font-size: 13px; color: var(--slate-500);">Monitor real-time "Burn Rates" and fleet readiness. Keep an eye on the **Conflict Monitor** for asset double-bookings.</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                        <div style="font-size: 20px; color: var(--emerald-600);"><i class="fas fa-truck-ramp-box"></i></div>
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">Logistics Hub (Requisitions & Receipts)</div>
                            <div style="font-size: 13px; color: var(--slate-500);">The core of your workflow. Fulfill Field Supervisor requests (Dispatch) and confirm physical delivery of goods purchased by Finance (Receipt).</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                        <div style="font-size: 20px; color: var(--orange-600);"><i class="fas fa-warehouse"></i></div>
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">Inventory & Registry</div>
                            <div style="font-size: 13px; color: var(--slate-500);">Manage the Master Asset Registry (Excavators, Tippers) and track consumable silo levels (Cement, Fuel, Bitumen).</div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; background: var(--slate-50); border-radius: 12px;">
                        <div style="font-size: 20px; color: var(--blue-600);"><i class="fas fa-wrench"></i></div>
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">Logistics Control (Maintenance & Logs)</div>
                            <div style="font-size: 13px; color: var(--slate-500);">Track historical consumption "burn" records and manage the preventative maintenance schedule for the heavy fleet.</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--slate-100); text-align: center;">
                    <button class="btn btn-primary" onclick="window.modal.hide()" style="width: 100%; justify-content: center; padding: 12px;">Got it, let's work</button>
                </div>
            </div>
        `;

        window.modal.show('Equipment Coordinator Map', gistHTML);
    }
};
