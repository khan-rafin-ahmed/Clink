# Asset Format Issue - CRITICAL

## Problem
All asset files in this directory are currently `.ico` files with `.png` extensions:
- `icon.png` - Actually an ICO file
- `splash.png` - Actually an ICO file  
- `adaptive-icon.png` - Actually an ICO file
- `favicon.png` - Actually an ICO file

## Impact
This will cause **build failures** in Expo/EAS builds because:
1. Expo expects actual PNG files for these assets
2. The file content doesn't match the file extension
3. Image processing during build will fail

## Required Action
Replace all these files with proper PNG format images:

### Required Specifications:
- **icon.png**: 1024x1024px PNG (app icon)
- **splash.png**: 1284x2778px PNG (splash screen) 
- **adaptive-icon.png**: 1024x1024px PNG (Android adaptive icon foreground)
- **favicon.png**: 32x32px or 48x48px PNG (web favicon)

### Background Colors:
- Use `#08090A` as the background color (matches app theme)
- Splash screen should use the same background

## Temporary Workaround
Until proper PNG assets are created, you can:
1. Use online ICO to PNG converters
2. Use design tools like Figma, Sketch, or Photoshop
3. Use command line tools like ImageMagick

## Command Line Conversion (if ImageMagick is available):
```bash
# Convert ICO to PNG (example)
convert icon.png icon_temp.ico
convert icon_temp.ico -resize 1024x1024 icon.png
rm icon_temp.ico
```

**This must be fixed before attempting any EAS builds.**
