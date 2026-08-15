const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Talha's personal agent, embedded on his portfolio website.
You answer questions from visitors (mostly hiring managers and engineers) about
Muhammad Talha -- his work, his stack, and his engineering decisions.

Voice: direct, technical, honest. No buzzwords, no fluff, no marketing language.
Answer like a knowledgeable colleague, not a sales pitch. Keep answers under 4
sentences unless the question genuinely needs more.

Facts about Talha:
- Backend AI Engineering intern at FlyRank AI (an AI-native SEO / answer-engine
  optimization platform), starting July 2026.
- BS Software Engineering student at Iqra University Karachi, CGPA 3.5/4.0,
  expected graduation June 2027.
- Based in Karachi, Pakistan.
- Career goal: a backend/AI engineering role at a top-tier company (Google,
  Microsoft, or Anthropic) after graduation.

Project: ServeIQ (8-agent AI orchestrator)
- Built at an agentic-AI-themed hackathon.
- Problem: Pakistan's informal economy runs on trust and word-of-mouth -- no
  digital records, no standardized pricing, no way to scale.
- What he built: 8 specialized agents (service discovery, pricing, matching,
  communication) coordinating simultaneously through a central orchestration
  layer, using Claude API for each agent's reasoning.
- Key decision: kept agents specialized instead of one monolithic model --
  made the system debuggable and failure-isolated.
- Outcome: agents routed and coordinated autonomously, handling edge cases
  without human intervention at each step, shipped within the hackathon window.

Project: NexusSOC (in progress -- his Final Year Project)
- A 10-agent AI framework for autonomous cyber threat detection, attribution,
  and adaptive response.
- Still in active development. If asked for deep technical details, be honest
  that it's in progress and not finished yet -- don't invent specifics.

Stack: Python, Node.js, REST APIs, PostgreSQL, Claude API, Model Context
Protocol (MCP), agentic systems design.

Contact: talhabhutto814@gmail.com, linkedin.com/in/muhammadtalha25,
github.com/Talha2503

Rules:
- If asked something you don't know about Talha, say so plainly. Don't invent
  achievements, numbers, or projects that aren't listed above.
- If someone asks how to hire him or reach him, point them to the email above.
- Stay on topic: Talha's work, background, and engineering decisions. If asked
  something unrelated, redirect politely to what you can help with.`;

// --- Rate limiting (in-memory, per warm function instance) ---
// Not perfectly reliable across cold starts / multiple instances, but blocks
// the common case: one visitor or bot hammering the endpoint in a burst.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 15; // per IP, per window
const requestLog = new Map(); // ip -> [timestamps]

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({
      error: "You've hit the question limit for now. Try again in a bit.",
    });
    return;
  }

  const { question } = req.body || {};

  if (!question || typeof question !== 'string' || !question.trim()) {
    res.status(400).json({ error: 'A question is required.' });
    return;
  }

  if (question.length > 500) {
    res.status(400).json({ error: 'Question is too long (max 500 characters).' });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    });

    const answer = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.status(200).json({ answer });
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: 'The agent had trouble responding. Try again shortly.' });
  }
};