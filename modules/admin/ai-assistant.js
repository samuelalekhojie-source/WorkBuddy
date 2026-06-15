function renderAdminAI() {
  clearChatHistory();
  const suggestions = [
    "How can I reduce employee turnover?",
    "What are best practices for performance reviews?",
    "Draft an email announcing a new leave policy",
    "How should I handle a workplace conflict?",
    "What metrics should I track for HR analytics?",
    "Suggest onboarding improvements for new hires"
  ];

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text">
        <h2>AI Assistant</h2>
        <p>Powered by Groq · Your intelligent HR copilot</p>
      </div>
    </div>
    <div class="ai-chat-wrap">
      <div class="ai-sidebar">
        <div class="card">
          <div class="card-title" style="margin-bottom:0.75rem">Quick Prompts</div>
          <div class="suggestions-list">
            ${suggestions.map(s => `<button class="suggestion-btn" onclick="sendSuggestion('${s.replace(/'/g,"\\'")}')"> ${s}</button>`).join('')}
          </div>
        </div>
        <div class="card" style="margin-top:1rem">
          <div class="card-title" style="margin-bottom:0.75rem">Company Snapshot</div>
          <div class="snapshot-list">
            <div class="snapshot-item"><span>Total Staff</span><strong>${getEmployees().length}</strong></div>
            <div class="snapshot-item"><span>Open Positions</span><strong>${getJobPostings().filter(j=>j.status==='open').length}</strong></div>
            <div class="snapshot-item"><span>Pending Leave</span><strong>${getPendingLeaves().length}</strong></div>
            <div class="snapshot-item"><span>Pending Payroll</span><strong>${getPayroll().filter(p=>p.status==='pending').length}</strong></div>
          </div>
        </div>
      </div>
      <div class="ai-chat-main">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg assistant">
            <div class="chat-avatar ai-avatar"><i data-lucide="sparkles"></i></div>
            <div class="chat-bubble">
              <p>Hello! I'm your WorkBuddy AI assistant. I can help you with HR strategy, policy drafting, workforce insights, compliance questions, and much more.</p>
              <p style="margin-top:0.5rem">What would you like to work on today?</p>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-box">
            <textarea id="chat-input" placeholder="Ask anything about HR, policies, your team..." rows="1" onkeydown="handleChatKey(event)" oninput="autoResize(this)"></textarea>
            <button class="chat-send-btn" id="chat-send-btn" onclick="sendChatMessage()"><i data-lucide="send"></i></button>
          </div>
          <div class="chat-input-hint">Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  `);
}

async function sendChatMessage() {
  const input   = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  input.value = ''; input.style.height = 'auto';

  appendChatMessage(message, 'user');

  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  // Create the AI bubble immediately and stream into it
  const msgId  = 'msg-' + Date.now();
  const bubble = appendStreamingBubble(msgId);

  let fullText = '';
  await askHRAssistantStream(
    message, 'admin',
    (chunk) => {
      fullText += chunk;
      if (bubble) bubble.innerHTML = formatChatText(fullText) + '<span class="cursor-blink">|</span>';
      const messages = document.getElementById('chat-messages');
      if (messages) messages.scrollTop = messages.scrollHeight;
    },
    () => {
      if (bubble) bubble.innerHTML = formatChatText(fullText);
      lucide.createIcons();
      if (sendBtn) sendBtn.disabled = false;
    }
  );
}

function sendSuggestion(text) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = text; sendChatMessage(); }
}






