import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatExperienceMonth, isValidExperienceStartDate } from "@/lib/experience";

const months = Array.from({ length: 12 }, (_, index) => index);

type MonthPickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const getYear = (value?: string) =>
  isValidExperienceStartDate(value) ? Number(value.slice(0, 4)) : new Date().getFullYear();

const MonthPicker = ({
  id,
  value = "",
  onChange,
  disabled = false,
  placeholder = "Select month",
}: MonthPickerProps) => {
  const [open, setOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(() => getYear(value));
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectMonth = (month: number) => {
    onChange(`${visibleYear}-${String(month + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          setVisibleYear(getYear(value));
          setOpen((current) => !current);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-left text-white outline-none transition-colors hover:border-primary/60 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        <span className={value ? "" : "text-gray-500"}>
          {value ? formatExperienceMonth(value, "en") : placeholder}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose month and year"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-2xl border border-white/10 bg-gray-950 p-4 shadow-2xl shadow-black/40"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setVisibleYear((year) => year - 1)}
              className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-white">{visibleYear}</span>
            <button
              type="button"
              onClick={() => setVisibleYear((year) => year + 1)}
              className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((month) => {
              const monthValue = `${visibleYear}-${String(month + 1).padStart(2, "0")}`;
              const selected = value === monthValue;

              return (
                <button
                  key={monthValue}
                  type="button"
                  onClick={() => selectMonth(month)}
                  aria-pressed={selected}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-primary text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(visibleYear, month, 1))}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-4 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
