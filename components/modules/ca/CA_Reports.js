import { ReportBuilder } from '../ReportBuilder.js';

export const CA_Reports = {
    async init() {
        if (!this.reportBuilder) {
            this.reportBuilder = new ReportBuilder();
        }
        await this.reportBuilder.init('ca-reports-root');
    },

    getReportsView() {
        setTimeout(() => this.init(), 100);

        return `
            <div id="ca-reports-root" class="animate-fade-in" style="min-height: calc(100vh - 120px);">
                <div class="rb-empty-state">
                    <div class="rb-loader"></div>
                    <p style="margin-top: 20px;">Booting Compliance Analytics...</p>
                </div>
            </div>
        `;
    }
};
