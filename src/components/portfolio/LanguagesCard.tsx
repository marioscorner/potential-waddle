import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const LanguagesCard = () => {
  const { t, language } = useLanguage();
  const { content } = useContent();

  // Editable content - Languages
  const languages: Array<{
    name: { es: string; en: string };
    level: { es: string; en: string };
  }> = Array.isArray(content?.languages) ? content.languages : [
    {
      name: { es: "Español", en: "Spanish" },
      level: { es: "Nativo", en: "Native" },
    },
    {
      name: { es: "Inglés", en: "English" },
      level: { es: "C1", en: "C1" },
    },
    {
      name: { es: "Alemán", en: "German" },
      level: { es: "A1", en: "A1" },
    },
  ];

  return (
    <section className="bento-card flex flex-col h-full" aria-labelledby="languages-title">
      <div className="mb-1 flex items-center gap-2">
        <Languages className="h-4 w-4 text-primary" />
        <h2 id="languages-title" className="section-label">{t.languages.title}</h2>
      </div>

      <div className="space-y-1">
        {languages.length > 0 ? (
          languages.map((lang, index) => (
            <div key={index} className="space-y-0.5">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {lang.name[language]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lang.level[language]}
                </p>
              </div>
              {index < languages.length - 1 && (
                <div className="border-t border-border pt-1" />
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t.languages.empty}</p>
        )}
      </div>
    </section>
  );
};

export default LanguagesCard;
