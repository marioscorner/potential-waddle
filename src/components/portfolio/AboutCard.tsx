import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutCard = () => {
  const { t } = useLanguage();

  return (
    <section className="bento-card flex flex-col" aria-labelledby="about-title">
      <div className="mb-1 flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h2 id="about-title" className="section-label">{t.about.label}</h2>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.about.paragraph1}
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.about.paragraphFullStack}
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.about.paragraph2}
        </p>
      </div>
    </section>
  );
};

export default AboutCard;
