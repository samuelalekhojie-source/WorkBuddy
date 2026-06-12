function renderEmployeeAI() {
  clearChatHistory();
  const suggestions = [
    "How many annual leave days do I have left?",
    "How do I apply for sick leave?",
    "When is the next payroll processing date?",
    "What is the remote work policy?",
    "How are performance reviews conducted?",
    "What benefits am I entitled to?"
  ];

  setPageContent(`
    <div class="page-header">
      <div class="page-header-text"><h2>AI Assistant</h2><p>Ask me anything about HR, policies, or your benefits</p></div>
    </div>
    <div class="ai-chat-wrap">
      <div class="ai-sidebar">
        <div class="card">
          <div class="card-title" style="margin-bottom:0.75rem">Quick Questions</div>
          <div class="suggestions-list">
            ${suggestions.map(s => `<button class="suggestion-btn" onclick="sendEmpSuggestion('${s.replace(/'/g,"\\'")}')">${s}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="ai-chat-main">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg assistant">
            <div class="chat-avatar ai-avatar"><i data-lucide="sparkles"></i></div>
            <div class="chat-bubble">
              <p>Hi ${getCurrentUser()?.name?.split(' ')[0] || 'there'}! I'm your WorkBuddy AI assistant. I can answer questions about leave policies, payroll, benefits, and anything HR-related.</p>
              <p style="margin-top:0.5rem">How can I help you today?</p>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-box">
            <textarea id="chat-input" placeholder="Ask about your leave balance, payroll, policies..." rows="1" onkeydown="handleEmpChatKey(event)" oninput="autoResize(this)"></textarea>
            <button class="chat-send-btn" id="chat-send-btn" onclick="sendEmpChatMessage()"><i data-lucide="send"></i></button>
          </div>
          <div class="chat-input-hint">Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  `);
}

async function sendEmpChatMessage() {
  const input   = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  input.value = ''; input.style.height = 'auto';
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
      if (bubble) bubble.innerHTML = formatChatText(fullText) + '<span class="cursor-blink">|</span>';
      const msgs = document.getElementById('chat-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    },
    () => {
      if (bubble) bubble.innerHTML = formatChatText(fullText);
      lucide.createIcons();
      if (sendBtn) sendBtn.disabled = false;
    }
  );
}

function sendEmpSuggestion(text) {
  const input = document.getElementById('chat-input');
  if (input) { input.value = text; sendEmpChatMessage(); }
}

function handleEmpChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendEmpChatMessage(); }
}
