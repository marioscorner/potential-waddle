import { ExternalLink, Code } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const ProjectsCard = () => {
  const { t, language } = useLanguage();
  const { content } = useContent();
  const projectsData = content?.projects?.[language] || t.projects;
  const githubUrl = content?.projects?.url || "https://github.com/marioscorner";

  return (
    <section className="bento-card flex flex-col justify-between h-full" aria-labelledby="projects-title">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          <h2 id="projects-title" className="section-label">{projectsData.title}</h2>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {projectsData.description}
        </p>
      </div>

      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
        aria-label={projectsData.visitGitHub}
      >
        <FaGithub className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{projectsData.visitGitHub}</span>
      </a>
    </section>
  );
};

export default ProjectsCard;
