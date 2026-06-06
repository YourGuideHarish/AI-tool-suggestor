'use client'
import { useState, useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface AiSplit {
  aiPercent: number
  manualPercent: number
  aiTasks: string
  manualTasks: string
  splitRationale: string
}
interface Tool {
  name: string
  type: string
  category: string
  why: string
  accessUrl: string
  steps: string[]
  badges: string[]
}
interface SkillItem { name: string; howToUse: string }
interface ConnectorItem { name: string; howToUse: string }
interface Recommendation {
  taskSummary: string
  aiSplit: AiSplit
  primaryTool: Tool
  alternativeTools: Tool[]
  claudeSkills: SkillItem[]
  claudeConnectors: ConnectorItem[]
  proTip: string
  warnings: string[]
}
interface Question { id: string; text: string; options: string[] }

// ── Badge colours ──────────────────────────────────────────────────────────
const badgeClass = (b: string) => {
  const l = b.toLowerCase()
  if (l.includes('best') || l.includes('recommended')) return 'tool-badge badge-best'
  if (l.includes('free') || l.includes('no cost')) return 'tool-badge badge-free'
  if (l.includes('claude')) return 'tool-badge badge-claude'
  if (l.includes('skill')) return 'tool-badge badge-skill'
  if (l.includes('connector')) return 'tool-badge badge-connector'
  return 'tool-badge badge-alt'
}

// ── Split bar ──────────────────────────────────────────────────────────────
function SplitBar({ split }: { split: AiSplit }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { setTimeout(() => setWidth(split.aiPercent), 100) }, [split.aiPercent])
  return (
    <div className="split-card anim-up">
      <div className="split-title">AI vs manual split</div>
      <div className="split-desc">{split.splitRationale}</div>
      <div className="split-bar-wrap">
        <div className="split-bar-track">
          <div className="split-bar-fill" style={{ width: `${width}%` }} />
        </div>
        <div className="split-labels">
          <span className="split-ai">⚡ AI handles {split.aiPercent}%</span>
          <span className="split-manual">You handle {split.manualPercent}%</span>
        </div>
      </div>
      <div className="split-detail">
        <strong style={{ color: 'var(--accent)', fontWeight: 500 }}>AI does: </strong>{split.aiTasks}
        <br /><br />
        <strong style={{ color: 'var(--text)', fontWeight: 500 }}>You do: </strong>{split.manualTasks}
      </div>
    </div>
  )
}

// ── Tool card ──────────────────────────────────────────────────────────────
function ToolCard({ tool, primary = false }: { tool: Tool; primary?: boolean }) {
  return (
    <div className={`tool-card${primary ? ' primary' : ''}`}>
      <div className="tool-header">
        <div className="tool-name">{tool.name}</div>
        <div className="tool-badges">
          {(tool.badges || []).map((b, i) => <span key={i} className={badgeClass(b)}>{b}</span>)}
        </div>
      </div>
      <div className="tool-why">{tool.why}</div>
      {tool.steps?.length > 0 && (
        <>
          <div className="tool-steps-title">How to use it</div>
          <ol className="tool-steps">
            {(tool.steps || []).map((s, i) => (
              <li key={i}>
                <span className="step-n">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {tool.accessUrl && (
        <a href={tool.accessUrl} target="_blank" rel="noopener noreferrer" className="tool-link">
          Open {tool.name} ↗
        </a>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [task, setTask] = useState('')
  const [phase, setPhase] = useState<'idle' | 'questions' | 'loading' | 'result' | 'error'>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Recommendation | null>(null)
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('Analysing your task…')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const LOADING_MSGS = [
    'Scanning 50+ free AI tools…',
    'Checking Claude skills & connectors…',
    'Calculating AI vs manual split…',
    'Mapping the best workflow…',
    'Almost done…',
  ]

  // auto-resize textarea
  const handleTaskChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTask(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 220) + 'px'
  }

  // Step 1: get clarifying questions
  const handleAnalyse = async () => {
    if (task.trim().length < 5) return
    setPhase('loading')
    setLoadingMsg('Understanding your task…')
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, phase: 'questions' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed')
      if (data.questions?.length > 0) {
        setQuestions(data.questions)
        setPhase('questions')
      } else {
        await getRecommendation({})
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPhase('error')
    }
  }

  // Step 2: get full recommendation with answers
  const getRecommendation = async (finalAnswers: Record<string, string>) => {
    setPhase('loading')
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[i])
    }, 1800)
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, phase: 'recommend', answers: finalAnswers }),
      })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok || data.error) throw new Error(data.error || 'Failed')
      setResult(data)
      setPhase('result')
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: unknown) {
      clearInterval(interval)
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPhase('error')
    }
  }

  const handleProceed = () => {
    getRecommendation(answers)
  }

  const handleReset = () => {
    setTask('')
    setPhase('idle')
    setQuestions([])
    setAnswers({})
    setResult(null)
    setError('')
    setTimeout(() => {
      textareaRef.current?.focus()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }, 50)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id])

  return (
    <>
      <div className="container">
        {/* Header */}
        <header className="header anim-in">
          <div className="logo">
            <div className="logo-dot" />
            AI Task Router
          </div>
          <span className="badge-live">Free forever</span>
        </header>

        {/* Hero */}
        <section className="hero">
          <div className="hero-tag anim-up">Powered by Gemini · No account needed</div>
          <h1 className="hero-title anim-up-2">
            What do you<br />need to <em>build</em>?
          </h1>
          <p className="hero-sub anim-up-3">
            Describe any task. Get the best free AI tools, Claude skills, connectors — plus an exact breakdown of what AI can do vs what needs your attention.
          </p>

          {/* Input */}
          <div className="input-wrap anim-up-3">
            <textarea
              ref={textareaRef}
              className="task-textarea"
              placeholder="e.g. I want to summarise a 50-page PDF and turn key points into a slide deck to share with my team…"
              value={task}
              onChange={handleTaskChange}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyse() }}
              disabled={phase === 'loading' || phase === 'result'}
              rows={3}
            />
            <div className="input-footer">
              <span className="char-count">{task.length} chars · ⌘↵ to submit</span>
              <button
                className="btn-analyze"
                onClick={handleAnalyse}
                disabled={task.trim().length < 5 || phase === 'loading' || phase === 'result'}
              >
                Analyse task
                <span>→</span>
              </button>
            </div>
          </div>
        </section>

        {/* Questions */}
        {phase === 'questions' && questions.length > 0 && (
          <div className="questions-panel">
            <div className="questions-title">A few quick questions →</div>
            {(questions || []).map((q, qi) => (
              <div key={q.id} className="question-item" style={{ animationDelay: `${qi * 0.07}s` }}>
                <div className="question-label">
                  <span className="q-num">Q{qi + 1}</span>
                  {q.text}
                </div>
                <div className="chip-group">
                  {(q.options || []).map((opt, oi) => (
                    <div
                      key={oi}
                      className={`chip${answers[q.id] === opt ? ' selected' : ''}`}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-proceed" onClick={handleProceed} disabled={!allAnswered}>
              Get my AI recommendation →
            </button>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div className="loading-state">
            <div className="spinner" />
            <div className="loading-text">{loadingMsg}</div>
            <div className="loading-sub">Searching across 50+ free tools including Claude skills & connectors</div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="questions-panel" style={{ borderColor: 'var(--coral)', marginTop: 24 }}>
            <div style={{ color: 'var(--coral)', fontWeight: 500, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>{error}</div>
            <button className="btn-reset" onClick={handleReset}>Try again</button>
          </div>
        )}

        {/* Results */}
        {phase === 'result' && result && (
          <div className="results" ref={resultsRef}>
            {/* Task summary */}
            <div className="note-card anim-up" style={{ marginBottom: 24 }}>
              <strong>Task: </strong>{result.taskSummary}
            </div>

            {/* AI/manual split */}
            <div className="section-label anim-up">Effort split</div>
            <SplitBar split={result.aiSplit} />

            {/* Primary tool */}
            <div className="section-label anim-up" style={{ marginTop: 28 }}>Best free tool</div>
            <div className="tools-grid">
              <ToolCard tool={result.primaryTool} primary />
            </div>

            {/* Claude skills */}
            {result.claudeSkills?.length > 0 && (
              <>
                <div className="section-label anim-up" style={{ marginTop: 28 }}>Claude skills to use</div>
                <div className="skills-section anim-up">
                  <div className="skills-title">
                    <span style={{ fontSize: 16 }}>◆</span> Claude built-in skills
                  </div>
                  {(result.claudeSkills || []).map((s, i) => (
                    <div key={i} className="skill-item">
                      <div className="skill-dot" />
                      <div>
                        <div className="skill-name">{s.name}</div>
                        <div className="skill-desc">{s.howToUse}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Claude connectors */}
            {result.claudeConnectors?.length > 0 && (
              <>
                <div className="section-label anim-up" style={{ marginTop: 16 }}>Claude connectors</div>
                <div className="connectors-section anim-up">
                  <div className="connectors-title">⟷ Connect external services</div>
                  {(result.claudeConnectors || []).map((c, i) => (
                    <div key={i} className="connector-item">
                      <div className="connector-dot" />
                      <div>
                        <div className="skill-name">{c.name}</div>
                        <div className="skill-desc">{c.howToUse}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Alternatives */}
            {result.alternativeTools?.length > 0 && (
              <>
                <div className="section-label anim-up" style={{ marginTop: 28 }}>Alternatives</div>
                <div className="tools-grid">
                  {(result.alternativeTools || []).map((t, i) => <ToolCard key={i} tool={t} />)}
                </div>
              </>
            )}

            {/* Pro tip */}
            {result.proTip && (
              <div className="note-card anim-up" style={{ marginTop: 20, borderColor: 'rgba(245,166,35,0.25)' }}>
                <strong>Pro tip: </strong>{result.proTip}
              </div>
            )}

            {/* Warnings */}
            {result.warnings?.map((w, i) => (
              <div key={i} className="note-card anim-up" style={{ borderColor: 'rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.04)' }}>
                <strong style={{ color: 'var(--coral)' }}>Note: </strong>{w}
              </div>
            ))}

            <button className="btn-reset" onClick={handleReset}>
              ← Analyse another task
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          AI Task Router · Free · No account needed · Powered by Gemini 2.5 Flash
          <br />
          <span style={{ color: 'var(--text-3)' }}>Knowledge auto-updates with every query · Built with Next.js + Vercel</span>
        </footer>
      </div>
    </>
  )
}
