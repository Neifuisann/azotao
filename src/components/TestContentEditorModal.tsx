import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"; // Assuming shadcn/ui dialog
import { Save, X } from "lucide-react";

// --- TIPTAP Imports ---
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { RegexHighlight } from "@/components/tiptap/RegexHighlight";
import FormulaModal from "@/components/tiptap/FormulaModal"; // Assuming this component is reusable
import 'katex/dist/katex.min.css'; // Assuming KaTeX is used for formulas
import { FormulaPlugin, EditFormulaMeta } from '@/components/tiptap/FormulaPlugin'; // Assuming this plugin is reusable

// --- ProseMirror Imports for custom plugin ---
import { Plugin, PluginKey, TextSelection, EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@tiptap/core';

// Define the key for the highlight plugin (if used)
const highlightPluginKey = new PluginKey<DecorationSet>('highlightOccurrence');

// Custom Tiptap Plugin for Highlighting Occurrences (if used)
const HighlightOccurrenceExtension = Extension.create<{}>({
  name: 'highlightOccurrence',
  addProseMirrorPlugins(): Plugin[] {
    return [
      new Plugin({
        key: highlightPluginKey,
        state: {
          init(): DecorationSet { return DecorationSet.empty; },
          apply(tr, oldSet: DecorationSet): DecorationSet {
            if (!tr.docChanged && !tr.selectionSet) { return oldSet; }
            const { selection } = tr;
            if (!(selection instanceof TextSelection) || selection.empty) { return DecorationSet.empty; }
            const selectedText = tr.doc.textBetween(selection.from, selection.to).trim();
            if (selectedText.length < 2) { return DecorationSet.empty; }
            const decorations: Decoration[] = [];
            const highlightClass = 'occurrence-highlight';
            tr.doc.descendants((node, pos) => {
              if (!node.isText) { return true; }
              let index = 0;
              const textContent = node.textContent;
              while ((index = textContent.indexOf(selectedText, index)) !== -1) {
                const from = pos + index;
                const to = from + selectedText.length;
                const overlapsWithSelection = selection.from < to && selection.to > from;
                if (!overlapsWithSelection) {
                  decorations.push(Decoration.inline(from, to, { class: highlightClass }));
                }
                index += selectedText.length;
              }
              return false;
            });
            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state: EditorState): DecorationSet | null | undefined {
            return highlightPluginKey.getState(state);
          },
        },
      })
    ];
  },
});

// Helper: figure out next letter label. E.g. "A." => "B." (if needed)
function getNextChoiceLabel(current: string): string {
  const match = current.match(/^([A-Z])(\.|\))/i);
  if (!match) return "A.";
  const letter = match[1];
  const punctuation = match[2] || ".";
  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
  return nextLetter + punctuation;
}

// Placeholder function to parse editor content for the API (Adapt as needed)
// This should match the logic in create.tsx
const parseEditorContentForAPI = (editor: Editor | null): any => {
  if (!editor) return null;
  // TODO: Implement parsing logic based on your Tiptap content structure
  // Example: return editor.getHTML(); or parse into a specific JSON format
  return editor.getHTML(); // Placeholder - returns HTML content
};

interface TestContentEditorModalProps {
  testId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void; // Optional callback after successful save
}

const TestContentEditorModal: React.FC<TestContentEditorModalProps> = ({ testId, isOpen, onClose, onSaveSuccess }) => {
  const [editorContent, setEditorContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // State for the Formula Modal (if needed)
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<EditFormulaMeta | null>(null);

  // Callback for the FormulaPlugin when a placeholder is double-clicked (if needed)
  const handleEditFormula = useCallback((meta: EditFormulaMeta) => {
    setEditingFormula(meta);
    setShowFormulaModal(true);
  }, []);

  // Function to handle closing the formula modal (if needed)
  const handleCloseFormulaModal = () => {
    setShowFormulaModal(false);
    setEditingFormula(null);
  };


  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      RegexHighlight, // Assuming RegexHighlight is reusable
      FormulaPlugin.configure({ // Assuming FormulaPlugin is reusable
        onEdit: handleEditFormula, // Pass the handler if formula editing is needed
      }),
      HighlightOccurrenceExtension, // Assuming HighlightOccurrenceExtension is reusable
      // Add other extensions used in create.tsx if necessary
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none dark:prose-invert pl-12 focus:outline-none min-h-[400px] relative line-numbers", // Match styles from create.tsx
      },
      // Add handleDOMEvents if needed from create.tsx
    },
    content: editorContent, // Initialize with fetched content
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  }, [editorContent]); // Re-initialize editor when content changes (after fetching)

  useEffect(() => {
    editorRef.current = editor || null;
  }, [editor]);

  // Fetch test content when modal opens and testId is available
  useEffect(() => {
    if (isOpen && testId) {
      const fetchTestContent = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/tests/${testId}`);
          if (!response.ok) {
            // Throw error based on status code BEFORE trying to parse JSON
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          // Type the expected response structure
          const result = await response.json() as { 
            success?: boolean; 
            data?: { content?: string | null }; // Allow content to be null
            error?: string 
          };
          
          // Check if success is true and data exists
          if (result.success && result.data) {
            // Set content, defaulting to empty string if it's null/undefined
            setEditorContent(result.data.content ?? ""); 
          } else {
            // Throw error if success is false or data is missing
            throw new Error(result.error || "Failed to fetch test content structure.");
          }

        } catch (err: any) { // Catch both fetch and manual errors
          console.error("Error fetching test content:", err);
          setError(err.message || "An unexpected error occurred.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTestContent();
    } else if (!isOpen) {
      // Reset state when modal is closed
      setEditorContent("");
      setError(null);
      setEditingFormula(null);
      setShowFormulaModal(false);
      editor?.commands.clearContent(); // Clear editor content
    }
  }, [isOpen, testId, editor]); // Depend on isOpen and testId to trigger fetch, and editor to clear content

  // Handle Save button
  const handleSave = async () => {
    if (!editorRef.current || !testId) {
      alert("Editor not ready or test ID missing.");
      return;
    }
    setIsSaving(true);
    setError(null);

    // 1) Parse content from the editor
    const updatedContent = parseEditorContentForAPI(editorRef.current);

    if (!updatedContent) {
       alert("Could not parse editor content.");
       setIsSaving(false);
       return;
    }

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'PUT', // Assuming PUT for updating the entire test object
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent }), // Adjust payload as per your API
      });
      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Test content saved successfully!");
        if (onSaveSuccess) {
          onSaveSuccess(); // Call the success callback
        }
        onClose(); // Close modal on success
      } else {
        throw new Error(result.error || "Failed to save test content");
      }

    } catch (err: any) {
      console.error("Error saving test content:", err);
      setError(err.message || "An unexpected error occurred.");
      alert(`Error saving content: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Test Content {testId ? `(ID: ${testId})` : ""}</DialogTitle>
          <DialogDescription>
            Modify the questions and choices for this test.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading content...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error: {error}</div>
          ) : (
            <div className="editor-container"> {/* Add a container for styling */}
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
        <DialogFooter>
          {isSaving && <span className="text-sm text-muted-foreground mr-4">Saving...</span>}
          {error && <span className="text-sm text-red-600 mr-4">{error}</span>}
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving || !editor}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </DialogFooter>

        {/* Formula Modal (if needed) */}
        {showFormulaModal && editingFormula && (
          <FormulaModal
            editor={editor} // Pass the editor instance
            open={showFormulaModal}
            onClose={handleCloseFormulaModal}
            editingInfo={editingFormula}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestContentEditorModal;