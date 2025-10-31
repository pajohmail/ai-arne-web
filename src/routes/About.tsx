import Seo from '../components/Seo';

export default function About() {
  return (
    <article className="space-y-8">
      <Seo title="Om mig – AI‑Arne" description="Om Per‑Arne Johansson" />
      <h1>Om mig</h1>
      <p>
        Mitt namn är Per-Arne Johansson och jag har en magisterexamen i Data- och systemvetenskap. Jag har arbetat inom IT-säkerhet i över 20 år, där fokus ofta legat på drift, infrastruktur och pålitliga systemlösningar.
      </p>
      <p>
        Under de senaste åren har mitt intresse mer och mer riktats mot artificiell intelligens. Sedan hösten 2024 har jag därför läst flera YH-kurser på kvällstid inom området. Även om kurserna varit givande, märker jag att jag lär mig allra mest genom att bygga — att helt enkelt skapa och testa egna idéer i praktiken.
      </p>
      <p>
        Planen framöver är därför att fokusera mer på egna AI-projekt, vilka jag kommer att lägga upp här på sidan. Själva denna webbplats är faktiskt ett av mina pågående projekt, utvecklad som en del av en YH-kurs, och den drivs av ett molnbaserat AI-agent-system som jag själv byggt.
      </p>
      <p>
        Om du vill se mina tidigare projekt — både stora och små — finns de samlade på min GitHub:
        <br />
        <a href="https://github.com/pajohmail" target="_blank" rel="noopener noreferrer">👉 github.com/pajohmail</a>
      </p>
    </article>
  );
}


