const ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * @returns {Promise<{ audio: HTMLAudioElement | null, error: string | null }>}
 */
export async function speakText(text, apiKey, voiceId, slow = false) {
  if (!apiKey || !text) return { audio: null, error: null };

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

    if (!res.ok) {
      const errText = await res.text();
      let message = `Voice request failed (HTTP ${res.status}).`;
      try {
        const j = JSON.parse(errText);
        if (j.detail?.message) message = j.detail.message;
        else if (Array.isArray(j.detail) && j.detail[0]?.msg) message = j.detail[0].msg;
        else if (typeof j.detail === "string") message = j.detail;
      } catch {
        /* keep default */
      }
      return { audio: null, error: message };
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    if (slow) audio.playbackRate = 0.75;
    try {
      await audio.play();
    } catch {
      return {
        audio: null,
        error: "Playback was blocked. Click Listen again, or check browser sound permissions.",
      };
    }
    return { audio, error: null };
  } catch (e) {
    return { audio: null, error: e.message || "Could not play audio." };
  }
}
