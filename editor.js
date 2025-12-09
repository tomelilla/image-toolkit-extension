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
    const autoAlignCheckbox = document.getElementById('autoAlignStitch');
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
        const autoAlign = autoAlignCheckbox.checked;

        // Load all images
        const loadPromises = uploadedImagesList.map(item => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = item.dataUrl;
            });
        });

        const loadedImages = await Promise.all(loadPromises);

        // 1. Normalize Dimensions
        // Horizontal: Height matches MaxHeight
        // Vertical: Width matches MaxWidth
        // We will store "draw dimensions" for each image
        const normalizedImages = [];

        let targetDimension = 0;

        if (direction === 'horizontal') {
            targetDimension = Math.max(...loadedImages.map(img => img.naturalHeight));
             loadedImages.forEach(img => {
                const scale = targetDimension / img.naturalHeight;
                normalizedImages.push({
                    img: img,
                    width: img.naturalWidth * scale,
                    height: targetDimension // Same height
                });
            });
        } else {
             targetDimension = Math.max(...loadedImages.map(img => img.naturalWidth));
             loadedImages.forEach(img => {
                const scale = targetDimension / img.naturalWidth;
                normalizedImages.push({
                    img: img,
                    width: targetDimension, // Same width
                    height: img.naturalHeight * scale
                });
            });
        }

        // 2. Calculate Offsets (Auto Align)
        // If autoAlign is true, we calculate overlap for each adjacent pair
        const overlaps = [0]; // First image has 0 overlap with specific predecessor

        if (autoAlign) {
            // Create a temp canvas for pixel analysis
            const tCanvas = document.createElement('canvas');
            const tCtx = tCanvas.getContext('2d');

            // Note: Since we need pixel data, we must draw them at normalised size or original?
            // Better to analyze at normalised size to match the output.

            // To be efficient, we only check max 20% overlap or fixed px?
            // Let's check max 300px or 20%

            for (let i = 1; i < normalizedImages.length; i++) {
                const prev = normalizedImages[i-1];
                const curr = normalizedImages[i];

                // We need to draw the relevant parts to tCanvas to get ImageData
                // Horizontal: Prev Right edge vs Curr Left edge
                // Vertical: Prev Bottom edge vs Curr Top edge

                let overlap = 0;

                if (direction === 'vertical') {
                    // Resize temp canvas to width: targetDimension, height: searchRange * 2
                    // Search range: Increase to 90% to catch large overlaps
                    const searchH = Math.min(prev.height, curr.height) * 0.9;
                    const w = targetDimension;

                    tCanvas.width = w;
                    tCanvas.height = searchH * 2; // Enough for both strips

                    // Draw Prev Bottom
                    tCtx.drawImage(prev.img, 0, 0, prev.img.naturalWidth, prev.img.naturalHeight,
                                   0, 0, prev.width, prev.height);
                    const prevData = tCtx.getImageData(0, prev.height - searchH, w, searchH);

                    // Draw Curr Top
                    tCtx.clearRect(0, 0, w, searchH * 2);
                    tCtx.drawImage(curr.img, 0, 0, curr.img.naturalWidth, curr.img.naturalHeight,
                                   0, 0, curr.width, curr.height);
                    const currData = tCtx.getImageData(0, 0, w, searchH);

                    overlap = calculateBestOverlap(prevData, currData, w, searchH, 'vertical');

                } else {
                    // Horizontal
                     const searchW = Math.min(prev.width, curr.width) * 0.9;
                     const h = targetDimension;

                     tCanvas.width = searchW * 2;
                     tCanvas.height = h;

                     // Prev Right
                     tCtx.drawImage(prev.img, 0, 0, prev.img.naturalWidth, prev.img.naturalHeight,
                                    0, 0, prev.width, prev.height);
                     const prevData = tCtx.getImageData(prev.width - searchW, 0, searchW, h);

                     // Curr Left
                     tCtx.clearRect(0,0, searchW*2, h);
                     tCtx.drawImage(curr.img, 0, 0, curr.img.naturalWidth, curr.img.naturalHeight,
                                    0, 0, curr.width, curr.height);
                     const currData = tCtx.getImageData(0, 0, searchW, h);

                     overlap = calculateBestOverlap(prevData, currData, searchW, h, 'horizontal');
                }

                overlaps.push(overlap);
            }
        } else {
            // Fill 0s
            for(let i=1; i<normalizedImages.length; i++) overlaps.push(0);
        }

        // 3. Render Final Canvas
        let totalWidth = 0;
        let totalHeight = 0;

        if (direction === 'horizontal') {
            totalHeight = targetDimension;
            normalizedImages.forEach((img, i) => {
                totalWidth += img.width;
                if (i > 0) totalWidth -= overlaps[i];
            });
        } else {
            totalWidth = targetDimension;
             normalizedImages.forEach((img, i) => {
                totalHeight += img.height;
                if (i > 0) totalHeight -= overlaps[i];
            });
        }

        outputCanvas.width = totalWidth;
        outputCanvas.height = totalHeight;
        ctx.clearRect(0, 0, totalWidth, totalHeight);

        let currentPos = 0;
        normalizedImages.forEach((img, i) => {
             const overlap = overlaps[i] || 0;
             // Subtract overlap from currentPos before drawing?
             // No, draw at currentPos, then increment by (width - overlap) for next.
             // Wait, if overlap is 50, we draw Img2 starting 50px EARLIER.
             // So currentPos should decrement by overlap.

             if (i > 0) currentPos -= overlap;

             if (direction === 'horizontal') {
                 // ctx.drawImage(img src, dstX, dstY, dstW, dstH)
                ctx.drawImage(img.img, 0, 0, img.img.naturalWidth, img.img.naturalHeight,
                              currentPos, 0, img.width, img.height);
                currentPos += img.width;
             } else {
                ctx.drawImage(img.img, 0, 0, img.img.naturalWidth, img.img.naturalHeight,
                              0, currentPos, img.width, img.height);
                currentPos += img.height;
             }
        });

        displayProcessedImage(outputCanvas.toDataURL());
    });

    // Simple Overlap Detection (MSE)
    function calculateBestOverlap(prevData, currData, w, h, direction) {
        // We shift currData "into" prevData (or vice versa) and find min diff
        // Max overlap to check is determined by input data size (search range)
        // We will check shifts from 0 to h (vertical) or 0 to w (horizontal)

        let minError = Infinity;
        let bestOffset = 0;
        const pData = prevData.data;
        const cData = currData.data;

        // Stride is 4 (RGBA)
        // Optimization: Check every Nth pixel or row/col to speed up?
        // Let's do a fairly naive scan but maybe step 2 or 4 pixels for speed if needed.
        // Given Chrome V8 speed, full scan of reasonable size (e.g. 500x100) is fast.

        const limit = direction === 'vertical' ? h : w;

        // Scan each possible overlap amount (offset)
        // Offset = 0 means no overlap check (start of curr touches end of prev) -- wait, we want to find overlap.
        // We assume curr's TOP overlaps with prev's BOTTOM.
        // So we compare prev's [Height - k] row with curr's [0] row... up to prev's [Height] with curr's [k].
        // Actually, we are comparing a strip.
        // We compare prevData (Bottom Strip) with currData (Top Strip).
        // If overlap is 10px, it means prevData's last 10px match currData's first 10px.

        // Let's iterate 'k' pixels of overlap
        // Range: 10 pixels to limit/2 ? or full limit?
        // Let's require at least 10px overlap to be "confident" and avoid false positives on 1px lines.

        // Scan starting from 5px to avoid edge noise
        for (let k = 5; k < limit; k++) {
             // Calculate error for overlap 'k'
             let error = 0;
             let count = 0;

             // We compare:
             // Prev: Row (h - k) to (h)
             // Curr: Row 0 to k

             // BUT checking area is costly. Let's check a few scanlines?
             // Let's check the whole area of overlap.

             // For Vertical:
             // Prev Pixel at (x, h-k+y) compare with Curr Pixel at (x, y)
             // where y goes from 0 to k

             if (direction === 'vertical') {
                 // Optimization: Only check the exact line if we assume perfect vertical shift?
                 // No, usually screenshots have some content.
                 // Checking full block is safer.

                 // If k is large, this loop is O(k * w * k) -> O(w*k^2).
                 // If w=1000, k=200, 1000*40000 = 40M ops. A bit heavy for UI thread?
                 // Optimization: sample every 5th column
                 const stepX = Math.floor(w / 80) || 1; // Sample ~80 points across width

                 for (let y = 0; y < k; y++) {
                     for (let x = 0; x < w; x += stepX) {
                         // Prev index
                         // Row: h - k + y
                         const pIdx = ((h - k + y) * w + x) * 4;
                         const cIdx = (y * w + x) * 4;

                         const rD = pData[pIdx] - cData[cIdx];
                         const gD = pData[pIdx+1] - cData[cIdx+1];
                         const bD = pData[pIdx+2] - cData[cIdx+2];
                         // const aD = pData[pIdx+3] - cData[cIdx+3]; // Ignore alpha diffs?

                         error += (rD*rD + gD*gD + bD*bD);
                         count++;
                     }
                 }
             } else {
                 // Horizontal
                 // Compare Prev Col (w-k+x) with Curr Col (x)
                 // Sample every 5th row
                 const stepY = Math.floor(h / 80) || 1;

                  for (let x = 0; x < k; x++) {
                     for (let y = 0; y < h; y += stepY) {
                          // Prev: col w-k+x
                          const pIdx = (y * w + (w - k + x)) * 4;
                          const cIdx = (y * w + x) * 4;

                         const rD = pData[pIdx] - cData[cIdx];
                         const gD = pData[pIdx+1] - cData[cIdx+1];
                         const bD = pData[pIdx+2] - cData[cIdx+2];
                         error += (rD*rD + gD*gD + bD*bD);
                         count++;
                     }
                  }
             }

             if (count > 0) {
                 const mse = error / count;
                 // Dynamic threshold? Or just find min?
                 // Find local minimum that is "good enough"?
                 // Simple approach: global min.
                 if (mse < minError) {
                     minError = mse;
                     bestOffset = k;
                 }
             }
        }

        // Threshold check
        // Relaxed threshold to 2500 (~50 avg diff) for compression handling
        if (minError > 2500) return 0;

        return bestOffset;
    }

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
