"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Project } from "@/lib/types";
import { sitePath } from "@/lib/content";

function ProjectMark({ project }: { project: Project }) {
  if (project.image) return <img src={sitePath(project.image)} alt="" />;
  return <svg viewBox="0 0 120 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
    {project.art === "layers" ? <>{[0, 1, 2].map((i) => <path key={i} d={`M18 ${22 + i * 9} 66 ${8 + i * 9} 106 ${24 + i * 9} 58 ${39 + i * 9}Z`} opacity={0.35 + i * 0.25} />)}</>
    : project.art === "flow" ? <>{[0, 1, 2].map((i) => <path key={i} d={`M8 ${22 + i * 10} C36 ${-4 + i * 10} 76 ${66 + i * 10} 112 ${23 + i * 10}`} opacity={0.35 + i * 0.25} />)}</>
    : <><ellipse cx="60" cy="32" rx="45" ry="18" /><ellipse cx="60" cy="32" rx="38" ry="14" opacity=".4" /><circle cx="60" cy="32" r="5" opacity=".6" /></>}
  </svg>;
}

export const sectionId = (project: Project, index: number) => `${project.id}-section-${index + 1}`;

export function ProjectSections({ project }: { project: Project }) {
  return <>{project.sections.map((section, i) => <section className="detail-section" id={sectionId(project, i)} key={i} tabIndex={-1} data-reading-section={i}>
    <h3><span className="num">{String(i + 1).padStart(2, "0")}</span>{section.title}</h3><p>{section.body}</p>
  </section>)}</>;
}

export function ProjectDetail({ project, index, projects, onNavigate, metadata }: {
  project: Project; index: number; projects: Project[];
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, key: string) => void;
  metadata: ReactNode;
}) {
  const body = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(-1);
  const go = (i: number) => {
    const box = body.current, target = document.getElementById(sectionId(project, i));
    if (!box || !target) return;
    window.dispatchEvent(new Event("portfolio:show-chrome"));
    const root = box.closest<HTMLElement>(".project-browser");
    const offset = root ? parseFloat(getComputedStyle(root).getPropertyValue("--reading-top")) || 12 : 12;
    box.scrollTo({ top: Math.max(0, box.scrollTop + target.getBoundingClientRect().top - box.getBoundingClientRect().top - offset), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    target.focus({ preventScroll: true });
    setAt(i);
  };
  useEffect(() => {
    const box = body.current;
    if (!box) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = box.closest<HTMLElement>(".project-browser");
      const offset = root ? parseFloat(getComputedStyle(root).getPropertyValue("--reading-top")) || 12 : 12;
      const line = box.getBoundingClientRect().top + offset + 4;
      let current = -1;
      for (const section of box.querySelectorAll<HTMLElement>("[data-reading-section]")) {
        if (section.getBoundingClientRect().top <= line) current = Number(section.dataset.readingSection);
      }
      if (box.scrollTop > 0 && box.scrollTop + box.clientHeight >= box.scrollHeight - 2) current = Math.max(0, project.sections.length - 1);
      setAt(current);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    box.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("portfolio:reading-offset", queue);
    window.addEventListener("resize", queue);
    update();
    return () => { cancelAnimationFrame(frame); box.removeEventListener("scroll", queue); window.removeEventListener("portfolio:reading-offset", queue); window.removeEventListener("resize", queue); };
  }, [project]);
  const back = <a className="detail-back" href={`#project/${project.id}`} onClick={(e) => onNavigate(e, `project/${project.id}`)}>← 돌아가기</a>;
  return <section className="detail-pane" aria-labelledby="detail-title">
    <header className="detail-head"><div><p className="stage-kicker">{project.category} · {project.period}</p><h2 id="detail-title">{project.name}</h2></div>{back}</header>
    <div className="detail-body" ref={body} tabIndex={0} aria-label={`${project.name} 상세 본문`}>
      <div className="detail-content"><div className="detail-layout">
        <aside className="detail-place" aria-label="상세 목차와 현재 위치">
          <div className="detail-mark"><ProjectMark project={project} /></div>
          <div className="detail-location" aria-live="polite"><span>{project.name}</span><b>{project.sections[at]?.title || "개요"}</b></div>
          <nav className="detail-toc" aria-label="상세 목차"><button type="button" aria-current={at === -1 ? "location" : undefined} onClick={() => { window.dispatchEvent(new Event("portfolio:show-chrome")); body.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); setAt(-1); }}>개요와 담당 역할</button>
            {project.sections.map((section, i) => <button key={i} type="button" aria-current={at === i ? "location" : undefined} onClick={() => go(i)}><span className="num">{String(i + 1).padStart(2, "0")}</span><b>{section.title}</b></button>)}
          </nav>{back}
        </aside>
        <article className="detail-copy"><p className="detail-intro">{project.summary}</p>{metadata}<ProjectSections project={project} /></article>
      </div></div>
    </div>
    <footer className="detail-footer"><div className="detail-adjacent">
      {index > 0 && <a href={`#project/${projects[index - 1].id}/details`} onClick={(e) => onNavigate(e, `project/${projects[index - 1].id}/details`)}>← {projects[index - 1].name}</a>}
      {index < projects.length - 1 && <a href={`#project/${projects[index + 1].id}/details`} onClick={(e) => onNavigate(e, `project/${projects[index + 1].id}/details`)}>{projects[index + 1].name} →</a>}
    </div><button type="button" onClick={() => { window.dispatchEvent(new Event("portfolio:show-chrome")); body.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}>맨 위로 ↑</button></footer>
  </section>;
}
