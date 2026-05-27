import { useEffect, useState } from 'react'
import { getPostMedia, resolveMediaSrc } from '@/lib/postMedia'
import { Film, ImageIcon } from 'lucide-react'

function MediaItem({ item }) {
  const [src, setSrc] = useState(() => resolveMediaSrc(item))

  useEffect(() => {
    setSrc(resolveMediaSrc(item) || getPostMedia(item?.id) || null)
  }, [item?.id, item?.dataUrl, item?.src])

  if (!src) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-white/5 text-xs text-[hsl(var(--muted-foreground))]">
        Media unavailable
      </div>
    )
  }

  if (item.type === 'video') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/10">
        <video src={src} controls className="max-h-64 w-full bg-black" preload="metadata">
          <track kind="captions" />
        </video>
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px]">
          <Film className="h-3 w-3" /> Video
        </span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      <img src={src} alt={item.name || 'Post image'} className="max-h-64 w-full object-cover" />
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px]">
        <ImageIcon className="h-3 w-3" /> Photo
      </span>
    </div>
  )
}

export function PostMedia({ media = [] }) {
  if (!media?.length) return null

  return (
    <div className={`mt-3 grid gap-2 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {media.map((item) => (
        <MediaItem key={item.id} item={item} />
      ))}
    </div>
  )
}
