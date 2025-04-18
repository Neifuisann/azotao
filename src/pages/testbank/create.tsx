/************************************************************
 * File: /src/pages/testbank/create.tsx
 * Adds auto-insert of A,B,C,D after "Question X:",
 * and auto-insert next question heading after finishing D.
 ************************************************************/
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InteractiveQuestionCard from "@/components/InteractiveQuestionCard";

// --- TIPTAP Imports ---
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { RegexHighlight } from "@/components/tiptap/RegexHighlight";
import { lineNumbers } from "@tiptap/extension-line-number"; 

// Some basic styles for your preview, etc. 
// (Kept as in your original code.)
const highlightStyles: React.CSSProperties = {
  color: "#ef4444", 
  fontWeight: "bold",
};
const choiceLabelStyles: React.CSSProperties = {
  color: "#0ea5e9",
  fontWeight: 500,
};
const asteriskStyles: React.CSSProperties = {
  color: "#eab308",
  fontWeight: "bold",
};
const chosenStyles: React.CSSProperties = {
  color: "#1d4ed8",
  fontWeight: "bold",
};

// Helper: figure out next letter label. E.g. "A." => "B."
function getNextChoiceLabel(current: string): string {
  const match = current.match(/^([A-Z])(\.|\))/i); // e.g. "A." or "A)"
  if (!match) return "A.";
  const letter = match[1];
  const punctuation = match[2] || ".";
  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
  return nextLetter + punctuation;
}

/************************************************************
 * Our main page
 ************************************************************/
export default function CreateTestPage() {
  const navigate = useNavigate();
  const [testTitle, setTestTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const editorRef = useRef<Editor | null>(null);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      RegexHighlight,
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none dark:prose-invert pl-12 focus:outline-none min-h-[400px] relative line-numbers",
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (event.key === "Enter") {
            const { state } = view;
            const { $from } = state.selection;
            const lineText = $from.nodeBefore?.textContent || "";
            const trimmedLine = lineText.trim();
          
            // 1) If line starts with "Question X:"
            if (/^Question\s+\d+:/i.test(trimmedLine)) {
              event.preventDefault(); 
              editor?.chain().focus().insertContent(`<p>A. </p>`).run();
              return true;
            }
          
            // 2) If line starts with "D." => Insert next question in a new paragraph
            if (/^D(\.|\))/.test(trimmedLine)) {
              event.preventDefault();
          
              // Find last question number in the doc
              const docText = view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n");
              const lines = docText.split("\n");
              let lastQuestionNumber = 1;
              lines.forEach((line) => {
                const match = line.match(/^Question\s+(\d+):/i);
                if (match) {
                  lastQuestionNumber = parseInt(match[1], 10);
                }
              });
              const nextQuestionNum = lastQuestionNumber + 1;
          
              // Insert the next question in its own <p>
              // Add a new line before the next question
              editor?.chain().focus().insertContent(`<p></p><p>Question ${nextQuestionNum}: </p>`).run();
              return true;
            }
          
            // 3) If line is "A." or "B." etc => insert next letter in its own paragraph (optional)
            const stripped = trimmedLine.replace(/^\*/, ""); 
            if (/^[A-Z]\.|^[A-Z]\)/i.test(stripped)) {
              event.preventDefault();
              const nextLabel = getNextChoiceLabel(stripped);
              editor?.chain().focus().insertContent(`<p>${nextLabel} </p>`).run();
              return true;
            }
          }
          
          return false;
        },
      },
    },
    content: "",
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor || null;
  }, [editor]);

  // Handle "Continue" button
  const [isSaving, setIsSaving] = useState(false);
  const handleSave = () => {
    if (!testTitle) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/testbank/configuration");
    }, 1000);
  };

  // Convert editor's content to plain lines
  const getPlainLines = (editor: Editor): string[] => {
    const html = editor.getHTML();
    const tmp  = document.createElement("div");
    tmp.innerHTML = html;
    return Array.from(tmp.querySelectorAll("p")).map(p => p.textContent || "");
  };

  const getQuestionBlocks = (lines: string[]): string[][] => {
    const blocks: string[][] = [];
    let current: string[] = [];
    lines.forEach(line => {
      if (/^Question\s+\d+:/i.test(line.trim())) {
        if (current.length) blocks.push(current);
        current = [line];
      } else {
        current.push(line);
      }
    });
    if (current.length) blocks.push(current);
    return blocks;
  };

  /**
  * Replace one "choice" paragraph with its starred / un‑starred version
  */
  const toggleStarForChoice = useCallback(
    (questionIdx: number, choiceIdx: number, willBeStarred: boolean) => {
      const editor = editorRef.current;
      if (!editor) return;

      /* ----------------------------------------------------------
        1.  Figure out which <p> we need:
            – Every question block has 1 paragraph for the
              "Question …:" line, then one paragraph per choice.
            – So inside that block, the paragraph we need is
              `choiceIdx + 1`
        ---------------------------------------------------------- */
      const targetParagraphIndexWithinBlock = choiceIdx + 1;

      /* ----------------------------------------------------------
        2.  Walk the doc and stop at the right paragraph
        ---------------------------------------------------------- */
      let paragraphCounter = -1;               // counts ALL <p> nodes
      let startPos: number | null = null;      // start of the target text
      let endPos:   number | null = null;      // end   of the target text
      let originalLine = "";

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "paragraph") {
          paragraphCounter++;

          /* Is this paragraph inside the block we care about?       *
          * We first skip all blocks before our question.           */
          const blockStart  = questionIdx === 0 ? 0 :
                              getQuestionBlocks(getPlainLines(editor))
                                .slice(0, questionIdx)
                                .reduce((acc, b) => acc + b.length, 0);

          const globalParagraphIndexNeeded =
            blockStart + targetParagraphIndexWithinBlock;

          if (paragraphCounter === globalParagraphIndexNeeded) {
            startPos      = pos + 1;                 // inside the node
            endPos        = pos + node.nodeSize - 1; // inside the node
            originalLine  = node.textContent || "";
            return false; // stop walking
          }
        }
        return true;
      });

      if (startPos == null || endPos == null) return;

      /* ----------------------------------------------------------
        3.  Build the updated line, wrap it in <p>…</p>
        ---------------------------------------------------------- */
      const updatedLine = willBeStarred
        ? `*${originalLine.replace(/^\*/, "")}`
        : originalLine.replace(/^\*/, "");

      const newParagraphHTML = `<p>${updatedLine}</p>`;

      /* ----------------------------------------------------------
        4.  Replace the old paragraph with the new one
        ---------------------------------------------------------- */
      editor
        .chain()
        .focus()
        .insertContentAt({ from: startPos-1, to: endPos }, newParagraphHTML)
        .run();
    },
    [] /* dependencies */
  );

  

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const lines = getPlainLines(editor);

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex flex-col testbank-create">
      {/* Fixed Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white dark:bg-zinc-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 bg-black text-white hover:bg-gray-800 hover:text-white dark:bg-zinc-700"
            onClick={() => navigate("/testbank")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="w-80">
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter test title..."
              className="h-9 border bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-1 bg-blue-600 hover:bg-blue-700 text-black"
            disabled={!testTitle || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Continue
          </Button>
        </div>
      </header>

      {/* Main Content: Preview (left) & Editor (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Pane */}
        <div className="w-1/2 p-0 overflow-hidden flex flex-col bg-gray-50 dark:bg-zinc-800">
          <div className="p-3 border-b font-medium text-sm text-gray-700 bg-gray-100 dark:bg-zinc-700 dark:text-white">
            Preview
          </div>
          <div className="flex-1 overflow-auto p-5">
            {lines.length > 0 ? (
              getQuestionBlocks(lines).map((block, qIdx) => (
                <InteractiveQuestionCard
                  key={qIdx}
                  rawLines={block}
                  questionIndex={qIdx}
                  onToggleStar={(choiceIdx, willBeStarred) => {
                    toggleStarForChoice(qIdx, choiceIdx, willBeStarred);
                  }}
                />
              ))
            ) : (
              <div className="text-gray-400 italic">
                Your formatted test content will appear here as you type...
              </div>
            )}
          </div>
        </div>

        {/* Editor Pane */}
        <div className="w-1/2 border-l overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
          <div className="p-3 border-b font-medium text-sm text-gray-700 dark:text-white bg-gray-100 dark:bg-zinc-700">
            Editor
          </div>
          <style>{`
            .ProseMirror p {
              margin: 0.25em 0;
              line-height: 1.5;
            }
            .line-numbers {
              counter-reset: line;
              padding-left: 3rem !important; 
            }
            .line-numbers p {
              counter-increment: line;
              position: relative;
            }
            .line-numbers p::before {
              content: counter(line);
              position: absolute;
              left: -2.5rem;
              color: #6b7280;
              font-size: 0.75rem;
              line-height: 1.75;
              user-select: none;
            }
          `}</style>
          <div className="flex-1 p-2 overflow-auto" style={{ minHeight: "400px" }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
