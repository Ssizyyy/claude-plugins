import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import type { SnapFile } from './variants'

const lang = (path: string) => (/\.css$/.test(path) ? css() : /\.(tsx?|jsx?)$/.test(path) ? javascript({ jsx: true, typescript: /\.tsx?$/.test(path) }) : [])

// One CodeMirror view for the working copy's files. Edits are reported per file (the caller debounces the write);
// `reloadKey` makes it re-read the content, e.g. after something else changed the files on disk.
export function CodeEditor({ files, entry, onChange, reloadKey, readOnly }: { files: SnapFile[]; entry?: string; onChange: (path: string, content: string) => void; reloadKey: number; readOnly?: boolean }) {
  const editable = files.filter((f) => f.editable)
  const [path, setPath] = useState(() => editable.find((f) => f.path === entry)?.path ?? editable[0]?.path ?? '')
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView>(undefined)
  const filesRef = useRef(files)
  filesRef.current = files
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const doc = filesRef.current.find((f) => f.path === path)?.content ?? ''
    const state = EditorState.create({
      doc,
      extensions: [
        basicSetup,
        lang(path),
        document.documentElement.classList.contains('dark') ? oneDark : [],
        EditorState.readOnly.of(!!readOnly),
        EditorView.theme({ '&': { height: '100%', fontSize: '12.5px' }, '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, Consolas, monospace' } }),
        EditorView.updateListener.of((u) => u.docChanged && onChangeRef.current(path, u.state.doc.toString())),
      ],
    })
    if (view.current) view.current.setState(state)
    else if (host.current) view.current = new EditorView({ state, parent: host.current })
  }, [path, reloadKey, readOnly])

  useEffect(
    () => () => {
      view.current?.destroy()
      view.current = undefined // StrictMode mounts twice: the second mount must build a new view
    },
    [],
  )

  return (
    <div className="flex h-full min-h-0 flex-col" data-code-editor>
      <label className="flex items-center gap-2 border-b px-2 py-1 text-xs text-muted-foreground">
        File
        <select value={path} onChange={(e) => setPath(e.target.value)} className="min-w-0 flex-1 rounded border bg-background px-1.5 py-1 text-foreground" aria-label="File to edit">
          {editable.map((f) => (
            <option key={f.path} value={f.path}>
              {f.path}
              {f.path === entry ? ' (entry)' : ''}
            </option>
          ))}
        </select>
        <span className="hidden sm:inline">Esc, then Tab leaves the editor</span>
      </label>
      <div ref={host} className="min-h-0 flex-1 overflow-hidden" />
    </div>
  )
}
