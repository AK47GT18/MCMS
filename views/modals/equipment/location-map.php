<?php
/**
 * Equipment Location Map Modal
 * Show equipment location on map
 */
?>

<div class="modal fade" id="equipmentLocationMapModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Equipment Location</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="locationMap" style="width: 100%; height: 400px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                    <p>Map will be displayed here</p>
                </div>
                <div class="mt-3">
                    <p><strong>Address:</strong> <span id="locationAddress"></span></p>
                    <p><strong>Coordinates:</strong> <span id="locationCoords"></span></p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="openMapBtn" href="#" target="_blank" class="btn btn-primary">Open in Map</a>
            </div>
        </div>
    </div>
</div>

<script>
const EquipmentLocationMapModal = {
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
        document.getElementById('locationAddress').textContent = equipment.location;
        document.getElementById('locationCoords').textContent = equipment.latitude && equipment.longitude 
            ? `${equipment.latitude}, ${equipment.longitude}` 
            : 'Not available';
        
        if (equipment.latitude && equipment.longitude) {
            const mapUrl = `https://maps.google.com/maps?q=${equipment.latitude},${equipment.longitude}&z=15`;
            document.getElementById('openMapBtn').href = mapUrl;
        }
        
        ModalManager?.show('equipmentLocationMapModal');
    }
};
</script>
