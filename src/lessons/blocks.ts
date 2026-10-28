export type ProseBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] }

/** Groups lesson paragraphs; consecutive "- " paragraphs become one bullet list. */
export function toProseBlocks(paragraphs: string[]): ProseBlock[] {
  const blocks: ProseBlock[] = []
  for (const p of paragraphs) {
    if (p.startsWith('- ')) {
      const last = blocks[blocks.length - 1]
      if (last?.kind === 'list') last.items.push(p.slice(2))
      else blocks.push({ kind: 'list', items: [p.slice(2)] })
    } else {
      blocks.push({ kind: 'paragraph', text: p })
    }
  }
  return blocks
}
