import { useState, useEffect, useRef, useCallback } from "react";

const GATEWAY_URL = "ws://127.0.0.1:18789";

const AGENTS = [
  { id: "main", name: "Sentinel", emoji: "🛡️", color: "#00d4aa", model: "claude-sonnet-4-6" },
  { id: "trader", name: "Trader", emoji: "💹", color: "#f59e0b", model: "claude-haiku-4-5" },
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #1a1a24;
    --border: #2a2a3a;
    --text: #e8e8f0;
    --text-dim: #6b6b88;
    --accent: #00d4aa;
    --accent2: #f59e0b;
    --danger: #ff4757;
    --radius: 12px;
  }

  body {
    font-family: 'JetBrains Mono', monospace;
    background: var(--bg);
    color: var(--text);
    height: 100vh;
    overflow: hidden;
  }

  .app {
    display: flex;
    height: 100vh;
    gap: 0;
  }

  /* SIDEBAR */
  .sidebar {
    width: 280px;
    min-width: 280px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 0;
    position: relative;
    overflow: hidden;
  }

  .sidebar::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }

  .sidebar-header {
    padding: 24px 20px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .logo-icon {
    font-size: 22px;
    filter: drop-shadow(0 0 8px var(--accent));
  }

  .logo-text {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, var(--accent), #00a8ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .logo-sub {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-left: 32px;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 11px;
    width: fit-content;
    transition: all 0.3s;
  }

  .connection-status.connected {
    background: rgba(0, 212, 170, 0.1);
    color: var(--accent);
    border: 1px solid rgba(0, 212, 170, 0.2);
  }

  .connection-status.disconnected {
    background: rgba(255, 71, 87, 0.1);
    color: var(--danger);
    border: 1px solid rgba(255, 71, 87, 0.2);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .connected .status-dot {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .agents-section {
    padding: 16px 12px;
    flex: 1;
    overflow-y: auto;
  }

  .section-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
    padding: 0 8px;
    margin-bottom: 8px;
  }

  .agent-btn {
    width: 100%;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius);
    padding: 12px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;
    margin-bottom: 4px;
    position: relative;
    overflow: hidden;
    text-align: left;
  }

  .agent-btn:hover {
    background: var(--surface2);
    border-color: var(--border);
  }

  .agent-btn.active {
    background: var(--surface2);
    border-color: var(--border);
  }

  .agent-btn.active::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: var(--agent-color);
  }

  .agent-emoji {
    font-size: 20px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .agent-info {
    flex: 1;
    min-width: 0;
  }

  .agent-name {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    display: block;
    margin-bottom: 2px;
  }

  .agent-model {
    font-size: 10px;
    color: var(--text-dim);
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .agent-badge {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--agent-color);
    flex-shrink: 0;
    opacity: 0.7;
  }

  .agent-btn.active .agent-badge {
    opacity: 1;
    box-shadow: 0 0 8px var(--agent-color);
    animation: badgePulse 2s infinite;
  }

  @keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 4px var(--agent-color); }
    50% { box-shadow: 0 0 12px var(--agent-color); }
  }

  .unread-badge {
    background: var(--danger);
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }

  .token-section {
    padding: 16px 12px;
    border-top: 1px solid var(--border);
  }

  .token-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    outline: none;
    transition: border-color 0.2s;
  }

  .token-input:focus {
    border-color: var(--accent);
  }

  .token-input::placeholder {
    color: var(--text-dim);
  }

  .connect-btn {
    width: 100%;
    margin-top: 8px;
    padding: 8px;
    background: linear-gradient(135deg, var(--accent), #00a8ff);
    border: none;
    border-radius: 8px;
    color: #000;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 1px;
  }

  .connect-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .connect-btn:active {
    transform: translateY(0);
  }

  /* MAIN CHAT */
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    min-width: 0;
  }

  .chat-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--surface);
    flex-shrink: 0;
  }

  .chat-header-emoji {
    font-size: 24px;
    filter: drop-shadow(0 0 6px var(--active-color));
  }

  .chat-header-info {
    flex: 1;
  }

  .chat-header-name {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
  }

  .chat-header-meta {
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 2px;
  }

  .chat-header-tokens {
    font-size: 11px;
    color: var(--text-dim);
    text-align: right;
  }

  .token-bar {
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 4px;
    overflow: hidden;
    width: 80px;
  }

  .token-bar-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transition: width 0.5s;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-track { background: transparent; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .message {
    display: flex;
    gap: 12px;
    animation: messageIn 0.3s ease;
  }

  @keyframes messageIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .message.user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    background: var(--surface2);
  }

  .message.assistant .message-avatar {
    background: var(--surface2);
    border: 1px solid var(--border);
  }

  .message.user .message-avatar {
    background: linear-gradient(135deg, var(--accent), #00a8ff);
    font-size: 12px;
    font-weight: 700;
    color: #000;
    font-family: 'Syne', sans-serif;
  }

  .message-content {
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .message.user .message-content {
    align-items: flex-end;
  }

  .message-bubble {
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .message.assistant .message-bubble {
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
    color: var(--text);
  }

  .message.user .message-bubble {
    background: linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,168,255,0.15));
    border: 1px solid rgba(0,212,170,0.2);
    border-bottom-right-radius: 4px;
    color: var(--text);
  }

  .message-time {
    font-size: 10px;
    color: var(--text-dim);
    padding: 0 4px;
  }

  .thinking-indicator {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    border-bottom-left-radius: 4px;
    width: fit-content;
  }

  .thinking-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-dim);
    animation: thinkDot 1.4s infinite;
  }

  .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
  .thinking-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes thinkDot {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  .welcome-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px;
    text-align: center;
  }

  .welcome-icon {
    font-size: 48px;
    filter: drop-shadow(0 0 20px var(--accent));
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .welcome-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), #00a8ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .welcome-sub {
    font-size: 13px;
    color: var(--text-dim);
    max-width: 400px;
    line-height: 1.6;
  }

  .quick-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
  }

  .quick-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 8px 14px;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .quick-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(0,212,170,0.05);
  }

  /* INPUT */
  .input-area {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 14px;
    transition: border-color 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: var(--accent);
  }

  .chat-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    resize: none;
    max-height: 120px;
    line-height: 1.5;
  }

  .chat-input::placeholder {
    color: var(--text-dim);
  }

  .send-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, var(--accent), #00a8ff);
    color: #000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    font-size: 14px;
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .input-hint {
    font-size: 10px;
    color: var(--text-dim);
    margin-top: 6px;
    padding: 0 4px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    gap: 12px;
    font-size: 13px;
  }

  .empty-icon {
    font-size: 40px;
    opacity: 0.3;
  }
`;

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ClawSwitch() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  const [conversations, setConversations] = useState(
    Object.fromEntries(AGENTS.map((a) => [a.id, []]))
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState("");
  const [unread, setUnread] = useState({});
  const [tokenUsage, setTokenUsage] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const hashToken = window.location.hash.replace("#token=", "");
    if (hashToken) setToken(hashToken);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isThinking]);

  const addMessage = useCallback((agentId, role, content) => {
    setConversations((prev) => ({
      ...prev,
      [agentId]: [
        ...prev[agentId],
        { role, content, time: Date.now(), id: Math.random() },
      ],
    }));
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;
    const msg = input.trim();
    setInput("");
    addMessage(activeAgent.id, "user", msg);
    setIsThinking(true);

    try {
      const response = await fetch("/api/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "YOUR_ANTHROPIC_API_KEY", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: activeAgent.id === "trader" ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `You are ${activeAgent.name} ${activeAgent.emoji}, an AI agent in the Zero Excuse Grind empire. ${
            activeAgent.id === "trader"
              ? "You are a dedicated paper trading agent. Be data driven, disciplined and concise."
              : "You are Sentinel, the chief content assistant. Be sharp, resourceful and strategic."
          } Keep responses focused and helpful.`,
          messages: [
            ...conversations[activeAgent.id].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: msg },
          ],
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "No response received.";

      setTokenUsage((prev) => ({
        ...prev,
        [activeAgent.id]: {
          input: (data.usage?.input_tokens || 0),
          output: (data.usage?.output_tokens || 0),
        },
      }));

      addMessage(activeAgent.id, "assistant", reply);
    } catch (err) {
      addMessage(activeAgent.id, "assistant", `Error: ${err.message}. Make sure your gateway is running.`);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchAgent = (agent) => {
    setActiveAgent(agent);
    setUnread((prev) => ({ ...prev, [agent.id]: 0 }));
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const quickSend = (msg) => {
    setInput(msg);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const currentMessages = conversations[activeAgent.id];
  const usage = tokenUsage[activeAgent.id];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">🦞</span>
              <span className="logo-text">ClawSwitch</span>
            </div>
            <div className="logo-sub">Multi-Agent Console</div>
            <div className={`connection-status ${connected ? "connected" : "disconnected"}`}>
              <div className="status-dot" />
              {connected ? "Gateway Connected" : "Not Connected"}
            </div>
          </div>

          <div className="agents-section">
            <div className="section-label">Your Agents</div>
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                className={`agent-btn ${activeAgent.id === agent.id ? "active" : ""}`}
                style={{ "--agent-color": agent.color }}
                onClick={() => switchAgent(agent)}
              >
                <div className="agent-emoji">{agent.emoji}</div>
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-model">{agent.model}</span>
                </div>
                <div className="agent-badge" />
                {unread[agent.id] > 0 && (
                  <span className="unread-badge">{unread[agent.id]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="token-section">
            <div className="section-label" style={{ marginBottom: "8px" }}>
              Gateway Token
            </div>
            <input
              className="token-input"
              type="password"
              placeholder="Paste token from openclaw dashboard"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <button
              className="connect-btn"
              onClick={() => setConnected(!connected)}
            >
              {connected ? "DISCONNECT" : "CONNECT"}
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="chat-area" style={{ "--active-color": activeAgent.color }}>
          {/* Header */}
          <div className="chat-header">
            <span className="chat-header-emoji">{activeAgent.emoji}</span>
            <div className="chat-header-info">
              <div className="chat-header-name" style={{ color: activeAgent.color }}>
                {activeAgent.name}
              </div>
              <div className="chat-header-meta">
                {currentMessages.length} messages · {activeAgent.model}
              </div>
            </div>
            {usage && (
              <div className="chat-header-tokens">
                <div>{usage.input + usage.output} tokens</div>
                <div className="token-bar">
                  <div
                    className="token-bar-fill"
                    style={{ width: `${Math.min(((usage.input + usage.output) / 200000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {currentMessages.length === 0 && !isThinking ? (
            <div className="welcome-screen">
              <div className="welcome-icon">{activeAgent.emoji}</div>
              <div className="welcome-title">Chat with {activeAgent.name}</div>
              <div className="welcome-sub">
                {activeAgent.id === "trader"
                  ? "Your dedicated paper trading agent. Ask about market analysis, trading strategies, or portfolio performance."
                  : "Your content strategy assistant for Zero Excuse Grind. Ask about video ideas, scripts, or brand strategy."}
              </div>
              <div className="quick-actions">
                {activeAgent.id === "trader" ? (
                  <>
                    <button className="quick-btn" onClick={() => quickSend("Give me today's market overview")}>
                      📊 Market Overview
                    </button>
                    <button className="quick-btn" onClick={() => quickSend("What trading strategy should I start with?")}>
                      📈 Trading Strategy
                    </button>
                    <button className="quick-btn" onClick={() => quickSend("Explain paper trading on Alpaca")}>
                      🎓 Paper Trading
                    </button>
                  </>
                ) : (
                  <>
                    <button className="quick-btn" onClick={() => quickSend("Give me 5 viral video ideas for Zero Excuse Grind")}>
                      🎬 Video Ideas
                    </button>
                    <button className="quick-btn" onClick={() => quickSend("Write a hook for a men's health video")}>
                      🪝 Write Hook
                    </button>
                    <button className="quick-btn" onClick={() => quickSend("What should I post today?")}>
                      📅 Today's Plan
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="messages">
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === "assistant" ? activeAgent.emoji : "K"}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.time)}</div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="message assistant">
                  <div className="message-avatar">{activeAgent.emoji}</div>
                  <div className="message-content">
                    <div className="thinking-indicator">
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                placeholder={`Message ${activeAgent.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || isThinking}
              >
                ↑
              </button>
            </div>
            <div className="input-hint">
              Enter to send · Shift+Enter for new line · Click agent to switch
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
