import { useEffect, useState } from "react";
import { FileText, Globe2, Hand } from "lucide-react";
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa6";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const HeroSection = () => {
  const { language, t } = useLanguage();
  const { content } = useContent();
  const [uploadedCvUrl, setUploadedCvUrl] = useState("");
  const [uploadedHeroPhotoUrl, setUploadedHeroPhotoUrl] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchUploads = async () => {
      try {
        const response = await fetch("/api/uploads");
        if (!response.ok) throw new Error("Failed to fetch uploads");

        const uploads = await response.json();
        const uploadList = Array.isArray(uploads) ? uploads : [];
        const cvUpload = uploadList.find((upload) => upload.slot === `cv-${language}`)
          || uploadList.find((upload) => upload.document_type === "cv" && upload.language === language);
        const heroPhotoUpload = uploadList.find((upload) => upload.slot === "hero-photo");
        const getVersionedUrl = (upload) => {
          const cacheKey = upload?.updated_at || upload?.created_at || "";
          return upload?.url ? `${upload.url}${cacheKey ? `?v=${encodeURIComponent(cacheKey)}` : ""}` : "";
        };

        if (!ignore) {
          setUploadedCvUrl(getVersionedUrl(cvUpload));
          setUploadedHeroPhotoUrl(getVersionedUrl(heroPhotoUpload));
        }
      } catch (error) {
        if (!ignore) {
          setUploadedCvUrl("");
          setUploadedHeroPhotoUrl("");
        }
      }
    };

    fetchUploads();

    return () => {
      ignore = true;
    };
  }, [language]);

  const heroData = content?.hero?.[language] || t.hero;
  const socialLinks = content?.social || [];
  const socialIcons = { FaLinkedin, FaGithub, FaInstagram, Globe2 };

  const cvUrl = uploadedCvUrl || (language === "es" ? "/cv-es.pdf" : "/cv-en.pdf");
  const heroPhotoUrl = uploadedHeroPhotoUrl || "/MY_PHOTO.webp";

  return (
    <header className="bento-card flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 text-primary" />
          <span className="section-label">welcome</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-lg leading-relaxed text-foreground">
            {heroData.greeting} <span className="font-semibold">{heroData.name}</span>, {heroData.intro}
          </h1>

          <p className="text-sm text-muted-foreground">{heroData.cta}</p>
        </div>

        {/* Social Icons + CV */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {socialLinks.map((link) => {
            const IconComponent = socialIcons[link.icon] || Globe2;
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                aria-label={link.name}
                title={link.name}
              >
                <IconComponent className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{link.name}</span>
              </a>
            );
          })}

          <a href={cvUrl} download className="btn-primary">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{heroData.downloadCV}</span>
          </a>
        </div>
      </div>

      {/* Avatar */}
      <div className="shrink-0">
        <div className="h-28 w-28 overflow-hidden rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 sm:h-32 sm:w-32">
          <picture>
            <source srcSet={heroPhotoUrl} type="image/webp" />
            <img
              src={heroPhotoUrl}
              alt={`Photo of ${heroData.name || "Mario"}`}
              className="h-full w-full object-cover"
              width="512"
              height="512"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
