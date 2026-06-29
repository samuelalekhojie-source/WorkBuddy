function renderEmployeeAI() {
  clearChatHistory();
  const user = getCurrentUser();
  const suggestions = [
    "How many annual leave days do I have left?",
    "Draft a leave request letter for me",
    "How do I apply for maternity leave?",
    "Write a formal complaint letter",
    "When is the next payroll date?",
    "What are my employee rights?"
  ];

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>AI Assistant</h2>
        <p>Powered by Groq &middot; Ask HR questions or generate letters and documents</p>
      </div>
    </div>
    <div class="ai-chat-wrap">
      <div class="ai-sidebar">
        <div class="card">
          <div class="card-title" style="margin-bottom:0.75rem">Quick Questions</div>
          <div class="suggestions-list">
            ${suggestions.map(s => `
              <button class="suggestion-btn" onclick="sendEmpChatMessage('${s.replace(/'/g,"\\'")}')">
                ${s}
              </button>`).join('')}
          </div>
        </div>
        <div class="card" style="margin-top:1rem">
          <div class="card-title" style="margin-bottom:0.5rem">Generate a Letter</div>
          <div style="display:flex;flex-direction:column;gap:0.35rem">
            ${['Leave Request Letter','Resignation Letter','Complaint Letter','Salary Advance Request','Reference Request'].map(d => `
              <button class="suggestion-btn" onclick="sendEmpChatMessage('Draft a ${d} for me')">
                &#128196; ${d}
              </button>`).join('')}
          </div>
        </div>
      </div>
      <div class="ai-chat-main">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg assistant">
            <div class="chat-avatar ai-avatar"><i data-lucide="sparkles"></i></div>
            <div class="chat-bubble">
              <p>Hi ${user?.name?.split(' ')[0] || 'there'}! I'm WorkBuddy AI. I can answer HR questions and <strong>draft letters or documents</strong> for you to download.</p>
              <p style="margin-top:0.5rem">Try: <em>"Draft a leave request letter for me"</em></p>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-box">
            <textarea id="chat-input" placeholder="Ask about HR policies or say 'Draft a letter for me'..." rows="1"
              onkeydown="handleChatKey(event)" oninput="autoResize(this)"></textarea>
            <button class="chat-send-btn" id="chat-send-btn" onclick="sendEmpChatMessage()">
              <i data-lucide="send"></i>
            </button>
          </div>
          <div class="chat-input-hint">Press Enter to send &middot; Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  `);
}

async function sendEmpChatMessage(prefilled) {
  const input   = document.getElementById('chat-input');
  const message = prefilled || input?.value.trim();
  if (!message) return;
  if (input) { input.value = ''; input.style.height = 'auto'; }

  appendChatMessage(message, 'user');

  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  const msgId  = 'msg-' + Date.now();
  const bubble = appendStreamingBubble(msgId);
  let fullText = '';

  await askHRAssistantStream(
    message, 'employee',
    (chunk) => {
      fullText += chunk;
      const display = fullText.replace('[DOCUMENT_READY]', '').trim();
      if (bubble) bubble.innerHTML = formatChatText(display) + '<span class="cursor-blink">|</span>';
      const msgs = document.getElementById('chat-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    },
    (finalText) => {
      const display = (finalText || fullText).replace('[DOCUMENT_READY]', '').trim();
      if (bubble) {
        bubble.innerHTML = formatChatText(display);

        if (hasDocumentContent(finalText || fullText)) {
          const docName = extractDocumentName(message);
          bubble.innerHTML += `
            <div style="margin-top:0.75rem;padding:0.75rem;background:var(--success-bg);border:1px solid var(--success);border-radius:var(--radius-sm);display:flex;align-items:center;gap:0.75rem">
              <i data-lucide="file-down" style="color:var(--success);width:18px;height:18px;flex-shrink:0"></i>
              <div style="flex:1">
                <div style="font-size:0.82rem;font-weight:600;color:var(--success)">Letter ready to download</div>
                <div style="font-size:0.72rem;color:var(--text-secondary)">${docName}.txt</div>
              </div>
              <button class="btn btn-primary" style="font-size:0.8rem;padding:0.4rem 0.85rem"
                onclick="downloadAIDocument(${JSON.stringify(finalText || fullText)}, '${docName}')">
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
    'leave request letter', 'resignation letter', 'complaint letter',
    'salary advance request', 'reference request', 'offer letter',
    'warning letter', 'leave policy', 'job description'
  ];
  for (const t of types) {
    if (lower.includes(t)) return t.replace(/ /g, '-');
  }
  return 'workbuddy-document';
}
