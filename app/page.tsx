import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Välkommen till AI-Arne
        </h1>
        <p className="text-lg text-gray-300 px-4">
          Här lär vi oss springa innan vi kan gå, för utvecklingen väntar inte.
        </p>

        <div className="text-left text-gray-400 leading-relaxed space-y-4 px-4">
            <p>
                Låt oss vara ärliga: Utvecklingen av AI och digitala verktyg går just nu rasande fort. Det som var &quot;cutting edge&quot; i morse är antagligen obsolet lagom till eftermiddagsfikat. Att försöka lära sig detta via traditionella kurser är lite som att läsa en bok om simning utan att någonsin hoppa i vattnet.
            </p>
            <p>
                Här på sidan tror vi på att göra. Vi provar, vi testar, vi kraschar lite kod, och vi hittar nya, smartare sätt att jobba. Det handlar inte om att veta allt, utan om att våga ta reda på det.
            </p>
            <p>
                Så känn dig som hemma och kika runt! Utforska mina Projekt för att se vad som är möjligt, dyk ner i en Tutorial om du vill testa själv, eller läs de senaste spaningarna under Nyheter.
            </p>
            <p className="text-center text-lg text-gray-300 pt-4">
                Välkommen till AI-Arne.se.
            </p>
        </div>

        {/* Placeholder for an image */}
        <div className="w-full h-64 bg-gray-700 rounded-lg my-6 flex items-center justify-center">
            <span className="text-gray-500">Bild kommer här</span>
        </div>

        <div className="pt-8 border-t border-gray-700 mt-8 text-left space-y-4 px-4">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">AI-driven Orchestration Framework for GitHub</h2>
            <p>
                Jag utvecklar en lösning för att orkestrera AI-modeller direkt i GitHubs ekosystem. Arbetsflödet automatiserar steget från designdokument till färdig kod genom följande steg:
            </p>
            <ul className="list-disc list-inside space-y-2">
                <li><strong>Planering:</strong> Claude Code analyserar designdokument och bryter ner arkitekturen i specifika delkomponenter.</li>
                <li><strong>Hantering:</strong> Dessa komponenter omvandlas automatiskt till GitHub Issues för tydlig struktur och spårbarhet.</li>
                <li><strong>Exekvering:</strong> En dedikerad server pollar repot och triggar Gemini CLI för att iterativt lösa och stänga öppna issues.</li>
                <li><strong>Transparens:</strong> All aktivitet, loggning och kodutveckling sker versionshanterat direkt i Git och GitHub.</li>
            </ul>
            <p className="text-center pt-4">
                Projektet lanseras inom kort under
            </p>
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <div className="flex gap-4 mt-4">
            <Link
              href="/projects"
              className="px-6 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
            >
              Projekt
            </Link>
            <Link
              href="/about"
              className="px-6 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
            >
              Om mig
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
