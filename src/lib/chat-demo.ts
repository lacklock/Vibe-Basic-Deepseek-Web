export type DemoChat = {
  id: string;
  title: string;
};

export type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  items?: string[];
};

export const demoChats: DemoChat[] = [
  { id: "demo-1", title: "如何制定一周学习计划" },
  { id: "demo-2", title: "如何提升团队协作效率" },
  { id: "demo-3", title: "产品需求文档示例" },
  { id: "demo-4", title: "Python 中的装饰器详解" },
  { id: "demo-5", title: "市场调研报告大纲" },
  { id: "demo-6", title: "旅行计划：日本东京五日游" },
  { id: "demo-7", title: "读书笔记：《原则》" },
  { id: "demo-8", title: "Vue 3 组合式 API 指南" },
  { id: "demo-9", title: "如何制定有效的 OKR" },
  { id: "demo-10", title: "个人年度计划模板" },
];

export const demoMessages: DemoMessage[] = [
  {
    id: "message-1",
    role: "user",
    content: "帮我制定一个适合上班族的一周学习计划。",
  },
  {
    id: "message-2",
    role: "assistant",
    content: "好的，以下是一份适合上班族的一周学习计划，兼顾工作与生活，帮助你稳步提升。",
    items: [
      "明确目标：确定本周学习的核心目标，例如掌握一个知识点或完成一本书。",
      "固定时间：每天安排 1 小时学习，建议放在早晨或睡前，保持专注。",
      "拆分任务：把目标拆成每天都能完成的小任务，循序渐进。",
      "周末复盘：回顾本周内容，整理笔记并补齐遗漏。",
    ],
  },
  {
    id: "message-3",
    role: "user",
    content: "每天只有一小时，周末可以多一点。",
  },
  {
    id: "message-4",
    role: "assistant",
    content: "了解了，基于你工作日每天 1 小时、周末时间更充裕的情况，可以这样安排：",
    items: [
      "周一至周五：复习 10 分钟、学习新内容 40 分钟、记录与总结 10 分钟。",
      "周六（2–3 小时）：深入学习本周重点，完成练习或一个小项目。",
      "周日（2 小时）：查漏补缺、整理资料，并预习下一周内容。",
    ],
  },
];

export function getDemoChat(chatId: string) {
  return demoChats.find((chat) => chat.id === chatId);
}
