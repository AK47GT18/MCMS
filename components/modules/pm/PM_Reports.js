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
            <div id="reports-container" class="animate-fade-in" style="height: calc(100vh - 120px);">
                <div class="flex items-center justify-center p-20">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            </div>
        `;
    }
};
