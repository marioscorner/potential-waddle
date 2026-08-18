import { Code2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const TechnologiesCard = () => {
  const { t } = useLanguage();
  const { content } = useContent();

  // Editable content - Technologies (4 per row)
  const techStack = content?.technologies?.items || [
    "JavaScript",
    "TypeScript",
    "Node.js",
    "Express",
    "React",
    "Angular",
    "Python",
    "Django",
    "FastAPI",
    "PostgreSQL",
    "MySQL",
    "Docker",
    "Linux",
    "Git",
  ];

  return (
    <section className="bento-card flex flex-col" aria-labelledby="technologies-title">
      <div className="mb-1 flex items-center gap-2">
        <Code2 className="h-4 w-4 text-primary" />
        <h2 id="technologies-title" className="section-label">{t.technologies.label}</h2>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1.5">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary border border-primary/20"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologiesCard;
