type Experience = {
  company?: string;
  isCurrent?: boolean;
  startDate?: unknown;
  endDate?: unknown;
  period?: Record<string, unknown>;
  position?: Record<string, string>;
  responsibilities?: Record<string, string[]>;
};

const START_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const legacyMonths = {
  es: {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  },
  en: {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  },
};

export const isValidExperienceStartDate = (value: unknown): value is string =>
  typeof value === "string" && START_DATE_PATTERN.test(value);

const getLegacyDates = (period: Experience["period"]) => {
  const values = Object.entries(period || {});
  const dates = values.flatMap(([language, value]) => {
    const monthMap = legacyMonths[language as keyof typeof legacyMonths];
    if (!monthMap || typeof value !== "string") return [];

    return [...value.toLocaleLowerCase().matchAll(/([a-z]+)\s+(\d{4})/g)]
      .map(([, month, year]) => monthMap[month as keyof typeof monthMap] && `${year}-${monthMap[month as keyof typeof monthMap]}`)
      .filter(isValidExperienceStartDate);
  });

  return [...new Set(dates)];
};

const hasLegacyCurrentValue = (period: Experience["period"]) =>
  Object.values(period || {}).some(
    (value) => typeof value === "string" && /\b(actual|actualidad|currently|current|present)\b/i.test(value)
  );

export const normalizeExperience = <T extends Experience>(experience: T) => {
  const legacyDates = getLegacyDates(experience.period);
  const isCurrent = experience.isCurrent === true || hasLegacyCurrentValue(experience.period);
  const startDate = isValidExperienceStartDate(experience.startDate)
    ? experience.startDate
    : legacyDates[0] || "";
  const endDate = isCurrent
    ? ""
    : isValidExperienceStartDate(experience.endDate)
      ? experience.endDate
      : legacyDates[1] || "";

  return { ...experience, startDate, endDate, isCurrent };
};

export const normalizeExperiences = <T extends Experience>(experiences: T[]) =>
  experiences.map(normalizeExperience);

export const toStructuredExperiences = <T extends Experience>(experiences: T[]) =>
  normalizeExperiences(experiences).map(({ period, ...experience }) => experience);

export const sortExperiences = <T extends Experience>(experiences: T[]) =>
  normalizeExperiences(experiences).sort((first, second) => {
    const currentDifference = Number(second.isCurrent === true) - Number(first.isCurrent === true);
    if (currentDifference !== 0) return currentDifference;

    const firstStartDate = isValidExperienceStartDate(first.startDate) ? first.startDate : "";
    const secondStartDate = isValidExperienceStartDate(second.startDate) ? second.startDate : "";

    if (firstStartDate === secondStartDate) return 0;
    return firstStartDate > secondStartDate ? -1 : 1;
  });

export const formatExperienceMonth = (date: unknown, language: string) => {
  if (!isValidExperienceStartDate(date)) return "";

  const [year, month] = date.split("-").map(Number);
  const locale = language === "es" ? "es-ES" : "en-US";
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
};

export const formatExperiencePeriod = (experience: Experience, language: string) => {
  const normalized = normalizeExperience(experience);
  const startDate = formatExperienceMonth(normalized.startDate, language);
  if (!startDate) return typeof normalized.period?.[language] === "string" ? normalized.period[language] : "";

  if (normalized.isCurrent) {
    return `${startDate} - ${language === "es" ? "Actual" : "Present"}`;
  }

  const endDate = formatExperienceMonth(normalized.endDate, language);
  return endDate ? `${startDate} - ${endDate}` : startDate;
};
