/************************************************************
 * File: /src/pages/testbank/create.tsx
 * Adds auto-insert of A,B,C,D after "Question X:",
 * and auto-insert next question heading after finishing D.
 ************************************************************/
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Save, Sigma, Settings, AlertTriangle } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import InteractiveQuestionCard from "@/components/InteractiveQuestionCard";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner"; // Import toast for notifications

// --- TIPTAP Imports ---
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { RegexHighlight } from "@/components/tiptap/RegexHighlight";
import FormulaModal from "@/components/tiptap/FormulaModal";
import { FormulaPlugin, EditFormulaMeta } from "@/components/tiptap/FormulaPlugin";
import 'katex/dist/katex.min.css';
import { Plugin, PluginKey, TextSelection, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Extension } from "@tiptap/core";

// Define the key for the plugin
const highlightPluginKey = new PluginKey<DecorationSet>("highlightOccurrence");

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

/** If the line is "Question 2: something", we detect it here. */
function isQuestionHeading(line: string) {
  return /^Question\s+\d+:/i.test(line.trim());
}

/** If the line is "D." or "D)", we detect it. */
function isChoiceD(line: string) {
  return /^D(\.|\))/i.test(line.trim().replace(/^[*]/, "")); // ignoring any leading '*'
}

/** Parse the editor doc -> question data for the API. */
function parseEditorContentForAPI(editor: Editor | null) {
  if (!editor) return [];

  const questions: any[] = [];
  let currentQuestion: any = null;

  editor.state.doc.content.forEach((node) => {
    if (node.type.name === "paragraph" && node.textContent) {
      const lineText = node.textContent.trim();

      // "Question X: ..."
      const qMatch = lineText.match(/^Question\s+\d+:\s*(.*)/i);
      if (qMatch) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = { text: qMatch[1].trim(), choices: [] };
        return;
      }

      // "*A. ..." or "A. ..."
      const cMatch = lineText.match(/^(\*?)([A-Z])([.)])\s*(.*)/i);
      if (cMatch && currentQuestion) {
        const isCorrect = cMatch[1] === "*";
        const choiceText = cMatch[4].trim();
        currentQuestion.choices.push({ text: choiceText, isCorrect });
      }
    }
  });

  if (currentQuestion) questions.push(currentQuestion);
  return questions;
}

// ---------- Convert plain text lines to array of question blocks
function getQuestionBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  lines.forEach((line) => {
    if (isQuestionHeading(line)) {
      if (current.length) blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  });
  if (current.length) blocks.push(current);
  return blocks;
}

/** Rebuild lines from testData (fetched from DB) for editing. */
function buildLinesFromTestData(testData: any) {
  const lines: string[] = [];
  if (!testData || !Array.isArray(testData.questions)) return lines;

  testData.questions.forEach((q: any, idx: number) => {
    const qNum = idx + 1;
    lines.push(`Question ${qNum}: ${q.text || ""}`);
    if (Array.isArray(q.choices)) {
      q.choices.forEach((c: any, cIdx: number) => {
        const letter = String.fromCharCode(65 + cIdx); // A, B, C...
        const prefix = c.isCorrect ? `*${letter}.` : `${letter}.`;
        lines.push(`${prefix} ${c.text || ""}`);
      });
    }
  });
  return lines;
}

/** lines -> <p> tags for Tiptap. */
function linesToHTML(lines: string[]) {
  return lines
    .map((line) => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`).join("");
}

// [ADDED] Define type for the saved test data returned by the helper
interface SavedTestData {
  id: string;
  title: string;
  status: string;
  // Add other fields if needed
}

/** Utility: read doc paragraphs from tiptap -> array of lines. */
function getPlainLines(editor: Editor) {
  const html = editor.getHTML();
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return Array.from(tmp.querySelectorAll("p")).map((p) => p.textContent || "");
}

/************************************************************
 * Our main page
 ************************************************************/
export default function CreateTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<EditFormulaMeta | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingAndConfiguring, setIsSavingAndConfiguring] = useState(false);

  // The test ID we might be editing (draft or published)
  const [testId, setTestId] = useState<string | null>(null);

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      RegexHighlight,
      FormulaPlugin.configure({
        onEdit: (meta) => {
          setEditingFormula(meta);
          setShowFormulaModal(true);
        },
      }),
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

            // 1) If line starts "Question X:"
            if (/^Question\s+\d+:/i.test(trimmedLine)) {
              event.preventDefault();
              editor?.chain().focus().insertContent(`<p>A. </p>`).run();
              return true;
            }
            // 2) If line starts "D." => Insert next question
            if (isChoiceD(trimmedLine)) {
              event.preventDefault();
              // find last question number
              const docText = view.state.doc.textBetween(
                0,
                view.state.doc.content.size,
                "\n",
                "\n"
              );
              const lines = docText.split("\n");
              let lastQ = 1;
              lines.forEach((l) => {
                const m = l.match(/^Question\s+(\d+):/i);
                if (m) lastQ = parseInt(m[1], 10);
              });
              const nextQ = lastQ + 1;
              editor?.chain().focus().insertContent(`<p></p><p>Question ${nextQ}: </p>`).run();
              return true;
            }
            // 3) If line is "A." or "B." => insert next letter
            const stripped = trimmedLine.replace(/^[*]/, "");
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
    onUpdate: () => {
      // We'll handle content in getPlainLines when needed
    },
    content: "", // start empty
  });

  // On mount, check if we have "testId" in the query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const existingId = params.get("testId");
    if (existingId) {
      setTestId(existingId);
    }
  }, [location.search]);

  // If we do have a testId, fetch that test data + load into tiptap
  useEffect(() => {
    if (!testId || !editor) return;

    const fetchTest = async () => {
      try {
        console.log(`Fetching test data for ID: ${testId}`);
        const response = await fetch(`/api/tests/${testId}`);
        
        if (!response.ok) {
          if (response.status === 403) {
            // Handle case where server rejects access
            console.error("Server denied access to this test");
            // Display unauthorized UI
            showUnauthorizedMessage();
            return;
          }
          throw new Error(`Failed to fetch test. status=${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Unable to load test data");
        }

        //console.log("Current User:", user);
        //console.log("Fetched Test Data:", result.data);
        
        // Check if user is authorized to edit this test
        if (user?.id && result.data.userId && result.data.userId !== user.id) {
          console.error("Authorization failed: User ID does not match test userId");
          // Display unauthorized UI
          showUnauthorizedMessage();
          return;
        }
        
        // Convert the test data to lines + set content in tiptap
        const lines = buildLinesFromTestData(result.data);
        const html = linesToHTML(lines);
        // Set content
        editor.commands.setContent(html);
      } catch (err) {
        console.error("Error loading existing test:", err);
        alert("Error loading test for editing. Check console for details.");
      }
    };

    fetchTest();
  }, [testId, editor, user]);

  // Add an effect to clean up any overlay on unmount
  useEffect(() => {
    return () => {
      // Cleanup function to remove overlay on unmount
      const overlay = document.querySelector('.testbank-create > .absolute');
      if (overlay) {
        overlay.remove();
      }
    };
  }, []);

  // Function to show unauthorized message
  const showUnauthorizedMessage = () => {
    // Create a modal or an overlay with error message
    const testCreateElement = document.querySelector('.testbank-create');
    if (testCreateElement) {
      // Remove any existing overlay first
      const existingOverlay = testCreateElement.querySelector('.absolute');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Add unauthorized overlay
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-900/95 z-50';
      overlay.id = 'unauthorized-overlay'; // Add ID for easier selection
      overlay.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 mb-4">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h1 class="text-2xl font-bold mb-2 text-red-500">Access Denied</h1>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            You do not have permission to view or edit this test.
          </p>
          <a href="/testbank" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded-md">
            Return to Test Bank
          </a>
        </div>
      `;
      testCreateElement.appendChild(overlay);
      
      // Make the editor read-only
      if (editor) {
        editor.setEditable(false);
      }
    } else {
      // Fallback if element not found
      alert("You don't have permission to edit this test.");
      setTimeout(() => {
        window.location.href = '/testbank';
      }, 500);
    }
  };

  // toggle star in preview
  const toggleStarForChoice = useCallback((questionIdx: number, choiceIdx: number, willBeStarred: boolean) => {
    if (!editor) return;
    let paragraphCounter = -1;
    let startPos: number | null = null;
    let endPos: number | null = null;
    let originalLine = "";

    // figure out which paragraph we need
    const lines = getPlainLines(editor);
    const blocks = getQuestionBlocks(lines);
    // inside block #questionIdx, the paragraph is choiceIdx+1
    const neededParagraphIndexInBlock = choiceIdx + 1; // 0=question line, so +1

    // count globally
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph") {
        paragraphCounter++;
        // how many paragraphs from previous blocks?
        const blockStart = questionIdx === 0 ? 0 : blocks.slice(0, questionIdx).reduce((acc, b) => acc + b.length, 0);
        const globalParagraphIndexNeeded = blockStart + neededParagraphIndexInBlock;

        if (paragraphCounter === globalParagraphIndexNeeded) {
          startPos = pos + 1;
          endPos = pos + node.nodeSize - 1;
          originalLine = node.textContent || "";
          return false;
        }
      }
      return true;
    });
    if (startPos == null || endPos == null) return;

    const updatedLine = willBeStarred
      ? `*${originalLine.replace(/^[*]/, "")}`
      : originalLine.replace(/^[*]/, "");
    const newParagraphHTML = `<p>${updatedLine}</p>`;

    editor.chain().focus().insertContentAt({ from: startPos - 1, to: endPos }, newParagraphHTML).run();
  }, [editor]);

  // focusing a question block
  const focusQuestion = useCallback((qIdx: number) => {
    if (!editor) return;
    let curQIndex = -1;
    let targetPos: number | null = null;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "paragraph") {
        // detect question lines
        if (isQuestionHeading(node.textContent || "")) {
          curQIndex++;
          if (curQIndex === qIdx) {
            targetPos = pos + 1;
            return false;
          }
        }
      }
      return targetPos === null; // stop when found
    });

    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).run();
    }
  }, [editor]);

  // [REFACTORED] Core saving logic extracted into a helper function
  const saveTestContent = async (): Promise<SavedTestData | null> => {
    if (!user) {
      alert("You must be logged in to create/edit a test.");
      return null;
    }
    if (!editor) {
      alert("Editor not ready yet.");
      return null;
    }

    // If we are editing an existing test, verify ownership
    if (testId) {
      try {
        const checkResponse = await fetch(`/api/tests/${testId}`);
        if (!checkResponse.ok) {
          throw new Error(`Failed to verify test ownership. status=${checkResponse.status}`);
        }
        
        const checkResult = await checkResponse.json();
        if (!checkResult.success || !checkResult.data) {
          throw new Error("Failed to verify test data");
        }
        
        // Check if user is authorized to edit this test
        if (checkResult.data.userId !== user.id) {
          console.error("Save attempt unauthorized: User does not own this test");
          alert("You don't have permission to modify this test.");
          return null;
        }
      } catch (err) {
        console.error("Error verifying test ownership:", err);
        alert("Error verifying test ownership. Save aborted.");
        return null;
      }
    }

    const questions = parseEditorContentForAPI(editor);
    if (questions.length === 0) {
      alert("No questions found in your text. Please use the 'Question X:' format.");
      return null;
    }

    try {
      let response: Response;
      if (testId) {
        // Update existing test
        response = await fetch(`/api/tests/${testId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "draft",
            questions,
          }),
        });
      } else {
        // Create new test
        response = await fetch("/api/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Untitled Test - ${new Date().toLocaleString()}`,
            status: "draft",
            questions,
            userId: user.id,
          }),
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        //console.log(testId ? "Test updated" : "Draft created", result.data);
        return result.data as SavedTestData; // Return the saved data (including ID)
      } else {
        throw new Error(result.error || (testId ? "Failed to update test" : "Failed to create test"));
      }
    } catch (err: any) {
      console.error("Error saving test content:", err);
      alert(`Error saving: ${err.message || "Unknown error. Check console for details."}`);
      return null;
    }
  };

  // handle saving - just save and go back to test bank
  const handleSaveAsDraft = async () => {
    setIsSavingDraft(true); // Set specific loading state
    try {
      const savedData = await saveTestContent();
      if (savedData) {
        navigate("/testbank"); // Navigate back to the list on success
      }
    } finally {
      setIsSavingDraft(false); // Clear specific loading state
    }
  };

  // Handle saving and navigating to configuration
  const handleSaveAndConfigure = async () => {
    setIsSavingAndConfiguring(true); // Set specific loading state
    try {
      const savedData = await saveTestContent();
      if (savedData) {
        // Navigate to configuration page with the test ID
        navigate(`/testbank/configuration?testId=${savedData.id}`);
      }
    } finally {
      setIsSavingAndConfiguring(false); // Clear specific loading state
    }
  };

  // ---------- Render ----------
  if (!editor) {
    return <div>Loading editor...</div>;
  }
  const lines = getPlainLines(editor);

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex flex-col testbank-create">
      {/* Header */}
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
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 bg-gray-200 hover:bg-gray-300"
            disabled={isSavingDraft || isSavingAndConfiguring || !user}
            onClick={handleSaveAsDraft}
          >
            {isSavingDraft ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            size="sm"
            className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSavingDraft || isSavingAndConfiguring || !user}
            onClick={handleSaveAndConfigure}
          >
            {isSavingAndConfiguring ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Settings className="h-4 w-4 mr-1" />
            )}
            {isSavingAndConfiguring ? "Saving..." : "Save & Configure"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview */}
        <div className="w-1/2 p-0 overflow-hidden flex flex-col bg-gray-100 dark:bg-zinc-800">
          <div className="flex-1 overflow-auto p-5">
            {lines.length > 0 ? (
              getQuestionBlocks(lines).map((block, qIdx) => (
                <InteractiveQuestionCard
                  key={qIdx}
                  rawLines={block}
                  questionIndex={qIdx}
                  onToggleStar={(choiceIdx, newStar) =>
                    toggleStarForChoice(qIdx, choiceIdx, newStar)
                  }
                  onFocusRequest={focusQuestion}
                />
              ))
            ) : (
              <div className="text-gray-400 italic">
                Your formatted test content will appear here as you type...
              </div>
            )}
          </div>
        </div>
        {/* Editor */}
        <div
          className="w-1/2 border-l overflow-hidden flex flex-col bg-white dark:bg-zinc-900"
          style={{ borderColor: "oklch(0 0 0 / 0.2)" }}
        >
          <div
            className="p-3 border-b font-medium text-sm text-gray-700 dark:text-white bg-b-100 dark:bg-zinc-700 flex justify-between items-center"
            style={{ borderColor: "oklch(0 0 0 / 0.2)" }}
          >
            <span></span>
            <Button
              variant="ghost"
              size="sm"
              className="border text-black bg-white dark:text-gray-100 px-2"
              style={{ borderColor: "oklch(0 0 0 / 0.2)" }}
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

            .occurrence-highlight {
              background-color: rgba(173, 216, 230, 0.5);
              border-radius: 2px;
              box-shadow: 0 0 0 1px rgba(173, 216, 230, 0.7);
            }
          `}</style>
          <div
            className="flex-1 p-2 overflow-auto"
            style={{ minHeight: "400px" }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Formula Modal */}
      <FormulaModal
        editor={editor}
        open={showFormulaModal}
        onClose={() => {
          setShowFormulaModal(false);
          setEditingFormula(null);
        }}
        editingInfo={editingFormula}
      />
    </div>
  );
}
