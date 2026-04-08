// ── Phoneme-aware word lists for consistent reading transitions ──
//
// Every word decomposes into exactly 3 phonemes: onset, vowel, coda.
// Two words can chain only if they share the same number of phonemes
// AND differ in exactly one phoneme position.
//
// Words removed from Level 1 (not standard CVC, or inconsistent phonemes):
//   Non-CVC: ant, ape, arm, art, ash, axe, egg, elf, elm, end, eve, ill, ink,
//            old, ore, owl, own
//   Inconsistent vowel: put (u=/ʊ/), son (o=/ʌ/)
//   Isolated clusters (can't connect to main graph):
//     ay-words: bay, hay, lay, ray  |  aw-words: law, paw, saw
//     ar-words: jar, tar, war       |  others: joy, row, yew
//   x=/ks/ (two sounds): fix, six, wax

const REMOVED = new Set([
  'ant','ape','arm','art','ash','axe','bay','egg','elf','elm','end','eve',
  'fix','hay','ill','ink','jar','joy','law','lay','old','ore','owl','own',
  'paw','put','ray','row','saw','six','son','tar','war','wax','yew',
]);

// Original CVC word pool
const ALL_CVC = [
  "ant","ape","arm","art","ash","axe",
  "bad","bag","ban","bat","bay","bed","big","bit","bud","bug","bun","bus","but",
  "cab","can","cap","cat","cod","cog","cop","cub","cup","cut",
  "dab","dam","dig","dim","dip","dog","dot","dug","dun",
  "egg","elf","elm","end","eve",
  "fan","fat","fed","fig","fit","fix","fog","fun",
  "gab","gal","gap","gas","get","got","gum","gun","gut",
  "had","ham","hat","hay","hen","him","hip","hit","hop","hot","hub","hug","hum","hut",
  "ill","ink",
  "jam","jar","jet","jig","job","jog","jot","joy","jug","jut",
  "keg","kin","kit",
  "lad","lag","lap","law","lay","led","leg","let","lid","lip","lit","log","lot","lug",
  "mad","man","map","mat","men","mob","mop","mud","mug",
  "nab","nag","nap","net","nip","nod","nut",
  "old","ore","owl","own",
  "pad","pan","pat","paw","peg","pet","pig","pin","pit","pod","pop","pot","pub","pun","put",
  "rag","ram","ran","rap","rat","ray","red","rib","rim","rip","rob","rod","rot","row","rub","rug","run","rut",
  "sag","sap","sat","saw","set","sip","sit","six","sob","sod","son","sub","sum","sun",
  "tab","tan","tap","tar","tin","tip","top","tub","tug",
  "van","vet",
  "war","wax","web","wet","wig","win","wit",
  "yam","yap","yew",
  "zap","zip",
];

// Level 1: clean CVC words with consistent phonemes
export const LEVEL1_WORDS = [...new Set(ALL_CVC.filter(w => !REMOVED.has(w)))];

// Level 2 additions: words with ch, sh, th digraphs
const DIGRAPH_WORDS = [
  // ch- onset
  'chap','chat','chin','chip','chop','chub','chug','chum',
  // sh- onset
  'shag','shed','shin','ship','shop','shot','shun','shut',
  // th- onset
  'than','that','them','then','thin','thud','thug',
  // -ch coda
  'much','such','rich',
  // -sh coda
  'bash','cash','dash','dish','fish','gash','gush','hash','hush',
  'lash','lush','mash','mesh','mush','rash','rush','wish',
  // -th coda
  'bath','math','moth','path','with',
];

// Level 2: CVC + digraph words
export const LEVEL2_WORDS = [...new Set([...LEVEL1_WORDS, ...DIGRAPH_WORDS])];

// ── Phoneme decomposition ──

const DIGRAPHS = ['ch', 'sh', 'th'];

/**
 * Decompose a word into 3 phonemes: [onset, vowel, coda].
 * For 3-letter CVC: each letter is a phoneme.
 * For 4-letter words: one position is a digraph (ch/sh/th).
 */
export function getPhonemes(word: string): [string, string, string] {
  if (word.length === 4) {
    const startDg = DIGRAPHS.find(d => word.startsWith(d));
    if (startDg) return [startDg, word[2], word[3]];

    const endDg = DIGRAPHS.find(d => word.endsWith(d));
    if (endDg) return [word[0], word[1], endDg];
  }

  // Standard 3-letter CVC
  return [word[0], word[1], word[2]];
}

/**
 * Get the letter index ranges for each phoneme position.
 * Used to highlight the changed letters in the UI.
 */
export function getLetterRanges(word: string): [number[], number[], number[]] {
  if (word.length === 4) {
    const startDg = DIGRAPHS.find(d => word.startsWith(d));
    if (startDg) return [[0, 1], [2], [3]];

    const endDg = DIGRAPHS.find(d => word.endsWith(d));
    if (endDg) return [[0], [1], [2, 3]];
  }

  return [[0], [1], [2]];
}

/**
 * Check if two words differ in exactly one phoneme position.
 */
export function phonemesMatch(a: string, b: string): boolean {
  const pa = getPhonemes(a);
  const pb = getPhonemes(b);
  let diffs = 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) diffs++;
  }
  return diffs === 1;
}

/**
 * Get the set of letter indices that changed between two words.
 */
export function getChangedLetters(prev: string, curr: string): Set<number> {
  const prevP = getPhonemes(prev);
  const currP = getPhonemes(curr);
  const ranges = getLetterRanges(curr);

  const changed = new Set<number>();
  for (let i = 0; i < 3; i++) {
    if (prevP[i] !== currP[i]) {
      for (const idx of ranges[i]) {
        changed.add(idx);
      }
    }
  }
  return changed;
}

// ── Pre-built adjacency graphs ──

function buildGraph(words: string[]): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  words.forEach(w => { adj[w] = []; });
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if (phonemesMatch(words[i], words[j])) {
        adj[words[i]].push(words[j]);
        adj[words[j]].push(words[i]);
      }
    }
  }
  return adj;
}

export const LEVEL1_ADJ = buildGraph(LEVEL1_WORDS);
export const LEVEL2_ADJ = buildGraph(LEVEL2_WORDS);
