"use client";

import { useRef, type CSSProperties } from "react";
import { LightField, type Scene } from "./light-field";
import type { Project } from "@/lib/types";
import { sitePath } from "@/lib/content";

// Decorative abstract studies, not measured data or a claim about a project's architecture.
// The brightness palette and additive point light are shared by all three studies.
export function ProjectArt({ project }: { project: Project }) {
  const pointer = useRef({ x: 0, y: 0 });
  const scene: Scene = (put, t, w, h, dark) => {
    const turn = t * 0.00009 + pointer.current.x * 0.3, tilt = -0.55 + pointer.current.y * 0.18;
    const scale = Math.min(w * 0.36, h * 0.43);
    const draw = (x: number, y: number, z: number, light: number, size = 4) => {
      const xx = x * Math.cos(turn) - z * Math.sin(turn), zz = x * Math.sin(turn) + z * Math.cos(turn);
      const yy = y * Math.cos(tilt) - zz * Math.sin(tilt), depth = y * Math.sin(tilt) + zz * Math.cos(tilt);
      const perspective = 3.6 / (3.6 + depth);
      put(w / 2 + xx * scale * perspective, h / 2 + yy * scale * perspective, size * perspective, light * (dark ? 2.5 : 1) * (0.7 + (1 - depth) * 0.15));
    };
    if (project.art === "orbit") {
      for (let ring = 0; ring < 9; ring++) for (let i = 0; i < 210; i++) {
        const a = i / 210 * Math.PI * 2, r = 0.85 + ring * 0.016;
        const glow = 0.2 + 0.65 * Math.pow((1 + Math.cos(a - t * 0.0005)) / 2, 8);
        draw(r * Math.cos(a), (ring - 4) * 0.03, r * Math.sin(a), glow, 4.2);
      }
      for (let i = 0; i < 180; i++) { const a = i * 2.39996, r = Math.sqrt(i / 180) * 0.23; draw(r * Math.cos(a), r * Math.sin(a), Math.sin(a) * 0.12, 0.32, 3.4); }
    } else if (project.art === "layers") {
      for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 42; i++) for (let j = 0; j < 28; j++) {
        const x = i / 41 * 1.8 - 0.9, z = j / 27 * 1.25 - 0.625;
        const edge = i === 0 || i === 41 || j === 0 || j === 27;
        draw(x, (layer - 1) * 0.46, z, edge ? 0.65 : 0.055 + 0.11 * (1 + Math.sin(i * 0.3 + j * 0.2 + t * 0.0007)) / 2, edge ? 4 : 2.6);
      }
    } else {
      for (let stream = 0; stream < 18; stream++) for (let i = 0; i < 150; i++) {
        const x = i / 149 * 2.8 - 1.4;
        const y = Math.sin(x * 2.5 + stream * 0.09 + t * 0.00035) * 0.26 + (stream - 8.5) * 0.018;
        draw(x, y, (stream - 8.5) * 0.032, 0.1 + 0.45 * Math.pow((1 + Math.cos(x * 3 - t * 0.001)) / 2, 8), 3.7);
      }
    }
  };
  if (project.image) return <figure className="project-image"><img src={sitePath(project.image)} alt={project.imageAlt} /><figcaption>{project.imageAlt}</figcaption></figure>;
  if (project.art === "none") return <div className="art-blank" aria-hidden="true"><span>{project.name}</span></div>;
  return <figure className="art-study" onPointerMove={(e) => { const b = e.currentTarget.getBoundingClientRect(); pointer.current = { x: (e.clientX - b.left) / b.width - 0.5, y: (e.clientY - b.top) / b.height - 0.5 }; }} onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}>
    <LightField scene={scene} label={`${project.name}의 추상 장식 그림`} still={3600}>
      <div className={`art-fallback art-fallback-${project.art}`} aria-hidden="true"><i /><i /><i /></div>
      {project.artLabels.map((label, i) => <span className="art-label" key={i} style={{ "--i": i } as CSSProperties}><b className="num">{String(i + 1).padStart(2, "0")}</b>{label}</span>)}
    </LightField>
    <figcaption><span className="num">{project.art.toUpperCase()} / ABSTRACT STUDY</span><span>장식용 추상 그래픽</span></figcaption>
  </figure>;
}
