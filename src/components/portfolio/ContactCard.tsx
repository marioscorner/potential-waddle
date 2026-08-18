import { Mail, MapPin, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const ContactCard = () => {
  const { t, language } = useLanguage();
  const { content } = useContent();
  const contactData = content?.contact?.[language] || {};
  const email = contactData.email || "hello@marioscorner.com";
  const location = contactData.location || "Madrid/Málaga (posibilidad de desplazamiento)";

  return (
    <section
      className="bento-card flex flex-col justify-between h-full"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div>
        <div className="mb-1 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 id="contact-title" className="section-label">{contactData.title || t.contact.label}</h2>
        </div>

        <div className="space-y-2">
          <address className="not-italic">
            <div className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary cursor-default">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {location}
            </p>
          </address>
        </div>
      </div>

      <a href={`mailto:${email}`} className="btn-accent mt-2">
        <Mail className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{contactData.sendEmail || t.contact.sendEmail}</span>
      </a>
    </section>
  );
};

export default ContactCard;
