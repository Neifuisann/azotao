import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
// Removed katex import as we are not rendering here

// Regex to find $...$ syntax, avoiding escaped \$ and ensuring non-empty content
const katexRegex = /(?<!\\)\$([^\s$][^$]*?)(?<!\\)\$/gs;

// Interface for the data passed when triggering an edit
export interface EditFormulaMeta {
  pos: number; // Start position of the original $...$ in the doc
  endPos: number; // End position of the original $...$ in the doc
  latex: string;
}

/**
 * Finds all KaTeX matches and creates placeholder decorations.
 */
function findPlaceholders(doc: any): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) {
      return;
    }

    const text = node.textContent || "";
    let match;
    katexRegex.lastIndex = 0;

    while ((match = katexRegex.exec(text)) !== null) {
      const startIndex = match.index;
      const latexContent = match[1];
      const startPos = pos + startIndex;
      const endPos = startPos + match[0].length;

      decorations.push(
        Decoration.widget(
          startPos + 1, // Position inside the $...$
          (view, getPos) => {
            const placeholder = document.createElement('span');
            placeholder.classList.add('formula-placeholder');
            placeholder.textContent = '[Formula]';
            placeholder.dataset.latex = latexContent;
            placeholder.dataset.pos = String(startPos); // Store start position
            placeholder.dataset.endPos = String(endPos); // Store end position
            placeholder.title = latexContent; // Show LaTeX on hover
            placeholder.style.cursor = 'pointer';
            placeholder.style.display = 'inline-block'; // Prevent breaking across lines
            placeholder.style.userSelect = 'none'; // Make it non-selectable text
            placeholder.style.border = '1px dashed #ccc'; // Visual cue
            placeholder.style.padding = '0 2px';
            placeholder.style.borderRadius = '3px';
            placeholder.contentEditable = 'false';
            return placeholder;
          },
          {
            key: `formula-${startPos}`,
            side: 0, // Affects cursor position, 0 seems reasonable
            marks: [],
            // Stop ProseMirror from treating the widget as editable content
            // atomic: true might be too restrictive, test cursor behavior
          }
        )
      );
      
      // Optionally hide the raw $...$ text. 
      // This is important now to only show the placeholder.
      decorations.push(Decoration.inline(startPos, endPos, { 
        class: 'formula-raw-hidden', // Use CSS to hide
        // style: 'display: none !important;', // Inline styles can be overridden
      }));
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Tiptap Extension for formula placeholders and editing.
 */
export const FormulaPlugin = Extension.create<{
  onEdit: (meta: EditFormulaMeta) => void; // Callback prop
}> ({
  name: 'formulaPlugin',

  addOptions() {
    return {
      onEdit: () => {}, // Default no-op callback
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this; // Capture extension instance

    return [
      new Plugin({
        key: new PluginKey('formulaPlugin'),
        state: {
          init(_, { doc }) {
            return findPlaceholders(doc);
          },
          apply(tr, oldSet) {
            return tr.docChanged ? findPlaceholders(tr.doc) : oldSet;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          // Handle double-click on the placeholder
          handleDoubleClickOn(view, pos, node, nodePos, event, direct) {
            const target = event.target as HTMLElement;
            if (direct && target && target.classList.contains('formula-placeholder')) {
              const latex = target.dataset.latex;
              const startPos = parseInt(target.dataset.pos || '0', 10);
              const endPos = parseInt(target.dataset.endPos || '0', 10);

              if (latex && !isNaN(startPos) && !isNaN(endPos)) {
                // Call the callback provided in options
                extensionThis.options.onEdit({
                  pos: startPos,
                  endPos: endPos,
                  latex: latex,
                });
                return true; // Mark event as handled
              }
            }
            return false;
          },
        },
      }),
    ];
  },
  
  addKeyboardShortcuts() {
    return {
      // Optional: Prevent backspace/delete inside the placeholder range if needed
      // This can get complex to manage correctly
    };
  },
  
  // Add CSS to hide the raw formula text
  addCSS() {
    return `
      .formula-raw-hidden {
        display: none !important;
      }
    `;
  }
}); 