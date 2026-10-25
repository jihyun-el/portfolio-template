import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { portfolio } from "@/lib/content";
import { ProjectBody } from "@/components/portfolio";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectDetailRedirect } from "@/components/project-detail-redirect";
import { sitePath } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return portfolio.projects.map((p) => ({ id: p.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = portfolio.projects.find((p) => p.id === id);
  return { title: project?.name, description: project?.summary };
}
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = portfolio.projects.find((p) => p.id === id);
  if (!project) notFound();
  return <main id="main-content" className="standalone"><script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(`${sitePath("/")}#project/${id}/details`)})` }} /><ProjectDetailRedirect id={id} /><nav className="detail-nav"><Link href={`/#project/${project.id}`}>← 포트폴리오</Link><ThemeToggle /></nav>
    {portfolio.site.example && <p className="example-badge">샘플 프로젝트</p>}
    <header><p className="stage-kicker">{project.category} · {project.period}</p><h1>{project.name}</h1><p className="page-intro">{project.summary}</p></header><ProjectBody project={project} />
  </main>;
}
