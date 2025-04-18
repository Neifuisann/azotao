import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Regex to find $...$ syntax, avoiding escaped \$ and ensuring non-empty content
const katexRegex = /(?<!\\)\$([^\s$][^$]*?)(?<!\\)\$/gs;

export interface EditFormulaMeta {
  pos: number; 
  endPos: number; 
  latex: string;
}

function findPlaceholders(doc: any): DecorationSet {
  const decorations: Decoration[] = [];

  let formulaCount = 0;

  doc.descendants((node: any, pos: number) => {
    if (!node.isText) {
      return;
    }

    const text = node.textContent || "";
    let match;
    katexRegex.lastIndex = 0;

    while ((match = katexRegex.exec(text)) !== null) {
      formulaCount++;
      const [fullMatch, latex] = match;
      const start = pos + match.index;
      const end = start + fullMatch.length;

      // Hide the raw formula text by inline style
      decorations.push(
        Decoration.inline(start, end, { style: 'display: none !important' }, {
          key: `formula-hide-${start}`
        })
      );

      // Add placeholder widget
      decorations.push(
        Decoration.widget(start, () => {
          const span = document.createElement('span');
          span.className = 'formula-placeholder';
          span.textContent = `[Formula ${formulaCount}]`;
          span.dataset.latex = latex;
          span.dataset.pos = String(start);
          span.dataset.endPos = String(end);
          span.contentEditable = 'false';
          span.style.cursor = 'pointer';
          return span;
        }, {
          key: `formula-widget-${start}`,
          side: 0,
          atomic: true
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

// The rest of the FormulaPlugin extension (onEdit callback, etc.) remains the same
export const FormulaPlugin = Extension.create<{
  onEdit: (meta: EditFormulaMeta) => void;
}> ({
  name: 'formulaPlugin',

  addOptions() {
    return {
      onEdit: () => {},
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this;

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
          handleDoubleClickOn(view, pos, node, nodePos, event, direct) {
            const target = event.target as HTMLElement;
            // Check specifically for our placeholder span
            const placeholder = target.closest('.formula-placeholder'); 
            if (direct && placeholder instanceof HTMLElement) {
              const latex = placeholder.dataset.latex;
              const startPos = parseInt(placeholder.dataset.pos || '0', 10);
              const endPos = parseInt(placeholder.dataset.endPos || '0', 10);

              if (latex && !isNaN(startPos) && !isNaN(endPos)) {
                extensionThis.options.onEdit({
                  pos: startPos,
                  endPos: endPos,
                  latex: latex,
                });
                return true;
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
      // Backspace/Delete handling around widgets can be tricky.
      // The 'atomic: true' on the widget helps prevent partial deletion.
    };
  },
  
  addCSS() {
    return `
      .formula-placeholder {
        color: #555;
        background: #f5f5f5;
        border: 1px dashed #ccc;
        padding: 0 4px;
        border-radius: 3px;
        user-select: none;
      }
      .formula-placeholder:hover {
        background: #eaeaea;
        border-color: #aaa;
      }
      .dark .formula-placeholder {
         color: #bbb;
         background-color: #444;
         border-color: #666;
      }
    `;
  }
}); 