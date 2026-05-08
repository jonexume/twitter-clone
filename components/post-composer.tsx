"use client"
import { useState, useRef } from "react"
import { Image as ImageIcon, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const MAX_CHARS = 280

interface PostComposerProps {
  userId: string
  username: string
  parentId?: string
  onPost?: () => void
}

export function PostComposer({ userId, username, parentId, onPost }: PostComposerProps) {
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const remaining = MAX_CHARS - content.length
  const isOverLimit = remaining < 0
  const isEmpty = content.trim().length === 0

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isEmpty || isOverLimit || loading) return
    setLoading(true)

    let image_url: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split(".").pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { data } = await supabase.storage.from("post-images").upload(path, imageFile)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(data.path)
        image_url = publicUrl
      }
    }

    await supabase.from("posts").insert({
      user_id: userId,
      content: content.trim(),
      image_url,
      parent_id: parentId ?? null,
    })

    setContent("")
    removeImage()
    setLoading(false)
    onPost?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-b border-border">
      <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold shrink-0">
        {username[0].toUpperCase()}
      </div>
      <div className="flex-1 space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={parentId ? "Post your reply…" : "What's happening?"}
          rows={3}
          className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground"
        />

        {imagePreview && (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="preview" className="max-h-64 rounded-2xl object-cover" />
            <button
              type="button" onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={() => fileRef.current?.click()}
              className="p-2 rounded-full hover:bg-sky-500/10 text-sky-500 transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>

          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <div className="relative h-8 w-8 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" />
                  <circle
                    cx="16" cy="16" r="12" fill="none" strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 12}`}
                    strokeDashoffset={`${2 * Math.PI * 12 * Math.max(0, remaining) / MAX_CHARS}`}
                    className={cn("transition-all", isOverLimit ? "text-red-500" : remaining <= 20 ? "text-yellow-500" : "text-sky-500")}
                    stroke="currentColor"
                  />
                </svg>
                {remaining <= 20 && (
                  <span className={cn("text-xs font-medium", isOverLimit ? "text-red-500" : "text-muted-foreground")}>
                    {remaining}
                  </span>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={isEmpty || isOverLimit || loading}
              className="rounded-full bg-sky-500 px-5 py-2 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Posting…" : parentId ? "Reply" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
