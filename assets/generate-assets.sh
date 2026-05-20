#!/usr/bin/env bash
# Run this script to generate placeholder PNG assets using ImageMagick or ffmpeg.
# In production, replace with your final brand assets before submitting to stores.

BG="#131921"
ALEXA="#00CAFF"

# icon.png  (1024×1024 required by both stores)
convert -size 1024x1024 xc:"$BG" \
  -fill "$ALEXA" -draw "circle 512,512 512,200" \
  -fill white -pointsize 320 -gravity center -annotate 0 "⌂" \
  assets/icon.png 2>/dev/null || echo "ImageMagick not found — supply icon.png manually (1024×1024)"

# adaptive-icon.png (Android, 1024×1024, 72dp safe zone)
cp assets/icon.png assets/adaptive-icon.png 2>/dev/null

# splash.png (2048×2048 recommended)
convert -size 2048x2048 xc:"$BG" \
  -fill "$ALEXA" -pointsize 200 -gravity center -annotate 0 "Echo Show\nRemote" \
  assets/splash.png 2>/dev/null || echo "ImageMagick not found — supply splash.png manually"

# favicon.png (48×48)
convert -size 48x48 xc:"$BG" \
  -fill "$ALEXA" -draw "circle 24,24 24,6" \
  assets/favicon.png 2>/dev/null || echo "ImageMagick not found — supply favicon.png manually"

# widget-preview.png (320×160)
convert -size 320x160 xc:"$BG" \
  -fill white -pointsize 24 -gravity center -annotate 0 "Echo Show Remote Widget" \
  assets/widget-preview.png 2>/dev/null || echo "supply widget-preview.png manually"

echo "Done. Replace placeholder assets with production artwork before store submission."
