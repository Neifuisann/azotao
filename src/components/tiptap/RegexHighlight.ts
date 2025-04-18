import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";

const questionStyle    = "color:rgb(18, 55, 240);font-weight:bold;";
const choiceLabelStyle = "color:rgb(234, 49, 20);font-weight:500;";
const asteriskStyle    = "color:rgb(234, 49, 20);font-weight:bold;";

export const RegexHighlight = Extension.create({
  name: "regexHighlight",

  addProseMirrorPlugins() {
    /** Re‑calculate all decorations every time the doc changes */
    const build = (doc: ProsemirrorNode): DecorationSet => {
      const decos: Decoration[] = [];

      doc.descendants((node: ProsemirrorNode, pos: number) => {
        if (!node.isText || !node.text) return;

        const text = node.text; // the full paragraph
        const from = pos;       // absolute start index of this text node

        /* ---- Question line ---- */
        const q = text.match(/^Question\s+\d+:/i);
        if (q) {
          decos.push(
            Decoration.inline(from, from + q[0].length, {
              style: questionStyle,
            }),
          );
        }

        /* ---- Choice line ---- */
        const c = text.match(/^(\*)?([A-Z](?:\.|\)))/); // *A.  /  A.  /  A)
        if (c) {
          const hasStar = !!c[1];
          const label   = c[2];              // "A." or "A)"
          if (hasStar) {
            decos.push(
              Decoration.inline(from, from + 1, { style: asteriskStyle }),
            );
          }
          const labelStart = from + (hasStar ? 1 : 0);
          decos.push(
            Decoration.inline(labelStart, labelStart + label.length, {
              style: choiceLabelStyle,
            }),
          );
        }
      });

      return DecorationSet.create(doc, decos);
    };

    return [
      new Plugin({
        key: new PluginKey("regexHighlight"),
        state: {
          init: (_, { doc })  => { return build(doc); },
          apply: (tr, old)    => { return tr.docChanged ? build(tr.doc) : old; },
        },
        props: {
          decorations(state: EditorState) {
            return (this as any).getState(state);
          },
        },
      }),
    ];
  },
});
