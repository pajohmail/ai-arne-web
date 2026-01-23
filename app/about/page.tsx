'use client';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Om mig</h1>
        <div className="prose prose-lg max-w-none">
          <p>
            Jag heter Per-Arne Johansson och har en magisterexamen i data- och systemvetenskap. Med över 20 års erfarenhet från säkerhetsbranschen har jag specialiserat mig på IT-infrastruktur, med ett särskilt fokus på driftsäkra och pålitliga systemlösningar.
          </p>
          <p>
            Vid sidan av mitt arbete har jag ett stort teknikintresse, och på senare år har jag fascinerats alltmer av artificiell intelligens. För att fördjupa mina kunskaper har jag läst flera YH-kurser inom AI på kvällstid. Det är ett spännande fält där jag, precis som inom mitt yrke, lär mig bäst genom att praktiskt bygga och testa nya idéer.
          </p>
        </div>
      </div>
    </div>
  );
}
