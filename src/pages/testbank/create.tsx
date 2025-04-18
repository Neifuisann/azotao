/************************************************************
 * File: /src/pages/testbank/create.tsx
 * Adds auto-insert of A,B,C,D after "Question X:",
 * and auto-insert next question heading after finishing D.
 ************************************************************/
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Save, Sigma } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InteractiveQuestionCard from "@/components/InteractiveQuestionCard";

// --- TIPTAP Imports ---
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { RegexHighlight } from "@/components/tiptap/RegexHighlight";

// [ADDED] Import the new Formula Modal component
import FormulaModal from "@/components/tiptap/FormulaModal";

// [ADDED] Import KaTeX CSS for rendering in PREVIEW
import 'katex/dist/katex.min.css';

// [CHANGED] Import the Formula Plugin and its types
import { FormulaPlugin, EditFormulaMeta } from '@/components/tiptap/FormulaPlugin';

// [ADDED] Import Tiptap ProseMirror types for custom plugin
import { Plugin, PluginKey, TextSelection, EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@tiptap/core';

// Define the key for the plugin
const highlightPluginKey = new PluginKey<DecorationSet>('highlightOccurrence');

// --- Helper Types for API ---
type ChoiceData = {
  text: string;
  isCorrect: boolean;
};

type QuestionData = {
  text: string;
  choices: ChoiceData[];
};

// [ADDED] Custom Tiptap Plugin for Highlighting Occurrences
// --- Wrap ProseMirror Plugin in Tiptap Extension ---
const HighlightOccurrenceExtension = Extension.create<{
  // No options needed for this extension
}>({
  name: 'highlightOccurrence',

  addProseMirrorPlugins(): Plugin[] { // Type the return array
    return [
      new Plugin({
        key: highlightPluginKey, // Use the defined key

        state: {
          init(): DecorationSet {
            return DecorationSet.empty;
          },
          apply(tr, oldSet: DecorationSet): DecorationSet { // Type the state
            // No changes, return old decorations
            if (!tr.docChanged && !tr.selectionSet) {
              return oldSet;
            }

            const { selection } = tr;
            // Only proceed if it's a TextSelection and not empty
            if (!(selection instanceof TextSelection) || selection.empty) {
              return DecorationSet.empty; // Clear decorations if selection is not text or empty
            }

            const selectedText = tr.doc.textBetween(selection.from, selection.to).trim();
            // Only highlight if selected text is reasonably long (e.g., 3+ chars)
            if (selectedText.length < 2) {
              return DecorationSet.empty; // Clear decorations for short selections
            }

            const decorations: Decoration[] = [];
            const highlightClass = 'occurrence-highlight'; // CSS class for styling

            // Iterate through the document to find occurrences
            tr.doc.descendants((node, pos) => {
              if (!node.isText) {
                return true; // Continue descending if not a text node
              }

              let index = 0;
              const textContent = node.textContent;
              while ((index = textContent.indexOf(selectedText, index)) !== -1) {
                const from = pos + index;
                const to = from + selectedText.length;

                // Check if this occurrence overlaps with the current selection
                const overlapsWithSelection = selection.from < to && selection.to > from;

                // Add decoration only if it does NOT overlap with the main selection
                if (!overlapsWithSelection) {
                  decorations.push(Decoration.inline(from, to, { class: highlightClass }));
                }

                index += selectedText.length; // Move past the found occurrence
              }
              return false; // Don't descend further into text nodes
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },

        props: {
          decorations(state: EditorState): DecorationSet | null | undefined { // Type state and return
            // Correct way to access plugin state using the key
            return highlightPluginKey.getState(state);
          },
        },
      })
    ];
  },
});

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

// [ADDED] Placeholder function to parse editor content for the API
// TODO: Implement this function based on your Tiptap content structure
// It should extract questions, their choices, and identify the correct choice.
// Example assumption: Correct choice line starts with '*' after the label (e.g., "*A. Correct answer")
const parseEditorContentForAPI = (editor: Editor | null): QuestionData[] => {
  if (!editor) return [];

  const questions: QuestionData[] = [];
  let currentQuestion: QuestionData | null = null;

  editor.state.doc.content.forEach(node => {
    if (node.type.name === 'paragraph' && node.textContent) {
      const lineText = node.textContent.trim();

      // Match "Question X: ..."
      const questionMatch = lineText.match(/^Question\s+\d+:\s*(.*)/i);
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = { text: questionMatch[1].trim(), choices: [] };
        return; // Move to next node
      }

      // Match choices like "A. ..." or "*A. ..."
      const choiceMatch = lineText.match(/^(\*?)([A-Z])([.)])\s*(.*)/i);
      if (choiceMatch && currentQuestion) {
        const isCorrect = choiceMatch[1] === '*';
        const choiceText = choiceMatch[4].trim();
        currentQuestion.choices.push({ text: choiceText, isCorrect });
      }
    }
  });

  // Add the last question if it exists
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  console.log("Parsed questions for API:", questions); // For debugging
  return questions;
};

/************************************************************
 * Our main page
 ************************************************************/
export default function CreateTestPage() {
  const navigate = useNavigate();
  const [testTitle, setTestTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null); // Store created test ID

  // State for the Formula Modal
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  // [ADDED] State to track which formula is being edited
  const [editingFormula, setEditingFormula] = useState<EditFormulaMeta | null>(null);

  // [ADDED] Callback for the FormulaPlugin when a placeholder is double-clicked
  const handleEditFormula = useCallback((meta: EditFormulaMeta) => {
    setEditingFormula(meta); // Store the details of the formula being edited
    setShowFormulaModal(true); // Open the modal
  }, []); // No dependencies needed

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      RegexHighlight,
      // [CHANGED] Use FormulaPlugin and pass the onEdit callback
      FormulaPlugin.configure({
        onEdit: handleEditFormula,
      }),
      // [ADDED] Add the custom highlight extension
      HighlightOccurrenceExtension,
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

  // Handle "Save as Draft" button
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveAsDraft = async () => {
    if (!testTitle || !editorRef.current) {
      alert("Please provide a title and some content."); // Basic validation
      return;
    }
    setIsSaving(true);

    // 1) Parse content from the editor
    const questions = parseEditorContentForAPI(editorRef.current);

    if (questions.length === 0) {
      alert("Could not parse any questions. Ensure they follow the 'Question X:' and 'A.', 'B.', etc. format.");
      setIsSaving(false);
      return;
    }

    // 2) Prepare data for API
    const newTest = {
      title: testTitle,
      status: 'draft', // Explicitly saving as draft
      questions: questions
    };

    try {
      // 3) Send it to /api/tests
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        // 4) Success: Store ID and navigate (or show message)
        const createdTest = result.data;
        setCreatedTestId(createdTest.id);
        console.log("Draft saved successfully! Test ID:", createdTest.id);
        // Navigate to configuration page, passing the new test ID
        navigate(`/testbank/configuration?testId=${createdTest.id}`);
      } else {
        // 5) Handle API error
        console.error("Error saving draft:", result.error);
        alert(`Error saving draft: ${result.error || 'Unknown server error'}`);
      }
    } catch (error) {
      // 6) Handle network error
      console.error("Network error saving draft:", error);
      alert("Network error saving draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
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

  // [ADDED] Function to handle focusing the editor on a specific question
  const handleFocusQuestion = useCallback((questionIndex: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    let currentQuestionIndex = -1;
    let targetPos: number | null = null;

    // Iterate through the document nodes to find the start of the target question
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph') {
        // Check if this paragraph is a question heading
        if (node.textContent.trim().match(/^Question\s+\d+:/i)) {
          currentQuestionIndex++;
          // If this is the question we're looking for, store its starting position
          if (currentQuestionIndex === questionIndex) {
            targetPos = pos + 1; // Position inside the <p> tag
            return false; // Stop iteration
          }
        }
      }
      // Continue iteration if the target hasn't been found
      return targetPos === null;
    });

    // If we found the position, set the editor focus and selection
    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).run();
    }
  }, [editorRef]); // Dependency on editorRef ensures the correct editor instance is used

  // [ADDED] Function to handle closing the modal and resetting edit state
  const handleCloseFormulaModal = () => {
    setShowFormulaModal(false);
    setEditingFormula(null); // Clear editing state when closing
  };

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
            onClick={handleSaveAsDraft}
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
        <div className="w-1/2 p-0 overflow-hidden flex flex-col bg-gray-100 dark:bg-zinc-800">
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
                  onFocusRequest={handleFocusQuestion}
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
        <div className="w-1/2 border-l overflow-hidden flex flex-col bg-white dark:bg-zinc-900" style={{ borderColor: 'oklch(0 0 0 / 0.2)' }}>
          <div className="p-3 border-b font-medium text-sm text-gray-700 dark:text-white bg-b-100 dark:bg-zinc-700 flex justify-between items-center" style={{ borderColor: 'oklch(0 0 0 / 0.2)' }}>
            <span></span>
            <Button
              variant="ghost"
              size="sm"
              className="border text-black bg-white dark:text-gray-100 px-2 " style={{ borderColor: 'oklch(0 0 0 / 0.2)' }}
              onClick={() => {
                setEditingFormula(null);
                setShowFormulaModal(true);
              }}
            >
              <Sigma className="h-4 w-4 mr-1" />
              Insert Formula
            </Button>
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
              color: #6b7280; /* text-gray-500 */
              font-size: 0.75rem;
              line-height: 1.75;
              user-select: none;
            }

            /* --- Scrollbar Styles --- */
            /* Width */
            ::-webkit-scrollbar {
              width: 8px;
            }
            
            /* Track */
            ::-webkit-scrollbar-track {
              background: #f1f5f9; /* bg-slate-100 */
              border-radius: 4px;
            }
            .dark ::-webkit-scrollbar-track {
              background: #27272a; /* bg-zinc-800 */
            }
            
            /* Handle */
            ::-webkit-scrollbar-thumb {
              background: #94a3b8; /* bg-slate-400 */
              border-radius: 4px;
            }
            .dark ::-webkit-scrollbar-thumb {
              background: #52525b; /* bg-zinc-600 */
            }
            
            /* Handle on hover */
            ::-webkit-scrollbar-thumb:hover {
              background:rgb(78, 78, 78); /* bg-slate-500 */
            }
            .dark ::-webkit-scrollbar-thumb:hover {
              background: #71717a; /* bg-zinc-500 */
            }
            
            /* [ADDED] Style for occurrence highlighting */
            .occurrence-highlight {
              background-color: rgba(173, 216, 230, 0.5); /* Light blue with some transparency */
              border-radius: 2px;
              box-shadow: 0 0 0 1px rgba(173, 216, 230, 0.7); /* Subtle border */
            }
          `}</style>
          <div className="flex-1 p-2 overflow-auto" style={{ minHeight: "400px" }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      {/* FormulaModal at the bottom */}
      <FormulaModal
        editor={editor}
        open={showFormulaModal}
        onClose={handleCloseFormulaModal}
        editingInfo={editingFormula}
      />
    </div>
  );
}
