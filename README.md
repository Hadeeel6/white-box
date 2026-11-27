# White Box

A values-guided AI ethics learning platform for 10th graders.

**Try it online:** https://hadeeel6.github.io/white-box/

Students choose their values, then play through three missions. Each mission has:

1. **A lesson** on how AI works: how a chatbot picks words, how AI learns from examples, how image AI makes pictures.
2. **A case** where AI goes wrong: a confident chatbot, a biased hiring tool, a deepfake of a classmate.
3. **A reflection** where students check and update their values.

All people, organizations and events in the cases are fictional.

## How to open it

The easiest way is the link above. It works on a laptop or a phone, with no sign-in.

To use it offline instead:

1. On this repository page, click the **Code** button, then **Download ZIP**.
2. Unzip the downloaded file.
3. Open the folder and double-click **index.html**. It opens in your web browser.

Keep `index.html` and the `assets` folder together in the same folder, or the images won't load.

## Good to know

- **Progress** is saved in your own browser on your own computer. Nothing is sent anywhere. To start over, open **Settings** (click your name at the bottom of the sidebar) and choose **Reset everything**.
- **Test mode:** use the **Test mode** switch in the sidebar (on phones, at the top of the Map), or **Unlock everything** in Settings, to open every mission, lesson and case without playing in order. This is useful for teachers and reviewers. Mission 1, its lesson and its case are always open.
- **Chatting with characters:** you can type your own questions to the case characters. In this downloaded version they reply with scripted answers.
- Works best in a recent version of Chrome, Edge, Safari or Firefox, on a laptop or a phone.

## Inside the machine (deep-dive lessons)

The **Lessons** page now has a second section, **Inside the machine**: 16 lessons in 5 units on how language models work. Six are built and playable; the other ten are storyboards that show what each lesson will contain.

| Unit | Lessons (built ones in bold) |
|---|---|
| 1. Meet the machine | **Tour of a chatbot** · **Text to tokens** · Words as numbers |
| 2. Reading in context | Word order · **Attention: looking back** · Layers |
| 3. Writing an answer | **Next-word odds** · **Temperature** · Context window |
| 4. How it learned | Training data · **Learning from mistakes** · Scale · Fine-tuning and feedback |
| 5. Using it wisely | Making things up · How we test AI · Capstone experiment |

Each lesson is a set of guided steps next to a **3D model** of a real small language model (distilGPT-2: 6 layers, 12 attention heads per layer, 82 million learned numbers). You can turn it, zoom, click its parts, and switch to a flat **2D view**. Steps have a task that unlocks **Next**; tabs show **The math**, **Parts** and **What this leaves out**. Finishing a lesson saves a **field note** to the Journey page. Mission pages link to the matching lessons under **Go deeper**.

**Talking to a real model.** Lessons use recorded runs of distilGPT-2 by default. Press **Turn on the live model** to download it (about 80 MB, once) and run it **inside your browser**: nothing you type is sent anywhere. Typed sentences are checked for emails, phone numbers, addresses and inappropriate words first, and generated text is filtered. **Compare with an assistant** uses a live assistant when one is connected; otherwise it shows example answers written by the team, labeled as such.

**Testing locally.** The 3D model needs a web server or an internet connection. The easiest way is to run `python3 -m http.server` in this folder and open http://localhost:8000. If you double-click `index.html` instead, the 3D view loads from the internet, and offline it falls back to the 2D view.

Files: `machine/` (`machine.js` core, `lessons.js` lesson content, `scene3d.js` 3D model, `model.js` live model, `data.js` recorded runs, `vendor/` three.js r187, MIT license).

## Design

White Box uses **Material Design 3** with its own theme: black and white, with sun yellow (`#FFC845`) as the only accent color. The theme includes Roboto Flex for text, Material Symbols for icons, a line-art box logo, an opening animation, and fixes for contrast and spacing. On phones, the main pages (Map, Values, Lessons, Cases, Guide, Journey) sit in a bottom navigation bar.

The theme is already built into `index.html`, so nothing extra is needed to run it. The source files are in `design/`, so the theme can be read, changed or rebuilt. See [design/README.md](design/README.md) for how to rebuild it.

## What's in this repository

- `index.html`: the whole platform in one file
- `assets/`: character, value and map images
- `machine/`: the Inside the machine lessons (3D model, live model, lesson content)
- `design/`: source files for the Material Design 3 theme (`m3.css`, `mono.css`, `logo.css`, `build.py`)
