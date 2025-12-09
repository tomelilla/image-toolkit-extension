# Image Toolkit Chrome Extension

**Author:** GeminiCLI {gemini-1.5-pro-002}

This Chrome extension provides a comprehensive suite of image manipulation tools directly within your browser popup. Designed for efficiency and privacy, it allows users to perform various operations on uploaded images locally, without sending data to any external server.

## Features

### 1. Multi-Image Management
- **List View**: Upload multiple images via drag & drop or file selection.
- **Thumbnail Navigation**: Easily switch between uploaded images using the thumbnail list.
- **Batch Ready**: All uploaded images can be used for stitching.

### 2. Smart Image Stitching
Combine multiple screenshots or images into a single file.
- **Directions**: Support for both **Horizontal** and **Vertical** stitching.
- **Auto-Normalize**: Automatically resizes all images to match dimensions (e.g., same width for vertical stitching) to prevent jagged edges.
- **Smart Stitch (Auto-Remove Overlap)**:
    - Automatically detects and removes duplicate overlapping areas between images.
    - Perfect for creating long screenshots from multiple scrolling captures.
    - Optimized algorithm ensures fast processing even for large images.

### 3. Image Compression
Reduce file size without losing quality.
- **Format Support**: Convert to **JPEG**, **PNG**, or **WebP**.
- **Quality Control**: Adjustable slider (0-100) to fine-tune the balance between file size and quality.

### 4. Image Editing Tools
- **Crop**: Crop images with freeform or preset aspect ratios (Square, 16:9, Round).
- **Scale**: Proportionally resize images by percentage.
- **Analyze**: View detailed image metadata (dimensions, types).

### 5. Privacy First & Local Processing
- All image operations are performed **entirely within your browser**.
- **No data upload**: Your images never leave your device.

## Installation

To install and use the Image Toolkit extension:

1.  **Download the Extension:**
    *   Clone this repository or download the source code.

2.  **Open Chrome Extensions Page:**
    *   Open your Chrome browser.
    *   Type `chrome://extensions/` in the address bar and press Enter.

3.  **Enable Developer Mode:**
    *   On the Extensions page, toggle on the "Developer mode" switch (top right).

4.  **Load Unpacked Extension:**
    *   Click "Load unpacked".
    *   Select the extension folder.

## Usage

1.  **Upload**: Click the extension icon and drag images into the drop zone.
2.  **Edit**: Use the tabs to switch between tools (Compress, Scale, Crop, Stitch).
3.  **Stitch**: To stitch images, ensure multiple images are uploaded. Go to the **Stitch** tab and click "Stitch". Enable "Auto-remove (Smart Stitch)" for scrolling screenshots.
4.  **Download**: Click "Download Image" to save the result. Files are automatically named with a timestamp.

## Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for version history.

## Localization

Supported languages:
*   English (Default)
*   繁體中文 (Traditional Chinese)
*   简体中文 (Simplified Chinese)
*   日本語 (Japanese)
