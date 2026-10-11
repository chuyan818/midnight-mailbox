export interface RedactionResult {
  redacted: string;
  changed: boolean;
  fields: string[];
  requiresHumanReview: boolean;
}

const RULES: Array<{ field: string; pattern: RegExp; replacement: string }> = [
  { field: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[邮箱]" },
  { field: "phone", pattern: /(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/g, replacement: "[电话]" },
  { field: "phone", pattern: /(?<!\d)0\d{2,3}[- ]?\d{7,8}(?!\d)/g, replacement: "[电话]" },
  { field: "id_number", pattern: /(?<![A-Z0-9])\d{17}[\dX](?![A-Z0-9])/gi, replacement: "[证件号]" },
  { field: "social_handle", pattern: /(?<![\w])@[a-z0-9_.-]{2,32}/gi, replacement: "[社交账号]" },
  { field: "url", pattern: /https?:\/\/[^\s]+/gi, replacement: "[链接]" },
  { field: "address", pattern: /(详细地址|住址|家庭住址|我住在|地址是)[:：]?[^，。；;\n]{2,40}/g, replacement: "$1：[地址]" },
  { field: "name", pattern: /(我叫|姓名是|名字叫|联系人是)[:：]?[^，。；;\n]{2,12}/g, replacement: "$1：[姓名]" },
];

export function redactForPublic(text: string): RedactionResult {
  let redacted = text;
  const fields: string[] = [];

  for (const rule of RULES) {
    if (rule.pattern.test(redacted)) {
      redacted = redacted.replace(rule.pattern, rule.replacement);
      fields.push(rule.field);
      rule.pattern.lastIndex = 0;
    }
  }

  const changed = redacted !== text;
  const requiresHumanReview = /(?:我的同事|我的老师|我的老板|我的孩子|我的伴侣).{0,10}(姓名|电话|住址|学校|公司)/.test(text);

  return {
    redacted,
    changed,
    fields: Array.from(new Set(fields)),
    requiresHumanReview,
  };
}
