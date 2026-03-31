import React, { useState, useRef, useEffect } from 'react'
import './StudyBuddy.css'

const BUDDY_HOTWORDS = {
  'risk': (pred) => pred?.risk_level
    ? `Your risk level is **${pred.risk_level.label}**. ${pred.risk_level.message}`
    : "I don't have your prediction data yet. Run a prediction first!",
  'score': (pred) => pred?.predicted_score != null
    ? `Your predicted score is **${pred.predicted_score.toFixed(1)} / 20**. ${pred.predicted_score >= 14 ? 'Excellent work! 🎉' : pred.predicted_score >= 10 ? 'You are on track, keep pushing!' : 'You need to improve — let me suggest a study plan.'}`
    : "No prediction yet! Fill in your data and analyze first.",
  'study': (pred) => pred?.learning_path
    ? `Here's your study plan:\n${pred.learning_path.study_plan?.map(s => `• **${s.topic}** — ${s.duration} (${s.priority} priority)`).join('\n') || 'No study plan generated.'}`
    : "Run a prediction to get a personalized study plan!",
  'recommend': (pred) => pred?.recommendation
    ? `**${pred.recommendation.title}**\n${pred.recommendation.description}\n\nActions:\n${pred.recommendation.actions?.map(a => `→ ${a}`).join('\n')}`
    : "No recommendation yet — analyze your performance first!",
  'mastery': (pred) => pred?.mastery != null
    ? `Your mastery status: **${pred.mastery_status}**. ${pred.mastery === 1 ? 'You have mastered the material! 🏆 Consider helping peers.' : 'You haven\'t reached mastery yet. Focus on reviewing weak areas.'}`
    : "Analyze your performance to check mastery status.",
  'improve': (pred) => pred?.learning_path?.next_steps?.length
    ? `Here are your next steps:\n${pred.learning_path.next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : "Run a prediction to get personalized improvement steps!",
  'weak': (pred) => pred?.profile?.weaknesses?.length
    ? `Your weak areas: ${pred.profile.weaknesses.join(', ')}. Focus on these!`
    : "Predict your performance to identify weak areas.",
  'strength': (pred) => pred?.profile?.strengths?.length
    ? `Your strengths: ${pred.profile.strengths.join(', ')}. Keep it up!`
    : "Analyze your data to find your strengths.",
  'hello': () => "Hello! 👋 I'm your AI Study Buddy! Ask me about your score, risk, study plan, mastery, strengths, or what to improve!",
  'hi': () => "Hi there! 👋 Ask me anything about your academic performance. Type 'help' to see what I can do!",
  'help': () => "I can help with:\n• **score** — Your predicted grade\n• **risk** — Your risk level\n• **study** — Your study plan\n• **mastery** — Mastery status\n• **improve** — Next steps\n• **weak** / **strength** — Your profile\n• **recommend** — Learning plan",
}

function matchAnswer(text, prediction) {
  const lower = text.toLowerCase()
  for (const [keyword, fn] of Object.entries(BUDDY_HOTWORDS)) {
    if (lower.includes(keyword)) return fn(prediction)
  }
  return "I'm not sure about that! Try asking: score, risk, study plan, mastery, improve, strengths, or weaknesses."
}

function StudyBuddy({ prediction }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! 👋 I'm your AI Study Buddy. Ask me about your score, risk, study plan, or improvements!" }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const msgEndRef = useRef(null)

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = () => {
    if (!input.trim()) return
    const userMsg = { from: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const answer = matchAnswer(input, prediction)
      setMessages(prev => [...prev, { from: 'bot', text: answer }])
      setTyping(false)
    }, 700)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const formatText = (text) => {
    // Bold **text**
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((segment, j) =>
          segment.startsWith('**') && segment.endsWith('**')
            ? <strong key={j}>{segment.slice(2, -2)}</strong>
            : segment
        )}
        <br />
      </span>
    ))
  }

  return (
    <>
      {/* Floating Button */}
      <button className={`study-buddy-fab ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)} title="AI Study Buddy">
        {open ? '✕' : '🤖'}
        {!open && <span className="fab-pulse"></span>}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="study-buddy-window">
          <div className="sb-header">
            <div className="sb-avatar">🤖</div>
            <div>
              <div className="sb-title">AI Study Buddy</div>
              <div className="sb-subtitle">Always here to help</div>
            </div>
            <button className="sb-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="sb-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`sb-msg ${msg.from}`}>
                {msg.from === 'bot' && <span className="sb-bot-icon">🤖</span>}
                <div className={`sb-bubble ${msg.from}`}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
            {typing && (
              <div className="sb-msg bot">
                <span className="sb-bot-icon">🤖</span>
                <div className="sb-bubble bot sb-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          <div className="sb-quick-actions">
            {['score', 'risk', 'study plan', 'improve'].map(q => (
              <button key={q} className="sb-quick-btn" onClick={() => {
                setInput(q)
                setTimeout(send, 50)
              }}>{q}</button>
            ))}
          </div>

          <div className="sb-input-row">
            <input
              className="sb-input"
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="sb-send" onClick={send} disabled={!input.trim()}>➤</button>
          </div>
        </div>
      )}
    </>
  )
}

export default StudyBuddy
