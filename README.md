# Image Toolkit Chrome Extension

**Author:** GeminiCLI {gemini-1.5-pro-002}

This Chrome extension provides a suite of image manipulation tools directly within your browser popup. It allows users to perform various operations on uploaded images, including analysis, scaling, compression, cropping, and smart stitching.

## Features

*   **Multi-Image Management**: Upload multiple images via drag & drop and manage them in a list.
*   **Image Compression**: Reduce file size with adjustable quality and format selection (**JPEG, PNG, WebP**).
*   **Smart Stitching**:
    *   Combine images horizontally or vertically.
    *   **Auto-Normalize**: Automatically matches image dimensions.
    *   **Smart Overlap Removal**: Detects and removes redundant overlapping areas (great for scrolling screenshots).
*   **Image Cropping**: Crop images to specific aspect ratios (Free, Square, 16:9, Round) or custom dimensions.
*   **Proportional Scaling**: Resize images by percentage.
*   **Privacy First**: All processing is done locally in your browser. No images are uploaded to any server.

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

1.  **Open Extension**: Click the icon in the toolbar.
2.  **Upload Images**: Drag & drop images or click the dashed area to upload.
3.  **Select Tool**:
    *   **Compress**: Choose format (JPEG/PNG/WebP) and quality.
    *   **Scale**: Resize by percentage.
    *   **Crop**: Select cropped area.
    *   **Stitch**: Switch to "Stitch" tab. All uploaded images will be used. Select direction and optionally enabling "Auto-remove overlap" for smart stitching.
4.  **Download**: Click "Download Image" to save the result.

## Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for version history.

## Localization

Supported languages:
*   English (Default)
*   繁體中文 (Traditional Chinese)
*   简体中文 (Simplified Chinese)
*   日本語 (Japanese)
