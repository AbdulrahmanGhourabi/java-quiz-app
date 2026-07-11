import React, { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:5000/api';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');
const getUser  = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ user, onLogout, onNavigate, view }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = user ? [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'quiz',      label: 'Take Quiz',  icon: '✎' },
    { id: 'profile',   label: 'My Profile', icon: '◉' },
  ] : [];

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <button className="navbar-brand" onClick={() => onNavigate(user ? 'dashboard' : 'home')}>
        <span className="brand-glyph">✦</span>
        <span className="brand-name">JavaMaster</span>
        <span className="brand-tag">Academy</span>
      </button>

      {user && (
        <>
          <ul className="navbar-links desktop-only">
            {navLinks.map(l => (
              <li key={l.id}>
                <button
                  className={`nav-link${view === l.id ? ' active' : ''}`}
                  onClick={() => onNavigate(l.id)}
                >
                  <span className="nav-icon">{l.icon}</span>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="nav-right desktop-only">
            <div className="user-chip">
              <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
              <span className="user-name">{user.username}</span>
            </div>
            <button className="btn-signout" onClick={onLogout}>Sign Out</button>
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>

          {menuOpen && (
            <div className="mobile-drawer">
              {navLinks.map(l => (
                <button key={l.id} className="mobile-link" onClick={() => { onNavigate(l.id); setMenuOpen(false); }}>
                  {l.icon} {l.label}
                </button>
              ))}
              <div className="mobile-divider" />
              <span className="mobile-user">Signed in as <strong>{user.username}</strong></span>
              <button className="btn-signout" onClick={onLogout} style={{ width: '100%', marginTop: '0.5rem' }}>Sign Out</button>
            </div>
          )}
        </>
      )}

      {!user && (
        <div className="nav-right desktop-only">
          <button className="nav-link" onClick={() => onNavigate('login')}>Sign In</button>
          <button className="btn-cta-nav" onClick={() => onNavigate('signup')}>Get Started</button>
        </div>
      )}
    </nav>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }) {
  return (
    <div className="page home-page">
      <div className="hero-section">
        <div className="hero-eyebrow">
          <span className="eyebrow-line" />
          <span>Java Assessment Platform</span>
          <span className="eyebrow-line" />
        </div>
        <h1 className="hero-title">
          Sharpen Your<br /><em>Java Mastery</em>
        </h1>
        <p className="hero-sub">
          Challenge yourself with curated questions, track every attempt,
          and watch your skills grow — one quiz at a time.
        </p>
        <div className="hero-actions">
          <button className="btn-primary hero-cta" onClick={() => onNavigate('signup')}>
            Begin Your Journey
          </button>
          <button className="btn-ghost" onClick={() => onNavigate('login')}>
            Already a member? Sign in →
          </button>
        </div>

        <div className="hero-pillars">
          {[
            { icon: '📝', stat: '10',   label: 'Questions per Quiz' },
            { icon: '📊', stat: '∞',    label: 'Attempts Tracked' },
            { icon: '🏅', stat: 'A–F',  label: 'Grade Feedback' },
          ].map((p, i) => (
            <div key={i} className="pillar">
              <span className="pillar-icon">{p.icon}</span>
              <span className="pillar-stat">{p.stat}</span>
              <span className="pillar-label">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="features-row">
        {[
          { icon: '📈', title: 'Progress Tracking',    desc: 'Every quiz attempt is saved. See your improvement over time with detailed history.' },
          { icon: '🎯', title: 'Instant Feedback',     desc: 'Get a full question breakdown after each attempt — know exactly what to improve.' },
          { icon: '⏱',  title: 'Timed Assessment',    desc: '15 minutes to answer 10 carefully crafted Java questions at your own pace.' },
          { icon: '🏅', title: 'Grade & Score',        desc: 'Receive a grade from A to F with personalized motivational feedback every time.' },
        ].map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon-wrap">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ initialMode = 'login', onLogin, onNavigate }) {
  const [mode, setMode]       = useState(initialMode);
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (mode === 'signup' && !form.username.trim()) { setError('Username is required'); return; }
    if (!form.email.trim() || !form.password) { setError('All fields are required'); return; }
    if (mode === 'signup' && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await apiFetch('/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        await apiFetch('/signup', {
          method: 'POST',
          body: JSON.stringify({ ...form, role: 'student' })
        });
        setSuccess('Account created! You can now sign in.');
        setMode('login');
        setForm({ username: '', email: '', password: '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth-card-top">
          <div className="auth-glyph">✦</div>
          <h2 className="auth-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Sign in to continue your Java journey'
              : 'Join the academy and start mastering Java'}
          </p>
        </div>

        {error   && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        {mode === 'signup' && (
          <div className="field-group">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              placeholder="Choose a unique username"
              autoFocus
            />
          </div>
        )}

        <div className="field-group">
          <label>Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="you@example.com"
            autoFocus={mode === 'login'}
          />
        </div>

        <div className="field-group">
          <label>Password</label>
          <div className="pass-wrap">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="auth-switch">
          {mode === 'login'
            ? <>No account? <span onClick={() => { setMode('signup'); setError(''); }}>Sign up free</span></>
            : <>Have an account? <span onClick={() => { setMode('login'); setError(''); }}>Sign in</span></>
          }
        </p>
      </div>
    </div>
  );
}

// ─── QUIZ PAGE ────────────────────────────────────────────────────────────────
function QuizPage({ onDone }) {
  const [questions, setQuestions]   = useState([]);
  const [totalPoints, setTotalPoints] = useState(100);
  const [current, setCurrent]       = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [flagged, setFlagged]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft]     = useState(15 * 60);

  useEffect(() => {
    apiFetch('/quiz/questions').then(data => {
      setQuestions(data.questions);
      setTotalPoints(data.totalPoints);
      setAnswers(new Array(data.questions.length).fill(null));
      setFlagged(new Array(data.questions.length).fill(false));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const timerCls = timeLeft < 120 ? 'quiz-timer danger' : timeLeft < 300 ? 'quiz-timer warn' : 'quiz-timer';

  const q = questions[current];
  const answered = answers.filter(a => a !== null).length;
  const progress = questions.length ? (answered / questions.length) * 100 : 0;
  const letters  = ['A', 'B', 'C', 'D'];

  const select    = i => { const n = [...answers]; n[current] = i; setAnswers(n); };
  const toggleFlag = () => { const n = [...flagged]; n[current] = !n[current]; setFlagged(n); };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await apiFetch('/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
      onDone(result);
    } catch {
      alert('Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page center-page">
      <div className="loader"><div className="loader-ring" /><span>Loading questions...</span></div>
    </div>
  );

  return (
    <div className="page quiz-page">
      <div className="quiz-wrap">

        {/* Header */}
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title">Java Assessment</h1>
            <p className="quiz-subtitle">10 questions · 15 minutes · Answer all to submit</p>
          </div>
          <div className={timerCls}>{fmt(timeLeft)}</div>
        </div>

        {/* Progress */}
        <div className="quiz-progress">
          <div className="progress-labels">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{answered} / {questions.length} answered</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="q-map">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`qm-btn${i === current ? ' cur' : ''}${answers[i] !== null ? ' ans' : ''}${flagged[i] ? ' flg' : ''}`}
                title={`Q${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="question-card">
          <div className="q-meta">
            <span className="q-id">Q{q.id}</span>
            <span className="q-pts">+{q.points} pts</span>
            <button className={`flag-btn${flagged[current] ? ' on' : ''}`} onClick={toggleFlag}>
              {flagged[current] ? '🚩' : '⚑'} {flagged[current] ? 'Flagged' : 'Flag'}
            </button>
          </div>

          <p className="q-text">{q.question}</p>

          <div className="options-grid">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`opt-btn${answers[current] === i ? ' chosen' : ''}`}
                onClick={() => select(i)}
              >
                <span className="opt-letter">{letters[i]}</span>
                <span className="opt-text">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="quiz-nav">
          <button className="btn-ghost" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
            ← Previous
          </button>
          <div className="nav-info">
            <span className="nav-count">{answered}/{questions.length}</span>
            {flagged.some(Boolean) && <span className="flag-count">🚩 {flagged.filter(Boolean).length}</span>}
          </div>
          {current < questions.length - 1 ? (
            <button className="btn-ghost" onClick={() => setCurrent(c => c + 1)}>Next →</button>
          ) : (
            <button
              className="btn-primary submit-btn"
              onClick={handleSubmit}
              disabled={submitting || answers.some(a => a === null)}
            >
              {submitting ? <span className="spinner" /> : 'Submit Quiz ✓'}
            </button>
          )}
        </div>

        {current === questions.length - 1 && answers.some(a => a === null) && (
          <p className="submit-warn">⚠ Answer all questions before submitting.</p>
        )}
      </div>
    </div>
  );
}

// ─── RESULTS PAGE ─────────────────────────────────────────────────────────────
function ResultsPage({ result, onRetry, onDashboard }) {
  const { score, rawScore, totalPoints, grade, breakdown } = result;
  const correct = breakdown.filter(b => b.correct).length;

  return (
    <div className="page results-page">
      <div className="results-wrap">

        {/* Score hero */}
        <div className="score-hero">
          <div className="score-ring" style={{ '--clr': grade.color }}>
            <span className="score-num">{score}%</span>
            <span className="score-lbl">Score</span>
          </div>
          <div className="score-info">
            <div className="grade-display" style={{ color: grade.color }}>
              {grade.emoji} Grade {grade.letter}
            </div>
            <div className="score-stats">
              <span>{rawScore} / {totalPoints} pts</span>
              <span className="stat-dot">·</span>
              <span>{correct} / {breakdown.length} correct</span>
            </div>
            <blockquote className="grade-quote">"{grade.message}"</blockquote>
          </div>
        </div>

        <div className="results-actions">
          <button className="btn-primary" onClick={onRetry}>↺ Retry Quiz</button>
          <button className="btn-ghost" onClick={onDashboard}>View Dashboard</button>
        </div>

        <div className="section-divider">
          <span>Question Breakdown</span>
        </div>

        <div className="breakdown-list">
          {breakdown.map((item, i) => (
            <div key={i} className={`breakdown-row ${item.correct ? 'ok' : 'ng'}`}>
              <div className="bi-status">{item.correct ? '✓' : '✗'}</div>
              <div className="bi-body">
                <p className="bi-q">Q{item.questionId}: {item.question.length > 90 ? item.question.slice(0, 90) + '…' : item.question}</p>
                <p className="bi-a">
                  {item.correct
                    ? `Your answer: ${item.yourAnswer}`
                    : `Your answer: ${item.yourAnswer} · Correct: ${item.correctAnswer}`}
                </p>
              </div>
              <span className="bi-pts" style={{ color: item.correct ? '#2ecc71' : '#e74c3c' }}>
                {item.correct ? `+${item.points}` : '0'} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ user, onNavigate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/quiz/history')
      .then(data => { setHistory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const bestScore = history.length ? Math.max(...history.map(h => h.score)) : null;
  const avgScore  = history.length ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length) : null;
  const passing   = history.filter(h => h.score >= 70).length;
  const getGrade  = s => s >= 90 ? 'A' : s >= 70 ? 'B' : s >= 50 ? 'C' : s >= 40 ? 'D' : 'F';
  const gradeColor = { A: '#FFD700', B: '#C0C0C0', C: '#CD7F32', D: '#FF8C00', F: '#e74c3c' };

  // Trend: last 5 attempts for mini-chart
  const recent5 = [...history].slice(0, 5).reverse();

  return (
    <div className="page dash-page">
      <div className="dash-wrap">

        <div className="dash-header">
          <div>
            <h1 className="dash-title">My Dashboard</h1>
            <p className="dash-sub">Welcome back, <strong>{user.username}</strong></p>
          </div>
          <button className="btn-primary new-quiz-btn" onClick={() => onNavigate('quiz')}>
            + New Quiz
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '📝', val: history.length,                        lbl: 'Total Attempts' },
            { icon: '🏆', val: bestScore != null ? `${bestScore}%` : '—', lbl: 'Best Score' },
            { icon: '📊', val: avgScore  != null ? `${avgScore}%`  : '—', lbl: 'Average Score' },
            { icon: '✅', val: passing,                                lbl: 'Passing Attempts' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <span className="sc-icon">{s.icon}</span>
              <span className="sc-val">{s.val}</span>
              <span className="sc-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        
        {recent5.length > 1 && (
          <div className="trend-card">
            <p className="trend-label">Recent Trend (last {recent5.length} attempts)</p>
            <div className="trend-bars">
              {recent5.map((h, i) => (
                <div key={i} className="trend-col">
                  <div className="trend-bar-wrap">
                    <div
                      className={`trend-bar ${h.score >= 70 ? 'pass' : 'fail'}`}
                      style={{ height: `${Math.max(h.score, 4)}%` }}
                    />
                  </div>
                  <span className="trend-val">{h.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

     
        {avgScore != null && (
          <div className="avg-bar-card">
            <div className="avg-bar-labels">
              <span>Overall Average</span>
              <span style={{ color: 'var(--gold)' }}>{avgScore}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${avgScore}%` }} />
            </div>
          </div>
        )}

        <div className="section-divider"><span>Attempt History</span></div>

        {loading ? (
          <div className="loader"><div className="loader-ring" /></div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <p>No quizzes taken yet.</p>
            <button className="btn-primary" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => onNavigate('quiz')}>
              Take Your First Quiz
            </button>
          </div>
        ) : (
          <table className="hist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const g = getGrade(h.score);
                return (
                  <tr key={i}>
                    <td className="muted">{i + 1}</td>
                    <td className="gold-text cinzel">{h.score}%</td>
                    <td className="cinzel" style={{ color: gradeColor[g], fontWeight: 700 }}>{g}</td>
                    <td>
                      <span className={`badge ${h.score >= 70 ? 'pass' : 'fail'}`}>
                        {h.score >= 70 ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="muted small">
                      {new Date(h.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


function ProfilePage({ user, onLogout }) {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pwForm, setPwForm]         = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState('');
  const [pwLoading, setPwLoading]   = useState(false);

  useEffect(() => {
    apiFetch('/quiz/history')
      .then(d => { setHistory(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalAttempts = history.length;
  const bestScore     = history.length ? Math.max(...history.map(h => h.score)) : null;
  const avgScore      = history.length ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length) : null;
  const getGrade      = s => s >= 90 ? 'A' : s >= 70 ? 'B' : s >= 50 ? 'C' : s >= 40 ? 'D' : 'F';

  const handlePwChange = async () => {
    setPwError(''); setPwSuccess('');
    if (!pwForm.current || !pwForm.newPw) { setPwError('All fields are required'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await apiFetch('/profile/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw })
      });
      setPwSuccess('Password updated successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="page profile-page">
      <div className="profile-wrap">

        
        <div className="identity-card">
          <div className="id-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="id-info">
            <h2 className="id-name">{user.username}</h2>
            <p className="id-email">{user.email}</p>
            <span className="id-badge">Student</span>
            {user.created_at && <p className="id-since">Member since {memberSince}</p>}
          </div>
        </div>

        
        {!loading && (
          <div className="profile-stats">
            {[
              { lbl: 'Attempts', val: totalAttempts },
              { lbl: 'Best Score', val: bestScore != null ? `${bestScore}%` : '—' },
              { lbl: 'Average', val: avgScore != null ? `${avgScore}%` : '—' },
              { lbl: 'Best Grade', val: bestScore != null ? getGrade(bestScore) : '—' },
            ].map((s, i) => (
              <div key={i} className="ps-item">
                <span className="ps-val">{s.val}</span>
                <span className="ps-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        )}

       
        <div className="pw-section">
          <h3 className="section-title">Change Password</h3>

          {pwError   && <div className="alert alert-error">⚠ {pwError}</div>}
          {pwSuccess && <div className="alert alert-success">✓ {pwSuccess}</div>}

          <div className="pw-fields">
            <div className="field-group">
              <label>Current Password</label>
              <input
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div className="field-group">
              <label>New Password</label>
              <input
                type="password"
                value={pwForm.newPw}
                onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="field-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat new password"
                onKeyDown={e => e.key === 'Enter' && handlePwChange()}
              />
            </div>
          </div>

          <button className="btn-primary pw-btn" onClick={handlePwChange} disabled={pwLoading}>
            {pwLoading ? <span className="spinner" /> : 'Update Password'}
          </button>
        </div>

        {/* Danger zone */}
        <div className="danger-zone">
          <h3 className="section-title">Account</h3>
          <button className="btn-danger" onClick={onLogout}>Sign Out of Account</button>
        </div>

      </div>
    </div>
  );
}


export default function App() {
  const [user, setUser]     = useState(() => getUser());
  const [view, setView]     = useState(getUser() ? 'dashboard' : 'home');
  const [result, setResult] = useState(null);

  const handleLogin  = u => { setUser(u); setView('dashboard'); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('home');
  };
  const navigate = v => { setResult(null); setView(v); };
  const handleQuizDone = res => { setResult(res); setView('results'); };

  return (
    <div className="app-root">
      <Navbar user={user} onLogout={handleLogout} onNavigate={navigate} view={view} />

      {view === 'home'      && <HomePage onNavigate={navigate} />}
      {view === 'login'     && !user && <AuthPage initialMode="login"  onLogin={handleLogin} onNavigate={navigate} />}
      {view === 'signup'    && !user && <AuthPage initialMode="signup" onLogin={handleLogin} onNavigate={navigate} />}
      {view === 'dashboard' && user  && <DashboardPage user={user} onNavigate={navigate} />}
      {view === 'quiz'      && user  && <QuizPage onDone={handleQuizDone} />}
      {view === 'profile'   && user  && <ProfilePage user={user} onLogout={handleLogout} />}
      {view === 'results'   && result && (
        <ResultsPage
          result={result}
          onRetry={() => navigate('quiz')}
          onDashboard={() => navigate('dashboard')}
        />
      )}
    </div>
  );
}