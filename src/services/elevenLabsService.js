const ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function speakText(text, apiKey, voiceId, slow = false) {
  if (!apiKey || !text) return;

  try {
    const res = await fetch(`${ELEVEN_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) throw new Error("ElevenLabs request failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    if (slow) audio.playbackRate = 0.75;
    audio.play();
    return audio;
  } catch (e) {
    // Fail silently — never break the app over audio
    console.warn("ElevenLabs audio failed:", e.message);
    return null;
  }
}
