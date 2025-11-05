import { useEffect, useState, useRef } from 'react';
import Seo from '../components/Seo';
import { ErrorState, Skeleton } from '../components/States';
import { sendChatMessage, getSavedQuestions, type UserQuestionDoc, type ChatResponse } from '../lib/firestore';
import { sanitizeHtml } from '../lib/sanitize';

export default function Chat() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'unknown'>('unknown');
  const [savedQuestions, setSavedQuestions] = useState<UserQuestionDoc[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [sessionId] = useState(() => {
    // Generera ett session ID för att spåra användarens frågor
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enkel frontend-validering - bara blockera uppenbart irrelevanta frågor
  // Den riktiga valideringen sker i backend med AI
  const hasObviousIrrelevantKeywords = (q: string) => {
    const qLower = q.toLowerCase();
    const obviousNegativeKeywords = [
      'recept', 'mat', 'matlagning', 'kök', 'baka', 'tårta', 'kaka',
      'middag', 'lunch', 'frukost', 'ingrediens', 'kräm', 'sås',
      'sport', 'fotboll', 'hockey', 'tennis', 'golf', 'träning',
      'hälsa', 'sjukdom', 'medicin', 'läkare', 'sjukvård'
    ];
    return obviousNegativeKeywords.some(keyword => qLower.includes(keyword));
  };

  // Hämta sparade frågor vid mount
  useEffect(() => {
    loadSavedQuestions();
  }, []);

  // Scroll till botten när nytt svar kommer
  useEffect(() => {
    if (answer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [answer]);

  async function loadSavedQuestions() {
    setLoadingQuestions(true);
    try {
      const questions = await getSavedQuestions(20);
      setSavedQuestions(questions);
    } catch (err) {
      console.error('Failed to load saved questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    
    if (!trimmedQuestion) {
      return;
    }

    // Enkel frontend-validering - bara blockera uppenbart irrelevanta frågor
    // Den riktiga valideringen sker i backend med AI
    if (hasObviousIrrelevantKeywords(trimmedQuestion)) {
      setError('Frågan verkar inte vara relaterad till AI eller teknologi. Försök igen med en relevant fråga.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setProvider('unknown');

    try {
      const response: ChatResponse = await sendChatMessage(trimmedQuestion, sessionId);
      setAnswer(response.answer);
      setProvider(response.provider);
      setQuestion(''); // Rensa input
      
      // Uppdatera lista över sparade frågor
      await loadSavedQuestions();
    } catch (err: any) {
      setError(err.message || 'Kunde inte skicka frågan. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuestionClick(savedQuestion: UserQuestionDoc) {
    const trimmedQuestion = savedQuestion.question.trim();
    if (trimmedQuestion) {
      setQuestion(trimmedQuestion);
      await handleSubmitWithQuestion(trimmedQuestion);
    }
  }

  async function handleSubmitWithQuestion(q: string) {
    setLoading(true);
    setError(null);
    setAnswer(null);
    setProvider('unknown');

    try {
      const response: ChatResponse = await sendChatMessage(q, sessionId);
      setAnswer(response.answer);
      setProvider(response.provider);
      
      // Uppdatera lista över sparade frågor
      await loadSavedQuestions();
    } catch (err: any) {
      setError(err.message || 'Kunde inte skicka frågan. Försök igen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Seo title="Nyhets Chat – AI‑Arne" description="Ställ frågor om AI-nyheter och utveckling" />
      <h1>Nyhets Chat</h1>
      <p className="muted">
        Ställ frågor om AI-nyheter, teknologi och tech-företag. T.ex. "Microsoft och deras AI-tankar om framtiden" eller "Vad är nytt inom OpenAI?".
      </p>

      {/* Sparade frågor */}
      {savedQuestions.length > 0 && (
        <div className="card">
          <h2>Sparade frågor</h2>
          <p className="muted">Klicka på en fråga för att ställa den igen</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {savedQuestions.slice(0, 10).map((q) => (
              <li key={q.id} style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuestionClick(q)}
                  style={{
                    background: 'none',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {q.question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat-formulär */}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="question" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Din fråga:
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="T.ex. 'Vad är nytt inom OpenAI?' eller 'Berätta om senaste AI-utvecklingen'"
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="btn"
          disabled={loading || !question.trim()}
          style={{ width: '100%' }}
        >
          {loading ? 'Laddar...' : 'Skicka fråga'}
        </button>
      </form>

      {/* Felmeddelande */}
      {error && <ErrorState message={error} />}

      {/* Loading state */}
      {loading && <Skeleton lines={3} />}

      {/* Svar */}
      {answer && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Svar</h2>
            <span className="muted" style={{ fontSize: '0.875rem' }}>
              Powered by {provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Unknown'}
            </span>
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(answer) }}
            style={{ lineHeight: '1.6' }}
          />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

