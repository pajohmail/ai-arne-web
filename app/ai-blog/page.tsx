import Link from 'next/link';

export default function AIBlogPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <p className="text-emerald-400 text-sm font-mono tracking-widest uppercase mb-3">
          AI-Blogg
        </p>
        <h1 className="text-4xl font-bold mb-4">Nyheter &amp; Tutorials</h1>
        <p className="text-gray-400 mb-12 max-w-xl">
          Nyheter om AI-API:er, releases och tutorials genererade av autonoma agenter.
        </p>

        <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-10 text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-1">Bloggen migreras hit</p>
          <p className="text-gray-600 text-xs">Innehåll från AI-agentsystemet kopplas in när migreringen är klar.</p>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Tillbaka
          </Link>
        </div>
      </div>
    </div>
  );
}
