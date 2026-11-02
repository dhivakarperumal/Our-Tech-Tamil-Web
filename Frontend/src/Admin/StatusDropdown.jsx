import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const options = [
  { value: "Active", description: "Visible to customers", dot: "bg-emerald-500" },
  { value: "Inactive", description: "Hidden from customers", dot: "bg-slate-400" },
];

const StatusDropdown = ({ label, value, onChange, disabled = false }) => {
  const listboxId = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value))
  );
  const [position, setPosition] = useState(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuHeight = options.length * 64 + 12;
    const openAbove = window.innerHeight - rect.bottom < menuHeight + 12
      && rect.top > menuHeight + 12;

    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - rect.width - 12)),
      top: openAbove ? rect.top - menuHeight - 8 : rect.bottom + 8,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    updatePosition();
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const reposition = () => updatePosition();
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen, updatePosition]);

  const selectOption = (index) => {
    onChange(options[index].value);
    setActiveIndex(index);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setActiveIndex(selectedIndex);
        setIsOpen(true);
      } else {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((current) => (current + direction + options.length) % options.length);
      }
      updatePosition();
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      setIsOpen(true);
      updatePosition();
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      selectOption(activeIndex);
    }
  };

  return (
    <div ref={rootRef} className="relative block text-sm font-semibold text-slate-700">
      {label}
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setIsOpen((open) => !open);
          updatePosition();
        }}
        onKeyDown={handleKeyDown}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm shadow-slate-900/[0.02] outline-none transition hover:border-violet-300 hover:bg-violet-50/30 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${selectedOption.dot}`} />
          {selectedOption.value}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-violet-600" : ""}`} />
      </button>
      {isOpen && position && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} options`}
          className="z-[120] rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-950/15 ring-1 ring-black/[0.03]"
          style={{ position: "fixed", left: position.left, top: position.top, width: position.width }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <div
                key={option.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(index)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  isActive ? "bg-violet-50" : "hover:bg-slate-50"
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${option.dot}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${isSelected ? "text-violet-800" : "text-slate-800"}`}>
                    {option.value}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">{option.description}</span>
                </span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-violet-700" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;
