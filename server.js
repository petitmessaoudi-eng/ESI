require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");
const { fromBuffer } = require("pdf2pic");
const Tesseract = require("tesseract.js");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format non supporté."));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN GUARD
// ─────────────────────────────────────────────────────────────────────────────
const DOMAIN_GUARD = `
RÈGLE ABSOLUE : Tu réponds UNIQUEMENT aux questions d'Informatique du Baccalauréat Tunisien.
Si hors domaine, réponds : "⚠️ Je suis spécialisé uniquement dans l'informatique du Baccalauréat Tunisien."
`;

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM INSTRUCTION COMPLÈTE
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `
Tu es l'Expert Système Informatique (ESI) du programme tunisien du Baccalauréat.
Tu maîtrises parfaitement les normes académiques officielles pour les sections
Mathématiques, Sciences Expérimentales et Sciences Techniques.

════════════════════════════════════════════════════
SYNTAXE ALGORITHMIQUE — NORME OFFICIELLE BAC TUNISIEN
════════════════════════════════════════════════════

AFFECTATION : "<-" UNIQUEMENT. COMPARAISON : "=" (JAMAIS "<-" dans une condition).
ENTRÉES/SORTIES : Lire(X), Saisir(X), Ecrire("msg", X)
OPÉRATEURS : +, -, *, /, MOD, DIV, ET, OU, NON, =, <>, >, <, <=, >=
TYPES : Entier, Réel, Chaîne, Caractère, Booléen
BOOLÉENS : Vrai / Faux (pas True/False)
RETOUR FONCTION : Retourner valeur (pas return)

STRUCTURES :
  Si (cond) alors ... Sinon ... FinSi
  Pour i de x à y faire ... Fin pour
  Tant que (cond) faire ... Fin Tant que
  Répéter ... Jusqu'à (cond)
  Selon var faire ... FinSelon

════════════════════════════════════════════════════
EN-TÊTES DES MODULES
════════════════════════════════════════════════════

PROCÉDURE :  DEF PROC NomProc (paramètres)
FONCTION  :  DEF FN NomFonc (paramètres) : TypeRetour

Passage par valeur (lecture seule) : sans "var"
Passage par référence (modifié) : avec "var"

Exemples :
  DEF PROC Saisie (var Nb : Entier ; var T : Tabd)
  DEF PROC Afficher (Nb : Entier ; T : Tabr)
  DEF FN Somme (T : Tab ; n : Entier) : Entier
  DEF PROC Fusion (N, M : Entier ; V1, V2 : Tabd ; var K : Entier ; var V3 : Tabr)

════════════════════════════════════════════════════
STRUCTURE DES ALGORITHMES — NUMÉROTATION OFFICIELLE
════════════════════════════════════════════════════

0) = en-tête DEF PROC/DEF FN ou "Début NomProgramme"
1), 2), 3)... = instructions principales
Dernière ligne numérotée = "Fin NomModule" ou "Fin NomProgramme"

Exemple PP :
0) Début Distinct
1)   Proc Saisie (N, V1)
2)   Proc Saisie (M, V2)
3)   Proc Fusion (N, M, V1, V2, K, V3)
4)   Proc Afficher (K, V3)
5) Fin Distinct

Exemple Procédure :
0) DEF PROC Afficher (Nb : Entier ; T : Tabr)
1)   Pour i de 1 à Nb faire
       Ecrire (T[i])
     Fin pour
2) Fin Afficher

════════════════════════════════════════════════════
TABLEAUX DE DÉCLARATION
════════════════════════════════════════════════════

TDNT — une seule colonne :
| Type                           |
|--------------------------------|
| Tabd = Tableau de 20 Entiers   |

TDO (TDOG / TDOL) — 3 colonnes Nom | Type | Rôle :
| Nom      | Type      | Rôle                               |
|----------|-----------|------------------------------------|
| K        | Entier    | Longueur du tableau final V3       |
| Afficher | Procédure | Affiche le tableau final           |

ANALYSE — tableau S | L.D.E. | O.U. :
| S | L.D.E.                    | O.U. |
|---|---------------------------|------|
| 1 | Résultat = Nb, T          |      |
| 2 | Nb = [validation 2..20]   | i    |
| 3 | Fin Saisie                |      |

════════════════════════════════════════════════════
DICTIONNAIRE PYTHON → ALGORITHME
════════════════════════════════════════════════════
  int(x)              -> Ent(X)
  round(x)            -> Arrondi(X)
  math.sqrt(x)        -> RacineCarré(X)
  random.randint(a,b) -> Aléa(a, b)
  ord(x)/chr(x)       -> Ord(X)/Chr(X)
  len(ch)             -> Long(Ch)
  ch2.find(ch1)       -> Pos(Ch1, Ch2)
  str(nb)             -> ConvCh(Nb)
  ch.isnumeric()      -> EstNum(Ch)
  ch[a:b]             -> Sous_chaîne(Ch, a, n)
  ch.upper()/lower()  -> Majus(Ch)/Minus(Ch)
  print(x)            -> Ecrire(X)
  input(msg)          -> Ecrire(msg) puis Lire(variable)

════════════════════════════════════════════════════
SQL — BAC TUNISIEN
════════════════════════════════════════════════════
  SELECT [DISTINCT] col FROM table [WHERE cond] [ORDER BY col] [GROUP BY col] [HAVING cond]
  Fonctions : COUNT(*), SUM(), AVG(), MAX(), MIN()
  Jointure : table1.col = table2.col dans WHERE
  Opérateurs : AND, OR, NOT, IN, BETWEEN, LIKE, IS NULL

════════════════════════════════════════════════════
RÉSEAUX — BAC TUNISIEN
════════════════════════════════════════════════════
  Modèle OSI 7 couches, TCP/IP 4 couches
  Adressage IP : classes A/B/C, masque, passerelle, CIDR
  Protocoles : HTTP/S, FTP, SMTP, POP3, DNS, DHCP, TCP, UDP
  Topologies : étoile, bus, anneau, maillée
  Équipements : hub, switch, routeur, pont, répéteur, pare-feu

════════════════════════════════════════════════════
BASES DE DONNÉES — BAC TUNISIEN
════════════════════════════════════════════════════
  Modèle E-A : entités, attributs, associations, cardinalités (1-1, 1-N, N-N)
  Modèle Relationnel : tables, clés primaires (souligné), clés étrangères (#)
  Dépendances fonctionnelles, normalisation 1NF/2NF/3NF
  Algèbre relationnelle : σ (sélection), π (projection), ⋈ (jointure)

════════════════════════════════════════════════════
ARCHITECTURE — BAC TUNISIEN
════════════════════════════════════════════════════
  Von Neumann : UC (UAL + UC), mémoire, E/S
  Bases numériques : binaire, octal, hexadécimal, conversions, complément à 2
  Portes logiques : ET, OU, NON, NAND, NOR, XOR — tables de vérité
  Circuits : additionneur, multiplexeur, décodeur, bascules

════════════════════════════════════════════════════
PASCAL — BAC TUNISIEN (Partie I théorique)
════════════════════════════════════════════════════
  Portée des variables : variable locale reconnue par son module et ses sous-modules
  Types scalaires énumérés : pas de Readln/Writeln, ord() retourne l'indice
  Chaînes : Copy(ch,pos,nb), Length(ch), Pos(ch1,ch2), Delete, Insert
  Pointeurs, enregistrements (Record), fichiers (File of)
`;

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildTranslationPrompt(code) {
  return `${DOMAIN_GUARD}
MODE TRADUCTION — Python → Algorithme Baccalauréat Tunisien

Traduis ce code Python en algorithme COMPLET.
Ordre : Analyse PP (tableau S/L.D.E./O.U.) → TDNT → TDOG → [pour chaque module : Analyse + TDOL + Algorithme numéroté] → Algorithme PP numéroté.

\`\`\`python
${code}
\`\`\``;
}

function buildProblemPrompt(text) {
  return `${DOMAIN_GUARD}
MODE RÉSOLUTION — Problème Algorithmique

Solution modulaire COMPLÈTE :
Analyse PP (tableau S/L.D.E./O.U.) → TDNT → TDOG → [pour chaque module : Analyse + TDOL + Algorithme numéroté] → Algorithme PP numéroté.

Énoncé :
${text}`;
}

function buildExamPrompt(text) {
  return `${DOMAIN_GUARD}
MODE EXAMEN COMPLET — Baccalauréat Tunisien Informatique

Résous cet examen COMPLET. Réponds à chaque partie, exercice et question dans l'ordre.

PARTIE I — Questions théoriques :
• Portée des variables Pascal → tableaux O/N avec justification
• Types scalaires → Valide/Non valide + justification pour les invalides
• Traçage/simulation → tableau de simulation variable par variable
• Fonctions Pascal → compléter types, donner résultats, identifier fonctions prédéfinies
• SQL → requêtes complètes avec explication
• Réseaux → réponses précises avec protocoles/couches
• Bases de données → schémas, dépendances, normalisation, SQL
• Architecture → conversions, tables de vérité, circuits

PARTIE II — Algorithmique :
Analyse PP (S/L.D.E./O.U.) → TDNT → TDOG → [chaque module : Analyse + TDOL + Algo numéroté] → Algo PP.

Examen à résoudre :
${text}`;
}

function buildTheoryPrompt(topic) {
  return `${DOMAIN_GUARD}
MODE THÉORIE — Informatique Bac Tunisien

Explique le concept suivant pour le programme tunisien du bac :
"${topic}"

## Définition
## Exemples concrets
## Points importants pour l'examen
## Exemple type bac`;
}

function buildSQLPrompt(text) {
  return `${DOMAIN_GUARD}
MODE SQL — Baccalauréat Tunisien

Résous cet exercice SQL. Pour chaque requête, explique la logique.
Utilise la syntaxe SQL standard du programme tunisien.

${text}`;
}

function buildTracePrompt(text) {
  return `${DOMAIN_GUARD}
MODE TRACÉ/SIMULATION

Effectue une trace manuelle de cet algorithme/programme Pascal.
Présente un tableau de simulation avec l'évolution de chaque variable à chaque étape.

| Étape | Var1 | Var2 | ... | Sortie |
|-------|------|------|-----|--------|

Conclus par la valeur finale retournée ou affichée.

${text}`;
}

function buildNetworkPrompt(text) {
  return `${DOMAIN_GUARD}
MODE RÉSEAUX — Baccalauréat Tunisien

Réponds à cette question de réseaux informatiques du bac tunisien.
Sois précis sur les protocoles, couches OSI/TCP-IP, adressage IP.

${text}`;
}

function buildDBPrompt(text) {
  return `${DOMAIN_GUARD}
MODE BASES DE DONNÉES — Baccalauréat Tunisien

Résous cet exercice de bases de données.
Couvre : modèle E-A, modèle relationnel, dépendances fonctionnelles, normalisation, SQL.

${text}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR
// ─────────────────────────────────────────────────────────────────────────────
async function preprocessImage(buffer) {
  return sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .grayscale().normalise()
    .sharpen({ sigma: 1.5, m1: 0.5, m2: 3 })
    .linear(1.3, -30).threshold(140).png().toBuffer();
}

async function ocrImage(buffer) {
  let processed;
  try { processed = await preprocessImage(buffer); } catch { processed = buffer; }
  const { data: { text, confidence } } = await Tesseract.recognize(processed, "fra+eng", {
    logger: m => { if (m.status==="recognizing text") process.stdout.write(`\r  OCR: ${Math.round(m.progress*100)}%`); },
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
    preserve_interword_spaces: "1",
  });
  return { text: text.trim(), confidence: Math.round(confidence) };
}

async function extractTextFromPDF(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  const convert = fromBuffer(pdfBuffer, { density: 220, format: "png", width: 1800, height: 2400 });
  let fullText = "";
  for (let i = 1; i <= pageCount; i++) {
    try {
      const result = await convert(i, { responseType: "buffer" });
      const buf = result.buffer || Buffer.from(result.base64 || "", "base64");
      const { text } = await ocrImage(buf);
      fullText += `\n--- Page ${i} ---\n${text}\n`;
    } catch (err) { fullText += `\n--- Page ${i} --- [Erreur: ${err.message}]\n`; }
  }
  return fullText.trim();
}

app.post("/api/ocr", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });
  try {
    let text = "", confidence = null;
    if (req.file.mimetype === "application/pdf") {
      text = await extractTextFromPDF(req.file.buffer);
    } else {
      const r = await ocrImage(req.file.buffer);
      text = r.text; confidence = r.confidence;
    }
    if (!text.trim()) return res.status(422).json({ error: "Aucun texte détecté." });
    res.json({ text, confidence });
  } catch (err) { res.status(500).json({ error: "Erreur OCR : " + err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE PRINCIPALE — Streaming
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  const { mode, input } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: "Entrée vide." });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY manquant." });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const prompts = {
    translate: buildTranslationPrompt,
    exam:      buildExamPrompt,
    theory:    buildTheoryPrompt,
    sql:       buildSQLPrompt,
    trace:     buildTracePrompt,
    network:   buildNetworkPrompt,
    database:  buildDBPrompt,
  };
  const builder = prompts[mode] || buildProblemPrompt;
  const prompt = builder(input);
  const temp = mode === "exam" ? 0.1 : 0.2;

  const MODELS = ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama3-8b-8192"];

  for (const model of MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model, max_tokens: 8000, temperature: temp, stream: true,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user",   content: prompt },
        ],
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end(); return;
    } catch (err) {
      const s = err.status || err.statusCode;
      if (s === 429 || s === 503) continue;
      if (s === 401) { res.write(`data: ${JSON.stringify({ error: "Clé API invalide." })}\n\n`); res.end(); return; }
      continue;
    }
  }
  res.write(`data: ${JSON.stringify({ error: "Tous les modèles indisponibles." })}\n\n`);
  res.end();
});

app.get("/api/health", (req, res) => res.json({
  status: "ok", provider: "Groq", hasApiKey: !!process.env.GROQ_API_KEY,
  modes: ["translate","solve","exam","theory","sql","trace","network","database"],
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🎓 ESI → http://localhost:${PORT}\n`));