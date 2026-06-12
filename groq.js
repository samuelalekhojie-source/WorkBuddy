/* ═══════════════════════════════════════════════
   GROQ.JS — AI LAYER (with streaming support)
════════════════════════════════════════════════ */

const GROQ_CONFIG = {
  apiKey: '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',
  model: 'llama-3.3-70b-versatile',
  baseURL: 'https://api.groq.com/openai/v1/chat/completions'
};


/* ── BASE CALL (non-streaming, for structured AI features) ── */
async function groqChat(messages, options = {}) {
  if (!GROQ_CONFIG.apiKey || GROQ_CONFIG.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    return '[AI features require a Groq API key. Add yours to groq.js to enable AI.]';
  }
  try {
    const response = await fetch(GROQ_CONFIG.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_CONFIG.apiKey}` },
      body: JSON.stringify({
        model: options.model || GROQ_CONFIG.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 800,
        stream: false
      })
    });
    if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'Groq API error'); }
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI.';
  } catch (error) {
    console.error('Groq API Error:', error);
    return `AI error: ${error.message}. Please check your API key.`;
  }
}


/* ── STREAMING CALL (for chat — word by word effect) ──
   
   This is how the ChatGPT typing effect works.
   Instead of waiting for the full response, we open
   a stream and read it chunk by chunk, updating the
   UI as each word arrives.

   onChunk(text) is called with each new piece of text.
   onDone() is called when the stream finishes.
════════════════════════════════════════════════ */
async function groqStream(messages, onChunk, onDone, options = {}) {
  if (!GROQ_CONFIG.apiKey || GROQ_CONFIG.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    onChunk('[AI features require a Groq API key.]');
    onDone(); return;
  }
  try {
    const response = await fetch(GROQ_CONFIG.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_CONFIG.apiKey}` },
      body: JSON.stringify({
        model: options.model || GROQ_CONFIG.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 800,
        stream: true   // ← this is the key difference
      })
    });

    if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'Groq error'); }

    // Read the stream chunk by chunk
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the binary chunk to text
      buffer += decoder.decode(value, { stream: true });

      // Each chunk may contain multiple SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line for next iteration

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          const text   = parsed.choices?.[0]?.delta?.content;
          if (text) onChunk(text);
        } catch { /* skip malformed chunks */ }
      }
    }
    onDone();
  } catch (error) {
    console.error('Groq Stream Error:', error);
    onChunk(`\n\nAI error: ${error.message}`);
    onDone();
  }
}


/* ── AI FEATURES ── */

async function screenCandidate(job, applicant) {
  const messages = [
    { role: 'system', content: `You are an expert HR recruiter. Analyze candidates objectively. Always respond in valid JSON format only — no markdown, no extra text.` },
    { role: 'user', content: `Screen this applicant and return a JSON object with exactly these fields:
      { "score": <number 0-100>, "recommendation": <"Strong Yes"|"Yes"|"Maybe"|"No">, "strengths": [<string>,<string>,<string>], "concerns": [<string>,<string>], "summary": <2-3 sentence plain English summary> }
      JOB: Title: ${job.title}, Requirements: ${job.requirements}, Description: ${job.description}
      APPLICANT: Name: ${applicant.name}, Experience: ${applicant.experience}, Skills: ${applicant.skills}, Cover Letter: ${applicant.coverLetter}
      Return ONLY the JSON object.` }
  ];
  const raw = await groqChat(messages, { temperature: 0.3, max_tokens: 600 });
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { score: 70, recommendation: 'Maybe', strengths: ['Relevant experience', 'Applied promptly', 'Clear communication'], concerns: ['Could not fully parse AI response'], summary: raw.slice(0, 300) };
  }
}

async function generatePerformanceSummary(review, employee) {
  const ratingLabels = { 1:'Poor', 2:'Below Average', 3:'Average', 4:'Good', 5:'Excellent' };
  const ratingSummary = Object.entries(review.ratings).map(([k,v]) => `${k}: ${v}/5 (${ratingLabels[v]})`).join(', ');
  const messages = [
    { role: 'system', content: `You are an experienced HR manager writing professional performance review summaries. Write in a constructive, encouraging, and professional tone. Keep to 3-4 sentences.` },
    { role: 'user', content: `Write a professional performance review summary for:
      Employee: ${employee.name}, Position: ${employee.position}, Department: ${employee.department}, Period: ${review.period}
      Ratings: ${ratingSummary}, Overall: ${review.overallRating}/5
      Achievements: ${review.achievements.join('; ')}
      Goals: ${review.goals.join('; ')}
      Manager Notes: ${review.feedback}
      Write a 3-4 sentence professional summary.` }
  ];
  return await groqChat(messages, { temperature: 0.6, max_tokens: 300 });
}

let hrChatHistory = [];

// Streaming version for the chat UI
async function askHRAssistantStream(userMessage, userRole = 'employee', onChunk, onDone) {
  const systemPrompt = userRole === 'admin'
    ? `You are WorkBuddy AI, an intelligent HR assistant for admins and HR managers. Help with HR policies, employee management, legal compliance, recruitment advice, and workforce analytics. Company context: Nigerian company, currency Naira (₦), work hours 8AM-5PM WAT Monday-Friday. Leave: Annual (20 days), Sick (10 days), Emergency (3 days). Be professional and concise.`
    : `You are WorkBuddy AI, a friendly HR assistant for employees. Help with leave policies, payroll, benefits, and HR procedures. Company context: Nigerian company, currency Naira (₦), work hours 8AM-5PM WAT Monday-Friday. Leave: Annual (20 days), Sick (10 days), Emergency (3 days). Be friendly and clear.`;

  hrChatHistory.push({ role: 'user', content: userMessage });
  const recentHistory = hrChatHistory.slice(-10);
  const messages = [{ role: 'system', content: systemPrompt }, ...recentHistory];

  let fullResponse = '';
  await groqStream(
    messages,
    (chunk) => { fullResponse += chunk; onChunk(chunk); },
    () => { hrChatHistory.push({ role: 'assistant', content: fullResponse }); onDone(); },
    { temperature: 0.7, max_tokens: 600 }
  );
}

// Non-streaming version kept for non-chat features
async function askHRAssistant(userMessage, userRole = 'employee') {
  const systemPrompt = userRole === 'admin'
    ? `You are WorkBuddy AI, an intelligent HR assistant for admins. Help with HR policies, employee management, compliance, and analytics. Nigerian company, Naira (₦), 8AM-5PM WAT. Be professional and concise.`
    : `You are WorkBuddy AI, a friendly HR assistant for employees. Help with leave, payroll, and benefits. Nigerian company, Naira (₦), 8AM-5PM WAT. Be friendly.`;
  hrChatHistory.push({ role: 'user', content: userMessage });
  const messages = [{ role: 'system', content: systemPrompt }, ...hrChatHistory.slice(-10)];
  const response = await groqChat(messages, { temperature: 0.7, max_tokens: 600 });
  hrChatHistory.push({ role: 'assistant', content: response });
  return response;
}

function clearChatHistory() { hrChatHistory = []; }

async function generateOnboardingChecklist(employee) {
  const messages = [
    { role: 'system', content: `You are an HR onboarding specialist. Always respond in valid JSON only.` },
    { role: 'user', content: `Generate an onboarding checklist for: Name: ${employee.name}, Position: ${employee.position}, Department: ${employee.department}.
      Return JSON: { "week1": [task,...], "week2": [task,...], "month1": [task,...] }
      Each array 4-5 items. Role-specific. Return ONLY the JSON.` }
  ];
  const raw = await groqChat(messages, { temperature: 0.4, max_tokens: 500 });
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {
      week1: ['Complete HR paperwork and contracts', 'Set up workstation and system accounts', 'Meet the team and key stakeholders', 'Review company handbook and policies', 'Office and facilities tour'],
      week2: ['Shadow team members on live projects', 'Complete role-specific software training', 'Review department workflows and processes', 'Set up all required tools and access', 'Attend first team meeting'],
      month1: ['Complete first assigned deliverable', 'Set 90-day goals with line manager', 'Complete mandatory compliance training', 'Attend company all-hands or town hall', 'Submit onboarding feedback form']
    };
  }
}

async function analyzeAttendancePattern(employee, attendanceRecords) {
  const summary = attendanceRecords.slice(-20).map(r =>
    `${r.date}: ${r.status} (in: ${r.clockIn||'N/A'}, out: ${r.clockOut||'N/A'}, hours: ${r.hoursWorked})`
  ).join('\n');
  const messages = [
    { role: 'system', content: `You are an HR analytics specialist. Analyze attendance and give brief, constructive insights. Be empathetic.` },
    { role: 'user', content: `Analyze this employee's recent attendance and give a 2-3 sentence insight:
      Employee: ${employee.name} (${employee.position})
      Recent Attendance:\n${summary}
      Note any patterns and suggest one constructive action.` }
  ];
  return await groqChat(messages, { temperature: 0.5, max_tokens: 200 });
}
