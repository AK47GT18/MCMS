import { ReportBuilder } from '../ReportBuilder.js';

export const PM_Reports = {
    async init() {
        if (!this.reportBuilder) {
            this.reportBuilder = new ReportBuilder();
        }
        await this.reportBuilder.init('reports-container');
    },

    getReportsView() {
        // Initialize on next tick after container is in DOM
        setTimeout(() => this.init(), 100);

        return `
            <div id="reports-container" class="animate-fade-in" style="min-height: calc(100vh - 120px);">
                <div class="rb-empty-state">
                    <div class="rb-loader"></div>
                    <p style="margin-top: 20px;">Booting Analytics Engine...</p>
                </div>
            </div>
        `;
    }
};
