# How to Set Up ArtTrack on Your Computer

**Written for Alisa — no experience needed! Just follow each step in order.**

---

## Part 1 — Install the Tools (one time only)

You need to install two free programs before anything else. You only do this once, ever.

---

### Step 1 — Install Git

Git is the tool that downloads the app from the internet.

1. Open your web browser and go to: **https://git-scm.com/download/win**
2. The download should start automatically — if it doesn't, click the link for "64-bit Git for Windows Setup"
3. Open the downloaded file (it will be in your Downloads folder)
4. Click **Next** through every screen — don't change anything, the defaults are all fine
5. Click **Install**
6. Click **Finish**

---

### Step 2 — Install Node.js

Node.js is what runs the app on your computer.

1. Open your web browser and go to: **https://nodejs.org**
2. Click the big green button that says **LTS** (that's the safe, stable version)
3. Open the downloaded file
4. Click **Next** through every screen — defaults are fine
5. Click **Install**
6. Click **Finish**

---

### Step 3 — Restart your computer

This makes sure both programs are fully set up. Just restart normally.

---

## Part 2 — Download the App (one time only)

---

### Step 4 — Open Windows Terminal

- Press the **Windows key** on your keyboard
- Type the word **Terminal**
- Press **Enter**

A dark window with a blinking cursor will open. That's Windows Terminal — don't worry, you'll only be typing a few simple things in it.

---

### Step 5 — Go to your Desktop folder

Type this **exactly** and press **Enter**:

```
cd Desktop
```

(This tells the computer "go to my Desktop folder")

---

### Step 6 — Download ArtTrack

Type this and press **Enter**:

```
git clone https://github.com/DesireeJoy/ArtTrack.git
```

- A window may pop up asking you to sign in to GitHub — sign in with your GitHub account
- You'll see text scrolling by — that's normal, it's downloading
- Wait until it stops and you see a `>` cursor again

---

### Step 7 — Go into the ArtTrack folder

Type this and press **Enter**:

```
cd ArtTrack
```

---

### Step 8 — Install the app's parts

Type this and press **Enter**:

```
npm install
```

This will take 1–3 minutes. Lots of text will scroll by — that's completely normal. Wait until the `>` cursor appears again before moving on.

---

## Part 3 — Running the App (every time you use it)

---

### Step 9 — Start the app

Type this and press **Enter**:

```
npm run dev
```

Wait until you see a line that includes `http://localhost:5173` — that means it's ready.

---

### Step 10 — Open the app in your browser

Open Chrome, Edge, or any web browser and type this in the address bar at the top:

```
http://localhost:5173
```

Press **Enter** — ArtTrack should appear!

---

## Every Time After the First Time

The next time you want to open ArtTrack, you just need to:

1. Open **Windows Terminal**
2. Type these two lines, pressing **Enter** after each:

```
cd Desktop\ArtTrack
npm run dev
```

3. Then open your browser and go to `http://localhost:5173`

---

## When You're Done Using the App

Go back to the Terminal window and press **Ctrl + C** (hold the Ctrl key and press C). Then you can close the Terminal window.

---

## Getting Updates from Desiree

When Desiree adds new features or fixes something, you can get the update by:

1. Opening **Windows Terminal**
2. Typing these lines one at a time, pressing **Enter** after each:

```
cd Desktop\ArtTrack
git pull
npm install
npm run dev
```

---

## Something Went Wrong?

- **"npm is not recognized"** — Node.js didn't install correctly. Try restarting your computer and trying again from Step 8.
- **"git is not recognized"** — Git didn't install correctly. Restart your computer and try again from Step 8.
- **The browser shows an error** — Make sure the Terminal is still open and `npm run dev` is still running.
- **Anything else** — Take a screenshot of the Terminal window and send it to Desiree!
