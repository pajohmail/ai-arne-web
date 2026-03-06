import Link from 'next/link';

const skills = [
  'Python', 'TypeScript', 'LLM Orchestration', 'RAG',
  'OpenClaw', 'Firebase', 'Intune & Microsoft 365', 'Next.js',
  'Google Cloud', 'Automation',
];

const featuredProjects = [
  {
    id: 'ai-arne-portal',
    title: 'AI-Arne Portal',
    stack: ['Next.js', 'TypeScript', 'Firebase', 'Google Cloud'],
    summary: 'Fullständig AI-driven portalplattform med agenter som automatiskt genererar och publicerar nyheter och tutorials om AI-API:er.',
    href: '/projects',
  },
  {
    id: 'openclaw-agents',
    title: 'OpenClaw Sub-agents',
    stack: ['Python', 'LLM Orchestration', 'OpenAI', 'Anthropic'],
    summary: 'Hierarkiskt multi-agent-system där en manager-agent delegerar specialiserade deluppgifter till underagenter i parallell exekvering.',
    href: '/projects',
  },
  {
    id: 'lokal-rag',
    title: 'Lokal RAG',
    stack: ['Python', 'RAG', 'Vector DB', 'Embeddings'],
    summary: 'Retrieval-Augmented Generation-pipeline som kör helt lokalt för att söka och svara på frågor mot interna dokument utan att data lämnar miljön.',
    href: '/projects',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28 sm:py-36">
        <div
          className="absolute inset-0 -z-10 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #10b981, transparent)',
          }}
        />
        <div className="max-w-3xl mx-auto">
          <p className="text-emerald-400 text-sm font-mono tracking-widest uppercase mb-4">
            AI · LLM · Automation
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
            Hej, jag är{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Per-Arne (Paj).
            </span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl">
            Jag bygger autonoma AI-agenter, RAG-system och automatiserar verksamheter.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Se mina projekt
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              Kontakta mig
            </Link>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="px-6 py-16 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-6">
            Nyckelkompetenser
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-full hover:border-emerald-500 hover:text-emerald-400 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="px-6 py-16 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Utvalda projekt</h2>
          <p className="text-gray-400 mb-10 text-sm">Ett urval av vad jag byggt.</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {featuredProjects.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="group flex flex-col bg-gray-800/50 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-5 transition-colors"
              >
                <h3 className="font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{p.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.stack.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-gray-700/60 text-gray-400 text-xs rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/projects"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              Alla projekt →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Söker du expertis inom AI &amp; automation?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Jag är öppen för anställningar och konsultuppdrag inom AI-agenter, LLM-orkestrering och automatisering.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Kontakta mig
          </Link>
        </div>
      </section>
    </main>
  );
}
