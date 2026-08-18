import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  // Determinar el idioma opuesto y su bandera
  const oppositeLanguage = language === "es" ? "en" : "es";
  const flag = language === "es" ? "🇬🇧" : "🇪🇸";
  const ariaLabel = language === "es" ? "Switch to English" : "Cambiar a Español";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(oppositeLanguage)}
      className="h-10 w-10 text-lg"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {flag}
    </Button>
  );
};

export default LanguageToggle;

