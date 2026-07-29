'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Flame, RotateCcw, CheckCircle2, XCircle, Clock, Zap, Award } from 'lucide-react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Category   = 'math' | 'seq' | 'verbal' | 'logic' | 'code';
interface QItem  { q: string; a: string; options: string[]; explanation: string; }

const rand  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick  = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ─── PROCEDURAL SPEED MATH GENERATOR ──────────────────────────────────────────
function genMath(diff: Difficulty): QItem {
  const m = diff === 'Easy' ? 1 : diff === 'Medium' ? 2 : 3;
  const types = ['arith','percent','profit','ratio','interest','work','speed','average','algebra'];
  const type  = pick(types);
  let q = '', a = 0, explanation = '';

  if (type === 'arith') {
    const op = pick(['+', '-', '×']);
    const n1 = rand(12 * m, 60 * m), n2 = rand(3, 25 * m);
    if (op === '+')  { a = n1 + n2; }
    else if (op === '-') { a = n1 - n2; }
    else { a = n1 * n2; }
    q = `${n1} ${op} ${n2} = ?`;
    explanation = `${n1} ${op} ${n2} = ${a}`;
  } else if (type === 'percent') {
    const pct = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]); 
    const val = rand(2, 25) * 20 * m;
    a = (pct * val) / 100;
    q = `Calculate ${pct}% of ${val}`;
    explanation = `(${pct} / 100) × ${val} = ${a}`;
  } else if (type === 'profit') {
    const cp = rand(5, 25) * 10 * m;
    const pctP = pick([10, 15, 20, 25, 30, 40, 50]);
    const sp = cp + (cp * pctP) / 100;
    a = pctP;
    q = `A product bought for ₹${cp} is sold for ₹${sp}. What is the profit percentage?`;
    explanation = `Profit = SP - CP = ₹${sp - cp}. Profit% = (${sp - cp}/${cp}) × 100 = ${pctP}%`;
  } else if (type === 'ratio') {
    const r1 = rand(2, 5), r2 = rand(3, 7);
    const units = rand(3, 8) * m;
    const total = (r1 + r2) * units;
    a = r1 * units;
    q = `A and B share money in ratio ${r1}:${r2}. If total amount is ₹${total}, find A's share.`;
    explanation = `Total parts = ${r1 + r2}. 1 part = ${total}/${r1 + r2} = ${units}. A = ${r1} × ${units} = ₹${a}`;
  } else if (type === 'interest') {
    const p = rand(5, 25) * 100 * m;
    const r = pick([4, 5, 6, 8, 10, 12]);
    const t = rand(2, 5);
    a = (p * r * t) / 100;
    q = `Find Simple Interest on ₹${p} at ${r}% per annum for ${t} years.`;
    explanation = `SI = (P × R × T) / 100 = (${p} × ${r} × ${t}) / 100 = ₹${a}`;
  } else if (type === 'work') {
    const d1 = rand(4, 8) * m, d2 = rand(6, 12) * m;
    a = Math.round((d1 * d2) / (d1 + d2) * 10) / 10;
    q = `Worker A takes ${d1} days and B takes ${d2} days to complete a job. Working together, how many days will it take? (round to 1 decimal)`;
    explanation = `Combined rate = 1/${d1} + 1/${d2} = (${d1}+${d2})/(${d1}×${d2}). Time = (${d1}×${d2})/(${d1}+${d2}) ≈ ${a} days`;
  } else if (type === 'speed') {
    const spd = pick([40, 50, 60, 72, 80, 90, 100, 120]);
    const t = rand(2, 6);
    a = spd * t;
    q = `A car travels at a constant speed of ${spd} km/h for ${t} hours. Total distance covered?`;
    explanation = `Distance = Speed × Time = ${spd} × ${t} = ${a} km`;
  } else if (type === 'algebra') {
    const x = rand(2, 12) * m;
    const k = rand(3, 9);
    const val = k * x + rand(1, 15);
    const b = val - k * x;
    a = x;
    q = `Solve for x: ${k}x + ${b} = ${val}`;
    explanation = `${k}x = ${val} - ${b} = ${k * x} → x = ${x}`;
  } else {
    const nums = Array.from({ length: 4 + m }, () => rand(12, 50 * m));
    a = Math.round(nums.reduce((x, y) => x + y, 0) / nums.length);
    q = `Find the arithmetic average of: ${nums.join(', ')}`;
    explanation = `Sum = ${nums.reduce((x,y)=>x+y,0)}, Count = ${nums.length}. Average ≈ ${a}`;
  }

  const wrong = Array.from(new Set([a + rand(1,15)*m, a - rand(1,10)*m, a + rand(12,25)*m]))
    .map(v => Math.max(0, Math.round(v)))
    .filter(v => v !== a);
  
  while (wrong.length < 3) wrong.push(a + wrong.length + 2);
  const options = shuffle([String(a), ...wrong.slice(0, 3).map(String)]);
  return { q, a: String(a), options, explanation };
}

// ─── PROCEDURAL NUMBER & PATTERN SEQUENCES ───────────────────────────────────
function genSequence(diff: Difficulty): QItem {
  const m = diff === 'Easy' ? 1 : diff === 'Medium' ? 2 : 3;
  const types = ['ap','gp','fib','sq','cu','alt','tri','prime','diff_inc'];
  const type  = pick(types);
  let seq: number[] = [], a = 0, explanation = '';
  const s = rand(2, 10 * m);

  if (type === 'ap') {
    const d = rand(3, 7 * m);
    seq = Array.from({ length: 5 }, (_, i) => s + i * d);
    a = s + 5 * d;
    explanation = `Arithmetic Progression: Starting term = ${s}, Common difference = +${d}`;
  } else if (type === 'gp') {
    const r = pick([2, 3]);
    seq = Array.from({ length: 5 }, (_, i) => s * Math.pow(r, i));
    a = s * Math.pow(r, 5);
    explanation = `Geometric Progression: Starting term = ${s}, Multiplier ratio = ×${r}`;
  } else if (type === 'fib') {
    const f1 = rand(1, 6), f2 = rand(2, 9);
    seq = [f1, f2];
    for (let i = 2; i < 5; i++) seq.push(seq[i-1] + seq[i-2]);
    a = seq[4] + seq[3];
    explanation = `Fibonacci Variant: Each term is sum of previous two. Next: ${seq[3]} + ${seq[4]} = ${a}`;
  } else if (type === 'sq') {
    const base = rand(2, 6 * m);
    seq = Array.from({ length: 5 }, (_, i) => (base + i) * (base + i));
    a = (base + 5) * (base + 5);
    explanation = `Square Series: Squares of consecutive integers starting from ${base}². Next = ${base+5}² = ${a}`;
  } else if (type === 'cu') {
    const base = rand(1, 4);
    seq = Array.from({ length: 4 }, (_, i) => Math.pow(base + i, 3));
    a = Math.pow(base + 4, 3);
    explanation = `Cube Series: Cubes of consecutive integers starting from ${base}³. Next = ${base+4}³ = ${a}`;
  } else if (type === 'alt') {
    const add = rand(4, 8 * m), sub = rand(1, 4 * m);
    seq = [s, s + add, s + add - sub, s + add - sub + add, s + add - sub + add - sub];
    a = seq[4] + add;
    explanation = `Alternating Series: Pattern is +${add}, -${sub}. Next term = ${seq[4]} + ${add} = ${a}`;
  } else if (type === 'diff_inc') {
    seq = [s];
    let curr = s;
    for (let i = 1; i <= 4; i++) {
      curr += i * 2;
      seq.push(curr);
    }
    a = curr + 5 * 2;
    explanation = `Increasing Difference Series: Differences increase by +2 each step (+2, +4, +6, +8, +10). Next = ${curr} + 10 = ${a}`;
  } else if (type === 'tri') {
    const base = rand(1, 5);
    seq = Array.from({ length: 5 }, (_, i) => ((base+i) * (base+i+1)) / 2);
    a = ((base+5) * (base+6)) / 2;
    explanation = `Triangular Number Pattern: Formula n(n+1)/2. Next = ${base+5}×${base+6}/2 = ${a}`;
  } else {
    const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113];
    const pi = rand(0, 18);
    seq = primes.slice(pi, pi + 5);
    a = primes[pi + 5];
    explanation = `Prime Series: Consecutive prime numbers. Prime following ${seq[4]} is ${a}`;
  }

  const q = `Find the next number in the sequence: ${seq.join(', ')}, ?`;
  const wrong = Array.from(new Set([a + rand(1, 6), a - rand(1, 4), a + rand(7, 14)]))
    .map(v => Math.max(1, v))
    .filter(v => v !== a);
  while (wrong.length < 3) wrong.push(a + wrong.length + 3);
  const options = shuffle([String(a), ...wrong.slice(0, 3).map(String)]);
  return { q, a: String(a), options, explanation };
}

// ─── VERBAL APTITUDE POOL ─────────────────────────────────────────────────────
const VERBAL_POOL: QItem[] = [
  { q: 'Synonym of ELOQUENT', a: 'Fluent', options: shuffle(['Fluent','Silent','Hostile','Hesitant']), explanation: 'Eloquent means articulate, expressive, or fluent in speech.' },
  { q: 'Antonym of ABUNDANT', a: 'Scarce', options: shuffle(['Scarce','Plentiful','Ample','Copious']), explanation: 'Abundant means existing in large quantities; antonym is scarce.' },
  { q: 'Odd one out: Apple, Mango, Carrot, Banana', a: 'Carrot', options: shuffle(['Apple','Mango','Carrot','Banana']), explanation: 'Carrot is a root vegetable; others are fruits.' },
  { q: 'Analogy — CAT : KITTEN :: DOG : ?', a: 'Puppy', options: shuffle(['Puppy','Cub','Calf','Foal']), explanation: 'Kitten is a young cat; Puppy is a young dog.' },
  { q: 'Analogy — BIRD : AVIARY :: FISH : ?', a: 'Aquarium', options: shuffle(['Aquarium','Pond','Ocean','Cage']), explanation: 'An aviary is an enclosure for birds; an aquarium is for fish.' },
  { q: 'Fill in: "The research team made a _____ breakthrough in cancer treatment."', a: 'Pivotal', options: shuffle(['Pivotal','Trivial','Minor','Redundant']), explanation: 'Pivotal means of crucial or fundamental importance.' },
  { q: 'Odd one out: Iron, Copper, Wood, Zinc', a: 'Wood', options: shuffle(['Iron','Copper','Wood','Zinc']), explanation: 'Wood is organic non-metal; others are chemical metallic elements.' },
  { q: 'Synonym of DILIGENT', a: 'Hardworking', options: shuffle(['Hardworking','Careless','Slothful','Passive']), explanation: 'Diligent means showing care and conscientiousness in work.' },
  { q: 'Antonym of TRANSPARENT', a: 'Opaque', options: shuffle(['Opaque','Lucid','Clear','Crystalline']), explanation: 'Transparent allows light through; opaque blocks light.' },
  { q: 'Analogy — DOCTOR : HOSPITAL :: JUDGE : ?', a: 'Courtroom', options: shuffle(['Courtroom','Police Station','Library','Clinic']), explanation: 'A doctor operates in a hospital; a judge presides in a courtroom.' },
  { q: 'Synonym of BENEVOLENT', a: 'Generous', options: shuffle(['Generous','Malevolent','Harsh','Greedy']), explanation: 'Benevolent means well-meaning, kindly, and generous.' },
  { q: 'Antonym of CONCISE', a: 'Verbose', options: shuffle(['Verbose','Brief','Succinct','Pithy']), explanation: 'Concise means brief and to the point; verbose means wordy.' },
  { q: 'Analogy — AUTHOR : BOOK :: COMPOSER : ?', a: 'Symphony', options: shuffle(['Symphony','Canvas','Sculpture','Architect']), explanation: 'An author creates a book; a composer creates a symphony.' },
  { q: 'Synonym of AMBIGUOUS', a: 'Equivocal', options: shuffle(['Equivocal','Explicit','Definite','Unmistakable']), explanation: 'Ambiguous means having double meaning or being unclear.' },
  { q: 'Antonym of EPHEMERAL', a: 'Perpetual', options: shuffle(['Perpetual','Transient','Fleeting','Momentary']), explanation: 'Ephemeral means lasting a very short time; perpetual means eternal.' },
  { q: 'Odd one out: Violin, Guitar, Flute, Cello', a: 'Flute', options: shuffle(['Violin','Guitar','Flute','Cello']), explanation: 'Flute is a woodwind instrument; others are stringed instruments.' },
  { q: 'Synonym of TENACIOUS', a: 'Persistent', options: shuffle(['Persistent','Yielding','Frail','Hesitant']), explanation: 'Tenacious means persistent and holding firm.' },
  { q: 'Fill in: "Her _____ leadership guided the company safely through financial crisis."', a: 'Prudent', options: shuffle(['Prudent','Reckless','Careless','Hasty']), explanation: 'Prudent means acting with or showing care and foresight for the future.' },
];

// ─── LOGICAL REASONING POOL ───────────────────────────────────────────────────
const LOGICAL_POOL: QItem[] = [
  { q: 'Blood Relation: A is B\'s mother. B is C\'s sister. How is A related to C?', a: 'Mother', options: shuffle(['Mother','Aunt','Grandmother','Sister']), explanation: 'B and C are siblings. A is B\'s mother → A is also C\'s mother.' },
  { q: 'Direction Test: Walk 3 km North, turn right and walk 4 km. What is the shortest distance from start point?', a: '5 km', options: shuffle(['5 km','7 km','1 km','12 km']), explanation: 'Right-angled triangle: Hypotenuse = √(3² + 4²) = √25 = 5 km.' },
  { q: 'Coded Alphabet: If CAT = 24 (C=3, A=1, T=20), what is DOG?', a: '26', options: shuffle(['26','30','22','28']), explanation: 'D=4, O=15, G=7. Sum = 4 + 15 + 7 = 26.' },
  { q: 'Syllogism: All engineers are problem solvers. All problem solvers are logical. Conclusion?', a: 'All engineers are logical', options: shuffle(['All engineers are logical','No engineers are logical','Some engineers are not logical','None of these']), explanation: 'Nested inclusion: Engineers ⊂ Problem Solvers ⊂ Logical.' },
  { q: 'Blood Relation: X is Y\'s father. Z is Y\'s brother. What is Z to X?', a: 'Son', options: shuffle(['Son','Brother','Father','Uncle']), explanation: 'Y is X\'s child. Z is Y\'s brother → Z is X\'s son.' },
  { q: 'Direction Test: Start facing East. Turn 90° clockwise, then 180°. Which direction are you facing?', a: 'North', options: shuffle(['North','South','East','West']), explanation: 'East → 90° clockwise = South → 180° = North.' },
  { q: 'Arrangement: In a line of 5 people, Arjun is 2nd from left and Priya is 4th from left. How many people stand between them?', a: '1', options: shuffle(['1','2','3','0']), explanation: 'Only the 3rd person stands between 2nd and 4th position.' },
  { q: 'Data Sufficiency: Is x positive? (1) x³ = 27. (2) x² = 9. Is statement (1) sufficient alone?', a: 'Yes, statement (1) alone is sufficient', options: shuffle(['Yes, statement (1) alone is sufficient','No, statement (2) alone is sufficient','Both required','Neither']), explanation: 'x³ = 27 has single real root x = +3 (definitely > 0). Statement (2) gives x = ±3.' },
  { q: 'Mirror Code: If PYTHON is mirrored as NOHTYP, how is ALGORITHM coded?', a: 'MHTIROGLA', options: shuffle(['MHTIROGLA','ALGORITHM','MHITROGLA','MALGORITH']), explanation: 'String reversal: ALGORITHM reversed letter-by-letter = MHTIROGLA.' },
  { q: 'Ranking: In a test result, Maya ranks 8th from top and 23rd from bottom. Total students?', a: '30', options: shuffle(['30','31','29','32']), explanation: 'Total = Top rank + Bottom rank - 1 = 8 + 23 - 1 = 30.' },
];

// ─── CODE OUTPUT POOL ─────────────────────────────────────────────────────────
const CODE_POOL: QItem[] = [
  { q: 'Python Code Output:\n\nx = [1, 2, 3]\nprint(x * 2)', a: '[1, 2, 3, 1, 2, 3]', options: shuffle(['[1, 2, 3, 1, 2, 3]','[2, 4, 6]','[1, 2, 3, 2]','TypeError']), explanation: 'Multiplying a Python list duplicates the list sequence.' },
  { q: 'JavaScript Code Output:\n\nconsole.log(typeof null);', a: '"object"', options: shuffle(['"object"','"null"','"undefined"','"string"']), explanation: 'Historical JavaScript quirk: typeof null evaluates to "object".' },
  { q: 'Python Code Output:\n\nprint(bool([]), bool([0]))', a: 'False True', options: shuffle(['False True','True False','False False','True True']), explanation: 'Empty list [] is falsy; non-empty list [0] is truthy.' },
  { q: 'JavaScript Code Output:\n\nconsole.log(1 + "2" + 3);', a: '"123"', options: shuffle(['"123"','6','"15"','NaN']), explanation: '1 + "2" = "12", then "12" + 3 = "123" (string concatenation).' },
  { q: 'Python Code Output:\n\na = (1, 2, 3)\na[0] = 5\nprint(a)', a: 'TypeError', options: shuffle(['TypeError','(5, 2, 3)','[5, 2, 3]','(1, 2, 3)']), explanation: 'Tuples in Python are immutable; modifying elements raises TypeError.' },
  { q: 'JavaScript Code Output:\n\nconst a = [1, 2];\nconst b = a;\nb.push(3);\nconsole.log(a.length);', a: '3', options: shuffle(['3','2','undefined','TypeError']), explanation: 'Arrays are passed by reference in JS. Modifying b mutates array a.' },
  { q: 'Python Code Output:\n\nprint("AI".center(6, "*"))', a: '**AI**', options: shuffle(['**AI**','***AI*','AI****','*AI***']), explanation: '.center(6, "*") pads 2 asterisks on left and 2 on right.' },
  { q: 'JavaScript Code Output:\n\nconsole.log(0.1 + 0.2 === 0.3);', a: 'false', options: shuffle(['false','true','undefined','SyntaxError']), explanation: 'IEEE 754 floating point arithmetic: 0.1 + 0.2 = 0.30000000000000004.' },
  { q: 'Python Code Output:\n\nx = {1, 2, 2, 3}\nprint(len(x))', a: '3', options: shuffle(['3','4','2','TypeError']), explanation: 'Python sets remove duplicate values: {1, 2, 3} has length 3.' },
  { q: 'JavaScript Code Output:\n\nconsole.log(typeof NaN);', a: '"number"', options: shuffle(['"number"','"NaN"','"undefined"','"null"']), explanation: 'NaN stands for Not-a-Number, but its JS type is "number".' },
];

const GAME_META = [
  { id:'math'   as Category, emoji:'🧮', title:'Speed Math',       desc:'Procedural arithmetic, ratios, profit %, speed & work formulas', color:'#6366f1' },
  { id:'seq'    as Category, emoji:'🔢', title:'Number Sequences',  desc:'AP, GP, Fibonacci, squares, cubes & increasing differences',  color:'#10b981' },
  { id:'verbal' as Category, emoji:'📚', title:'Verbal Aptitude',   desc:'Synonyms, antonyms, analogies & vocabulary placement tests',   color:'#f59e0b' },
  { id:'logic'  as Category, emoji:'🧩', title:'Logical Reasoning', desc:'Blood relations, direction tests, syllogisms & code matrices',   color:'#8b5cf6' },
  { id:'code'   as Category, emoji:'💻', title:'Code Output',       desc:'Python & JavaScript execution tracing & type traps',          color:'#06b6d4' },
];

const TIME_LIMITS: Record<Difficulty, number> = { Easy: 30, Medium: 20, Hard: 12 };

export default function GamesPage() {
  const router = useRouter();
  const [cat, setCat]         = useState<Category | null>(null);
  const [diff, setDiff]       = useState<Difficulty>('Medium');
  const [q, setQ]             = useState<QItem | null>(null);
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [total, setTotal]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [chosen, setChosen]   = useState<string | null>(null);
  const [history, setHistory] = useState<Record<Category, number | null>>({ math:null,seq:null,verbal:null,logic:null,code:null });
  const usedSet               = useRef<Set<string>>(new Set());

  const getNextQuestion = useCallback((category: Category): QItem => {
    if (category === 'math') return genMath(diff);
    if (category === 'seq')  return genSequence(diff);

    const pool = category === 'verbal' ? VERBAL_POOL : category === 'logic' ? LOGICAL_POOL : CODE_POOL;
    const unused = pool.filter(item => !usedSet.current.has(item.q));
    
    if (unused.length === 0) {
      usedSet.current.clear();
      return pick(pool);
    }
    const selected = pick(unused);
    usedSet.current.add(selected.q);
    return selected;
  }, [diff]);

  const startGame = (selectedCat: Category) => {
    setCat(selectedCat);
    usedSet.current.clear();
    setScore(0);
    setStreak(0);
    setTotal(0);
    setChosen(null);
    setQ(getNextQuestion(selectedCat));
    setTimeLeft(TIME_LIMITS[diff]);
  };

  const nextQ = useCallback(() => {
    if (!cat) return;
    setChosen(null);
    setQ(getNextQuestion(cat));
    setTimeLeft(TIME_LIMITS[diff]);
  }, [cat, diff, getNextQuestion]);

  // Timer loop
  useEffect(() => {
    if (!cat || !q || chosen !== null) return;
    if (timeLeft <= 0) {
      setChosen('__timeout__');
      setStreak(0);
      setTotal(t => t + 1);
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [cat, q, chosen, timeLeft]);

  const handleAnswer = (opt: string) => {
    if (chosen !== null) return;
    setChosen(opt);
    setTotal(t => t + 1);
    if (opt === q!.a) {
      const bonus = streak >= 3 ? 15 : streak >= 1 ? 12 : 10;
      setScore(s => s + bonus);
      setStreak(st => st + 1);
    } else {
      setStreak(0);
    }
  };

  const exitGame = () => {
    if (cat && total > 0) {
      const pct = Math.round((score / (total * 10)) * 100);
      setHistory(prev => ({ ...prev, [cat]: pct }));
    }
    setCat(null);
    setQ(null);
    setChosen(null);
  };

  const timerPct = (timeLeft / TIME_LIMITS[diff]) * 100;
  const timerColor = timerPct > 50 ? '#10b981' : timerPct > 25 ? '#f59e0b' : '#ef4444';

  // ── GAME IN-PROGRESS VIEW (FULL SCREEN LAPTOP DISPLAY) ──────────────────────
  if (cat && q) return (
    <div style={{ minHeight:'100vh', background:'#030308', color:'white', fontFamily:'Inter,sans-serif', padding:'36px 48px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      
      {/* Header bar */}
      <div style={{ width:'100%', maxWidth:900, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <button onClick={exitGame} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 16px', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <ArrowLeft size={15}/> Exit Game
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:20, fontFamily:'Space Grotesk' }}>
          <div style={{ fontSize:'0.95rem' }}>Score: <strong style={{ color:'#6366f1', fontSize:'1.1rem' }}>{score}</strong></div>
          <div style={{ fontSize:'0.95rem' }}>Accuracy: <strong style={{ color:'#10b981', fontSize:'1.1rem' }}>{total > 0 ? Math.round((score / (total * 10)) * 100) : 0}%</strong></div>
          {streak >= 2 && (
            <div style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#fbbf24', padding:'4px 12px', borderRadius:20, fontSize:'0.82rem', fontWeight:900, display:'flex', alignItems:'center', gap:4 }}>
              <Flame size={14}/> STREAK {streak}x
            </div>
          )}
        </div>
      </div>

      {/* Progress & timer bar */}
      <div style={{ width:'100%', maxWidth:900, height:6, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginBottom:24 }}>
        <div style={{ height:'100%', width:`${timerPct}%`, background:`linear-gradient(90deg, ${timerColor}90, ${timerColor})`, transition:'width 1s linear', borderRadius:4 }}/>
      </div>

      <div style={{ width:'100%', maxWidth:900, display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', fontWeight:800, letterSpacing:'0.06em' }}>
          {GAME_META.find(g=>g.id===cat)?.emoji} {GAME_META.find(g=>g.id===cat)?.title.toUpperCase()} · LEVEL: {diff.toUpperCase()}
        </span>
        <span style={{ fontSize:'0.85rem', fontWeight:900, color:timerColor, fontFamily:'Space Grotesk' }}>⏱ {timeLeft}s remaining</span>
      </div>

      {/* Question Container Card */}
      <div style={{ width:'100%', maxWidth:900, padding:'36px 40px', borderRadius:24, background:'rgba(255,255,255,0.025)', border:`1px solid ${chosen ? (chosen === q.a ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.35)') : 'rgba(255,255,255,0.07)'}`, marginBottom:24, transition:'all 0.3s' }}>
        <pre style={{ margin:0, fontFamily: cat === 'code' ? 'monospace' : 'Space Grotesk', fontSize: cat === 'code' ? '1rem' : '1.25rem', fontWeight: cat === 'code' ? 400 : 700, lineHeight:1.6, color:'white', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
          {q.q}
        </pre>
      </div>

      {/* 4 Answer Options Grid */}
      <div style={{ width:'100%', maxWidth:900, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
        {q.options.map((opt, idx) => {
          const isCorrect = opt === q.a;
          const isChosen  = opt === chosen;
          let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)', col = 'white';

          if (chosen !== null) {
            if (isCorrect) { bg = 'rgba(16,185,129,0.14)'; border = 'rgba(16,185,129,0.5)'; col = '#34d399'; }
            else if (isChosen) { bg = 'rgba(239,68,68,0.14)'; border = 'rgba(239,68,68,0.5)'; col = '#f87171'; }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              disabled={chosen !== null}
              style={{
                padding:'18px 24px', borderRadius:16, background:bg, border:`2px solid ${border}`,
                color:col, fontSize:'1rem', fontWeight:600, cursor: chosen ? 'default' : 'pointer',
                textAlign:'left', transition:'all 0.2s', fontFamily: cat === 'code' ? 'monospace' : 'Inter,sans-serif',
                display:'flex', alignItems:'center', gap:12
              }}
              onMouseEnter={e => { if(!chosen) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)'; }}
              onMouseLeave={e => { if(!chosen) (e.currentTarget as HTMLButtonElement).style.background = bg; }}
            >
              <span style={{ fontSize:'0.75rem', fontWeight:900, color:'rgba(255,255,255,0.3)', width:24 }}>
                {['A','B','C','D'][idx]}.
              </span>
              <span style={{ flex:1 }}>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Instant Explanation Box */}
      {chosen !== null && (
        <div style={{ width:'100%', maxWidth:900, padding:'22px 28px', borderRadius:18, background: chosen === q.a ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${chosen === q.a ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, marginBottom:24 }}>
          <div style={{ fontWeight:800, fontSize:'1rem', color: chosen === '__timeout__' ? '#f59e0b' : chosen === q.a ? '#34d399' : '#f87171', marginBottom:6 }}>
            {chosen === '__timeout__' ? '⏰ Time Expired!' : chosen === q.a ? '✅ Correct Answer!' : '❌ Incorrect'}
          </div>
          {chosen !== q.a && (
            <p style={{ margin:'0 0 8px', fontSize:'0.9rem', color:'rgba(255,255,255,0.7)' }}>
              Correct Option: <strong style={{ color:'white' }}>{q.a}</strong>
            </p>
          )}
          <p style={{ margin:0, color:'rgba(255,255,255,0.65)', fontSize:'0.88rem', lineHeight:1.6 }}>
            💡 <strong>Explanation:</strong> {q.explanation}
          </p>
        </div>
      )}

      {chosen !== null && (
        <button onClick={nextQ} style={{ padding:'14px 44px', borderRadius:14, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'white', fontWeight:800, fontSize:'1rem', cursor:'pointer', fontFamily:'Space Grotesk', boxShadow:'0 4px 24px rgba(99,102,241,0.4)' }}>
          Next Question →
        </button>
      )}
    </div>
  );

  // ── MAIN MENU VIEW (FULL LAPTOP SCREEN DISPLAY) ─────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#030308', color:'white', fontFamily:'Inter,sans-serif', padding:'36px 48px 60px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        
        {/* Title Banner */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:36 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 14px', borderRadius:20, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', marginBottom:12 }}>
              <Zap size={13} color="#818cf8"/>
              <span style={{ fontSize:'0.72rem', fontWeight:800, color:'#a5b4fc', letterSpacing:'0.06em' }}>PLACEMENT EXAM PREP</span>
            </div>
            <h1 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2.5rem', margin:0, background:'linear-gradient(135deg,#c4b5fd,#818cf8,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              🎮 Aptitude Mastery Arena
            </h1>
            <p style={{ color:'rgba(255,255,255,0.45)', margin:'8px 0 0', fontSize:'0.95rem' }}>
              Procedural placement exam questions. Unlimited unique variations, step-by-step solutions, zero boring repeats.
            </p>
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ padding:'10px 20px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
            ← Dashboard
          </button>
        </div>

        {/* Difficulty Controls */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32, padding:'14px 20px', borderRadius:16, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize:'0.75rem', fontWeight:800, color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em' }}>SELECT DIFFICULTY:</span>
          {(['Easy','Medium','Hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              style={{
                padding:'8px 22px', borderRadius:12, fontWeight:800, fontSize:'0.82rem', cursor:'pointer', fontFamily:'Space Grotesk',
                border:`1px solid ${diff === d ? (d === 'Easy' ? '#10b981' : d === 'Medium' ? '#6366f1' : '#ef4444') : 'rgba(255,255,255,0.08)'}`,
                background: diff === d ? (d === 'Easy' ? 'rgba(16,185,129,0.15)' : d === 'Medium' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)') : 'transparent',
                color: diff === d ? (d === 'Easy' ? '#34d399' : d === 'Medium' ? '#a5b4fc' : '#f87171') : 'rgba(255,255,255,0.4)',
                transition:'all 0.2s'
              }}
            >
              {d} ({TIME_LIMITS[d]}s / Q)
            </button>
          ))}
        </div>

        {/* 5 Game Cards Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20, marginBottom:40 }}>
          {GAME_META.map(g => {
            const best = history[g.id];
            return (
              <div
                key={g.id}
                onClick={() => startGame(g.id)}
                style={{
                  padding:'30px 28px', borderRadius:22,
                  background: `rgba(${g.id==='math'?'99,102,241':g.id==='seq'?'16,185,129':g.id==='verbal'?'245,158,11':g.id==='logic'?'139,92,246':'6,182,212'},0.06)`,
                  border: `1px solid ${g.color}25`, cursor:'pointer', transition:'all 0.25s', position:'relative'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px ${g.color}20`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = g.color;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${g.color}25`;
                }}
              >
                <div style={{ fontSize:'2.6rem', marginBottom:16 }}>{g.emoji}</div>
                <h3 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'1.25rem', margin:'0 0 8px', color:'white' }}>{g.title}</h3>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.85rem', lineHeight:1.6, margin:'0 0 24px', minHeight:42 }}>{g.desc}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.72rem', fontWeight:800, color:g.color, background:`${g.color}15`, border:`1px solid ${g.color}25`, padding:'4px 12px', borderRadius:10 }}>
                    ⏱ {TIME_LIMITS[diff]}s / Q
                  </span>
                  {best !== null && <span style={{ fontSize:'0.75rem', fontWeight:800, color:'#f59e0b' }}>Best: {best}%</span>}
                  <div style={{ width:36, height:36, borderRadius:'50%', background:g.color, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px ${g.color}50`, color:'white', fontWeight:900, fontSize:'0.9rem' }}>
                    ▶
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pro Tips Panel */}
        <div style={{ padding:'24px 32px', borderRadius:20, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'0.9rem', color:'rgba(255,255,255,0.5)', margin:'0 0 14px', letterSpacing:'0.06em' }}>
            💡 PLACEMENT EXAM APTITUDE STRATEGY
          </h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {[
              '🧮 Speed Math: Estimate unit digits to instantly rule out 2 choices',
              '🔢 Sequences: Look for second-order differences or square patterns',
              '📚 Verbal: Dissect prefixes/suffixes to deduce unknown vocabulary',
              '🧩 Logic: Sketch quick line diagrams for direction & blood relations',
              '💻 Code Output: Trace loop counters line-by-line in memory',
            ].map((tip, i) => (
              <div key={i} style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.04)', fontSize:'0.78rem', color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>
                {tip}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
