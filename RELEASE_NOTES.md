# Release Notes

## [1.0.0] - 2025-12-09

### Added
- **Multi-Image Support**: Upload and manage multiple images in a list. Quickly switch between them for editing.
- **Smart Stitching**:
    - **Auto-Resize**: Automatically normalizes image dimensions (width/height) before stitching.
    - **Smart Overlap Removal**: "Auto-align" feature detects and removes overlapping areas between screenshots (e.g. scrolling captures).
    - **Performance**: Optimized with downsampling for fast processing and low memory usage.
- **Enhanced Compression**:
    - Support for multiple output formats: **JPEG** (Default), **PNG**, and **WebP**.
    - Adjustable quality slider.
- **UI Improvements**:
    - **Tabbed Interface**: Organized tools into tabs (Compress, Scale, Crop, Stitch) for better usability.
    - **Drag & Drop**: Improved drop zone for uploading images.
    - **Output Stats**: Displays file size and dimensions of the processed image.
    - **Timestamped Filenames**: Downloaded files now include a timestamp for better organization.

### Removed
- **Background Removal**: Removed placeholder feature as per user request.

### Fixed
- **Stitching**: Fixed issue where images of different sizes caused misalignment.
- **Performance**: Resolved memory issues during high-res image stitching.
