# Voice Preview Audio Samples

This directory contains short audio samples for each TTS voice option.

## Required Files

Place the following audio preview files here:

- `alloy.mp3` - Alloy voice sample
- `echo.mp3` - Echo voice sample
- `fable.mp3` - Fable voice sample
- `onyx.mp3` - Onyx voice sample
- `nova.mp3` - Nova voice sample
- `shimmer.mp3` - Shimmer voice sample

## Generating Sample Files

You can generate these samples using OpenAI's TTS API:

```python
from openai import OpenAI
client = OpenAI()

voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
sample_text = "Welcome to Publishing Studio. This is a preview of the voice you've selected for your audiobook narration."

for voice in voices:
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=sample_text
    )
    response.stream_to_file(f"public/audio-samples/{voice}.mp3")
```

## Fallback

If audio files are not present, the preview button will show an error in the console but won't break the UI.

## File Size

Keep samples short (5-10 seconds) to minimize loading times.
