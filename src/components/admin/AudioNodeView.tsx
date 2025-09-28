import { NodeViewWrapper } from '@tiptap/react'
import { NodeViewProps } from '@tiptap/core'

const AudioNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const { src, title } = node.attrs

  return (
    <NodeViewWrapper as="div" className="audio-node-view">
      <div className="audio-player-wrapper">
        <audio 
          controls 
          className="audio-player" 
          src={src}
          style={{ width: '100%' }}
        />
        {/* Only show title if it was manually provided by user */}
        {title && typeof title === 'string' && title.trim() && title !== 'undefined' && title !== 'null' && (
          <p className="audio-title" style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            {title}
          </p>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default AudioNodeView
