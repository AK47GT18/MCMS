<?php
/**
 * GPS Validation Modal
 * Validate GPS coordinates from site reports
 */
?>

<div class="modal fade" id="gpsValidationModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">GPS Validation</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Coordinates</label>
                    <input type="text" class="form-control" id="gpsCoords" placeholder="latitude, longitude" readonly>
                </div>
                
                <div class="form-group">
                    <label>Accuracy</label>
                    <p id="gpsAccuracy"></p>
                </div>
                
                <div class="form-group">
                    <label>Location on Map</label>
                    <div id="gpsMap" style="width: 100%; height: 300px; background: #f0f0f0; border-radius: 4px;"></div>
                </div>
                
                <div class="form-group">
                    <label>Timestamp</label>
                    <p id="gpsTimestamp"></p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
const GPSValidationModal = {
    show: function(gpsData) {
        document.getElementById('gpsCoords').value = `${gpsData.latitude}, ${gpsData.longitude}`;
        document.getElementById('gpsAccuracy').textContent = `${gpsData.accuracy} meters`;
        document.getElementById('gpsTimestamp').textContent = new Date(gpsData.timestamp).toLocaleString();
        
        ModalManager?.show('gpsValidationModal');
    }
};
</script>
