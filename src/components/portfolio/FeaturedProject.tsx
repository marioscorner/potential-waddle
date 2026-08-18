import { ExternalLink, FolderOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const FeaturedProject = () => {
  const { t, language } = useLanguage();
  const { content } = useContent();
  const featuredData = content?.featured?.[language] || t.featured;
  const projectTitle = featuredData.projectTitle || "Taekwondo Mario Gutiérrez";
  const projectUrl = content?.featured?.url || "https://github.com/marioscorner";
  const isComingSoon = false;

  return (
    <article className="bento-card-featured group flex flex-col justify-between h-full" aria-labelledby="featured-project-title">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <p className="section-label">{featuredData.title || t.featured.label}</p>
        </div>

        <h2 id="featured-project-title" className="mb-1 text-base font-semibold text-foreground">
          {projectTitle}
        </h2>

        {isComingSoon && (
          <span className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {featuredData.comingSoon || t.featured.comingSoon}
          </span>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed">
          {featuredData.description}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
          {featuredData.description2}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{featuredData.cta}</p>
      </div>

      <a
        href={projectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-2"
        aria-label={`${featuredData.visitWeb || t.featured.visitWeb} ${projectTitle}`}
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{featuredData.visitWeb || t.featured.visitWeb}</span>
      </a>
    </article>
  );
};

export default FeaturedProject;
