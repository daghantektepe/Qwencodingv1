import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  styleHeatmapEngine,
  HeatmapThresholds
} from '../../../services/style/styleHeatmapEngine';

export interface HeatmapExtensionOptions {
  enabled: boolean;
  thresholds: HeatmapThresholds;
}

export const HeatmapPluginKey = new PluginKey('styleHeatmap');

export const StyleHeatmapExtension = Extension.create<HeatmapExtensionOptions>({
  name: 'styleHeatmap',

  addOptions() {
    return {
      enabled: true,
      thresholds: styleHeatmapEngine.getSnapshot()
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: HeatmapPluginKey,
        state: {
          init(_, { doc }) {
            return extension.options.enabled
              ? createHeatmapDecorations(doc, extension.options.thresholds)
              : DecorationSet.empty;
          },
          apply(tr, oldSet, oldState, newState) {
            if (!extension.options.enabled) return DecorationSet.empty;
            if (!tr.docChanged && oldSet) return oldSet.map(tr.mapping, tr.doc);
            return createHeatmapDecorations(newState.doc, extension.options.thresholds);
          }
        },
        props: {
          decorations(state) {
            return this.getState(state);
          }
        }
      })
    ];
  }
});

function createHeatmapDecorations(doc: any, thresholds: HeatmapThresholds): DecorationSet {
  const decorations: Decoration[] = [];
  const text = doc.textBetween(0, doc.content.size, ' ', ' ');

  if (!text || !thresholds.enabled) return DecorationSet.empty;

  const analysis = styleHeatmapEngine.analyze(text, thresholds);

  analysis.sentences.forEach((sent) => {
    if (sent.level !== 'normal') {
      const from = Math.min(doc.content.size, Math.max(1, sent.startIndex + 1));
      const to = Math.min(doc.content.size, Math.max(from, sent.endIndex + 1));

      if (from < to) {
        let cssClass = 'heatmap-lengthy';
        if (sent.level === 'very_complex') cssClass = 'heatmap-very-complex';
        if (sent.level === 'passive') cssClass = 'heatmap-passive';

        decorations.push(
          Decoration.inline(from, to, {
            class: `heatmap-highlight ${cssClass}`,
            title: sent.reason
          })
        );
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export default StyleHeatmapExtension;
