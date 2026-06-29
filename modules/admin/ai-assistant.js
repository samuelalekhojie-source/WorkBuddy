function renderAdminAI() {
  clearChatHistory();
  const suggestions = [
    "Draft an offer letter for a new Software Developer",
    "Write a warning letter for repeated lateness",
    "Create a remote work policy for our company",
    "How can I reduce employee turnover?",
    "Draft a performance improvement plan (PIP)",
    "Write an email announcing a salary review"
  ];

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>AI Assistant</h2>
        <p>Powered by Groq &middot; Ask questions or generate HR documents</p>
      </div>
    </div>

    <div class="ai-chat-wrap">
      <!-- Sidebar -->
      <div class="ai-sidebar">
        <div class="card">
          <div class="card-title" style="margin-bottom:0.75rem">Quick Prompts</div>
          <div class="suggestions-list">
            ${suggestions.map(s => `
              <button class="suggestion-btn" onclick="sendChatMessage('${s.replace(/'/g,"\\'")}')">
                ${s}
              </button>`).join('')}
          </div>
        </div>
        <div class="card" style="margin-top:1rem">
          <div class="card-title" style="margin-bottom:0.5rem">Documents</div>
          <p class="text-sm text-secondary" style="margin-bottom:0.75rem">
            Ask AI to draft any HR document and a download button will appear automatically.
          </p>
          <div style="display:flex;flex-direction:column;gap:0.35rem">
            ${['Offer Letter','Warning Letter','Termination Letter','Leave Policy','NDA Agreement','PIP Document','Appraisal Form','Job Description'].map(d => `
              <button class="suggestion-btn" onclick="sendChatMessage('Draft a ${d} for me')">
                &#128196; ${d}
              </button>`).join('')}
          </div>
        </div>
        <div class="card" style="margin-top:1rem">
          <div class="card-title" style="margin-bottom:0.75rem">Company Snapshot</div>
          <div class="snapshot-list">
            <div class="snapshot-item"><span>Total Staff</span><strong>${getEmployees().length}</strong></div>
            <div class="snapshot-item"><span>Open Positions</span><strong>${getJobPostings().filter(j=>j.status==='open').length}</strong></div>
            <div class="snapshot-item"><span>Pending Leave</span><strong>${getPendingLeaves().length}</strong></div>
            <div class="snapshot-item"><span>Active Tasks</span><strong>${getTasks().filter(t=>t.status!=='completed').length}</strong></div>
          </div>
        </div>
      </div>

      <!-- Chat -->
      <div class="ai-chat-main">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg assistant">
            <div class="chat-avatar ai-avatar"><i data-lucide="sparkles"></i></div>
            <div class="chat-bubble">
              <p>Hello! I'm WorkBuddy AI powered by Groq. I can help you with HR strategy, answer policy questions, and <strong>generate complete HR documents</strong> you can download instantly.</p>
              <p style="margin-top:0.5rem">Try asking me to draft an offer letter, warning letter, or any HR document you need.</p>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-box">
            <textarea id="chat-input" placeholder="Ask anything or say 'Draft a [document type]...'" rows="1"
              onkeydown="handleChatKey(event)" oninput="autoResize(this)"></textarea>
            <button class="chat-send-btn" id="chat-send-btn" onclick="sendChatMessage()">
              <i data-lucide="send"></i>
            </button>
          </div>
          <div class="chat-input-hint">Press Enter to send &middot; Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  `);
}

async function sendChatMessage(prefilled) {
  const input   = document.getElementById('chat-input');
  const message = prefilled || input.value.trim();
  if (!message) return;
  if (input) { input.value = ''; input.style.height = 'auto'; }

  appendChatMessage(message, 'user');

  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  const msgId  = 'msg-' + Date.now();
  const bubble = appendStreamingBubble(msgId);
  let fullText = '';

  await askHRAssistantStream(
    message, 'admin',
    (chunk) => {
      fullText += chunk;
      // Strip the document marker from live display
      const display = fullText.replace('[DOCUMENT_READY]', '').trim();
      if (bubble) bubble.innerHTML = formatChatText(display) + '<span class="cursor-blink">|</span>';
      const msgs = document.getElementById('chat-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    },
    (finalText) => {
      const display = (finalText || fullText).replace('[DOCUMENT_READY]', '').trim();
      if (bubble) {
        bubble.innerHTML = formatChatText(display);

        // If AI produced a document, show download button
        if (hasDocumentContent(finalText || fullText)) {
          const docName = extractDocumentName(message);
          // Store content on window object to avoid HTML attribute escaping issues
          const docKey = 'wb_doc_' + Date.now();
          window[docKey] = finalText || fullText;
          bubble.innerHTML += `
            <div style="margin-top:0.75rem;padding:0.75rem;background:var(--success-bg);border:1px solid var(--success);border-radius:var(--radius-sm);display:flex;align-items:center;gap:0.75rem">
              <i data-lucide="file-down" style="color:var(--success);width:18px;height:18px;flex-shrink:0"></i>
              <div style="flex:1">
                <div style="font-size:0.82rem;font-weight:600;color:var(--success)">Document ready to download</div>
                <div style="font-size:0.72rem;color:var(--text-secondary)">${docName}.txt</div>
              </div>
              <button class="btn btn-primary" style="font-size:0.8rem;padding:0.4rem 0.85rem"
                onclick="downloadAIDocument(window['${docKey}'], '${docName}')">
                <i data-lucide="download"></i> Download
              </button>
            </div>`;
          lucide.createIcons();
        }
      }
      lucide.createIcons();
      if (sendBtn) sendBtn.disabled = false;
    }
  );
}

function extractDocumentName(message) {
  const lower = message.toLowerCase();
  const types = [
    'offer letter', 'warning letter', 'termination letter', 'leave policy',
    'nda agreement', 'pip document', 'appraisal form', 'job description',
    'performance improvement plan', 'employment contract', 'remote work policy',
    'salary review', 'promotion letter', 'resignation acceptance'
  ];
  for (const t of types) {
    if (lower.includes(t)) return t.replace(/ /g, '-');
  }
  return 'hr-document';
}
