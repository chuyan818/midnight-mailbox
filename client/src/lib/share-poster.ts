import QRCode from "qrcode";

export interface LetterPosterOptions {
  content: string;
  shareUrl: string;
  letterId: string;
  backgroundType?: string;
  language?: string;
}

const posterBackgrounds: Record<
  string,
  { top: string; bottom: string; accent: string }
> = {
  星空漫漫: { top: "#10163f", bottom: "#34285d", accent: "#ffd580" },
  牛皮纸: { top: "#f1d0a7", bottom: "#bb7a54", accent: "#fff4dc" },
  樱花来信: { top: "#ffe9f0", bottom: "#f4a9c3", accent: "#9c456b" },
  秋日落信: { top: "#ffbd73", bottom: "#c85c4d", accent: "#fff2ce" },
  节日灯火: { top: "#203f60", bottom: "#a84f66", accent: "#ffd66e" },
};

const posterCopy: Record<
  string,
  { eyebrow: string; footer: string; qrHint: string }
> = {
  zh: {
    eyebrow: "一封写给深夜的信",
    footer: "深夜信箱 · 让心事被温柔接住",
    qrHint: "扫码打开信件",
  },
  en: {
    eyebrow: "A letter for the night",
    footer: "Midnight Mailbox · A softer place for your heart",
    qrHint: "Scan to open",
  },
  ja: {
    eyebrow: "夜に宛てた手紙",
    footer: "Midnight Mailbox · 心をやさしく受け止める場所",
    qrHint: "スキャンして開く",
  },
  ko: {
    eyebrow: "밤에 보내는 편지",
    footer: "Midnight Mailbox · 마음을 다정하게 안아주는 곳",
    qrHint: "스캔하여 열기",
  },
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n/)) {
    let line = "";
    for (const character of paragraph) {
      const candidate = line + character;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = character;
        if (lines.length >= maxLines) break;
      } else line = candidate;
    }
    if (lines.length >= maxLines) break;
    if (line || paragraph === "") lines.push(line);
    if (lines.length >= maxLines) break;
  }
  const originalHasMore = text.length > lines.join("\n").length;
  if (originalHasMore && lines.length) {
    const last = lines.length - 1;
    while (
      context.measureText(`${lines[last]}…`).width > maxWidth &&
      lines[last].length > 1
    )
      lines[last] = lines[last].slice(0, -1);
    lines[last] += "…";
  }
  return lines;
}

function drawStars(context: CanvasRenderingContext2D, color: string) {
  context.fillStyle = color;
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 173) % 1080;
    const y = 70 + ((i * 97) % 1180);
    context.globalAlpha = i % 4 === 0 ? 0.85 : 0.42;
    context.beginPath();
    context.arc(x, y, i % 5 === 0 ? 2.4 : 1.1, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load QR code"));
    image.src = src;
  });
}

export async function createLetterPoster(options: LetterPosterOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported");

  const palette =
    posterBackgrounds[options.backgroundType || "星空漫漫"] ||
    posterBackgrounds["星空漫漫"];
  const copy = posterCopy[options.language || "zh"] || posterCopy.zh;
  const gradient = context.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, palette.top);
  gradient.addColorStop(1, palette.bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1350);
  drawStars(context, palette.accent);

  context.fillStyle = "rgba(255,255,255,0.13)";
  roundedRect(context, 74, 74, 932, 1202, 42);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.24)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = palette.accent;
  context.font =
    '600 30px "Noto Sans SC", "PingFang SC", system-ui, sans-serif';
  context.fillText(copy.eyebrow, 128, 164);
  context.fillStyle = "rgba(255,255,255,0.82)";
  context.font = "500 22px system-ui, sans-serif";
  context.fillText("MIDNIGHT MAILBOX", 128, 215);
  context.strokeStyle = palette.accent;
  context.globalAlpha = 0.75;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(128, 256);
  context.lineTo(952, 256);
  context.stroke();
  context.globalAlpha = 1;

  context.fillStyle = "rgba(255,255,255,0.96)";
  context.font = '500 40px "Noto Serif SC", "Songti SC", serif';
  wrapText(context, options.content.trim() || "", 780, 16).forEach(
    (line, index) => context.fillText(line, 128, 350 + index * 62)
  );

  const qrDataUrl = await QRCode.toDataURL(options.shareUrl, {
    width: 180,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#171a43", light: "#ffffff" },
  });
  const qrImage = await loadImage(qrDataUrl);
  context.fillStyle = "#ffffff";
  roundedRect(context, 814, 1012, 150, 190, 18);
  context.fill();
  context.drawImage(qrImage, 829, 1027, 120, 120);
  context.fillStyle = "#171a43";
  context.font = "600 15px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(copy.qrHint, 889, 1174);
  context.textAlign = "start";

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "400 22px system-ui, sans-serif";
  context.fillText(copy.footer, 128, 1168);
  context.fillStyle = "rgba(255,255,255,0.56)";
  context.font = "400 18px system-ui, sans-serif";
  context.fillText(options.shareUrl, 128, 1210, 650);

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, "image/png", 0.95)
  );
  if (!blob) throw new Error("Unable to create poster");
  return blob;
}

export function downloadPosterBlob(blob: Blob, letterId: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `midnight-mailbox-${letterId}.png`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export async function downloadLetterPoster(options: LetterPosterOptions) {
  const blob = await createLetterPoster(options);
  downloadPosterBlob(blob, options.letterId);
}
