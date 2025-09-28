import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import AudioComponent from './AudioNodeView'

export interface AudioOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audio: {
      /**
       * Insert an audio element
       */
      setAudio: (options: { src: string; title?: string }) => ReturnType
    }
  }
}

export const Audio = Node.create<AudioOptions>({
  name: 'audio',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) {
            return {}
          }
          return {
            src: attributes.src,
          }
        },
      },
      title: {
        default: null,
        parseHTML: element => {
          const titleElement = element.querySelector('.audio-title')
          return titleElement ? titleElement.textContent : null
        },
        renderHTML: attributes => {
          if (!attributes.title) {
            return {}
          }
          return {
            'data-title': attributes.title,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[class*="audio-player-wrapper"]',
        contentElement: 'audio',
      },
    ]
  },

  renderHTML({ node }) {
    const attrs: Record<string, any> = {
      controls: 'true',
      src: node.attrs.src,
    };
    if (node.attrs.title) attrs.title = node.attrs.title;
    return ['audio', attrs];
  },

  addCommands() {
    return {
      setAudio:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioComponent)
  },
})
