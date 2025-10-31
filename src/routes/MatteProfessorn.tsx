import Seo from '../components/Seo';

export default function MatteProfessorn() {
  return (
    <article className="space-y-8">
      <Seo title="Matte Professorn – AI‑Arne" description="AI‑driven mattehandledning för högstadiet" />
      <h1>Matte Professorn</h1>
      <p>
        <a className="btn" href="https://www.ai-arne.se/inlup2/index.html" target="_blank" rel="noopener noreferrer">Öppna appen</a>
        {' '}
        <a className="btn" href="https://github.com/pajohmail/nakademi-inlup2" target="_blank" rel="noopener noreferrer">GitHub</a>
      </p>

      <p>
        Matte Professorn är en webbaserad applikation utvecklad för högstadieelever som vill få stöd och vägledning i matematik. Syftet är att erbjuda en AI-driven handledning som hjälper elever att förstå och lösa matteproblem på ett pedagogiskt sätt.
      </p>
      <p>
        Tjänsten använder OpenAI:s språkmodell, som kommunicerar via ett PHP-baserat API. AI-n styrs av en särskild övergripande prompt som talar om hur den ska svara – tydligt, strukturerat och endast på matematikrelaterade frågor.
      </p>
    </article>
  );
}


