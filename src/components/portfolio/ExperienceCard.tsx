import { Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";
import { formatExperiencePeriod, sortExperiences } from "@/lib/experience";

const ExperienceCard = () => {
  const { t, language } = useLanguage();
  const { content } = useContent();
  const workExperience = Array.isArray(content?.experience)
    ? sortExperiences(content.experience)
    : [];

  return (
    <section className="bento-card flex flex-col" aria-labelledby="experience-title">
      <div className="mb-1 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        <h2 id="experience-title" className="section-label">{t.techStack.experience}</h2>
      </div>

      <div className="space-y-1">
        {workExperience.map((job, index) => (
          <article key={index} className="space-y-1">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-base font-semibold text-foreground">
                {job.position?.[language]}
              </h3>
              <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
              <time className="text-xs text-muted-foreground" dateTime={job.startDate}>
                {formatExperiencePeriod(job, language)}
              </time>
            </div>
            {job.responsibilities?.[language]?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {job.responsibilities[language].map((responsibility, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5"
                  >
                    {responsibility}
                  </li>
                ))}
              </ul>
            )}
            {index < workExperience.length - 1 && (
              <div className="border-t border-border pt-1 mt-1" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default ExperienceCard;
