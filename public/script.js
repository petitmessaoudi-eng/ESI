/* ══════════════════════════════════════════════════════
   ESI — Expert Informatique Bac Tunisien · script.js v5
   ══════════════════════════════════════════════════════ */

marked.setOptions({ breaks: true, gfm: true });

// ── State ──
let mode = 'translate';
let generating = false;
let fullMd = '';

// ── DOM ──
const $ = id => document.getElementById(id);
const inputArea    = $('inputArea');
const inputLabel   = $('inputLabel');
const lineNums     = $('lineNums');
const charCount    = $('charCount');
const btnGenerate  = $('btnGenerate');
const btnText      = $('btnText');
const btnClear     = $('btnClear');
const btnExample   = $('btnExample');
const btnCopy      = $('btnCopy');
const btnPrint     = $('btnPrint');
const statusRing   = $('statusRing');
const statusLabel  = $('statusLabel');
const modeDesc     = $('modeDesc');
const modeDescText = $('modeDescText');
const resultBadge  = $('resultBadgeText');

const stateEmpty   = $('stateEmpty');
const stateLoading = $('stateLoading');
const stateResult  = $('stateResult');
const stateError   = $('stateError');
const streamPreview= $('streamPreview');
const resultContent= $('resultContent');
const errorMsg     = $('errorMsg');
const stepsList    = $('stepsList');

const cheatPanel   = $('cheatPanel');
const cheatOverlay = $('cheatOverlay');
const cheatFabBtn  = $('cheatFabBtn');
const cheatClose   = $('cheatClose');
const fileInput    = $('fileInput');
const ocrOverlay   = $('ocrOverlay');
const ocrTitle     = $('ocrTitle');
const toastEl      = $('toast');

// ══════════════════════════════════════
// MODE CONFIGURATION
// ══════════════════════════════════════
const MODES = {
  translate: {
    label: 'Code Python',
    placeholder: '# Collez votre code Python ici…\n\ndef ma_fonction(n):\n    for i in range(n):\n        print(i)',
    btn: "Générer l'Algorithme",
    desc: '⚡ Traduit votre code Python en algorithme officiel bac tunisien avec TDO, TDNT et analyse.',
    badge: 'Algorithme généré · Normes officielles Bac Tunisien',
    steps: ['Analyse du code…','Identification des modules…','Construction des tableaux TDO…','Rédaction de l\'algorithme…'],
  },
  solve: {
    label: 'Énoncé du Problème',
    placeholder: 'Décrivez votre problème algorithmique ici…\n\nExemple : Écrire un programme modulaire permettant de gérer N employés…',
    btn: 'Résoudre le Problème',
    desc: '🧩 Résout un problème algorithmique avec analyse complète, TDNT, TDOG et algorithmes numérotés.',
    badge: 'Solution générée · Normes officielles Bac Tunisien',
    steps: ['Analyse du problème…','Décomposition en modules…','Construction des tableaux…','Rédaction des algorithmes…'],
  },
  exam: {
    label: 'Texte de l\'Examen',
    placeholder: 'Collez ici le texte complet de votre examen bac tunisien…\n\nPartie I — Exercices théoriques\nExercice 1 : ...\n\nPartie II — Algorithmique\n...',
    btn: 'Résoudre l\'Examen',
    desc: '📄 Résout un examen complet : Partie I (Pascal, types, tracé, SQL…) et Partie II (algorithmique modulaire).',
    badge: 'Examen résolu · Normes officielles Bac Tunisien',
    steps: ['Lecture de l\'examen…','Résolution Partie I…','Résolution Partie II…','Vérification des normes…'],
  },
  trace: {
    label: 'Algorithme ou Programme à Tracer',
    placeholder: 'Collez ici l\'algorithme ou le programme Pascal à simuler…\n\nIndiquez les valeurs d\'entrée si nécessaire.',
    btn: 'Effectuer le Tracé',
    desc: '📊 Effectue une trace/simulation manuelle avec tableau d\'évolution des variables étape par étape.',
    badge: 'Tracé de simulation · Bac Tunisien',
    steps: ['Initialisation des variables…','Simulation étape par étape…','Construction du tableau…','Résultat final…'],
  },
  sql: {
    label: 'Exercice SQL',
    placeholder: 'Décrivez votre exercice SQL ou collez le schéma de la base de données…\n\nExemple :\nTables : ELEVE(id, nom, moyenne), CLASSE(id, niveau)\nQuestion : Afficher les élèves avec moyenne > 14 triés par nom.',
    btn: 'Résoudre SQL',
    desc: '🗄️ Résout des exercices SQL du bac : SELECT, jointures, GROUP BY, fonctions d\'agrégat…',
    badge: 'Requêtes SQL générées · Bac Tunisien',
    steps: ['Analyse du schéma…','Décomposition des requêtes…','Rédaction SQL…','Vérification syntaxe…'],
  },
  network: {
    label: 'Question Réseaux',
    placeholder: 'Posez votre question sur les réseaux informatiques…\n\nExemple : Expliquer les couches OSI et leurs rôles.\nOu : Donner l\'adresse réseau de 192.168.1.45/26',
    btn: 'Répondre',
    desc: '🌐 Répond aux questions de réseaux : OSI, TCP/IP, adressage IP, protocoles, équipements…',
    badge: 'Réponse Réseaux · Bac Tunisien',
    steps: ['Analyse de la question…','Identification du concept…','Rédaction de la réponse…','Vérification…'],
  },
  database: {
    label: 'Exercice Bases de Données',
    placeholder: 'Décrivez votre exercice de bases de données…\n\nExemple : Donner le modèle E-A pour une bibliothèque avec Livres, Auteurs et Emprunts. Puis le modèle relationnel.',
    btn: 'Résoudre BD',
    desc: '📋 Résout des exercices de BD : modèle E-A, modèle relationnel, normalisation, SQL…',
    badge: 'Solution BD générée · Bac Tunisien',
    steps: ['Analyse du problème…','Modèle entité-association…','Modèle relationnel…','Requêtes SQL…'],
  },
  theory: {
    label: 'Concept à Expliquer',
    placeholder: 'Entrez le concept informatique à expliquer…\n\nExemples :\n- Les types scalaires énumérés en Pascal\n- La normalisation des bases de données\n- Le protocole TCP/IP\n- Les portes logiques',
    btn: 'Expliquer',
    desc: '📚 Explique un concept du programme bac avec définitions, exemples et points clés pour l\'examen.',
    badge: 'Explication générée · Programme Bac Tunisien',
    steps: ['Analyse du concept…','Recherche des définitions…','Construction des exemples…','Synthèse pour le bac…'],
  },
};

// ══════════════════════════════════════
// EXAMPLES PER MODE
// ══════════════════════════════════════
const EXAMPLES = {
  translate: `import math
import random

def est_premier(n):
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

def compter_premiers(tab, n):
    cpt = 0
    for i in range(n):
        if est_premier(tab[i]):
            cpt += 1
    return cpt

def remplir(tab, n):
    for i in range(n):
        tab[i] = random.randint(1, 100)

def afficher(tab, n, nb):
    for i in range(n):
        print(tab[i], end=" ")
    print("Nombre de premiers :", nb)

n = int(input("Taille (5-50) : "))
while n < 5 or n > 50:
    n = int(input("Taille invalide : "))
tab = [0] * n
remplir(tab, n)
nb = compter_premiers(tab, n)
afficher(tab, n, nb)`,

  solve: `Une école souhaite gérer les résultats de ses N élèves (5 ≤ N ≤ 100).
Chaque élève est identifié par son nom (chaîne) et sa moyenne générale (réel entre 0 et 20).

Écrire un programme modulaire permettant de :
1. Saisir les N noms dans un tableau NOM et les N moyennes dans un tableau MOY avec contrôle de saisie.
2. Calculer et afficher la moyenne générale de la classe.
3. Afficher le nom et la moyenne du meilleur élève.
4. Afficher pour chaque élève son nom, sa moyenne et sa mention :
   - "Très Bien" si moyenne >= 16
   - "Bien" si 14 <= moyenne < 16
   - "Assez Bien" si 12 <= moyenne < 14
   - "Passable" si 10 <= moyenne < 12
   - "Insuffisant" si moyenne < 10`,

  exam: `PARTIE I (8 points)

Exercice 1 (1.5 pts) :
Soit la fonction Pascal suivante :
Function Carre(n : integer) : integer;
Var r : integer;
  Function Double(x : integer) : integer;
  Begin Double := x * 2; End;
Begin
  r := Double(n) + n;
  Carre := r;
End;

Indiquer si l'objet r est reconnu par la fonction Double (O/N) et justifier.

Exercice 2 (3.5 pts) :
Dire si les instructions suivantes sont valides ou non (avec justification si invalide) :
Type jours = (Lun, Mar, Mer, Jeu, Ven, Sam, Dim);
Var j : jours; n : integer; b : boolean;

1. Readln(j);
2. j := Mer;
3. Writeln(j);
4. n := ord(j);
5. b := j < Sam;

Exercice 3 (3 pts) :
Tracer l'algorithme suivant pour n=4 :
0) DEF FN Factorielle(n : Entier) : Entier
1) Si (n = 0) alors Retourner 1
   Sinon Retourner n * Factorielle(n-1)
   FinSi
2) Fin Factorielle

PARTIE II (12 points)
Écrire un programme modulaire permettant de remplir un tableau T de N entiers (2 ≤ N ≤ 30) saisis dans l'ordre croissant, puis de rechercher si une valeur V donnée existe dans T par recherche dichotomique, et d'afficher le résultat.`,

  trace: `DEF FN Mystere(n : Entier) : Entier
  Var r, i : Entier
0) Début
1)   r <- 1
     Pour i de 1 à n faire
       r <- r * i
     Fin pour
2)   Retourner r
3) Fin Mystere

Tracer pour n = 5`,

  sql: `Base de données d'une bibliothèque :
- LIVRE(id_livre, titre, annee, id_auteur#)
- AUTEUR(id_auteur, nom, prenom, nationalite)
- EMPRUNT(id_emprunt, id_livre#, id_adherent#, date_emprunt, date_retour)
- ADHERENT(id_adherent, nom, prenom, email)

Questions :
1. Afficher le titre et l'année de tous les livres publiés après 2000, triés par année décroissante.
2. Afficher le nombre de livres par auteur (nom de l'auteur et nombre de livres).
3. Afficher les adhérents qui n'ont jamais emprunté de livre.
4. Afficher le titre des livres actuellement empruntés (date_retour IS NULL).`,

  network: `Questions sur les réseaux informatiques :

1. Donner les 7 couches du modèle OSI avec leurs rôles principaux.
2. Quelle est la différence entre un hub et un switch ?
3. Pour l'adresse IP 172.16.45.200 avec le masque 255.255.240.0 :
   a. Déterminer la classe de cette adresse.
   b. Calculer l'adresse réseau.
   c. Calculer l'adresse de diffusion (broadcast).
4. Expliquer le rôle du protocole DNS.`,

  database: `Système de gestion d'une école :
Une école a des élèves, des professeurs et des matières.
- Chaque élève appartient à une seule classe.
- Chaque professeur peut enseigner plusieurs matières.
- Chaque matière peut être enseignée par plusieurs professeurs.
- Chaque élève a une note par matière.

1. Construire le modèle Entité-Association.
2. Déduire le modèle relationnel (indiquer les clés primaires et étrangères).
3. Écrire en SQL :
   a. Afficher les élèves avec leur moyenne générale.
   b. Afficher les matières dont la moyenne de la classe est inférieure à 10.`,

  theory: `Les types scalaires énumérés en Pascal`,
};

// ══════════════════════════════════════
// MODE SWITCH
// ══════════════════════════════════════
function switchMode(m) {
  mode = m;
  const cfg = MODES[m];

  // Update tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === m);
  });

  // Update UI
  inputLabel.textContent = cfg.label;
  inputArea.placeholder  = cfg.placeholder;
  btnText.textContent    = cfg.btn;
  modeDescText.textContent = cfg.desc;

  showState('empty');
  inputArea.value = '';
  updateLineNums();
  updateCharCount();
}

document.querySelectorAll('.tab[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

// ══════════════════════════════════════
// EDITOR
// ══════════════════════════════════════
function updateLineNums() {
  const lines = inputArea.value.split('\n');
  lineNums.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  lineNums.scrollTop = inputArea.scrollTop;
}
function updateCharCount() {
  const n = inputArea.value.length;
  charCount.textContent = `${n} car.`;
}

inputArea.addEventListener('input', () => { updateLineNums(); updateCharCount(); });
inputArea.addEventListener('scroll', () => { lineNums.scrollTop = inputArea.scrollTop; });
inputArea.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = inputArea.selectionStart, en = inputArea.selectionEnd;
    inputArea.value = inputArea.value.slice(0, s) + '    ' + inputArea.value.slice(en);
    inputArea.selectionStart = inputArea.selectionEnd = s + 4;
    updateLineNums();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!generating) generate();
  }
});

btnClear.addEventListener('click', () => {
  inputArea.value = ''; updateLineNums(); updateCharCount();
  showState('empty'); inputArea.focus();
});
btnExample.addEventListener('click', () => {
  inputArea.value = EXAMPLES[mode] || EXAMPLES.solve;
  updateLineNums(); updateCharCount();
  toast('Exemple chargé !', 'ok');
  inputArea.focus();
});

// ══════════════════════════════════════
// STATE MANAGEMENT
// ══════════════════════════════════════
function showState(s) {
  stateEmpty.hidden   = s !== 'empty';
  stateLoading.hidden = s !== 'loading';
  stateResult.hidden  = s !== 'result';
  stateError.hidden   = s !== 'error';
}

// ══════════════════════════════════════
// LOADING STEPS
// ══════════════════════════════════════
let stepTimer = null;
let stepIdx = 0;
let stepEls = [];

function startSteps() {
  const cfg = MODES[mode];
  const stepsData = cfg.steps || ['Analyse…','Traitement…','Génération…','Finalisation…'];

  stepsList.innerHTML = stepsData.map((s, i) =>
    `<div class="step${i===0?' active':''}" id="st${i}"><div class="step-dot"></div><span>${s}</span></div>`
  ).join('');

  stepEls = stepsData.map((_, i) => $(`st${i}`));
  stepIdx = 0;
  streamPreview.textContent = '';

  stepTimer = setInterval(() => {
    if (stepIdx < stepEls.length - 1) {
      stepEls[stepIdx].classList.remove('active');
      stepEls[stepIdx].classList.add('done');
      stepIdx++;
      stepEls[stepIdx].classList.add('active');
    }
  }, 2200);
}

function stopSteps() {
  clearInterval(stepTimer);
  stepEls.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
}

// ══════════════════════════════════════
// GENERATE
// ══════════════════════════════════════
async function generate() {
  const input = inputArea.value.trim();
  if (!input) { toast('Veuillez entrer du contenu.', 'err'); inputArea.focus(); return; }

  generating = true; fullMd = '';
  btnGenerate.disabled = true;
  btnGenerate.classList.add('loading');
  btnText.textContent = 'Génération…';
  showState('loading');
  startSteps();

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, input })
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.error || `Erreur ${res.status}`); }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let hasContent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        let parsed;
        try { parsed = JSON.parse(raw); } catch { continue; }
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.done) break;
        if (parsed.text) {
          fullMd += parsed.text;
          hasContent = true;
          streamPreview.textContent = fullMd.slice(-1400);
          streamPreview.scrollTop = streamPreview.scrollHeight;
        }
      }
    }

    if (!hasContent) throw new Error('Aucune réponse reçue.');
    stopSteps();
    resultBadge.textContent = MODES[mode]?.badge || 'Réponse générée · Bac Tunisien';
    renderResult(fullMd);
    showState('result');

  } catch (err) {
    stopSteps();
    errorMsg.textContent = err.message;
    showState('error');
    toast('Erreur : ' + err.message.slice(0, 60), 'err');
  } finally {
    generating = false;
    btnGenerate.disabled = false;
    btnGenerate.classList.remove('loading');
    btnText.textContent = MODES[mode]?.btn || 'Générer';
  }
}

btnGenerate.addEventListener('click', generate);

// ══════════════════════════════════════
// RENDER MARKDOWN + SYNTAX HIGHLIGHT
// ══════════════════════════════════════
function renderResult(md) {
  resultContent.innerHTML = marked.parse(md);
  resultContent.style.animation = 'none';
  requestAnimationFrame(() => {
    resultContent.style.animation = 'fadeIn 0.4s ease forwards';
  });

  resultContent.querySelectorAll('pre code').forEach(block => {
    let html = block.innerHTML;

    // 1. Strings
    html = html.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="kw-str">$1</span>');

    // 2. Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="kw-num">$1</span>');

    // 3. Assignment arrow
    html = html.replace(/(&lt;-)/g, '<span class="kw-assign">$1</span>');

    // 4. DEF keywords + Retourner
    html = html.replace(/\b(DEF FN|DEF PROC|Retourner|RETOURNER)\b/g, '<span class="kw-def">$1</span>');

    // 5. Control flow + var
    html = html.replace(/\b(Si|SI|Alors|ALORS|Sinon|SINON|FinSi|FIN SI|Pour|POUR|De|DE|À|Faire|FAIRE|Fin pour|FIN POUR|Tant que|TANT QUE|Fin Tant que|FIN TANT QUE|Répéter|RÉPÉTER|Jusqu|JUSQU|Selon|SELON|FinSelon|Début|Fin|DEBUT|FIN|Proc|var)\b/g,
      '<span class="kw-ctrl">$1</span>');

    // 6. Built-in functions
    html = html.replace(/\b(Lire|Saisir|Ecrire|Aléa|Long|Pos|ConvCh|EstNum|Ord|Chr|Ent|Arrondi|RacineCarré|Sous_cha[iî]ne|Majus|Minus|Efface|Valeur|Insère)\b/g,
      '<span class="kw-fn">$1</span>');

    // 7. Types
    html = html.replace(/\b(Entier|Réel|Cha[iî]ne|Caract[eè]re|Bool[eé]en|Tab|Tableau|Tabd|Tabr|Vrai|Faux)\b/g,
      '<span class="kw-type">$1</span>');

    // 8. Operators
    html = html.replace(/\b(ET|OU|NON|MOD|DIV|AND|OR|NOT)\b/g, '<span class="kw-op">$1</span>');

    // 9. SQL keywords
    html = html.replace(/\b(SELECT|FROM|WHERE|ORDER BY|GROUP BY|HAVING|JOIN|ON|INSERT|UPDATE|DELETE|DISTINCT|INTO|VALUES|SET|AS|COUNT|SUM|AVG|MAX|MIN|AND|OR|NOT|IN|BETWEEN|LIKE|IS NULL|IS NOT NULL|ASC|DESC|INNER|LEFT|RIGHT|OUTER|CREATE|TABLE|PRIMARY KEY|FOREIGN KEY|REFERENCES)\b/g,
      '<span class="kw-sql">$1</span>');

    block.innerHTML = html;
  });
}

// ══════════════════════════════════════
// COPY & PRINT
// ══════════════════════════════════════
btnCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(fullMd);
    toast('Copié dans le presse-papiers !', 'ok');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = fullMd; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Copié !', 'ok');
  }
});

btnPrint.addEventListener('click', () => window.print());

// ══════════════════════════════════════
// FILE UPLOAD — OCR
// ══════════════════════════════════════
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  fileInput.value = '';

  ocrTitle.textContent = file.type === 'application/pdf' ? 'Analyse du PDF…' : 'Analyse de l\'image…';
  ocrOverlay.hidden = false;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/ocr', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok || data.error) throw new Error(data.error || `Erreur ${res.status}`);
    if (!data.text?.trim()) throw new Error('Aucun texte extrait.');

    inputArea.value = data.text.trim();
    updateLineNums(); updateCharCount();
    showState('empty');

    const confMsg = data.confidence !== null
      ? ` · Confiance : ${data.confidence}%${data.confidence < 70 ? ' ⚠' : ''}`
      : '';
    toast(`✓ Texte extrait (${data.text.trim().length} car.)${confMsg}`,
          data.confidence < 70 ? '' : 'ok');
    inputArea.focus();

  } catch (err) {
    toast('Erreur OCR : ' + err.message.slice(0, 80), 'err');
  } finally {
    ocrOverlay.hidden = true;
  }
});

// ══════════════════════════════════════
// CHEATSHEET — with tabs
// ══════════════════════════════════════
function openCheat()  { cheatPanel.classList.add('open'); cheatOverlay.classList.add('open'); }
function closeCheat() { cheatPanel.classList.remove('open'); cheatOverlay.classList.remove('open'); }

cheatFabBtn.addEventListener('click', openCheat);
cheatClose.addEventListener('click', closeCheat);
cheatOverlay.addEventListener('click', closeCheat);

document.querySelectorAll('.cheat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cheat-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.cheat-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    $(`csec-${tab.dataset.section}`)?.classList.add('active');
  });
});

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════
let toastTimer = null;
function toast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

// ══════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════
async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    const d = await r.json();
    if (d.hasApiKey) {
      statusRing.classList.add('online');
      statusLabel.textContent = `Groq · Llama 3.3`;
    } else {
      statusRing.classList.add('error');
      statusLabel.textContent = 'Clé API manquante';
      toast('⚠ Configurez GROQ_API_KEY dans .env', 'err');
    }
  } catch {
    statusRing.classList.add('error');
    statusLabel.textContent = 'Hors ligne';
  }
}

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
updateLineNums();
updateCharCount();
checkHealth();

console.log('%cESI v5 — Expert Informatique Bac Tunisien', 'color:#4f8ef7;font-size:15px;font-weight:700');