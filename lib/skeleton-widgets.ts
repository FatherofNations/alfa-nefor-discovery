/* Расписания прогрессивной загрузки виджетов (DashboardSkeletonGate).
   Общие для Next-страниц и статической сборки, чтобы не разъезжались.
   По просьбе пользователя загрузка удлинена на 0.5 s: каркас виден полсекунды,
   затем по виджетам подтягивается контент (1550/1500 мс до последнего). */

export type SkeletonWidget = { key: string; delay: number };
export type SkeletonSchedule = readonly SkeletonWidget[];

/* Главная предпринимателя: каркас → табы → hero → «Мои дела» → лента. */
export const ENTREPRENEUR_WIDGETS: SkeletonSchedule = [
  { key: "shell", delay: 620 },
  { key: "spot", delay: 620 },
  { key: "tabs", delay: 720 },
  { key: "hero", delay: 840 },
  { key: "tasks", delay: 1200 },
  { key: "operations", delay: 1550 },
];

/* Главная бухгалтера: хром настоящий и сразу, контент — по виджетам. */
export const ACCOUNTANT_WIDGETS: SkeletonSchedule = [
  { key: "qa", delay: 620 },
  { key: "balance", delay: 760 },
  { key: "inwork", delay: 900 },
  { key: "banners", delay: 1020 },
  { key: "tablo", delay: 1180 },
  { key: "cards", delay: 1320 },
  { key: "feed", delay: 1500 },
];
