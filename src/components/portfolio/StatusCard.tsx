import { UserCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContent } from "@/contexts/ContentContext";

const StatusCard = () => {
  const { language, t } = useLanguage();
  const { content } = useContent();

  const statusData = content?.status?.[language];
  const indicatorColor = content?.status?.indicatorColor || "#22c55e";

  return (
    <section className="bento-card flex flex-col" aria-labelledby="status-title">
      <div className="mb-1 flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <h2 id="status-title" className="section-label">{statusData?.status || t.techStack.status}</h2>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: indicatorColor }}
            ></span>
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: indicatorColor }}
            ></span>
          </span>
          <span className="text-sm font-medium text-foreground">
            {statusData?.available || t.techStack.available}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {statusData?.statusDetail || t.techStack.statusDetail}
        </p>
      </div>
    </section>
  );
};

export default StatusCard;
