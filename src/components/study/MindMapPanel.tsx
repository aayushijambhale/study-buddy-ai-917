import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiShare2, FiZap, FiDownload, FiImage } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStudy, type MindMap } from "@/context/StudyContext";
import { generateMindMap } from "@/lib/study.functions";
import { downloadMindMapSvg, downloadMindMapPng } from "@/lib/mindmap-export";

export function MindMapPanel() {
  const { pdf, mindMap, setMindMap, bump, awardXp } = useStudy();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<{ branch: number; child: number } | null>(null);

  if (!pdf) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
        Upload a PDF first to generate a mind map.
      </div>
    );
  }

  const run = async () => {
    setLoading(true);
    try {
      const res = await generateMindMap({ data: { text: pdf.content } });
      setMindMap(res);
      bump("mindMapsGenerated");
      awardXp(20);
      toast.success("Mind map ready!");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't build the mind map.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mind Map</h1>
          <p className="text-muted-foreground mt-1">
            A visual concept map of the most important ideas in your document.
          </p>
        </div>
        <div className="flex gap-2">
          {mindMap && (
            <>
              <Button variant="outline" onClick={() => downloadMindMapSvg(mindMap)}>
                <FiDownload className="mr-1" /> SVG
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await downloadMindMapPng(mindMap);
                  } catch (e) {
                    console.error(e);
                    toast.error("PNG export failed — SVG downloaded instead.");
                    downloadMindMapSvg(mindMap);
                  }
                }}
              >
                <FiImage className="mr-1" /> PNG
              </Button>
            </>
          )}
          <Button onClick={run} disabled={loading}>
            <FiZap className="mr-1" />
            {mindMap ? "Regenerate" : loading ? "Drawing…" : "Generate mind map"}
          </Button>
        </div>
      </header>

      {loading && (
        <div className="glass rounded-2xl p-10 text-center animate-pulse text-muted-foreground">
          Drawing your map…
        </div>
      )}

      {!mindMap && !loading && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <FiShare2 className="mx-auto size-8 mb-3 opacity-50" />
          Click Generate mind map to start.
        </div>
      )}

      {mindMap && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-3 md:p-5"
        >
          <MindMapSvg mindMap={mindMap} active={active} onSelect={setActive} />
          {active && (
            <div className="mt-4 rounded-xl border bg-card p-4">
              <div
                className="text-xs uppercase tracking-wide font-semibold mb-1"
                style={{ color: mindMap.branches[active.branch].color }}
              >
                {mindMap.branches[active.branch].label}
              </div>
              <div className="font-semibold">
                {mindMap.branches[active.branch].children[active.child].label}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {mindMap.branches[active.branch].children[active.child].detail}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function MindMapSvg({
  mindMap,
  active,
  onSelect,
}: {
  mindMap: MindMap;
  active: { branch: number; child: number } | null;
  onSelect: (a: { branch: number; child: number } | null) => void;
}) {
  const W = 900;
  const H = 700;
  const cx = W / 2;
  const cy = H / 2;
  const branchRadius = 220;
  const childRadius = 130;

  const layout = useMemo(() => {
    return mindMap.branches.map((b, bi) => {
      const angle = (bi / mindMap.branches.length) * Math.PI * 2 - Math.PI / 2;
      const bx = cx + Math.cos(angle) * branchRadius;
      const by = cy + Math.sin(angle) * branchRadius;
      const children = b.children.map((c, ci) => {
        const spread = Math.PI / 2.2;
        const step = b.children.length > 1 ? spread / (b.children.length - 1) : 0;
        const ca = angle - spread / 2 + step * ci;
        const childX = bx + Math.cos(ca) * childRadius;
        const childY = by + Math.sin(ca) * childRadius;
        return { ...c, x: childX, y: childY };
      });
      return { ...b, x: bx, y: by, children };
    });
  }, [mindMap, cx, cy]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Mind map: ${mindMap.topic}`}
    >
      {/* edges branch -> center */}
      {layout.map((b, bi) => (
        <g key={`b-${bi}`}>
          <path
            d={`M ${cx} ${cy} Q ${(cx + b.x) / 2} ${cy} ${b.x} ${b.y}`}
            stroke={b.color}
            strokeWidth={3}
            fill="none"
            opacity={0.7}
          />
          {b.children.map((c, ci) => (
            <line
              key={`l-${bi}-${ci}`}
              x1={b.x}
              y1={b.y}
              x2={c.x}
              y2={c.y}
              stroke={b.color}
              strokeWidth={1.5}
              opacity={0.45}
            />
          ))}
        </g>
      ))}

      {/* center node */}
      <g>
        <circle cx={cx} cy={cy} r={70} fill="currentColor" className="text-primary" />
        <foreignObject x={cx - 65} y={cy - 30} width={130} height={60}>
          <div className="w-full h-full flex items-center justify-center text-center text-primary-foreground text-sm font-bold leading-tight px-1">
            {mindMap.topic}
          </div>
        </foreignObject>
      </g>

      {/* branches */}
      {layout.map((b, bi) => (
        <g key={`bg-${bi}`}>
          <circle cx={b.x} cy={b.y} r={50} fill={b.color} opacity={0.95} />
          <foreignObject x={b.x - 46} y={b.y - 24} width={92} height={48}>
            <div className="w-full h-full flex items-center justify-center text-center text-white text-[11px] font-bold leading-tight px-1">
              {b.label}
            </div>
          </foreignObject>
          {b.children.map((c, ci) => {
            const isActive =
              active?.branch === bi && active?.child === ci;
            return (
              <g
                key={`c-${bi}-${ci}`}
                className="cursor-pointer"
                onClick={() => onSelect({ branch: bi, child: ci })}
              >
                <rect
                  x={c.x - 60}
                  y={c.y - 18}
                  width={120}
                  height={36}
                  rx={10}
                  fill="white"
                  stroke={b.color}
                  strokeWidth={isActive ? 3 : 1.5}
                  className="drop-shadow-sm"
                />
                <foreignObject x={c.x - 58} y={c.y - 16} width={116} height={32}>
                  <div className="w-full h-full flex items-center justify-center text-center text-[10px] font-semibold leading-tight px-1 text-slate-800">
                    {c.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

