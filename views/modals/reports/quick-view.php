<?php
/**
 * Reports Quick View Modal
 * Display report summary
 */
?>

<div class="modal fade" id="reportQuickViewModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="reportTitle">Report</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="reportContent"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="reportViewBtn" href="#" class="btn btn-primary">View Full Report</a>
            </div>
        </div>
    </div>
</div>

<script>
const ReportQuickViewModal = {
    show: async function(reportId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports/${reportId}`);
            const data = await response.json();
            
            if (data.success) {
                this.display(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    display: function(report) {
        document.getElementById('reportTitle').textContent = report.title;
        document.getElementById('reportContent').innerHTML = `
            <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleDateString()}</p>
            <p><strong>Type:</strong> ${report.type}</p>
            <p><strong>Period:</strong> ${report.period}</p>
            <div class="mt-3">${report.summary}</div>
        `;
        document.getElementById('reportViewBtn').href = `<?php echo BASE_URL; ?>/reports/${report.id}`;
        
        ModalManager?.show('reportQuickViewModal');
    }
};
</script>
