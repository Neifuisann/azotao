import { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { EditFormulaMeta } from "./FormulaPlugin";
import clsx from 'clsx';
// Import type only
import type { MathfieldElement } from 'mathlive';

// Define the intrinsic elements for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        ref?: React.RefObject<any>;
        value?: string;
      }, HTMLElement>;
    }
  }
}

// Function to ensure MathLive is loaded
const ensureMathLiveLoaded = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && !customElements.get('math-field')) {
      // Dynamically import MathLive
      import('mathlive').then(() => {
        // Check if custom element is defined
        if (!customElements.get('math-field')) {
          // Create a listener for when the element is defined
          window.customElements.whenDefined('math-field').then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

type Props = {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
  editingInfo: EditFormulaMeta | null;
};

const DEFAULT_LATEX = "";

export default function FormulaModal({ editor, open, onClose, editingInfo }: Props) {
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const mathfieldRef = useRef<MathfieldElement>(null);

  useEffect(() => {
    if (!open) return;
    
    // Ensure MathLive is loaded before proceeding
    ensureMathLiveLoaded().then(() => {
      const mf = mathfieldRef.current;
      if (!mf) return;
      
      // Set initial value
      let initialValue = DEFAULT_LATEX;
      if (editingInfo) {
        initialValue = editingInfo.latex;
      }

      // Set value and focus
      mf.value = initialValue;
      
      // Make sure to use setTimeout to allow the field to fully initialize
      setTimeout(() => {
        mf.focus();
      }, 0);
    });
  }, [open, editingInfo]);

  if (!open) return null;

  const handleInsert = () => {
    if (!editor) return;
    const finalLatex = mathfieldRef.current?.value?.trim() || "";
  
    if (finalLatex === "") return;
  
    if (editingInfo) {
      // For editing existing formula
      editor
        .chain()
        .focus()
        .insertContentAt({ from: editingInfo.pos, to: editingInfo.endPos }, `$${finalLatex}$`)
        .run();
    } else {
      // For new formula insertion
      editor.chain().focus().insertContent(`$${finalLatex}$`).run();
    }
    
    // Force editor update to refresh decorations
    setTimeout(() => {
      editor.commands.focus();
    }, 0);
    
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 p-5 rounded-lg shadow-xl w-[90vw] max-w-[650px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{editingInfo ? 'Edit' : 'Insert'} Formula</h2>

        {/* @ts-ignore - Custom element */}
        <math-field
           ref={mathfieldRef}
           placeholder="Enter a LaTeX formula here"
           onInput={(evt: Event) => {
             // Need to cast to any because MathField has a non-standard value property
             const target = evt.target as any;
             if (target && typeof target.value === 'string') {
               setLatex(target.value);
             }
           }}
           className="w-full p-4 border rounded dark:border-zinc-700 mb-4 text-lg min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
           style={{
             // Force light theme for MathLive
             "--primary-color": "#3b82f6", 
             "--text-font-family": "system-ui, -apple-system, sans-serif",
             "backgroundColor": "white",
             "color": "black"
           }}
        ></math-field>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded bg-gray-100 
                       dark:bg-zinc-700 dark:text-gray-100 dark:border-zinc-600
                       hover:bg-gray-200 dark:hover:bg-zinc-600 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-5 py-2 border rounded bg-blue-600 text-white 
                       hover:bg-blue-700 text-sm font-medium 
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingInfo ? 'Update' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}
