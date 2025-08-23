// Audio format priority based on YouTube's itag values
export const AUDIO_FORMAT_PRIORITY = [
  251, // Opus 128kbps
  250, // Opus 70kbps
  249, // Opus 50kbps
  140, // AAC 128kbps
  139, // AAC 48kbps
  141, // AAC 256kbps
  256, // AAC 192kbps 5.1
  258, // AAC 384kbps 5.1
  327, // AAC 256kbps 5.1
  338, // Opus 480kbps Ambisonic
  774, // Opus 256kbps
  599, // AAC 30kbps HE
  600, // Opus 35kbps
  773, // IAMF 900kbps
]
