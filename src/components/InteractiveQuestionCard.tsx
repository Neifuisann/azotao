import { useMemo, useState, KeyboardEvent, useEffect, useRef } from "react"
import { Check, Hash, BookAudio, Tags, MoreVertical } from "lucide-react"
import clsx from "clsx"

type Choice = {
  raw: string
  label: string  // "A", "B", ...
  text: string   // everything after "A. "
  starred: boolean
}

type Props = {
  rawLines: string[]          // the plain lines for ONE question block
  onToggleStar: (idx: number, starred: boolean) => void // callback to mutate the editor
  questionIndex: number       // 0‑based, for the header
}

/**
 * A single "card" = 1 question + N choices.
 * Works even if you allow multiple starred answers.
 */
export default function InteractiveQuestionCard({
  rawLines,
  onToggleStar,
  questionIndex,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  /* ---------- Parse ---------- */
  const { questionText, choices } = useMemo(() => {
    // Handle empty or invalid input
    if (!rawLines?.length) {
      return { questionText: "", choices: [] };
    }

    const q = rawLines[0].replace(/^Question\s+\d+:/i, "").trim()
    const parsed: Choice[] = rawLines.slice(1)
      .filter(l => l && l.trim()) // Filter out empty lines
      .map((l) => {
        const star = l.startsWith("*")
        const clean = star ? l.slice(1).trim() : l.trim()
        // Handle case where line doesn't match expected format
        const match = clean.match(/^([A-Z])[\.\)]\s*(.*)$/i)
        if (!match) {
          return { raw: l, label: "?", text: clean, starred: star }
        }
        const [, lbl, txt] = match
        return { raw: l, label: lbl, text: txt, starred: star }
      })
    return { questionText: q, choices: parsed }
  }, [rawLines]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Initial adjustment
    adjustHeight();

    // Adjust on window resize
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [questionText]); // Re-run when content changes

  const handleKey = (e: KeyboardEvent<HTMLDivElement>, idx: number) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      onToggleStar(idx, !choices[idx].starred)
    }
    if (e.key === "ArrowDown") {
      (e.currentTarget.parentElement?.children[idx + 1] as HTMLElement)?.focus()
    }
    if (e.key === "ArrowUp") {
      (e.currentTarget.parentElement?.children[idx - 1] as HTMLElement)?.focus()
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="border rounded-lg p-3 mb-4 bg-white dark:bg-zinc-800" style={{ borderColor: 'oklch(0 0 0 / 0.2)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 text-sm">
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
          {`Câu ${questionIndex + 1}.`}
        </span>
        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <Hash size={14} />
        </button>
        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <BookAudio size={14} />
        </button>
        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <Tags size={14} />
        </button>
        <button className="ml-auto text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Question text */}
      <textarea
        ref={textareaRef}
        className="w-full resize-none border rounded p-2 text-sm bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
        style={{ 
          borderColor: 'oklch(0 0 0 / 0.2)',
          overflow: 'hidden', // Hide scrollbar during auto-resize
        }}
        value={questionText}
        readOnly
      />

      {/* Choices */}
      <div className="mt-2">
        {choices.map((c, idx) => (
          <div
            key={idx}
            tabIndex={0}
            onKeyDown={(e) => handleKey(e, idx)}
            onMouseEnter={() => setHoverRow(idx)}
            onMouseLeave={() => setHoverRow(null)}
            onClick={() => onToggleStar(idx, !c.starred)}
            className={clsx(
              "flex items-center gap-2 mb-1 group cursor-pointer",
              c.starred && "bg-blue-50 dark:bg-blue-900/40"
            )}
          >

            {/* Letter pill */}
            <div
              className={clsx(
                "w-7 h-7 rounded flex items-center justify-center border text-sm font-medium",
                c.starred
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-blue-700 border-blue-700 group-hover:bg-blue-100 dark:text-blue-300 dark:border-blue-300"
              )}
              style={{ borderColor: c.starred ? undefined : 'oklch(0 0 0 / 0.2)' }}
            >
              {c.label}
            </div>

            {/* Choice text */}
            <div
              className={clsx(
                "flex-1 border rounded px-2 py-1 text-sm",
                c.starred
                  ? "border-blue-600 text-gray-900 dark:text-blue-100"
                  : "border-transparent group-hover:border-gray-300 dark:group-hover:border-gray-600 text-gray-900 dark:text-gray-100"
              )}
              style={{ borderColor: c.starred ? undefined : 'oklch(0 0 0 / 0.2)' }}
            >
              {c.text || <span className="text-gray-400 dark:text-gray-500">…</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 