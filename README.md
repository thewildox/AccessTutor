# AccessTutor

> Learning, redesigned for focus.

A calm AI learning companion for neurodivergent kids (ages 8–14). Transforms dense school material into simple chunks, audio explanations, and gentle practice.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Keys

Enter your keys directly in the app UI — they stay in your browser only.

- **Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)
- **ElevenLabs API Key** — [Get one here](https://elevenlabs.io) (optional, for voice)
- **Voice ID** — Default is Rachel (`21m00Tcm4TlvDq8ikWAM`). Change to any ElevenLabs voice ID.

---

## File Structure

```
src/
  App.jsx                        ← global state + view switching
  index.css                      ← all global styles + CSS variables
  main.jsx                       ← React entry point
  components/
    HomeScreen.jsx               ← input, API keys, start button
    LessonScreen.jsx             ← chunked lesson + voice playback
    QuizScreen.jsx               ← 3-question quiz with feedback
    AccessibilityBar.jsx         ← fixed bottom bar with 5 toggles
    LoadingState.jsx             ← loading spinner + rotating messages
  services/
    geminiService.js             ← Gemini API call + prompt
    elevenLabsService.js         ← ElevenLabs TTS + blob playback
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

1. Paste a dense 5th-grade science paragraph
2. Click **Start Learning**
3. Show the simplified chunks side by side with the original
4. Click **Listen** — let the voice read the first chunk
5. Toggle **Focus Mode** to show one step at a time
6. Click **Quiz Me** — answer a question wrong on purpose
7. Show the gentle "Not quite — let's look at that together" response + voice hint

**Opening line:** *"Some kids aren't blocked by intelligence. They're blocked by format. AccessTutor changes the format."*

---

## Build Order (if starting fresh)

1. `npm install && npm run dev` — confirm it runs
2. Check HomeScreen renders and text input works
3. Add your Gemini key and test the API call
4. Confirm lesson chunks render on LessonScreen
5. Test quiz flow end to end
6. Add ElevenLabs key and test voice playback
7. Test all 5 accessibility toggles
8. Run your full demo script 3 times
