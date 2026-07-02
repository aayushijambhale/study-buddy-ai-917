import type { MindMap } from "@/context/StudyContext";

// Standalone SVG export for mind maps. Uses <text>/<tspan> so the file renders
// correctly in any SVG viewer AND can be rasterized to a PNG via a canvas
// (foreignObject/HTML rasterization is unreliable across browsers).

const W = 900;
const H = 700;
const BRANCH_R = 220;
const CHILD_R = 130;

interface LaidOutChild {
  label: string;
  x: number;
  y: number;
}
interface LaidOutBranch {
  label: string;
  color: string;
  x: number;
  y: number;
  children: LaidOutChild[];
}

function layout(mindMap: MindMap): LaidOutBranch[] {
  const cx = W / 2;
  const cy = H / 2;
  return mindMap.branches.map((b, bi) => {
    const angle = (bi / mindMap.branches.length) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(angle) * BRANCH_R;
    const by = cy + Math.sin(angle) * BRANCH_R;
    const spread = Math.PI / 2.2;
    const step = b.children.length > 1 ? spread / (b.children.length - 1) : 0;
    const children = b.children.map((c, ci) => {
      const ca = angle - spread / 2 + step * ci;
      return {
        label: c.label,
        x: bx + Math.cos(ca) * CHILD_R,
        y: by + Math.sin(ca) * CHILD_R,
      };
    });
    return { label: b.label, color: b.color, x: bx, y: by, children };
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Wrap a label to at most `maxLines` lines with approximate `maxCharsPerLine`.
function wrap(label: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (trial.length > maxCharsPerLine && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = trial;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length > maxCharsPerLine - 1 ? last.slice(0, maxCharsPerLine - 1) + "…" : last + "…";
  }
  return lines;
}

function textBlock(
  x: number,
  y: number,
  lines: string[],
  fontSize: number,
  color: string,
  weight = 700,
): string {
  const lineHeight = fontSize * 1.15;
  const total = (lines.length - 1) * lineHeight;
  const startY = y - total / 2;
  const tspans = lines
    .map(
      (ln, i) =>
        `<tspan x="${x}" y="${startY + i * lineHeight}">${escapeXml(ln)}</tspan>`,
    )
    .join("");
  return `<text text-anchor="middle" dominant-baseline="central" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}">${tspans}</text>`;
}

export function buildStandaloneSvg(mindMap: MindMap): string {
  const cx = W / 2;
  const cy = H / 2;
  const laid = layout(mindMap);

  const edges = laid
    .map((b) => {
      const branchEdge = `<path d="M ${cx} ${cy} Q ${(cx + b.x) / 2} ${cy} ${b.x} ${b.y}" stroke="${b.color}" stroke-width="3" fill="none" opacity="0.7"/>`;
      const childEdges = b.children
        .map(
          (c) =>
            `<line x1="${b.x}" y1="${b.y}" x2="${c.x}" y2="${c.y}" stroke="${b.color}" stroke-width="1.5" opacity="0.45"/>`,
        )
        .join("");
      return branchEdge + childEdges;
    })
    .join("");

  const center = `<circle cx="${cx}" cy="${cy}" r="70" fill="#0ea5e9"/>${textBlock(
    cx,
    cy,
    wrap(mindMap.topic, 14, 3),
    14,
    "#ffffff",
    800,
  )}`;

  const branches = laid
    .map((b) => {
      const node = `<circle cx="${b.x}" cy="${b.y}" r="50" fill="${b.color}" opacity="0.95"/>${textBlock(
        b.x,
        b.y,
        wrap(b.label, 13, 3),
        11,
        "#ffffff",
        800,
      )}`;
      const children = b.children
        .map(
          (c) =>
            `<rect x="${c.x - 60}" y="${c.y - 18}" width="120" height="36" rx="10" fill="#ffffff" stroke="${b.color}" stroke-width="1.5"/>${textBlock(
              c.x,
              c.y,
              wrap(c.label, 18, 2),
              10,
              "#1e293b",
              700,
            )}`,
        )
        .join("");
      return node + children;
    })
    .join("");

  const title = escapeXml(mindMap.topic);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Mind map: ${title}">
  <title>Mind map: ${title}</title>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${edges}
  ${center}
  ${branches}
</svg>`;
}

function safeName(topic: string): string {
  return (topic || "mindmap").replace(/[^a-z0-9-]+/gi, "_").slice(0, 60);
}

function trigger(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadMindMapSvg(mindMap: MindMap): void {
  const svg = buildStandaloneSvg(mindMap);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  trigger(url, `${safeName(mindMap.topic)}-mindmap.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadMindMapPng(mindMap: MindMap, scale = 2): Promise<void> {
  const svg = buildStandaloneSvg(mindMap);
  // Use base64 data URL to avoid canvas tainting issues in some browsers.
  const b64 =
    typeof window !== "undefined" && "btoa" in window
      ? window.btoa(unescape(encodeURIComponent(svg)))
      : "";
  const dataUrl = `data:image/svg+xml;base64,${b64}`;

  const img = new Image();
  img.decoding = "sync";
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load SVG for rasterization"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      trigger(url, `${safeName(mindMap.topic)}-mindmap.png`);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve();
    }, "image/png");
  });
}
