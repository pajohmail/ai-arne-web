import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  stack: string[];
  githubUrl?: string;
  demoUrl?: string;
}

const projects: Project[] = [
  {
    id: 'ai-arne-portal',
    title: 'AI-Arne Portal',
    tagline: 'AI-driven nyhets- och tutorialportal med autonoma Cloud-agenter',
    problem: 'Manuell omvärldsbevakning av AI-API:er är tidskrävande och missar ändå viktiga releases. Innehållsproduktion för en kunskapsblogg kräver konsekvent tid och kompetens.',
    solution: 'Byggde ett agentigkörningssystem på Google Cloud Functions med tre specialiserade agenter som var och en pollar externa källor, sammanfattar nyheter med LLM och skriver till Firestore. En PHP-proxy exponerar datan read-only för en Next.js-frontend utan att API-nycklar exponeras i klienten.',
    stack: ['Next.js', 'TypeScript', 'Google Cloud Functions', 'Firestore', 'OpenAI Responses API', 'PHP'],
    githubUrl: 'https://github.com/pajohmail/ai-arne-web',
  },
  {
    id: 'autoagent',
    title: 'GitHub Issue Auto-Agent',
    tagline: 'Pollar GitHub-repos och låter AI lösa issues automatiskt',
    problem: 'Repetitiva issues och boilerplate-koduppgifter tar up oproportionerligt mycket tid från kärnutveckling.',
    solution: 'En Bash-daemon pollar repos var 15:e minut, identifierar issues med specifik label och startar en AI-agent som analyserar, implementerar, testar och öppnar en pull request – helt utan manuell intervention.',
    stack: ['Bash', 'GitHub CLI', 'AI Agents', 'Automation', 'DevOps'],
    githubUrl: 'https://github.com/pajohmail/autoagent',
  },
  {
    id: 'openclaw-agents',
    title: 'OpenClaw Sub-agents',
    tagline: 'Hierarkiskt multi-agent-system med parallell exekvering',
    problem: 'Enkla LLM-anrop kan inte hantera komplexa uppgifter som kräver specialisering och parallellism. Kostnaden och latensen för sekventiella anrop skalas dåligt.',
    solution: 'Designade ett manager/worker-mönster där en orchestrator-agent bryter ner uppgifter och delegerar till specialiserade underagenter i parallell exekvering. Resultaten aggregeras och valideras av managern.',
    stack: ['Python', 'LLM Orchestration', 'OpenAI', 'Anthropic', 'Async'],
    githubUrl: undefined,
    demoUrl: undefined,
  },
  {
    id: 'lokal-rag',
    title: 'Lokal RAG',
    tagline: 'Retrieval-Augmented Generation-pipeline utan molntjänster',
    problem: 'Känsliga interna dokument kan inte processas via externa AI-API:er utan att bryta mot dataskyddskrav eller interna säkerhetspolicies.',
    solution: 'Implementerade en fullständig RAG-pipeline som körs lokalt: dokumentingestion, chunking, embedding via lokal modell, vector store och en query-loop mot en lokal LLM. Ingen data lämnar miljön.',
    stack: ['Python', 'RAG', 'Vector DB', 'Embeddings', 'Local LLM'],
    githubUrl: undefined,
  },
];

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <p className="text-emerald-400 text-sm font-mono tracking-widest uppercase mb-3">
          Case Studies
        </p>
        <h1 className="text-4xl font-bold mb-3">Projekt</h1>
        <p className="text-gray-400 mb-14 max-w-xl">
          Problem jag identifierat, lösningar jag byggt och tekniken bakom.
        </p>

        <div className="space-y-10">
          {projects.map((project) => (
            <article
              key={project.id}
              className="bg-gray-800/40 border border-gray-700 hover:border-gray-600 rounded-xl p-7 transition-colors"
            >
              <h2 className="text-2xl font-bold text-white mb-1">{project.title}</h2>
              <p className="text-emerald-400 text-sm mb-5">{project.tagline}</p>

              <div className="grid sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Problemet</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{project.problem}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Lösningen</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{project.solution}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {project.stack.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-700/60 text-gray-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-3">
                {project.githubUrl ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <GitHubIcon />
                    GitHub
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-600 text-sm rounded-lg cursor-not-allowed">
                    <GitHubIcon />
                    Privat repo
                  </span>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 text-sm rounded-lg transition-colors"
                  >
                    Demo →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Diskutera ett projekt
          </Link>
        </div>
      </div>
    </div>
  );
}
