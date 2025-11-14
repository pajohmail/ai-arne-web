import Seo from '../components/Seo';
import { sanitizeHtml } from '../lib/sanitize';

export default function CursorTutorial() {
  const content = `
<h2>Strukturerad och testdriven projektutveckling med Cursor 2.0</h2>

<p><em>(eller: hur du slipper bli slav under din egen AI)</em></p>

<h3>Introduktion</h3>

<p>Cursor 2.0 är i praktiken VS Code på koffein – fast med en inbyggd AI-kompis som gärna skriver koden åt dig, kommenterar den och ibland hittar på helt nya buggar du aldrig bett om.</p>

<p>Du kan "vibekoda": snacka med AI:n och få hela filer, moduler och projekt genererade. Rätt använt går det sjukt fort. Fel använt blir det… ja, mer som att låta en överentusiastisk praktikant refaktorera produktion.</p>

<p>Nyckeln till att Cursor inte ska förvandlas till en <strong>buggkanon</strong> är:</p>

<ul>
  <li><strong>Struktur</strong></li>
  <li><strong>Regler</strong></li>
  <li><strong>Tester</strong></li>
</ul>

<p>Med andra ord: du bestämmer spelplanen, AI:n får springa i korridoren – inte ute på motorvägen.</p>

<p>I den här guiden går vi igenom hur du bygger ett <strong>strukturerat, testdrivet projekt</strong> med Cursor 2.0 – från första prompt till deploy.</p>

<p>Vi kör exempel för:</p>

<ul>
  <li>Web (Node.js / Python)</li>
  <li>Cloud (GCP/AWS med CLI)</li>
  <li>Desktop (Python)</li>
</ul>

<p>Och vi väver in tänket från <strong>AI-Arne-metoden</strong>:</p>

<p>→ Planering → Utveckling → Test → Drift – allt i ett sammanhängande flöde, inte "vi fixar tester sen"–ljugeriet.</p>

<h3>Planering och projektstruktur</h3>

<p><em>("Planera först, vibekoda sen")</em></p>

<p>Innan du börjar mata in episka prompts i Cursor: sätt strukturen. Annars får du exakt det du bad om: <strong>AI-genererat kaos</strong>.</p>

<p>AI-Arne-tänket (och i princip alla som testat detta på riktigt) säger att du ska börja med tre saker:</p>

<ol>
  <li><strong>Tydlig systemarkitektur</strong><br>
  AI:n måste förstå <em>hur</em> systemet hänger ihop, inte bara "bygg nåt coolt med auth och microservices".</li>
  
  <li><strong>Strukturerad uppgiftsplan</strong><br>
  Bryt ned projektet i små, hanterbara tasks som både du och AI:n fattar.</li>
  
  <li><strong>Utvecklingsregler</strong><br>
  Skriv ned vad som gäller: kodstil, testkrav, naming, osv. AI:n är överrörlig – ge den ramar.</li>
</ol>

<p>En enkel men kraftfull mappstruktur:</p>

<pre><code>projektmapp/
├── .cursorrules              # AI-regler och kontext  
├── docs/                     # Dokumentation  
│   ├── architecture.mermaid  # Arkitekturskiss / systemdiagram  
│   ├── technical.md          # Tech-stack, kodstil, beslut  
│   └── status.md             # Vad är gjort, vad är på gång  
├── tasks/                    # Tasks / user stories  
│   └── tasks.md  
└── src/                      # Din faktiska kod
</code></pre>

<h4>Projektregler (.cursorrules)</h4>

<p><code>.cursorrules</code> är där du talar om för Cursor <em>hur ni jobbar här</em>. Exempel:</p>

<ul>
  <li><strong>Kontext:</strong><br>
  <em>"Du är en senior utvecklare i ett Node.js-projekt med Jest och Docker."</em></li>
  
  <li><strong>Viktiga filer AI:n ska bry sig om:</strong><br>
  <code>docs/architecture.mermaid</code>, <code>docs/technical.md</code>, <code>tasks/tasks.md</code>, <code>docs/status.md</code>.</li>
  
  <li><strong>Regler, typ:</strong>
    <ul>
      <li>Använd strikt typning där det går</li>
      <li>Följ SOLID så gott det går</li>
      <li>Skapa enhetstester för alla publika funktioner</li>
      <li>Ändra aldrig produktionskod utan att också röra tester (❤️)</li>
    </ul>
  </li>
</ul>

<p>Det här gör enorm skillnad: istället för att AI:n "gissar kultur" får du <em>din</em> standard konsekvent genom hela projektet.</p>

<h4>Arkitektur och dokumentation (docs/)</h4>

<p>I <code>docs/</code> hamnar hjärnan på projektet:</p>

<ul>
  <li><strong><code>architecture.mermaid</code></strong><br>
  En översikt över moduler, API:er, databaser osv. Cursor kan använda det här som karta.</li>
  
  <li><strong><code>technical.md</code></strong><br>
  Här skriver du t.ex:
    <ul>
      <li>Node 20 + Express</li>
      <li>PostgreSQL</li>
      <li>PyTest eller Jest</li>
      <li>"Vi kör feature branches, inte commit direkt på main, tack."</li>
    </ul>
  </li>
  
  <li><strong><code>status.md</code></strong><br>
  Projektets minne.<br>
  Här loggar du:
    <ul>
      <li>Vad som är klart</li>
      <li>Vad som pågår</li>
      <li>Kända problem/blockers</li>
    </ul>
  </li>
</ul>

<p>När AI:ns kontext tar slut (vilket den gör förr eller senare) kan du peka den tillbaka mot <code>status.md</code> istället för att börja förklara allt från scratch igen.</p>

<h4>Uppgifter (tasks/)</h4>

<p><code>tasks/tasks.md</code> är todo-listan för både dig och AI:n.</p>

<p>Varje task kan ha:</p>

<ul>
  <li>Beskrivning</li>
  <li>Krav</li>
  <li>Acceptanskriterier</li>
</ul>

<p>Exempel:</p>

<blockquote>
<p><strong>Task:</strong> Implementera användarautentisering<br>
<strong>Krav:</strong><br>
– E-post + lösenord<br>
– JWT-token vid inloggning<br>
– Hashning av lösenord<br>
– 5 felaktiga inloggningar → låst konto</p>
</blockquote>

<p>När Cursor läser <code>tasks.md</code> vet den <em>vad som är nästa grej</em> istället för att varje prompt blir ett filosofiskt samtal.</p>

<h3>Steg-för-steg: Utveckling med Cursor 2.0</h3>

<p><em>("Yes, du får faktiskt låta AI:n jobba – men du är fortfarande hjärnan")</em></p>

<p>När du satt struktur och regler kan du börja ha kul.</p>

<h4>1. Projektstart i Cursor</h4>

<ul>
  <li>Öppna projektmappen i Cursor</li>
  <li>Aktivera AI-chatten (Cmd/Ctrl + L)</li>
  <li>Se till att <code>.cursorrules</code> ligger där och att <code>docs/</code> & <code>tasks/</code> inte är tomma</li>
</ul>

<p>Nu har du en AI som inte bara ser en tom mapp, utan ett projekt med hjärna.</p>

<h4>2. Generera basapplikationen via prompt</h4>

<p>Skriv en tydlig prompt, typ:</p>

<blockquote>
<p>"Skapa en enkel webbtjänst i Node.js (Express) med två endpoints: <code>/hello</code> och <code>/status</code>.<br>
Lägg till <code>README.md</code> med körinstruktioner och <code>package.json</code> med rätt scripts."</p>
</blockquote>

<p>Cursor kommer då:</p>

<ul>
  <li>Skapa filer som <code>app.js</code>, <code>package.json</code>, <code>README.md</code></li>
  <li>Visa diffar så du kan granska innan du accepterar</li>
</ul>

<p><strong>Gör alltid:</strong></p>

<ul>
  <li>Läs igenom koden</li>
  <li>Kolla att scripts, dependencies och endpoints stämmer</li>
  <li>Justera där det behövs</li>
</ul>

<p>Samma grej för Python:</p>

<ul>
  <li>Flask/FastAPI-projekt</li>
  <li>Eller desktopapp med Tkinter / PyQt</li>
  <li>Eller ett litet CLI-verktyg</li>
</ul>

<p>Du slipper "pip install random skit i panik" – allt kan genereras med hyfsad ordning.</p>

<h4>3. Bygg funktionalitet i små klossar</h4>

<p>Nu börjar det riktiga jobbet.</p>

<p>Gå via dina tasks:</p>

<ol>
  <li>Välj en task i <code>tasks.md</code></li>
  
  <li>Skriv en prompt kopplad till just den uppgiften, t.ex:
    <blockquote>
    <p>"Lägg till MongoDB-stöd. Skapa en <code>User</code>-modell med fälten <code>name</code> och <code>email</code>, och en <code>/users</code>-endpoint för skapa/lista användare. Följ strukturen i <code>docs/architecture.mermaid</code>."</p>
    </blockquote>
  </li>
  
  <li>Låt Cursor generera:
    <ul>
      <li><code>models/User.js</code></li>
      <li>uppdaterade routes i <code>app.js</code></li>
      <li>ev. konfigurationsfiler</li>
    </ul>
  </li>
  
  <li>Bygg & kör själv:
    <ul>
      <li><code>npm install</code></li>
      <li><code>npm test</code></li>
      <li><code>npm run dev</code> eller liknande</li>
    </ul>
  </li>
</ol>

<p><strong>Viktigt:</strong><br>
Acceptera aldrig koden som "sanning". AI:n är snabb, inte ofelbar.</p>

<p>Om AI:n fattar fel:</p>

<ul>
  <li>Förtydliga prompten</li>
  <li>Dela upp i mindre steg</li>
  <li>Eller ändra koden manuellt och säg:
    <blockquote>
    <p>"Fortsätt utifrån den här versionen istället."</p>
    </blockquote>
  </li>
</ul>

<p>Cursor låter dig markera kod och säga t.ex:</p>

<blockquote>
<p>"Refaktorera den här metoden så den kastar rätt feltyp och loggar via vår logger."</p>
</blockquote>

<h4>4. Micromanagement-fällan</h4>

<p>Försök inte styra AI:n in i minsta underscore från början.</p>

<p><strong>Fel sätt:</strong></p>

<blockquote>
<p>"Skapa en fil som heter exakt <code>UserServiceButOnlyForNonAdminUsers.ts</code> och se till att alla funktioner heter exakt…"</p>
</blockquote>

<p><strong>Bättre:</strong></p>

<blockquote>
<p>"Skapa en <code>UserService</code> som hanterar CRUD för användare. Lägg den i rätt modul enligt vår arkitektur. Lägg också till enhetstester."</p>
</blockquote>

<p>Ta emot utkastet. Sen:</p>

<ul>
  <li>Byt namn</li>
  <li>Skruva på strukturen</li>
  <li>Be AI:n uppdatera resten efteråt</li>
</ul>

<p>AI:n är grym på grovjobb. Finputs är du (och dina tester).</p>

<h4>5. Håll dokumentation och status uppdaterad</h4>

<p>Efter varje större steg:</p>

<ul>
  <li>Uppdatera <code>docs/status.md</code> med:
    <ul>
      <li>Vad som är klart</li>
      <li>Vad som är på gång</li>
      <li>Eventuella blocker/saker att kolla sen</li>
    </ul>
  </li>
  
  <li>Lägg till beslut i <code>technical.md</code> om du ändrar approach</li>
</ul>

<p>Då kan du senare skriva till Cursor:</p>

<blockquote>
<p>"Läs <code>docs/status.md</code> och föreslå nästa naturliga task."</p>
</blockquote>

<p>Och den <em>faktiskt</em> har en chans att svara vettigt.</p>

<h3>Kontinuerlig testning under utveckling</h3>

<p><em>("No tests, no mercy")</em></p>

<p>AI utan tester är som att be någon skriva kod med ögonbindel och fyra dubbel espresso.<br>
Det ser produktivt ut. Tills det går live.</p>

<p>Därför: <strong>testerna ska in från början.</strong></p>

<h4>TDD med Cursor – i praktiken</h4>

<ol>
  <li><strong>Skriv testet först</strong><br>
  Exempel:
    <ul>
      <li>Node: Jest-test i <code>__tests__/formatName.test.js</code></li>
      <li>Python: PyTest i <code>tests/test_format_name.py</code></li>
    </ul>
  
  Beskriv:
    <ul>
      <li>In: råa data</li>
      <li>Ut: förväntad output</li>
      <li>Edge cases</li>
    </ul>
  </li>
  
  <li><strong>Låt AI:n skriva implementationen</strong><br>
  Prompt, typ:
    <blockquote>
    <p>"Implementera <code>formatName()</code> i <code>src/utils/formatName.js</code> så att alla tester i <code>__tests__/formatName.test.js</code> går igenom."</p>
    </blockquote>
  
  Cursor:
    <ul>
      <li>Läser testfilen</li>
      <li>Skriver funktionen</li>
      <li>Försöker uppfylla kraven</li>
    </ul>
  </li>
  
  <li><strong>Kör testerna ofta</strong>
    <ul>
      <li><code>npm test</code></li>
      <li><code>pytest</code></li>
    </ul>
  
  Vid fail:
    <ul>
      <li>Kopiera fel</li>
      <li>Klistra in i chatten</li>
      <li>"Fixa detta utan att förstöra de tester som redan går igenom."</li>
    </ul>
  </li>
</ol>

<p>Det är ganska nära <em>manuellt TDD-läge</em> – tills de bygger in ett automatiskt.</p>

<h4>Gör testning till en del av reglerna</h4>

<p>I <code>.cursorrules</code> kan du skriva t.ex:</p>

<ul>
  <li>"Skapa alltid testfiler för nya moduler"</li>
  <li>"Om du ändrar en funktion med tests täckning – uppdatera/utöka testerna"</li>
  <li>"Skapa hellre för många tester än för få"</li>
</ul>

<p>Du kan också be:</p>

<blockquote>
<p>"Följ TDD: skapa testfil först, sedan implementation, uppdatera <code>docs/status.md</code> när testen är gröna."</p>
</blockquote>

<p>Då <em>tvingar</em> du AI:n att tänka i testtermer, inte bara "det compilar, ship it".</p>

<h4>Integrationstester med AI-hjälp</h4>

<p>För större flöden:</p>

<ul>
  <li>Be Cursor skriva ett litet skript som:
    <ul>
      <li>Kallar dina API-endpoints i ordning</li>
      <li>Kollar svarskoder och nyckelfält</li>
    </ul>
  </li>
  
  <li>Låt AI:n dokumentera hur du kör det i <code>README.md</code></li>
</ul>

<p>På så sätt blir det enkelt att:</p>

<ul>
  <li>Sanity-checka en staging-env</li>
  <li>Få en "rök-test" innan release</li>
</ul>

<p><strong>Slutsats här:</strong><br>
Varje ny feature = ny eller uppdaterad test.<br>
AI:n = din testslav, du = testchef.</p>

<h3>Deployment och molnexempel</h3>

<p><em>(Gör molnet, inte kaoset, till din vän)</em></p>

<p>När koden faktiskt fungerar lokalt (och testen säger "ok då") är det dags att få ut den.</p>

<h4>Containerisering (Docker)</h4>

<p>Node och Python blir mycket trevligare att deploya om du containeriserar.</p>

<p>Be Cursor:</p>

<blockquote>
<p>"Skapa en Dockerfile för det här projektet enligt <code>docs/technical.md</code> och <code>package.json</code>. Vi kör Node 20 och vill ha en prod-image."</p>
</blockquote>

<p>Exempel:</p>

<pre><code>FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]
</code></pre>

<p>Sedan:</p>

<ul>
  <li>Låt AI:n skapa <code>docker-compose.yml</code> om du vill ha:
    <ul>
      <li>App + Postgres</li>
      <li>App + Redis</li>
      <li>osv</li>
    </ul>
  </li>
</ul>

<p>Du slipper googla "dockerfile node example" för 47:e gången.</p>

<h4>Deploy till Google Cloud (Cloud Run t.ex.)</h4>

<p>Standardflöde:</p>

<ol>
  <li>Bygg image</li>
  <li>Pusha image till Container Registry / Artifact Registry</li>
  <li><code>gcloud run deploy ...</code></li>
</ol>

<p>AI:n kan:</p>

<ul>
  <li>Generera skript för build & push</li>
  <li>Skriva README-sektion "Så här deployar du till Cloud Run"</li>
  <li>Hjälpa dig att få rätt flaggor i CLI-kommandona</li>
</ul>

<p>Med MCP/verktyg integrerade kan du t.o.m. säga:</p>

<blockquote>
<p>"Deploya detta projekt till Cloud Run i region europe-north1 med min standardkonfiguration."</p>
</blockquote>

<p>…och låta AI:n sköta kommandona (med dina credentials i bakgrunden).</p>

<h4>Deploy till AWS</h4>

<p>Liknande upplägg:</p>

<ul>
  <li>AI:n hjälper dig skapa:
    <ul>
      <li>Terraform/CloudFormation</li>
      <li>GitHub Actions workflow</li>
      <li>CLI-kommandon för ECS/Fargate eller Lambda</li>
    </ul>
  </li>
</ul>

<p>Exempel-prompt:</p>

<blockquote>
<p>"Skriv ett Terraform-exempel som deployar min Docker-image till ECS Fargate, med en liten load balancer framför."</p>
</blockquote>

<p>Du får en startpunkt, du finjusterar, kör <code>terraform apply</code> och har infrastruktur utan att klicka runt i AWS-console tills du glömmer varför du loggade in.</p>

<h4>Efter deploy: testa och övervaka</h4>

<ul>
  <li>Lägg till healthchecks / smoke tests</li>
  <li>Låt AI:n skriva små skript för att:
    <ul>
      <li>Kolla <code>/health</code>-endpoint</li>
      <li>Mäta svarstid</li>
      <li>Verifiera några kritiska flöden</li>
    </ul>
  </li>
</ul>

<p>Och, viktigt:<br>
Se till att dina CI/CD-flöden kör tester <strong>innan</strong> deploy.</p>

<p>AI:n kan generera GitHub Actions / GitLab CI pipelines åt dig.</p>

<h3>Slutsats och vidare resurser</h3>

<p><em>("AI:n gör grovjobbet, du håller i ratten")</em></p>

<p>Med Cursor 2.0 kan du:</p>

<ul>
  <li>Starta nya projekt löjligt snabbt</li>
  <li>Låta AI:n skriva 70–80% av koden</li>
  <li>Lägga din egen hjärnkraft på:
    <ul>
      <li>Arkitektur</li>
      <li>Design</li>
      <li>Kvalitet</li>
      <li>Edge cases</li>
      <li>"Vad försöker vi ens bygga?"</li>
    </ul>
  </li>
</ul>

<p>Men det funkar bara bra om du:</p>

<ol>
  <li>Har <strong>struktur</strong>: mappar, regler, arkitektur.</li>
  <li>Jobbar i <strong>små iterativa steg</strong>.</li>
  <li>Låter <strong>tester</strong> vara ryggraden – inte ett dåligt samvete i slutet.</li>
  <li>Använder AI:n som <strong>senior praktikant</strong>, inte som allsmäktig gud.</li>
</ol>

<h4>Några bra tutorials att kika på</h4>

<ul>
  <li><strong>Riley Brown – "Cursor 2.0 Tutorial for Beginners (Full Course)"</strong><br>
  Steg-för-steg, bygger flera projekt, visar hela Cursor-flödet. Perfekt som "se allt i verkligheten"-video.</li>
  
  <li><strong>Volo Builds – "Cursor AI Tutorial for Beginners (2025 Edition)"</strong><br>
  Populär, pedagogisk och fokuserad på hur du jobbar med AI-flödet, prompts, struktur osv.</li>
  
  <li><strong>Tech With Tim – "Cursor Vibe Coding Tutorial (For Complete Beginners)"</strong><br>
  Lugn genomgång, särskilt bra om du vill se hur någon <em>tänker</em> när de bygger med Cursor från scratch.</li>
</ul>

<p>Och för den som vill nörda teori:</p>

<ul>
  <li><strong>"The Ultimate Guide to AI-Powered Development with Cursor" – Ravi Kiran Vemula</strong><br>
  Mycket bra om du vill förstå <em>varför</em> struktur + regler + tester gör så stor skillnad i AI-drivet kodande.</li>
</ul>

<p><strong>Kort sagt:</strong><br>
Cursor 2.0 + bra struktur + TDD =<br>
Du gör hjärnjobbet, AI:n gör muskeljobbet.<br>
Det är så det ska vara.</p>
`;

  return (
    <article className="space-y-8">
      <Seo 
        title="Cursor 2.0 Tutorial – AI‑Arne" 
        description="Lär dig strukturerad och testdriven projektutveckling med Cursor 2.0. Från första prompt till deploy med exempel för Web, Cloud och Desktop." 
      />
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
    </article>
  );
}


