<?php
/**
 * Image Preview Modal
 * Display images in fullscreen
 */
?>

<div class="modal fade" id="imagePreviewModal" tabindex="-1">
    <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="imageTitle">Image Preview</h5>
                <button type="button" class="modal-close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body text-center">
                <img id="previewImage" src="" alt="Preview" class="img-fluid" style="max-height: 80vh;">
            </div>
            <div class="modal-footer">
                <div class="image-info" id="imageInfo" style="margin-right: auto;"></div>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <a id="downloadImageBtn" href="#" class="btn btn-primary" download>Download</a>
            </div>
        </div>
    </div>
</div>

<script>
const ImagePreviewModal = {
    show: function(imageSrc, title = 'Image', info = '') {
        document.getElementById('previewImage').src = imageSrc;
        document.getElementById('imageTitle').textContent = title;
        
        if (info) {
            document.getElementById('imageInfo').textContent = info;
        }
        
        const downloadBtn = document.getElementById('downloadImageBtn');
        downloadBtn.href = imageSrc;
        downloadBtn.download = title + '.jpg';
        
        ModalManager?.show('imagePreviewModal');
    },
    
    showMultiple: function(images, currentIndex = 0) {
        let index = currentIndex;
        
        const updateImage = () => {
            const image = images[index];
            this.show(image.src, image.title || 'Image ' + (index + 1), `${index + 1} of ${images.length}`);
        };
        
        updateImage();
    }
};
</script>
