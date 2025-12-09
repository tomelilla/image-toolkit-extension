# Image Toolkit Chrome Extension

**Author: GeminiCLI {gemini-1.5-flash-001}**

This Chrome extension provides a suite of image manipulation tools directly within your browser popup. It allows users to perform various operations on uploaded images, including analysis, scaling, compression, cropping, and stitching.

## Features

*   **Image Analysis**: View detailed information about an image (filename, extension, width, height).
*   **Proportional Scaling**: Resize images by a specified percentage, maintaining aspect ratio.
*   **Image Compression**: Reduce image file size by adjusting quality (supports JPEG/PNG).
*   **Image Cropping**: Crop images to a specific area defined by X, Y, Width, and Height coordinates.
*   **Image Background Removal (Placeholder)**: Acknowledges the complexity of this feature. In a production environment, this would typically require advanced algorithms or external API integration.
*   **Image Stitching**: Combine multiple images either horizontally or vertically into a single image.

## Installation

To install and use the Image Toolkit extension:

1.  **Download the Extension:**
    *   Clone this repository or download the `image-toolkit-extension` folder.

2.  **Open Chrome Extensions Page:**
    *   Open your Chrome browser.
    *   Type `chrome://extensions/` in the address bar and press Enter.

3.  **Enable Developer Mode:**
    *   On the Extensions page, toggle on the "Developer mode" switch, usually found in the top right corner.

4.  **Load Unpacked Extension:**
    *   Click the "Load unpacked" button.
    *   Navigate to the location where you downloaded/cloned the `image-toolkit-extension` folder.
    *   Select the `image-toolkit-extension` folder and click "Select".

5.  **Pin the Extension (Optional):**
    *   After loading, a puzzle piece icon will appear in your Chrome toolbar. Click it.
    *   Find "Image Toolkit Extension" in the list and click the pin icon next to it to make it easily accessible in your toolbar.

## Usage

1.  **Open the Extension:** Click the "Image Toolkit Extension" icon in your Chrome toolbar.
2.  **Upload an Image:** Use the "Upload Image:" input field to select an image from your computer. The original image will be displayed.
3.  **Use Tools:**
    *   **Analyze:** Click "Analyze" to see its dimensions, filename, and extension.
    *   **Scale:** Enter a percentage and click "Scale" to resize the image proportionally.
    *   **Compress:** Enter a quality value (0-100) and click "Compress" to reduce file size.
    *   **Crop:** Enter the X, Y coordinates, and the desired Width and Height for the crop area, then click "Crop".
    *   **Remove Background:** This is a placeholder button. A full implementation would require advanced image processing.
    *   **Stitch:** Use the "Upload Images for Stitching:" input to select multiple images, choose a direction (Horizontal/Vertical), and click "Stitch".
4.  **Download Output:** After processing, the output image will be displayed. Click "Download Image" to save it to your computer.

## Localization (i18n)

This extension supports multiple languages. Chrome will automatically use the language matching your browser's UI language, if available. Supported languages include:

*   English (Default)
*   繁體中文 (Traditional Chinese)
*   简体中文 (Simplified Chinese)
*   日本語 (Japanese)

To change the extension's language, you need to change your Chrome browser's display language settings.

## Testing

For detailed information on how to test this extension, please refer to the `tests/README.md` file.

## Developer Information

**Author:** GeminiCLI {gemini-1.5-flash-001}
