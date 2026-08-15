# Muhammad Talha — Portfolio + Personal Agent

Capstone project for FlyRank AI Internship — General AI Fluency track.
**Brief:** Master the AI stack, build a personal brand with a real website, ship a personal agent.

## What this is

A single-page portfolio site proving one claim: *"I build multi-agent AI
systems that work reliably in production — not just demo well."*

It has two parts:

1. **The website** — Home, Work (ServeIQ case study), About, Contact.
   Static HTML/CSS/JS, no framework, no build step.
2. **The personal agent** — a Claude-powered "query panel" embedded in the
   site. Visitors can ask it questions about my work, my stack, or my
   engineering decisions, and it answers using my actual background as
   context (not a generic chatbot — it only knows what's true about me).

## Why it's built this way

I'm a backend engineer, so the site's visual language leans into that: a
graphite/amber "system status" aesthetic, section labels styled like code
comments, and the agent framed as a query/REPL panel instead of a bubbly
chat widget. The design choice is meant to *be* the proof, not just
decorate it.

## Project structure

```
portfolio-site/
├── index.html          the whole site (single page, anchor navigation)
├── style.css            design system (colors, type, layout)
├── chat-widget.js        frontend logic for the agent panel
├── api/
│   └── chat.js           serverless function — calls Claude API server-side
├── package.json          backend dependency (@anthropic-ai/sdk)
└── README.md
```

## How to run it locally

The static site works with any local server:

```bash
cd portfolio-site
python3 -m http.server 8000
```

Visit `http://localhost:8000`. The site itself works fully — only the
agent panel needs the backend running to respond (see below).

## How to deploy (recommended: Vercel — free, and handles both halves)

Vercel serves the static files **and** runs the `api/chat.js` serverless
function from the same project, so this is the simplest path.

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click
   **Add New → Project**, and import the repo.
3. In the project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Claude API key (get one free at
     [console.anthropic.com](https://console.anthropic.com))
4. Deploy. Vercel gives you a live URL — that's your submission link.

**Never put your API key directly in `chat-widget.js` or any frontend
file.** It has to stay server-side (in the environment variable) or
anyone visiting the site could steal it and run up your API bill.

### Alternative: static site only, no live agent

If you don't want to deal with API keys/deployment right now, you can
deploy just the static site (GitHub Pages, Netlify, etc.) and the agent
panel will show a graceful "agent offline" message instead of erroring.
The rest of the site works completely on its own.

## The agent's knowledge

`api/chat.js` contains a system prompt with my real background, ServeIQ's
engineering details, and my current stack — the agent can't invent
achievements or answer questions outside that scope. If you ask it
something it doesn't know, it says so rather than making something up.

## What I'd build next

- NexusSOC case study, once the FYP is further along
- Give the agent a short conversation memory (currently each question is
  stateless — no follow-up context)
- Rate-limit the `/api/chat` endpoint to prevent abuse on a public API key
