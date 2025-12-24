<?php
/**
 * Contract Version History Modal
 * View contract version history
 */
?>

<div class="modal fade" id="versionHistoryModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Version History</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="version-timeline" id="versionTimeline">
                    <!-- Versions loaded dynamically -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
const VersionHistoryModal = {
    show: async function(contractId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/contracts/${contractId}/versions`);
            const data = await response.json();
            
            if (data.success) {
                this.renderVersions(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    renderVersions: function(versions) {
        const timeline = document.getElementById('versionTimeline');
        timeline.innerHTML = '';
        
        versions.forEach((version, index) => {
            const div = document.createElement('div');
            div.className = 'version-item';
            div.innerHTML = `
                <div class="version-marker"></div>
                <div class="version-content">
                    <h6>Version ${version.number} - ${new Date(version.createdAt).toLocaleDateString()}</h6>
                    <p><small>${version.createdBy}</small></p>
                    <p>${version.changes}</p>
                    <button class="btn btn-sm btn-info" onclick="downloadVersion(${version.id})">Download</button>
                </div>
            `;
            timeline.appendChild(div);
        });
        
        ModalManager?.show('versionHistoryModal');
    }
};

function downloadVersion(versionId) {
    location.href = `<?php echo BASE_URL; ?>/api/v1/contracts/versions/${versionId}/download`;
}
</script>
