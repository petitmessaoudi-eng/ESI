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
    placeholder: '# Collez votre code Python ici…\n\ndef ma_fonction(n):\n    for i in range(1, n+1):\n        print(i)',
    btn: "Générer l'Algorithme",
    desc: '⚡ Traduit votre code Python en algorithme officiel bac tunisien (Procédure/Fonction, DEBUT/FIN, @, TDNT, TDO) + implémentation Python numpy.',
    badge: 'Algorithme généré · Normes officielles Bac Tunisien 2024/2025',
    steps: ['Analyse du code Python…','Identification des modules…','Construction TDNT / TDO…','Rédaction algorithme + Python…'],
  },
  solve: {
    label: 'Énoncé du Problème',
    placeholder: 'Décrivez votre problème algorithmique ici…\n\nExemple : Écrire un programme modulaire permettant de gérer N citoyens…',
    btn: 'Résoudre le Problème',
    desc: '🧩 Résout un problème algorithmique : algorithme complet (Procédure/Fonction, DEBUT/FIN) + implémentation Python numpy.',
    badge: 'Solution générée · Normes officielles Bac Tunisien',
    steps: ['Analyse du problème…','Décomposition en modules…','Construction TDNT / TDO…','Rédaction algo + Python…'],
  },
  exam: {
    label: 'Texte de l\'Examen',
    placeholder: 'Collez ici le texte complet de votre examen bac tunisien…\n\nExercice 1 : Validité des appels...\nExercice 2 : Trace d\'algorithme...\nProblème : ...',
    btn: 'Résoudre l\'Examen',
    desc: '📄 Résout un examen complet : validité des appels (@), trace/simulation, rôle des modules, Aléa(vi,vf), algo + Python numpy.',
    badge: 'Examen résolu · Normes officielles Bac Tunisien',
    steps: ['Lecture de l\'examen…','Résolution Partie I…','Résolution Partie II…','Vérification des normes…'],
  },
  trace: {
    label: 'Algorithme ou Fonction à Tracer',
    placeholder: 'Collez ici l\'algorithme à simuler…\n\nExemple :\nFonction f1(T : Tab ; n, x : Entier) : Entier\nDEBUT\n  Cpt <- 0\n  Pour i de 1 à n Faire\n    Si T[i] = x Alors Cpt <- Cpt+1 FinSi\n  Fin Pour\n  Retourner Cpt\nFIN\n\nT=[5,6,3,3,2,8,6,2,6,3], n=10, x=6',
    btn: 'Effectuer le Tracé',
    desc: '📊 Trace manuelle avec tableau d\'évolution des variables (Cpt, i, M…) à chaque itération. Déduit le rôle du module.',
    steps: ['Initialisation des variables…','Simulation itération par itération…','Construction du tableau de trace…','Résultat final…'],
    badge: 'Tracé de simulation · Bac Tunisien',
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
from numpy import array

def est_premier(n):
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

def compter_premiers(T, n):
    cpt = 0
    for i in range(1, n+1):
        if est_premier(T[i-1]):
            cpt += 1
    return cpt

def remplir(T, n):
    for i in range(1, n+1):
        T[i-1] = random.randint(1, 100)

def afficher(T, n, nb):
    for i in range(1, n+1):
        print(T[i-1], end=" ")
    print()
    print("Nombre de premiers :", nb)

T = array([int()]*50)
n = int()

while True:
    n = int(input("Taille (5-50) : "))
    if 5 <= n <= 50:
        break
remplir(T, n)
nb = compter_premiers(T, n)
afficher(T, n, nb)`,

  solve: `Écrire un programme modulaire permettant de gérer les vaccinations de N citoyens (5 ≤ N ≤ 100).
Chaque citoyen est représenté par une chaîne de caractères de la forme :
  "CodeVaccin-NomVaccin-NombreDoses"
  Exemple : "TN12345678-Pfizer-2"

Le programme doit :
1. Saisir N avec contrôle (5 ≤ N ≤ 100)
2. Remplir le tableau T par les informations des N citoyens (avec contrôle de validité)
3. Afficher pour chaque citoyen :
   - S'il peut télécharger son passe vaccinal : si 2 doses, ou 1 dose avec vaccin Johnson
   - Sinon : lui demander de compléter son schéma vaccinal`,

  exam: `PARTIE I (8 points)

Exercice 1 (3 points) :
Soient le tableau de déclaration des objets globaux :
| Objet | Type/Nature |
|-------|-------------|
| n     | Entier      |
| y     | Réel        |

et l'en-tête de la procédure : Procédure Traitement (@ x : Réel ; a : Entier)

Compléter le tableau (Valide/Invalide + justification pour les invalides) :
1. Traitement(y, n)
2. Traitement(y, n, 2)
3. Traitement(5.5, 6)
4. Traitement(y, 3)

Exercice 2 (5 points) :
Soient : Tab = Tableau de 50 Entiers
Fonction f1(T : Tab ; n, x : Entier) : Entier qui compte les occurrences de x dans T.
T = [5, 6, 3, 3, 2, 8, 6, 2, 6, 3]  (n=10)

a. Donner f1(T, 10, 6) et f1(T, 6, 3).
b. Déduire le rôle de f1.
c. Parmi les procédures remplir suivantes, lesquelles remplissent T par des chiffres de 1 à 9 ?
   - Procédure avec T[i] <- Aléa(1, 9)
   - Procédure avec T[i] <- Aléa(1, 10)
   - Procédure avec T[i] <- Aléa(0, 9)

PARTIE II (12 points) :
Écrire un programme modulaire permettant de gérer les résultats de N élèves (5 ≤ N ≤ 50).
Chaque élève est identifié par son nom (Chaîne) et sa moyenne (Réel entre 0 et 20).
Le programme doit :
1. Saisir N avec contrôle (5 ≤ N ≤ 50)
2. Saisir les noms et moyennes avec contrôle (0 ≤ moyenne ≤ 20)
3. Afficher le meilleur élève (nom et moyenne maximale)
4. Afficher la mention de chaque élève (TB≥16, B≥14, AB≥12, P≥10, Insuffisant)`,

  trace: `Fonction f1 (T : Tab ; n, x : Entier) : Entier
DEBUT
  Cpt <- 0
  Pour i de 1 à n Faire
    Si T[i] = x Alors
      Cpt <- Cpt + 1
    FinSi
  Fin Pour
  Retourner Cpt
FIN

Tableau T : [5, 6, 3, 3, 2, 8, 6, 2, 6, 3]  (indices 1 à 10)
Appel : f1(T, 10, 6)`,

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

    // 4. Module keywords + Retourner + ALGORITHME
    html = html.replace(/\b(Retourner|RETOURNER|ALGORITHME|Algorithme)\b/g, '<span class="kw-def">$1</span>');

    // 5. Control flow — official bac tunisien syntax
    html = html.replace(/\b(Si|Alors|Sinon|FinSi|Pour|De|À|Faire|Fin\sPour|Tant\sque|Fin\sTant\sque|Répéter|Jusqu|Selon|Fin\sSelon|DEBUT|Début|FIN|Fin|Procédure|Fonction|global)\b/g,
      '<span class="kw-ctrl">$1</span>');

    // 5b. Python control flow
    html = html.replace(/\b(if|elif|else|for|while|in|range|def|return|True|False|None|and|or|not|import|from|break|global)\b/g,
      '<span class="kw-ctrl">$1</span>');

    // 6. Built-in functions (algo tunisien + Python)
    html = html.replace(/\b(Lire|Saisir|Ecrire|Ecrire_nl|Aléa|Long|Pos|ConvCh|EstNum|Ord|Chr|Ent|Arrondi|RacineCarré|Sous_cha[iî]ne|Majus|Minus|Efface|Valeur|print|input|int|float|str|len|round|abs|sqrt|randint|ord|chr|array|open|load|dump|range)\b/g,
      '<span class="kw-fn">$1</span>');

    // 7. Types (algo + Python)
    html = html.replace(/\b(Entier|Réel|Cha[iî]ne|Caract[eè]re|Bool[eé]en|Tab|Tableau|Vrai|Faux|int|float|str|bool|dict|list)\b/g,
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