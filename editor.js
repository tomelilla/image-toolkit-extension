document.addEventListener('DOMContentLoaded', async () => {

    // Initialize I18n
    const languageSelector = document.getElementById('languageSelector');
    await I18nManager.init();
    languageSelector.value = I18nManager.currentLocale;

    // Handle Language Switch
    languageSelector.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        await I18nManager.setLanguage(newLang);
    });

    // Re-render info on language change
    window.addEventListener('languageChanged', () => {
        if (uploadedImage) {
             const file = imageUpload.files[0] || { name: 'image.png', size: 0 }; // Fallback if file input is empty (e.g. from popup transfer)
             // Note: If loaded from popup, we might lose original file object.
             // We can store metadata in a global var to re-render.
             // For now, let's just re-trigger display info if we have the data.
             if (currentImageMetadata) {
                 displayImageInfo(currentImageMetadata.name, currentImageMetadata.sizeStr, uploadedImage.naturalWidth, uploadedImage.naturalHeight);
             }
        }
    });

    const imageUpload = document.getElementById('imageUpload');
    const originalImage = document.getElementById('originalImage');
    const imageInfo = document.getElementById('imageInfo');
    const scalePercentageInput = document.getElementById('scalePercentage');
    const scaleWidthInput = document.getElementById('scaleWidth');
    const scaleHeightInput = document.getElementById('scaleHeight');
    const scaleImageBtn = document.getElementById('scaleImage');
    const compressQualityInput = document.getElementById('compressQuality');
    const compressImageBtn = document.getElementById('compressImage');
    const cropImageBtn = document.getElementById('cropImage');
    const removeBackgroundBtn = document.getElementById('removeBackground');

    const stitchDirectionSelect = document.getElementById('stitchDirection');
    const stitchImagesBtn = document.getElementById('stitchImages');

    const compressFormatSelect = document.getElementById('compressFormat');
    const outputCanvas = document.getElementById('outputCanvas');
    const outputImage = document.getElementById('outputImage');
    const downloadLink = document.getElementById('downloadLink');
    const ctx = outputCanvas.getContext('2d');

    // Tab Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             // Remove active class from all
             tabBtns.forEach(b => b.classList.remove('active'));
             tabContents.forEach(c => c.classList.remove('active'));

             // Add active to clicked and target
             btn.classList.add('active');
             const tabId = btn.getAttribute('data-tab');
             document.getElementById(`tab-${tabId}`).classList.add('active');

             // Toggle Cropper based on tab
             if (tabId === 'crop') {
                 initCropper();
             } else {
                 destroyCropper();
             }
        });
    });

    let uploadedImagesList = []; // Array to store multiple images
    let currentIndex = -1;
    let uploadedImage = null; // Stores the currently selected image data
    let uploadedStitchImages = []; // Stores images for stitching
    let currentImageMetadata = null; // Store metadata for re-localization
    const imageListContainer = document.getElementById('imageListContainer');
    const dropZone = document.getElementById('dropZone'); // The add button
    const outputInfo = document.getElementById('outputInfo');

    // Helper to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function displayImageInfo(fileName, fileSizeStr, width, height) {
        const fileExtension = fileName.split('.').pop();
        imageInfo.textContent = I18nManager.getMessage('imageInfoText')
            .replace('%s', fileName)
            .replace('%s', fileExtension)
            .replace('%s', fileSizeStr)
            .replace('%s', `${width}px`)
            .replace('%s', `${height}px`);
    }

    const cropToolsContainer = document.getElementById('cropToolsContainer');
    const btnCropFree = document.getElementById('btnCropFree');
    const btnCropSquare = document.getElementById('btnCropSquare');
    const btnCrop169 = document.getElementById('btnCrop169');
    const btnCropRound = document.getElementById('btnCropRound');

    let cropper = null;
    let isRoundCrop = false;

    // Helper to init cropper
    function initCropper() {
        if (!uploadedImage || cropper) return; // Don't re-init or init if no image

        cropper = new Cropper(originalImage, {
            viewMode: 1,
            autoCrop: true,
        });

        cropToolsContainer.style.display = 'block';
        const cropMessage = document.getElementById('cropMessage');
        if (cropMessage) cropMessage.style.display = 'none';
        btnCropFree.classList.add('active');
    }

    // Helper to reset cropper
    function destroyCropper() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        isRoundCrop = false;
        // Reset buttons
        document.querySelectorAll('.crop-mode-btn').forEach(btn => btn.classList.remove('active'));
    }

    // Load image from Data URL
    function loadImageFromDataURL(dataURL, fileName, fileSizeStr) {
        destroyCropper();
        originalImage.src = dataURL;
        originalImage.style.display = 'block';
        uploadedImage = new Image();
        uploadedImage.onload = () => {
             // Reset output
            outputCanvas.style.display = 'none';
            outputImage.style.display = 'none';
            downloadLink.style.display = 'none';

            // Store metadata
            currentImageMetadata = { name: fileName, sizeStr: fileSizeStr };

            // Display info
            displayImageInfo(fileName, fileSizeStr, uploadedImage.naturalWidth, uploadedImage.naturalHeight);

            scaleWidthInput.placeholder = uploadedImage.naturalWidth;
            scaleHeightInput.placeholder = uploadedImage.naturalHeight;

            // Conditional Init Cropper (only if on crop tab)
            if (document.querySelector('.tab-btn[data-tab="crop"]').classList.contains('active')) {
                initCropper();
            }
            btnCropFree.classList.add('active');
        };
        uploadedImage.src = dataURL;
    }

    // Add Image to List and Select
    function addImageToList(dataUrl, name, sizeStr, fileObj = null) {
        const imgObj = {
            dataUrl: dataUrl,
            name: name,
            sizeStr: sizeStr,
            file: fileObj
        };

        // Wait for dimensionality
        const tempImg = new Image();
        tempImg.onload = () => {
            imgObj.width = tempImg.naturalWidth;
            imgObj.height = tempImg.naturalHeight;

            uploadedImagesList.push(imgObj);
            const index = uploadedImagesList.length - 1;

            renderThumbnail(imgObj, index);

            // Auto Select if it's the first one, or maybe always?
            // User requirement: "Original image defaults to showing the first one. Clicking other images switches display"
            // So if it's the first one, select it. If appending, maybe don't auto-switch unless user wants?
            // "Last one is add more... Default shows first one" -> Implementation: If list was empty, select 0.
            if (uploadedImagesList.length === 1) {
                selectImage(0);
            }
        };
        tempImg.src = dataUrl;
    }

    function renderThumbnail(imgObj, index) {
        const thumb = document.createElement('div');
        thumb.className = 'image-list-item';
        thumb.dataset.index = index;

        const img = document.createElement('img');
        img.src = imgObj.dataUrl;

        thumb.appendChild(img);

        thumb.addEventListener('click', () => {
            selectImage(index);
        });

        // Insert before the dropZone (add button)
        imageListContainer.insertBefore(thumb, dropZone);
    }

    function selectImage(index) {
        if (index < 0 || index >= uploadedImagesList.length) return;

        currentIndex = index;

        // Update UI Highlights
        document.querySelectorAll('.image-list-item').forEach(item => {
            if (item.classList.contains('add-btn')) return;
            item.classList.remove('selected');
            if (parseInt(item.dataset.index) === index) {
                item.classList.add('selected');
            }
        });

        const item = uploadedImagesList[index];
        loadImageFromDataURL(item.dataUrl, item.name, item.sizeStr);
    }


    // Check for pending image from Popup
    chrome.storage.local.get(['pendingImage'], (result) => {
        if (result.pendingImage) {
            const { dataUrl, name, sizeStr } = result.pendingImage;
            addImageToList(dataUrl, name, sizeStr);
            // Clear storage
            chrome.storage.local.remove('pendingImage');
        }
    });

    // Handle image upload (Directly in Editor)
    imageUpload.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => handleFile(file));
        }
        // Reset input so same file can be selected again
        event.target.value = '';
    });

    // Drag & Drop logic .... (Keep existing but update handleFile call)
    // ...


    // Drag and Drop Logic
    // dropZone is already defined in updated scope
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
             Array.from(files).forEach(file => {
                 if (file.type.startsWith('image/')) {
                     handleFile(file);
                 }
             });
        }
    }

    function handleFile(file) {
         const reader = new FileReader();
         reader.onload = (e) => {
             addImageToList(e.target.result, file.name, formatFileSize(file.size), file);
         };
         reader.readAsDataURL(file);
    }

    // Handle image scaling
    scaleImageBtn.addEventListener('click', () => {
        if (!uploadedImage) {
            alert(I18nManager.getMessage('pleaseUploadImageFirst'));
            return;
        }

        const originalWidth = uploadedImage.naturalWidth;
        const originalHeight = uploadedImage.naturalHeight;
        let newWidth, newHeight;

        const percentage = parseFloat(scalePercentageInput.value);
        const targetWidth = parseInt(scaleWidthInput.value);
        const targetHeight = parseInt(scaleHeightInput.value);

        if (!isNaN(targetWidth) && !isNaN(targetHeight) && targetWidth > 0 && targetHeight > 0) {
            // Use specific dimensions
            newWidth = targetWidth;
            newHeight = targetHeight;
        } else if (!isNaN(targetWidth) && targetWidth > 0) {
            // Width only, maintain aspect ratio
            newWidth = targetWidth;
            newHeight = (originalHeight / originalWidth) * targetWidth;
        } else if (!isNaN(targetHeight) && targetHeight > 0) {
            // Height only, maintain aspect ratio
            newHeight = targetHeight;
            newWidth = (originalWidth / originalHeight) * targetHeight;
        } else if (!isNaN(percentage) && percentage > 0) {
            // Use percentage
            newWidth = originalWidth * (percentage / 100);
            newHeight = originalHeight * (percentage / 100);
        } else {
            alert(I18nManager.getMessage('enterValidPercentage')); // Reuse error message or add generic "Invalid Input"
            return;
        }

        outputCanvas.width = newWidth;
        outputCanvas.height = newHeight;
        ctx.clearRect(0, 0, newWidth, newHeight);
        ctx.drawImage(uploadedImage, 0, 0, newWidth, newHeight);

        displayProcessedImage(outputCanvas.toDataURL());
    });

    // Placeholder for compress image
    compressImageBtn.addEventListener('click', () => {
        if (!uploadedImage) {
            alert(I18nManager.getMessage('pleaseUploadImageFirst'));
            return;
        }
        const quality = parseInt(compressQualityInput.value);
        if (isNaN(quality) || quality < 0 || quality > 100) {
            alert(I18nManager.getMessage('enterValidQuality'));
            return;
        }
        // Compression logic will go here
        outputCanvas.width = uploadedImage.naturalWidth;
        outputCanvas.height = uploadedImage.naturalHeight;
        ctx.clearRect(0, 0, uploadedImage.naturalWidth, uploadedImage.naturalHeight);
        ctx.drawImage(uploadedImage, 0, 0);

        let mimeType = 'image/png';
        const format = compressFormatSelect.value;

        if (format === 'original') {
             mimeType = uploadedImage.src.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
             // If original is webp, we should probably respect that if possible, but toDataURL support varies.
             if (uploadedImage.src.startsWith('data:image/webp')) mimeType = 'image/webp';
        } else if (format === 'jpeg') {
            mimeType = 'image/jpeg';
        } else if (format === 'png') {
            mimeType = 'image/png';
        } else if (format === 'webp') {
            mimeType = 'image/webp';
        }

        const compressedDataURL = outputCanvas.toDataURL(mimeType, quality / 100);
        displayProcessedImage(compressedDataURL);
    });

    // Crop Token Handlers
    function setActiveCropBtn(activeBtn) {
        document.querySelectorAll('.crop-mode-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
        isRoundCrop = false; // Reset unless specified
    }

    btnCropFree.addEventListener('click', () => {
        if (!cropper) return;
        cropper.setAspectRatio(NaN);
        setActiveCropBtn(btnCropFree);
    });

    btnCropSquare.addEventListener('click', () => {
        if (!cropper) return;
        cropper.setAspectRatio(1);
        setActiveCropBtn(btnCropSquare);
    });

    btnCrop169.addEventListener('click', () => {
        if (!cropper) return;
        cropper.setAspectRatio(16 / 9);
        setActiveCropBtn(btnCrop169);
    });

    btnCropRound.addEventListener('click', () => {
        if (!cropper) return;
        cropper.setAspectRatio(1);
        setActiveCropBtn(btnCropRound);
        isRoundCrop = true;
    });


    // Perform Crop
    cropImageBtn.addEventListener('click', () => {
        if (!cropper) {
            alert(I18nManager.getMessage('pleaseUploadImageFirst'));
            return;
        }

        // Get cropped canvas
        let croppedCanvas = cropper.getCroppedCanvas({
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        if (!croppedCanvas) {
             alert('Could not crop image. Please check selection.');
             return;
        }

        // Handle Round Crop
        if (isRoundCrop) {
            const roundedCanvas = document.createElement('canvas');
            const roundedCtx = roundedCanvas.getContext('2d');
            const w = croppedCanvas.width;
            const h = croppedCanvas.height;
            const size = Math.min(w, h); // Should be square usually

            roundedCanvas.width = size;
            roundedCanvas.height = size;

            // Draw circle mask
            roundedCtx.beginPath();
            roundedCtx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
            roundedCtx.closePath();
            roundedCtx.clip();

            // Draw image into masked area
            roundedCtx.drawImage(croppedCanvas, 0, 0, size, size);
            croppedCanvas = roundedCanvas;
        }

        displayProcessedImage(croppedCanvas.toDataURL('image/png')); // Force PNG for transparency support (round)
    });

    // Placeholder for remove background
    removeBackgroundBtn.addEventListener('click', () => {
        if (!uploadedImage) {
            alert(I18nManager.getMessage('pleaseUploadImageFirst'));
            return;
        }
        alert(I18nManager.getMessage('backgroundRemovalComplex'));
        // This will likely require a dedicated library or API
    });

    // Stitch Logic
    stitchImagesBtn.addEventListener('click', async () => {
        if (uploadedImagesList.length < 2) {
            alert(I18nManager.getMessage('atLeastTwoImagesForStitching'));
            return;
        }

        const direction = stitchDirectionSelect.value;
        const imagesToStitch = [];

        // Load all images
        const loadPromises = uploadedImagesList.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = item.dataUrl;
            });
        });

        const loadedImages = await Promise.all(loadPromises);

        let totalWidth = 0;
        let totalHeight = 0;
        let maxWidth = 0;
        let maxHeight = 0;

        // Calculate total dimensions
        if (direction === 'horizontal') {
            for (const img of loadedImages) {
                totalWidth += img.naturalWidth;
                maxHeight = Math.max(maxHeight, img.naturalHeight);
            }
            totalHeight = maxHeight;
        } else { // vertical
            for (const img of loadedImages) {
                totalHeight += img.naturalHeight;
                maxWidth = Math.max(maxWidth, img.naturalWidth);
            }
            totalWidth = maxWidth;
        }

        outputCanvas.width = totalWidth;
        outputCanvas.height = totalHeight;
        ctx.clearRect(0, 0, totalWidth, totalHeight);

        let currentX = 0;
        let currentY = 0;

        for (const img of loadedImages) {
            if (direction === 'horizontal') {
                ctx.drawImage(img, currentX, 0, img.naturalWidth, maxHeight);
                currentX += img.naturalWidth;
            } else { // vertical
                ctx.drawImage(img, 0, currentY, maxWidth, img.naturalHeight);
                currentY += img.naturalHeight;
            }
        }

        displayProcessedImage(outputCanvas.toDataURL());
    });

    // Helper function to display processed image
    function displayProcessedImage(dataURL) {
        outputImage.src = dataURL;
        outputImage.style.display = 'block';

        // Detect Extension
        let ext = 'png';
        const match = dataURL.match(/^data:image\/(.*?);/);
        if (match && match[1]) {
            ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        }

        // Generate Timestamp: image-YYYY-MM-DD-HHmmss
        const now = new Date();
        const YYYY = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const DD = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${YYYY}-${MM}-${DD}-${HH}${mm}${ss}`;

        downloadLink.href = dataURL;
        downloadLink.download = `image-${timestamp}.${ext}`;
        downloadLink.style.display = 'block';
        outputCanvas.style.display = 'none'; // Hide canvas if image is directly displayed

        // Calculate Stats
        const i = new Image();
        i.onload = () => {
             // Rough size calc from base64 (remove header)
             const base64str = dataURL.split(',')[1];
             const decodedSize = window.atob(base64str).length;
             const sizeStr = formatFileSize(decodedSize);
             const width = i.naturalWidth;
             const height = i.naturalHeight;

             // "Size: %s, Dimensions: %s x %s"
             outputInfo.textContent = I18nManager.getMessage('outputStats')
                 .replace('%s', sizeStr)
                 .replace('%s', width)
                 .replace('%s', height);
        };
        i.src = dataURL;
    }
});
