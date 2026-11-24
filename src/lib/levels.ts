export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: "Khởi hành" },
  { level: 2, minXp: 120, title: "Tập sự Cú pháp" },
  { level: 3, minXp: 280, title: "Người viết Mã" },
  { level: 4, minXp: 480, title: "Thợ rèn Logic" },
  { level: 5, minXp: 720, title: "Nhà chinh phục Vòng lặp" },
  { level: 6, minXp: 1000, title: "Chuyên gia Cấu trúc" },
  { level: 7, minXp: 1350, title: "Bậc thầy Giải thuật" },
  { level: 8, minXp: 1750, title: "Kỹ sư Hệ thống" },
  { level: 9, minXp: 2250, title: "Kiến trúc sư Mã nguồn" },
  { level: 10, minXp: 2800, title: "Huyền thoại CODELAB" },
];

export function computeLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i].minXp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? {
        level: current.level + 1,
        minXp: current.minXp + 600,
        title: current.title,
      };
    }
  }

  const span = Math.max(1, next.minXp - current.minXp);
  const progressPercent = Math.min(100, Math.round(((safeXp - current.minXp) / span) * 100));

  return {
    level: current.level,
    title: current.title,
    currentLevelXp: current.minXp,
    nextLevelXp: next.minXp,
    progressPercent,
  };
}
