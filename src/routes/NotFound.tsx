import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div>
      <Seo title="Sidan kunde inte hittas – AI‑Arne" description="404" />
      <h1>Sidan kunde inte hittas.</h1>
      <p className="muted">Kontrollera adressen eller gå tillbaka till startsidan.</p>
    </div>
  );
}


