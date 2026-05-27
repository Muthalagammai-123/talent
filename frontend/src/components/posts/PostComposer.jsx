import { useState, useRef } from 'react'
import { Send, ImagePlus, Video, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostMedia } from './PostMedia'
import { fileToDataUrl } from '@/lib/postMedia'

export function PostComposer({ onPublish, posts = [] }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const imageRef = useRef(null)
  const videoRef = useRef(null)

  const handleFiles = async (files, type) => {
    setError('')
    setUploading(true)
    try {
      const list = Array.from(files)
      const next = []
      for (const file of list) {
        const dataUrl = await fileToDataUrl(file)
        next.push({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: type === 'video' || file.type.startsWith('video/') ? 'video' : 'image',
          name: file.name,
          dataUrl,
        })
      }
      setAttachments((prev) => [...prev, ...next].slice(0, 6))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const publish = () => {
    if (!text.trim() && attachments.length === 0) return
    onPublish({ content: text.trim(), attachments })
    setText('')
    setAttachments([])
    setError('')
  }

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share an update — add photos or videos below..."
        className="flex min-h-[100px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
      />

      {attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attachments.map((a) => (
            <div key={a.id} className="relative overflow-hidden rounded-xl border border-white/10">
              {a.type === 'video' ? (
                <video src={a.dataUrl} className="h-28 w-full object-cover bg-black" muted />
              ) : (
                <img src={a.dataUrl} alt="" className="h-28 w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files, 'image')
            e.target.value = ''
          }}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files, 'video')
            e.target.value = ''
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => imageRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Photos
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => videoRef.current?.click()}>
          <Video className="h-4 w-4" /> Video
        </Button>
        <Button
          type="button"
          className="ml-auto gradient-btn"
          onClick={publish}
          disabled={uploading || (!text.trim() && attachments.length === 0)}
        >
          <Send className="h-4 w-4" /> Publish
        </Button>
      </div>
      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Images up to 5MB · Videos up to 15MB · Max 6 files</p>

      {posts.length > 0 && (
        <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
          <p className="text-sm font-medium">Your posts</p>
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl bg-white/5 p-4 text-sm">
              {post.content && <p>{post.content}</p>}
              <PostMedia media={post.media} />
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                {new Date(post.createdAt).toLocaleString()}
                {post.media?.length ? ` · ${post.media.length} attachment(s)` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
