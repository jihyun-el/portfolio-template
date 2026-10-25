"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { PortfolioData, Project, PublicLink } from "@/lib/types";
import { sitePath } from "@/lib/content";
import { ThemeToggle } from "./theme-toggle";
import { ProjectArt } from "./project-art";
import { ProjectDetail, ProjectSections } from "./project-detail";
import { useReadingChrome } from "@/lib/use-reading-chrome";

function Links({ links }: { links: PublicLink[] }) {
  return <div className="public-links">{links.map((link) => <a key={link.url} href={link.url} {...(link.url.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label} <span aria-hidden="true">↗</span></a>)}</div>;
}
function ProjectMetadata({ project }: { project: Project }) {
  return <div className="detail-meta"><p>{project.role}</p><ul className="tags">{project.stack.map((name) => <li key={name}>{name}</li>)}</ul><Links links={project.links} /></div>;
}
export function ProjectBody({ project }: { project: Project }) {
  return <div className="project-body"><ProjectMetadata project={project} /><ProjectSections project={project} /></div>;
}
function Accent({ text, accent }: { text: string; accent: string }) {
  const at = accent ? text.indexOf(accent) : -1;
  return at < 0 ? text : <>{text.slice(0, at)}<em>{accent}</em>{text.slice(at + accent.length)}</>;
}
export function Portfolio({ data }: { data: PortfolioData }) {
  const { profile, projects } = data;
  const first = projects[0] ? `project/${projects[0].id}` : "about";
  const [selected, setSelected] = useState(first);
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  useReadingChrome(root, selected);
  const valid = (key: string) => ["about", "skills", "writing"].includes(key) || projects.some((p) => key === `project/${p.id}` || key === `project/${p.id}/details`);
  useEffect(() => {
    const sync = () => {
      let key = "";
      try { key = decodeURIComponent(window.location.hash.slice(1)); } catch {}
      setSelected(valid(key) ? key : first);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
    // The selected content is immutable during a page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first, projects]);
  const choose = (event: MouseEvent<HTMLAnchorElement>, key: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    if (selected !== key) window.history.pushState(null, "", `#${key}`);
    setSelected(key);
    main.current?.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  };
  const project = projects.find((p) => selected === `project/${p.id}` || selected === `project/${p.id}/details`);
  const detail = selected.endsWith("/details");
  const current = (key: string) => selected === key || selected === `${key}/details` ? "page" as const : undefined;
  return <div className="project-browser" ref={root}>
    <aside className="browser-side">
      <div className="browser-identity"><div className="browser-id-row browser-name-row"><div className="browser-name"><h1><a href={`#${first}`} onClick={(e) => choose(e, first)}>{profile.name}</a></h1><p>{profile.role}</p></div><ThemeToggle /></div><p className="browser-fields">{profile.fields.join(" · ")}</p></div>
      <nav className="browser-choices" aria-label="프로젝트 선택">
        {projects.map((p, i) => <a key={p.id} href={`#project/${p.id}`} aria-current={current(`project/${p.id}`)} onClick={(e) => choose(e, `project/${p.id}`)}><span className="browser-no num">{String(i + 1).padStart(2, "0")}</span><b>{p.name}</b><em>{p.category}</em></a>)}
      </nav>
      <nav className="browser-resources" aria-label="소개와 기록"><a href="#about" aria-current={current("about")} onClick={(e) => choose(e, "about")}>소개·이력</a><a href="#skills" aria-current={current("skills")} onClick={(e) => choose(e, "skills")}>기술 스택</a><a href="#writing" aria-current={current("writing")} onClick={(e) => choose(e, "writing")}>글과 기록</a></nav>
      <Links links={profile.links} />
      {data.site.example && <p className="template-note">샘플 포트폴리오<br />내용을 내 이야기로 바꿔 보세요.</p>}
    </aside>
    <main ref={main} id="main-content" className={`browser-main${detail ? " is-detail" : ""}`} tabIndex={-1}>
      <div key={project?.id || selected} className="scene" hidden={detail} aria-label={project?.name || "프로필"}>
        {project ? <>
          <header className="stage-head"><p className="stage-kicker num"><b>{String(projects.indexOf(project) + 1).padStart(2, "0")}</b><span>{project.name}</span><span>{project.period}</span></p>
            <div className="stage-heading"><h2 className="stage-title"><Accent text={project.title} accent={project.accent} /></h2>
              <a className="stage-go" href={sitePath(`/projects/${project.id}/`)} onClick={(e) => choose(e, `project/${project.id}/details`)}>만든 과정 보기 <span aria-hidden="true">→</span></a>
            </div>
            <p className="stage-summary">{project.summary}</p><p className="stage-role">{project.role}</p>
          </header>
          <ProjectArt project={project} /><footer className="stage-foot"><ul className="tags">{project.stack.map((name) => <li key={name}>{name}</li>)}</ul><Links links={project.links} /></footer>
        </> : selected === "skills" ? <section className="text-page"><p className="eyebrow">TOOLS & PRACTICE</p><h2>기술 스택</h2><p className="page-intro">직접 사용한 기술과, 그 기술로 해 본 일입니다.</p>{data.skills.length ? <div className="skills-grid">{data.skills.map((skill) => <article key={skill.name}><h3>{skill.name}</h3><p>{skill.usage}</p></article>)}</div> : <p className="empty-state">아직 등록한 기술이 없습니다.</p>}</section>
        : selected === "writing" ? <section className="text-page"><p className="eyebrow">NOTES & QUESTIONS</p><h2>글과 기록</h2><p className="page-intro">만들면서 만난 문제와 그 문제를 풀어 간 기록입니다.</p>{data.writing.length ? <div className="writing-list">{data.writing.map((post) => <article key={post.url}><a href={post.url} target="_blank" rel="noopener noreferrer"><h3>{post.title} ↗</h3><p>{post.summary}</p></a></article>)}</div> : <p className="empty-state">아직 등록한 글이 없습니다.</p>}</section>
        : <section className="text-page"><p className="eyebrow">ABOUT ME</p><h2>{profile.name}</h2><p className="about-intro">{profile.intro}</p><Links links={profile.links} />
          {[{ name: "경험", rows: profile.experiences }, { name: "교육", rows: profile.education }].map((group) => group.rows.length > 0 && <section className="record-group" key={group.name}><h3>{group.name}</h3>{group.rows.map((row, i) => <article key={i}><span className="num">{row.period}</span><div><h4>{row.title}</h4><p>{row.description}</p></div></article>)}</section>)}
        </section>}
      </div>
      {project && detail && <ProjectDetail key={project.id} project={project} projects={projects} index={projects.indexOf(project)} onNavigate={choose} metadata={<ProjectMetadata project={project} />} />}
      <noscript><div className="noscript-links"><p>프로젝트 상세 페이지</p>{projects.map((p) => <a key={p.id} href={sitePath(`/projects/${p.id}/`)}>{p.name} →</a>)}</div></noscript>
    </main>
  </div>;
}
