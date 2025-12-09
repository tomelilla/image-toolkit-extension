document.addEventListener('DOMContentLoaded', () => {
    // Helper to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Localize
    I18nManager.init();

    const imageUpload = document.getElementById('imageUpload');
    const dropZoneLabel = document.getElementById('dropZoneLabel');
    const openFullScreenBtn = document.getElementById('openFullScreen');

    // Handle Open Full Screen
    if (openFullScreenBtn) {
        openFullScreenBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'editor.html' });
        });
    }

    // Common Upload Handler
    function handleUpload(file) {
        if (!file) return;

        // Simple error handling for storage quota
        // 5MB limit on local storage usually
        if (file.size > 5 * 1024 * 1024) {
             // Fallback or warning
             // Ideally we should use IndexedDB, but for now let's warn
             // or try anyway and catch error
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const pendingImage = {
                dataUrl: dataUrl,
                name: file.name,
                sizeStr: formatFileSize(file.size)
            };

            // Save to storage with error handling
            try {
                chrome.storage.local.set({ pendingImage: pendingImage }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Storage Error:", chrome.runtime.lastError);
                        alert(I18nManager.getMessage('uploadError') || "Upload failed: Image might be too large.");
                    } else {
                        // Open editor tab
                        chrome.tabs.create({ url: 'editor.html' });
                    }
                });
            } catch (err) {
                 console.error("Storage Exception:", err);
                 alert("Upload failed. Code: " + err);
            }
        };
        reader.readAsDataURL(file);
    }

    // Input Change
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        handleUpload(file);
        event.target.value = ''; // Reset
    });

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZoneLabel.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneLabel.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZoneLabel.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZoneLabel.style.borderColor = '#4CAF50';
        dropZoneLabel.style.background = '#e8f5e9';
    }

    function unhighlight(e) {
        dropZoneLabel.style.borderColor = '#ccc';
        dropZoneLabel.style.background = '#fafafa';
    }

    dropZoneLabel.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
    }
});
