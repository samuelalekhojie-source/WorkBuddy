/* ═══════════════════════════════════════════════
   AI.JS — WORKBUDDY AI LAYER
   Model : GitHub Models → openai/gpt-4o-mini
   Docs  : https://docs.github.com/en/github-models
   ─────────────────────────────────────────────
   Required CDN scripts in your HTML <head>:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
════════════════════════════════════════════════ */

const AI_CONFIG = {
  apiKey: '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',   // ← paste your GitHub PAT here (never commit this)
  model: 'openai/gpt-4o-mini',
  baseURL: 'https://models.github.ai/inference/chat/completions'
};


/* ════════════════════════════════════════════════
   CORE API CALLS
════════════════════════════════════════════════ */

/* ── non-streaming call — returns full text string ── */
async function groqChat(messages, options = {}) {
  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'YOUR_GITHUB_PAT_HERE') {
    return '[AI features require an API key.]';
  }
  try {
    const res = await fetch(AI_CONFIG.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_CONFIG.apiKey}` },
      body: JSON.stringify({
        model: options.model || AI_CONFIG.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 800,
        stream: false
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `API error ${res.status}`);
    }
    const data = await res.json();
    return data.choices[0]?.message?.content || 'No response from AI.';
  } catch (err) {
    console.error('[WorkBuddy AI] groqChat error:', err);
    return `AI error: ${err.message}`;
  }
}

/* ── streaming call — fires onChunk(text) per token, onDone(fullText) at end ── */
async function groqStream(messages, onChunk, onDone, options = {}) {
  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'YOUR_GITHUB_PAT_HERE') {
    onChunk('[AI features require an API key.]'); onDone(''); return;
  }
  let fullResponse = '';
  try {
    const res = await fetch(AI_CONFIG.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_CONFIG.apiKey}` },
      body: JSON.stringify({
        model: options.model || AI_CONFIG.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1500,
        stream: true
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Stream error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { onDone(fullResponse); return; }
        try {
          const chunk = JSON.parse(raw)?.choices?.[0]?.delta?.content;
          if (chunk) { fullResponse += chunk; onChunk(chunk); }
        } catch { /* skip malformed SSE chunk */ }
      }
    }
    onDone(fullResponse);
  } catch (err) {
    console.error('[WorkBuddy AI] groqStream error:', err);
    onChunk(`\n\nAI error: ${err.message}`);
    onDone(fullResponse);
  }
}


/* ════════════════════════════════════════════════
   HR AI FEATURES
════════════════════════════════════════════════ */

/* ── candidate screening → returns structured JSON ── */
async function screenCandidate(job, applicant) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert HR recruiter. Analyze candidates objectively. Respond ONLY in valid JSON — no markdown, no extra text.'
    },
    {
      role: 'user',
      content: `Screen this applicant and return exactly this JSON shape:
{ "score": <0-100>, "recommendation": <"Strong Yes"|"Yes"|"Maybe"|"No">,
  "strengths": [<str>,<str>,<str>], "concerns": [<str>,<str>],
  "summary": "<2-3 sentence plain-English summary>" }

JOB: Title: ${job.title} | Requirements: ${job.requirements} | Description: ${job.description}
APPLICANT: Name: ${applicant.name} | Experience: ${applicant.experience} | Skills: ${applicant.skills} | Cover Letter: ${applicant.coverLetter}
Return ONLY the JSON.`
    }
  ];
  const raw = await groqChat(messages, { temperature: 0.3, max_tokens: 700 });
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {
      score: 70, recommendation: 'Maybe',
      strengths: ['Relevant experience', 'Applied promptly', 'Clear communication'],
      concerns: ['AI response could not be fully parsed'],
      summary: raw.slice(0, 300)
    };
  }
}

/* ── performance review summary ── */
async function generatePerformanceSummary(review, employee) {
  const labels = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' };
  const ratingSummary = Object.entries(review.ratings)
    .map(([k, v]) => `${k}: ${v}/5 (${labels[v]})`).join(', ');
  const messages = [
    {
      role: 'system',
      content: 'You are an experienced HR manager writing professional performance review summaries. Constructive and encouraging tone. 3-4 sentences.'
    },
    {
      role: 'user',
      content: `Write a professional performance summary for:
Employee: ${employee.name} | Position: ${employee.position} | Department: ${employee.department} | Period: ${review.period}
Ratings: ${ratingSummary} | Overall: ${review.overallRating}/5
Achievements: ${review.achievements.join('; ')}
Goals: ${review.goals.join('; ')}
Manager Notes: ${review.feedback}`
    }
  ];
  return groqChat(messages, { temperature: 0.6, max_tokens: 400 });
}

/* ── onboarding checklist → returns { week1, week2, month1 } ── */
async function generateOnboardingChecklist(employee) {
  const messages = [
    { role: 'system', content: 'You are an HR onboarding specialist. Respond ONLY in valid JSON.' },
    {
      role: 'user',
      content: `Generate an onboarding checklist for:
Name: ${employee.name} | Position: ${employee.position} | Department: ${employee.department}
Return JSON: { "week1": [<4-5 tasks>], "week2": [<4-5 tasks>], "month1": [<4-5 tasks>] }
Make tasks role-specific. Return ONLY the JSON.`
    }
  ];
  const raw = await groqChat(messages, { temperature: 0.4, max_tokens: 600 });
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

/* ── attendance pattern analysis ── */
async function analyzeAttendancePattern(employee, attendanceRecords) {
  const summary = attendanceRecords.slice(-20)
    .map(r => `${r.date}: ${r.status} (in: ${r.clockIn || 'N/A'}, out: ${r.clockOut || 'N/A'}, hours: ${r.hoursWorked})`)
    .join('\n');
  const messages = [
    { role: 'system', content: 'You are an HR analytics specialist. Brief, constructive, empathetic insights.' },
    {
      role: 'user',
      content: `Analyze this employee's recent attendance in 2-3 sentences. Note patterns and suggest one constructive action.
Employee: ${employee.name} (${employee.position})
Attendance:\n${summary}`
    }
  ];
  return groqChat(messages, { temperature: 0.5, max_tokens: 250 });
}


/* ════════════════════════════════════════════════
   CHATBOT  (streaming + history)
════════════════════════════════════════════════ */

let hrChatHistory = [];

const HR_SYSTEM_PROMPTS = {
  admin: `You are WorkBuddy AI, an intelligent HR assistant. You help HR managers with:
- HR policies, compliance, and Nigerian labour law
- Recruitment, candidate evaluation, and onboarding
- Workforce analytics and performance management
- Drafting HR documents: offer letters, warning letters, policies, contracts, reports, memos

DOCUMENT RULES:
- When the user asks you to CREATE, DRAFT, or GENERATE any document, produce the FULL document content.
- If they want Excel/spreadsheet data, format your response as a clean markdown table with headers.
- End every document output with exactly: [DOCUMENT_READY]
- Indicate the ideal format by also appending one of: [FORMAT:docx] [FORMAT:pdf] [FORMAT:xlsx] [FORMAT:csv]

Company context: Nigerian company | Currency: Naira (₦) | Hours: 8AM–5PM WAT Mon–Fri
Leave policy: Annual 20 days | Sick 10 days | Emergency 3 days | Maternity 90 days | Paternity 14 days
Be professional, thorough, and actionable.`,

  employee: `You are WorkBuddy AI, a friendly HR assistant. You help employees with:
- Leave policies, how to apply, and leave balances
- Payroll, salary, and benefits questions
- HR procedures and company policies
- Drafting leave applications, complaint letters, or request letters

DOCUMENT RULES:
- When the user asks you to DRAFT or WRITE a letter/document, produce the FULL document content.
- End every document output with exactly: [DOCUMENT_READY]
- Append [FORMAT:docx] for letters and [FORMAT:pdf] for formal documents.

Company context: Nigerian company | Currency: Naira (₦) | Hours: 8AM–5PM WAT Mon–Fri
Be friendly, clear, and supportive.`
};

/* ── streaming chat (main chatbot function) ── */
async function askHRAssistantStream(userMessage, userRole = 'employee', onChunk, onDone) {
  hrChatHistory.push({ role: 'user', content: userMessage });
  const messages = [
    { role: 'system', content: HR_SYSTEM_PROMPTS[userRole] || HR_SYSTEM_PROMPTS.employee },
    ...hrChatHistory.slice(-14)   // keep last 7 exchanges in context
  ];
  await groqStream(
    messages,
    onChunk,
    (fullText) => {
      hrChatHistory.push({ role: 'assistant', content: fullText });
      onDone(fullText);
    },
    { temperature: 0.7, max_tokens: 1500 }
  );
}

/* ── non-streaming chat (fallback / programmatic use) ── */
async function askHRAssistant(userMessage, userRole = 'employee') {
  hrChatHistory.push({ role: 'user', content: userMessage });
  const messages = [
    { role: 'system', content: HR_SYSTEM_PROMPTS[userRole] || HR_SYSTEM_PROMPTS.employee },
    ...hrChatHistory.slice(-10)
  ];
  const response = await groqChat(messages, { temperature: 0.7, max_tokens: 1000 });
  hrChatHistory.push({ role: 'assistant', content: response });
  return response;
}

function clearChatHistory() { hrChatHistory = []; }


/* ════════════════════════════════════════════════
   DOCUMENT GENERATION
   Supports .docx · .xlsx · .csv · .pdf · .txt
════════════════════════════════════════════════ */

/* ── strip AI markers and whitespace ── */
function cleanAIContent(content) {
  return content
    .replace(/\[DOCUMENT_READY\]/gi, '')
    .replace(/\[EXCEL_READY\]/gi, '')
    .replace(/\[FORMAT:[a-z]+\]/gi, '')
    .trim();
}

/* ── auto-detect format from AI response + user message ── */
function detectDocumentFormat(content, userMessage = '') {
  const text = (userMessage + ' ' + content).toLowerCase();
  // check AI's own format hint first
  const hint = content.match(/\[FORMAT:(\w+)\]/i)?.[1]?.toLowerCase();
  if (hint) return hint;
  // fall back to keyword detection
  if (text.includes('excel') || text.includes('spreadsheet') || text.includes('xlsx')) return 'xlsx';
  if (text.includes(' csv ')) return 'csv';
  if (text.includes(' pdf ')) return 'pdf';
  return 'docx'; // default for all HR letters/reports
}

/* ── fire a browser download from a Blob ── */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename, style: 'display:none' });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

/* ────────────────────────────────────────────
   .TXT  (plain text fallback)
──────────────────────────────────────────── */
function downloadAsTxt(content, filename) {
  triggerDownload(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename + '.txt');
}

/* ────────────────────────────────────────────
   .CSV
──────────────────────────────────────────── */
function downloadAsCSV(content, filename) {
  const lines = content.split('\n').filter(l => l.trim());
  const rows = lines.map(line => {
    if (line.startsWith('|')) {
      // markdown table row
      return line.split('|')
        .map(c => c.trim())
        .filter(c => c && !/^[-:]+$/.test(c))
        .map(c => `"${c.replace(/"/g, '""')}"`)
        .join(',');
    }
    if (line.includes(',')) return line;
    return `"${line.replace(/"/g, '""')}"`;
  }).filter(Boolean);

  triggerDownload(
    new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }),
    filename + '.csv'
  );
}

/* ────────────────────────────────────────────
   .XLSX  (Excel)
──────────────────────────────────────────── */
async function downloadAsXLSX(content, filename) {
  if (typeof XLSX === 'undefined') {
    console.warn('SheetJS not loaded — falling back to CSV');
    showToast('Excel library not loaded. Saving as CSV instead.', 'warning');
    downloadAsCSV(content, filename); return;
  }

  const lines = content.split('\n').filter(l => l.trim());
  const rows = [];

  for (const line of lines) {
    if (line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c && !/^[-:]+$/.test(c));
      if (cells.length) rows.push(cells);
    } else if (line.includes(',')) {
      rows.push(line.split(',').map(c => c.trim()));
    } else if (line.trim()) {
      rows.push([line.trim()]);
    }
  }

  const sheetData = rows.length > 1 ? rows : lines.map(l => [l]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // auto column widths
  if (sheetData[0]) {
    ws['!cols'] = sheetData[0].map((_, ci) => ({
      wch: Math.min(60, Math.max(12, ...sheetData.map(r => String(r[ci] ?? '').length)))
    }));
  }

  // bold + light-blue background for header row
  if (rows.length > 0) {
    rows[0].forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[ref]) ws[ref].s = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } } };
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, 'WorkBuddy');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  triggerDownload(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename + '.xlsx'
  );
}

/* ────────────────────────────────────────────
   .DOCX  (Word)
────────────────────────────────────────────── */

/* dynamically injects a <script> tag and resolves when ready */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load: ' + src));
    document.head.appendChild(s);
  });
}

async function downloadAsDOCX(content, filename) {
  // auto-load the library if it is not on the page yet
  if (typeof window.docx === 'undefined') {
    try {
      showToast('Loading Word library...', 'info');
      await loadScript('https://unpkg.com/docx@8.5.0/build/index.umd.js');
    } catch (e) {
      console.error('[WorkBuddy AI] docx library load failed:', e);
      showToast('Could not load Word library. Saving as TXT.', 'warning');
      downloadAsTxt(content, filename); return;
    }
  }

  if (typeof window.docx === 'undefined') {
    showToast('Word library unavailable. Saving as TXT.', 'warning');
    downloadAsTxt(content, filename); return;
  }

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const children = [];

    for (const line of content.split('\n')) {
      const t = line.trim();

      if (!t) {
        children.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }
      if (t.startsWith('### ')) {
        children.push(new Paragraph({ text: t.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } }));
        continue;
      }
      if (t.startsWith('## ')) {
        children.push(new Paragraph({ text: t.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
        continue;
      }
      if (t.startsWith('# ')) {
        children.push(new Paragraph({ text: t.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 } }));
        continue;
      }
      if (t.startsWith('- ') || t.startsWith('• ') || t.startsWith('* ')) {
        children.push(new Paragraph({ text: t.slice(2).trim(), bullet: { level: 0 }, spacing: { after: 80 } }));
        continue;
      }
      // parse **bold** and *italic* inline
      if (t.includes('**') || (t.includes('*') && !t.startsWith('*'))) {
        const runs = [];
        const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
          } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
          } else if (part) {
            runs.push(new TextRun({ text: part }));
          }
        }
        children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
        continue;
      }
      children.push(new Paragraph({ children: [new TextRun({ text: t })], spacing: { after: 100 } }));
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    triggerDownload(blob, filename + '.docx');

  } catch (err) {
    console.error('[WorkBuddy AI] DOCX generation error:', err);
    showToast('Word export failed — saving as TXT instead.', 'warning');
    downloadAsTxt(content, filename);
  }
}

/* ────────────────────────────────────────────
   .PDF
──────────────────────────────────────────── */
async function downloadAsPDF(content, filename) {
  const PDFClass = window.jspdf?.jsPDF ?? window.jsPDF;
  if (!PDFClass) {
    console.warn('jsPDF not loaded — falling back to TXT');
    showToast('PDF library not loaded. Saving as TXT instead.', 'warning');
    downloadAsTxt(content, filename); return;
  }

  const doc = new PDFClass({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageW = 170;
  let y = 32;

  // header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('WorkBuddy HR', margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t) { y += 4; continue; }

    if (t.startsWith('# ')) { doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text(t.slice(2), margin, y); y += 9; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); }
    else if (t.startsWith('## ')) { doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text(t.slice(3), margin, y); y += 7.5; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); }
    else if (t.startsWith('### ')) { doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(t.slice(4), margin, y); y += 6.5; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); }
    else {
      doc.setFontSize(10);
      const plain = t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-•] /, '  • ');
      const wrapped = doc.splitTextToSize(plain, pageW);
      for (const wl of wrapped) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(wl, margin, y);
        y += 5.5;
      }
    }
    if (y > 275) { doc.addPage(); y = 20; }
  }

  // page footers
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`Generated by WorkBuddy AI  •  Page ${i} of ${total}`, margin, 290);
  }

  doc.save(filename + '.pdf');
}


/* ════════════════════════════════════════════════
   MAIN DOWNLOAD ENTRY POINT
   Call this whenever [DOCUMENT_READY] appears in
   the AI response. Everything is auto-detected.

   Usage:
     downloadAIDocument(aiResponseText, 'offer-letter', null, userMessage)
════════════════════════════════════════════════ */
async function downloadAIDocument(content, filename = 'workbuddy-document', format = null, userMessage = '') {
  if (!content) { showToast('No document content to download.', 'error'); return; }

  const clean = cleanAIContent(content);
  const date = new Date().toISOString().split('T')[0];
  const safeName = filename.replace(/[^a-z0-9\-]/gi, '-').toLowerCase() + '-' + date;
  const fmt = format || detectDocumentFormat(content, userMessage);

  showToast('Preparing document…', 'info');

  try {
    switch (fmt) {
      case 'xlsx': await downloadAsXLSX(clean, safeName); break;
      case 'csv': downloadAsCSV(clean, safeName); break;
      case 'pdf': await downloadAsPDF(clean, safeName); break;
      case 'docx': await downloadAsDOCX(clean, safeName); break;
      default: downloadAsTxt(clean, safeName);
    }
    showToast(`Downloaded as .${fmt} ✓`, 'success');
  } catch (err) {
    console.error('[WorkBuddy AI] Document generation failed:', err);
    showToast('Download failed — check console for details.', 'error');
  }
}

/* ── helper: does this AI response contain a downloadable document? ── */
function hasDocumentContent(text) {
  return Boolean(text?.includes('[DOCUMENT_READY]'));
}


/* ════════════════════════════════════════════════
   SMART EXCEL GENERATOR
   Asks the AI to return structured JSON, then
   builds a properly formatted .xlsx from it.

   Usage:
     generateSmartExcel('monthly payroll report', employeesArray)
════════════════════════════════════════════════ */
async function generateSmartExcel(userRequest, contextData = null) {
  const messages = [
    {
      role: 'system',
      content: `You are a data formatting expert. Respond ONLY with a valid JSON object — no markdown fences, no explanation:
{ "title": "<sheet name>", "headers": ["Col1","Col2",...], "rows": [["val","val",...], ...] }`
    },
    {
      role: 'user',
      content: `Generate spreadsheet data for: ${userRequest}
${contextData ? 'Use this data as a source:\n' + JSON.stringify(contextData, null, 2) : ''}
Return ONLY the JSON object.`
    }
  ];

  showToast('Generating Excel file…', 'info');
  const raw = await groqChat(messages, { temperature: 0.2, max_tokens: 2000 });

  try {
    const { title, headers, rows } = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!headers || !rows) throw new Error('Missing headers or rows');

    if (typeof XLSX === 'undefined') { showToast('Excel library not loaded.', 'error'); return; }

    const sheetData = [headers, ...rows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // header row styling
    headers.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[ref]) ws[ref].s = { font: { bold: true }, fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } } };
    });

    // auto column widths
    ws['!cols'] = headers.map((h, ci) => ({
      wch: Math.max(h.length + 2, ...rows.map(r => String(r[ci] ?? '').length), 10)
    }));

    XLSX.utils.book_append_sheet(wb, ws, title || 'Report');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const date = new Date().toISOString().split('T')[0];
    triggerDownload(
      new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `workbuddy-${(title || 'report').toLowerCase().replace(/\s+/g, '-')}-${date}.xlsx`
    );
    showToast('Excel file downloaded ✓', 'success');
  } catch (err) {
    console.error('[WorkBuddy AI] generateSmartExcel parse error:', err);
    showToast('Could not build Excel — try rephrasing your request.', 'error');
  }
}
