#!/bin/sh
# Remotion output (full-range yuvj420p, no audio) + the mix -> X-ready files: yuv420p limited range, bt709, AAC.
set -e
cd "$(dirname "$0")"
for v in wide:trace-explainer-16x9 tall:trace-explainer-4x5; do
  in=out/${v%%:*}.mp4; out=../${v##*:}.mp4
  ffmpeg -y -loglevel error -i "$in" -i ../audio/mix.wav \
    -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
    -vf "scale=in_range=full:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
    -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$out"
  echo "wrote $out"
done
