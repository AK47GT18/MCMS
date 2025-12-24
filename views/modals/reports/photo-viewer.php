<?php
/**
 * Photo Viewer Modal
 * Display photos in gallery
 */
?>

<div class="modal fade" id="photoViewerModal" tabindex="-1">
    <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Photo Gallery</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
                <div id="photoGallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                    <!-- Photos loaded dynamically -->
                </div>
            </div>
        </div>
    </div>
</div>

<script>
const PhotoViewerModal = {
    show: async function(reportId) {
        try {
            const response = await fetch(`<?php echo BASE_URL; ?>/api/v1/reports/${reportId}/photos`);
            const data = await response.json();
            
            if (data.success) {
                this.renderPhotos(data.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
    
    renderPhotos: function(photos) {
        const gallery = document.getElementById('photoGallery');
        gallery.innerHTML = '';
        
        photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.url;
            img.style.width = '100%';
            img.style.height = '200px';
            img.style.objectFit = 'cover';
            img.style.cursor = 'pointer';
            img.style.borderRadius = '4px';
            img.onclick = () => ImagePreviewModal?.show(photo.url, photo.name);
            gallery.appendChild(img);
        });
        
        ModalManager?.show('photoViewerModal');
    }
};
</script>
