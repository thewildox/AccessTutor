# Focusly

> Learning, redesigned for focus.

A calm AI learning companion for neurodivergent kids (ages 8–14). Transforms dense school material into simple chunks, audio explanations, and gentle practice.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Tap **⚙️ Settings** on the home screen to add API keys (the panel stays closed until you open it).

---

## API Keys

Enter your keys in **Settings** on the home screen. Optional **“Remember keys on this device”** saves them in `localStorage` for faster demos — **do not use on shared lab machines**; turn it off before handing the laptop to someone else.

- **Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)
- **ElevenLabs API Key** — [Get one here](https://elevenlabs.io)
- **Voice ID** — Default is Rachel (`21m00Tcm4TlvDq8ikWAM`). Change to any ElevenLabs voice ID.

While you are on a **lesson or quiz**, progress is saved to `sessionStorage` so a **browser refresh** during judging does not wipe the demo. Going **Back** from the lesson to home clears that saved session.

---

## File Structure

```
src/
  App.jsx                        ← global state + view switching
  index.css                      ← all global styles + CSS variables
  main.jsx                       ← React entry point
  components/
    HomeScreen.jsx               ← input, Settings (API keys), primary CTA
    LessonScreen.jsx             ← chunked lesson + voice playback
    QuizScreen.jsx               ← 3-question quiz with feedback
    AccessibilityBar.jsx         ← fixed bottom bar with 5 toggles
    LoadingState.jsx             ← loading pulse + rotating status lines
  services/
    geminiService.js             ← Gemini API call + prompt
    elevenLabsService.js         ← ElevenLabs TTS + blob playback
  lib/
    hackathonStorage.js          ← session resume + optional remembered keys
```

---

## Customization

### Change colors
Edit CSS variables in `src/index.css` under `:root { ... }`

### Change the AI prompt
Edit `buildPrompt()` in `src/services/geminiService.js`

### Change number of quiz questions
Edit the prompt in `geminiService.js` — ask for more questions in the JSON schema

### Change the voice
Enter any ElevenLabs Voice ID in the app UI, or change the default in `App.jsx`

### Change accessibility toggles
Edit the `TOGGLES` array in `src/components/AccessibilityBar.jsx`

---

## Tracks This Targets

| Track | Argument |
|-------|----------|
| Education | Built for the most underserved learners |
| Social Impact & Accessibility | 1 in 5 kids is neurodivergent |
| ElevenLabs | Voice is how these kids access content most naturally |
| Gemini API | Powers simplification + quiz generation |
| UI/UX | Every design decision serves cognitive needs |

---

## Demo Script

1. Open **⚙️ Settings**, confirm keys (or use **Remember keys** on your own machine)
2. Paste a dense paragraph (or **Try a sample paragraph**)
3. Click **Start Learning**
4. Show simplified chunks; **Focus Mode** is on by default — show one step at a time
5. Click **Listen** — if voice fails, the **error message** explains why (key, quota, browser block)
6. Click **Quiz Me** — miss one on purpose to show feedback + optional spoken hint
7. **Backup:** record a 30s screen capture in case Wi‑Fi or billing fails live

**Opening line:** *"Some kids aren't blocked by intelligence. They're blocked by format. Focusly changes the format."*

---

## Build Order (if starting fresh)

1. `npm install && npm run dev` — confirm it runs
2. Check HomeScreen renders and text input works
3. Open **Settings**, add your Gemini key, and test the API call
4. Confirm lesson chunks render on LessonScreen
5. Test quiz flow end to end
6. Add ElevenLabs key and test voice playback
7. Test all 5 accessibility toggles
8. Run your full demo script 3 times
