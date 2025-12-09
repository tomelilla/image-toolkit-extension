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

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const pendingImage = {
                    dataUrl: dataUrl,
                    name: file.name,
                    sizeStr: formatFileSize(file.size)
                };

                // Save to storage
                chrome.storage.local.set({ pendingImage: pendingImage }, () => {
                    // Open editor tab
                    chrome.tabs.create({ url: 'editor.html' });
                });
            };
            reader.readAsDataURL(file);
        }
    });
});
