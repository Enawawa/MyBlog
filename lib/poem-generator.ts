// ============================================================
// 废话文学生成器 — 核心引擎
// 基于种子的确定性生成，相同种子总是生成相同的诗
// ============================================================

// ---------- Seeded PRNG (Mulberry32) ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// ---------- 词库 ----------

const SCENES = [
  "工位", "办公室", "会议室", "地铁", "出租屋",
  "茶水间", "电梯", "走廊", "食堂", "公交车",
  "电脑前", "屏幕前", "窗边", "路上", "座位上",
  "格子间", "打印机旁", "饮水机前", "楼梯间", "天台上",
];

const OBJECTS = [
  "电脑", "鼠标", "键盘", "外卖", "咖啡",
  "Excel", "PPT", "手机", "工牌", "水杯",
  "耳机", "日报", "椅子", "显示器", "需求文档",
  "会议纪要", "周报", "简历", "便利贴", "充电线",
];

const ACTIONS = [
  "坐着", "看着", "打开", "关上", "等待",
  "点击", "刷新", "发送", "思考", "假装",
  "盯着", "放下", "拿起", "敲着", "滑动",
  "保存", "复制", "粘贴", "删除", "搜索",
];

const STATES = [
  "上班", "加班", "开会", "等下班", "摸鱼",
  "发呆", "划水", "改方案", "赶进度", "写周报",
  "通勤", "带薪午休", "假装忙碌", "认真摸鱼", "对齐颗粒度",
];

const TIMES = [
  "周一", "周五", "早上九点", "深夜", "午休",
  "下午三点", "六点半", "凌晨两点", "傍晚", "早高峰",
  "晚高峰", "下班前", "上班后", "周末", "月底",
];

const CONNECTORS = [
  "因为", "所以", "但是", "于是", "其实",
  "反正", "毕竟", "总之", "不过", "然而",
];

const ADJECTIVES = [
  "安静地", "默默地", "努力地", "假装", "认真地",
  "反复地", "机械地", "习惯性地", "无聊地", "熟练地",
];

// ---------- 模板系统 ----------

type WordBank = {
  S: string[];   // scenes
  O: string[];   // objects
  A: string[];   // actions
  ST: string[];  // states
  T: string[];   // times
  C: string[];   // connectors
  ADJ: string[]; // adjectives
};

type RNG = () => number;

function pick(rng: RNG, arr: string[]): string {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN(rng: RNG, arr: string[], n: number): string[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

type TemplateGenerator = (rng: RNG, w: WordBank) => string[];

const TEMPLATES: TemplateGenerator[] = [
  // 1. 位置循环
  (rng, w) => {
    const s1 = pick(rng, w.S), s2 = pick(rng, w.S), a = pick(rng, w.A), st = pick(rng, w.ST);
    return [
      `我${a}在${s1}`,
      `${s1}在${s2}里`,
      `${s2}有很多${s1}`,
      `我在其中一个`,
      `因为我要${st}`,
      `所以我${a}在这里`,
    ];
  },

  // 2. 物品沉思
  (rng, w) => {
    const o = pick(rng, w.O), s = pick(rng, w.S), t = pick(rng, w.T), c = pick(rng, w.C);
    return [
      `${o}在${s}上`,
      `我在${o}旁边`,
      `${o}不说话`,
      `我也不说话`,
      `我们${c}就这样`,
      `${pick(rng, w.A)}到${t}`,
    ];
  },

  // 3. 动作循环
  (rng, w) => {
    const st = pick(rng, w.ST), a = pick(rng, w.A), o = pick(rng, w.O), t = pick(rng, w.T), c = pick(rng, w.C);
    return [
      `${t}我开始${st}`,
      `${st}就是${a}${o}`,
      `${a}完了还要${a}`,
      `${c}这就是${st}`,
      `${st}的意思`,
      `就是一直${a}${o}`,
    ];
  },

  // 4. 今天等于昨天
  (rng, w) => {
    const a = pick(rng, w.A), s = pick(rng, w.S), o = pick(rng, w.O), c = pick(rng, w.C);
    return [
      `今天和昨天一样`,
      `我${a}在${s}`,
      `${s}和昨天一样`,
      `${o}也和昨天一样`,
      `${c}今天就是昨天`,
      `明天也会是今天`,
    ];
  },

  // 5. 因果闭环
  (rng, w) => {
    const st = pick(rng, w.ST), s = pick(rng, w.S), a = pick(rng, w.A), o = pick(rng, w.O);
    return [
      `因为要${st}`,
      `所以来到${s}`,
      `来到${s}之后`,
      `就开始${a}${o}`,
      `${a}完${o}`,
      `就可以继续${st}了`,
    ];
  },

  // 6. 存在主义
  (rng, w) => {
    const s = pick(rng, w.S), o1 = pick(rng, w.O), o2 = pick(rng, w.O), t = pick(rng, w.T);
    return [
      `${s}里有一个我`,
      `我旁边有一个${o1}`,
      `${o1}旁边还有${o2}`,
      `我们都在${s}里`,
      `这就是${t}的${s}`,
      `${s}里的一切`,
    ];
  },

  // 7. 灵魂拷问
  (rng, w) => {
    const st = pick(rng, w.ST), a = pick(rng, w.A), s = pick(rng, w.S), o = pick(rng, w.O), t = pick(rng, w.T);
    return [
      `有人问我在干嘛`,
      `我说我在${st}`,
      `${st}是什么呢`,
      `就是${a}在${s}`,
      `${a}着${o}`,
      `一直${a}到${t}`,
    ];
  },

  // 8. 等待
  (rng, w) => {
    const t = pick(rng, w.T), a = pick(rng, w.A), o = pick(rng, w.O), s = pick(rng, w.S);
    return [
      `还有一会儿就${t}了`,
      `我${a}着${o}`,
      `${o}${pick(rng, w.ADJ)}在${s}上`,
      `${s}里的人都在${a}`,
      `大家都在等`,
      `等一个${t}的到来`,
    ];
  },

  // 9. 周一特供
  (rng, w) => {
    const s = pick(rng, w.S), o = pick(rng, w.O), st = pick(rng, w.ST), c = pick(rng, w.C);
    return [
      `周一来到${s}`,
      `${o}还在原来的位置`,
      `我也在原来的位置`,
      `上周${st}到现在`,
      `这周继续${st}`,
      `下周${c}也一样`,
    ];
  },

  // 10. 咖啡循环
  (rng, w) => {
    const t = pick(rng, w.T), st = pick(rng, w.ST), c = pick(rng, w.C);
    return [
      `${t}的第一杯咖啡`,
      `喝完了就要${st}`,
      `${st}累了就喝咖啡`,
      `喝完咖啡继续${st}`,
      `${c}咖啡就是燃料`,
      `燃烧完了再加一杯`,
    ];
  },

  // 11. 外卖哲学
  (rng, w) => {
    const s = pick(rng, w.S), a = pick(rng, w.A), st = pick(rng, w.ST);
    return [
      `中午点了外卖`,
      `外卖还没到`,
      `我${a}在${s}`,
      `${a}着等外卖`,
      `外卖到了`,
      `吃完继续${st}`,
      `明天还要点外卖`,
    ];
  },

  // 12. 会议禅
  (rng, w) => {
    const a = pick(rng, w.A), o = pick(rng, w.O), c = pick(rng, w.C), adj = pick(rng, w.ADJ);
    return [
      `会议开始了`,
      `大家${adj}${a}着${o}`,
      `有人在说话`,
      `有人在${a}`,
      `我${adj}听着`,
      `${c}会议就是这样`,
      `说完了就结束了`,
    ];
  },

  // 13. 下班倒计时
  (rng, w) => {
    const s = pick(rng, w.S), o = pick(rng, w.O), a = pick(rng, w.A), c = pick(rng, w.C);
    return [
      `距离下班还有三小时`,
      `我${a}了一下${o}`,
      `又${a}了一下${o}`,
      `距离下班还有两小时五十九分`,
      `${c}时间就是这样`,
      `你${a}它 它就慢`,
      `你不${a}它 它还是慢`,
    ];
  },

  // 14. 通勤感悟
  (rng, w) => {
    const a = pick(rng, w.A), c = pick(rng, w.C);
    return [
      `早上从出租屋出发`,
      `坐地铁到公司`,
      `晚上从公司出发`,
      `坐地铁回出租屋`,
      `${c}出租屋和公司之间`,
      `只隔了一条地铁线`,
      `和我的一整天`,
    ];
  },

  // 15. 深夜加班
  (rng, w) => {
    const o = pick(rng, w.O), s = pick(rng, w.S), a = pick(rng, w.A);
    return [
      `办公室只剩我一个人`,
      `${o}还亮着`,
      `我${a}着${o}`,
      `${s}很安静`,
      `安静到能听见`,
      `${o}嗡嗡的声音`,
      `和我自己的呼吸`,
    ];
  },
];

// ---------- 关键词映射 ----------

const KEYWORD_WORD_MAP: Record<string, Partial<WordBank>> = {
  "加班": { ST: ["加班", "赶进度", "改方案", "熬夜", "通宵"], T: ["深夜", "凌晨两点", "晚高峰", "月底"] },
  "周一": { T: ["周一", "早上九点", "早高峰"], ST: ["上班", "开会", "写周报"] },
  "摸鱼": { ST: ["摸鱼", "划水", "假装忙碌", "认真摸鱼", "发呆"], A: ["刷新", "滑动", "搜索", "假装"] },
  "996": { ST: ["加班", "赶进度", "上班"], T: ["早上九点", "深夜", "周末"] },
  "开会": { S: ["会议室", "办公室"], ST: ["开会", "对齐颗粒度", "改方案"], O: ["PPT", "会议纪要", "需求文档"] },
  "外卖": { O: ["外卖", "咖啡", "水杯"], T: ["午休", "下午三点"] },
  "咖啡": { O: ["咖啡", "水杯"], ST: ["上班", "加班", "赶进度"] },
  "通勤": { S: ["地铁", "公交车", "路上"], T: ["早高峰", "晚高峰", "早上九点", "六点半"] },
  "下班": { T: ["六点半", "下班前", "傍晚"], ST: ["等下班", "摸鱼", "划水"] },
  "打工": { ST: ["上班", "加班", "通勤", "开会"], S: ["工位", "办公室", "格子间"] },
  "excel": { O: ["Excel", "鼠标", "键盘", "显示器"], A: ["点击", "复制", "粘贴", "保存"] },
  "ppt": { O: ["PPT", "显示器", "鼠标"], ST: ["改方案", "开会", "赶进度"] },
};

// ---------- 所有可用标签 ----------

export const ALL_TAGS = [
  "打工人", "上班", "加班", "摸鱼", "996",
  "周一", "开会", "外卖", "咖啡", "通勤",
  "下班", "打工", "深夜", "excel", "ppt",
  "发呆", "等待", "孤独", "循环", "日常",
];

// ---------- 生成接口 ----------

export interface Poem {
  id: string;
  lines: string[];
  keywords: string[];
  createdAt: string;
  slug: string;
}

function buildWordBank(keywords?: string[]): WordBank {
  const base: WordBank = {
    S: [...SCENES],
    O: [...OBJECTS],
    A: [...ACTIONS],
    ST: [...STATES],
    T: [...TIMES],
    C: [...CONNECTORS],
    ADJ: [...ADJECTIVES],
  };

  if (keywords && keywords.length > 0) {
    for (const kw of keywords) {
      const mapped = KEYWORD_WORD_MAP[kw.toLowerCase()];
      if (mapped) {
        if (mapped.S) base.S = [...mapped.S, ...base.S.slice(0, 5)];
        if (mapped.O) base.O = [...mapped.O, ...base.O.slice(0, 5)];
        if (mapped.A) base.A = [...mapped.A, ...base.A.slice(0, 5)];
        if (mapped.ST) base.ST = [...mapped.ST, ...base.ST.slice(0, 5)];
        if (mapped.T) base.T = [...mapped.T, ...base.T.slice(0, 5)];
      }
    }
  }

  return base;
}

function extractKeywords(lines: string[]): string[] {
  const text = lines.join("");
  const found: string[] = [];
  const kwList = [
    "加班", "上班", "摸鱼", "开会", "外卖", "咖啡", "通勤", "下班",
    "周一", "周五", "深夜", "凌晨", "地铁", "工位", "办公室", "会议室",
    "Excel", "PPT", "日报", "周报", "996",
  ];
  for (const kw of kwList) {
    if (text.includes(kw)) found.push(kw);
  }
  if (found.length === 0) found.push("打工人", "日常");
  if (found.length === 1) found.push("打工人");
  return Array.from(new Set(found)).slice(0, 5);
}

export function generatePoem(id: string, keywords?: string[]): Poem {
  const seed = hashString(id);
  const rng = mulberry32(seed);
  const wordBank = buildWordBank(keywords);
  const templateIndex = Math.floor(rng() * TEMPLATES.length);
  const template = TEMPLATES[templateIndex];
  const lines = template(rng, wordBank);
  const derivedKeywords = keywords && keywords.length > 0
    ? Array.from(new Set([...keywords, ...extractKeywords(lines)])).slice(0, 5)
    : extractKeywords(lines);

  const dateMatch = id.match(/^d-(\d{4})(\d{2})(\d{2})/);
  const createdAt = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : new Date().toISOString().slice(0, 10);

  return {
    id,
    lines,
    keywords: derivedKeywords,
    createdAt,
    slug: id,
  };
}

// 生成某一天的全部诗歌
export function generateDailyPoems(dateStr: string, count: number = 50): Poem[] {
  const cleanDate = dateStr.replace(/-/g, "");
  const poems: Poem[] = [];
  for (let i = 1; i <= count; i++) {
    const id = `d-${cleanDate}-${String(i).padStart(3, "0")}`;
    poems.push(generatePoem(id));
  }
  return poems;
}

// 获取今天的日期字符串
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 根据关键词生成诗歌 ID
export function makeKeywordPoemId(keyword: string, index: number): string {
  return `k-${keyword}-${String(index).padStart(3, "0")}`;
}

// 根据关键词生成一组诗歌
export function generatePoemsByKeyword(keyword: string, count: number = 20): Poem[] {
  const poems: Poem[] = [];
  for (let i = 1; i <= count; i++) {
    const id = makeKeywordPoemId(keyword, i);
    poems.push(generatePoem(id, [keyword]));
  }
  return poems;
}

// 获取最近几天的所有诗歌（用于首页列表）
export function getRecentPoems(days: number = 3, perDay: number = 10): Poem[] {
  const poems: Poem[] = [];
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    poems.push(...generateDailyPoems(dateStr, perDay));
  }
  return poems;
}
