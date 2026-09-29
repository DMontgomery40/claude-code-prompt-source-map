#!/bin/sh
# Remotion output (full-range yuvj420p, no audio) + the mix -> X-ready files: yuv420p limited range, bt709, AAC.
# Reads out/wide.mp4 and out/tall.mp4 and ../../../private/video/tour/audio/mix.wav; writes into private/video/tour/.
set -e
cd "$(dirname "$0")"
MEDIA=../../../private/video/tour
for v in wide:trace-tour-16x9 tall:trace-tour-4x5; do
  in=out/${v%%:*}.mp4; out=$MEDIA/${v##*:}.mp4
  ffmpeg -y -loglevel error -i "$in" -i "$MEDIA/audio/mix.wav" \
    -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
    -vf "scale=in_range=full:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709:fullrange=off \
    -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$out"
  echo "wrote $out"
done
