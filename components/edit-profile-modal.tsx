"use client"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/lib/types"

interface EditProfileModalProps {
  profile: Profile
  onClose: () => void
  onSave: (updated: Profile) => void
}

export function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const supabase = createClient()
  const [displayName, setDisplayName] = useState(profile.display_name ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")
  const [website, setWebsite] = useState(profile.website ?? "")
  const [location, setLocation] = useState(profile.location ?? "")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.cover_photo_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  async function uploadImage(file: File, folder: string): Promise<string | null> {
    const ext = file.name.split(".").pop()
    const path = `${profile.id}/${folder}-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (error || !data) return null
    return supabase.storage.from("avatars").getPublicUrl(data.path).data.publicUrl
  }

  async function handleSave() {
    setSaving(true)
    let avatar_url = profile.avatar_url
    let cover_photo_url = profile.cover_photo_url
    if (avatarFile) avatar_url = await uploadImage(avatarFile, "avatar")
    if (coverFile) cover_photo_url = await uploadImage(coverFile, "cover")
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: displayName || null, bio: bio || null, website: website || null, location: location || null, avatar_url, cover_photo_url })
      .eq("id", profile.id).select().single()
    if (!error && data) onSave(data as Profile)
    setSaving(false)
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-lg">Edit profile</h2>
          </div>
          <button
            onClick={handleSave} disabled={saving}
            className="rounded-full bg-foreground text-background px-5 py-1.5 text-sm font-bold hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Cover photo */}
          <div className="relative h-40 bg-muted shrink-0">
            {coverPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            )}
            <button
              type="button" onClick={() => coverRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} />
          </div>

          {/* Avatar */}
          <div className="px-4 -mt-9 mb-3">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-background bg-sky-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {avatarPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : profile.username[0].toUpperCase()}
              </div>
              <button
                type="button" onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)) } }} />
            </div>
          </div>

          {/* Fields */}
          <div className="px-4 pb-6 space-y-1">
            {([
              { label: "Display name", value: displayName, set: setDisplayName, max: 50, multiline: false },
              { label: "Bio", value: bio, set: setBio, max: 160, multiline: true },
              { label: "Location", value: location, set: setLocation, max: 30, multiline: false },
              { label: "Website", value: website, set: setWebsite, max: 100, multiline: false },
            ] as { label: string; value: string; set: (v: string) => void; max: number; multiline: boolean }[]).map(({ label, value, set, max, multiline }) => (
              <div key={label} className="relative border border-border rounded-md px-3 pt-5 pb-1 focus-within:border-sky-500 transition-colors">
                <label className="absolute top-1.5 left-3 text-xs text-muted-foreground">{label}</label>
                {multiline ? (
                  <textarea
                    value={value} onChange={e => set(e.target.value)}
                    maxLength={max} rows={3}
                    className="w-full bg-transparent text-sm outline-none resize-none pt-0.5"
                  />
                ) : (
                  <input
                    type="text" value={value}
                    onChange={e => set(e.target.value)}
                    maxLength={max}
                    className="w-full bg-transparent text-sm outline-none py-1"
                  />
                )}
                <div className="text-right text-xs text-muted-foreground pb-1">{value.length}/{max}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
