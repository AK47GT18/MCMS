<?php
/**
 * Equipment Quick View Modal
 * Display equipment summary
 */
?>

<div class="modal fade" id="equipmentQuickViewModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="equipmentName">Equipment Details</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Equipment ID:</strong> <span id="equipmentId"></span></p>
                        <p><strong>Category:</strong> <span id="equipmentCategory"></span></p>
                        <p><strong>Status:</strong> <span id="equipmentStatus" class="badge"></span></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Operator:</strong> <span id="equipmentOperator"></span></p>
                        <p><strong>Location:</strong> <span id="equipmentLocation"></span></p>
                        <p><strong>Utilization:</strong> <span id="equipmentUtilization"></span>%</p>
                    </div>
                </div>
                <hr>
                <p><strong>Manufacturer:</strong> <span id="equipmentManufacturer"></span></p>
                <p><strong>Model:</strong> <span id="equipmentModel"></span></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="equipmentViewBtn" href="#" class="btn btn-primary">View Full</a>
            </div>
        </div>
    </div>
</div>

<script>
const EquipmentQuickViewModal = {
    show: async function(equipmentId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/equipment/${equipmentId}`);
            const data = await response.json();
            
            if (data.success) {
                this.display(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    display: function(equipment) {
        document.getElementById('equipmentName').textContent = equipment.name;
        document.getElementById('equipmentId').textContent = equipment.equipmentId;
        document.getElementById('equipmentCategory').textContent = equipment.category;
        document.getElementById('equipmentStatus').textContent = equipment.status;
        document.getElementById('equipmentStatus').className = 'badge badge-' + equipment.status;
        document.getElementById('equipmentOperator').textContent = equipment.operator || '-';
        document.getElementById('equipmentLocation').textContent = equipment.location;
        document.getElementById('equipmentUtilization').textContent = equipment.utilization || 0;
        document.getElementById('equipmentManufacturer').textContent = equipment.manufacturer;
        document.getElementById('equipmentModel').textContent = equipment.model;
        document.getElementById('equipmentViewBtn').href = `<?php echo BASE_URL; ?>/equipment/${equipment.id}/view`;
        
        ModalManager?.show('equipmentQuickViewModal');
    }
};
</script>
