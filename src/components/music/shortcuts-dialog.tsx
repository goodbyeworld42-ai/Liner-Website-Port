"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUIStore } from "@/store/ui-store"

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Space", action: "Play / pause" },
  { keys: "← / →", action: "Seek 10s backward / forward" },
  { keys: "N", action: "Next track" },
  { keys: "P", action: "Previous track" },
  { keys: "F", action: "Toggle fullscreen player" },
  { keys: "Q", action: "Toggle queue" },
  { keys: "L", action: "Like the current track" },
  { keys: "M", action: "Mute / unmute" },
  { keys: "S", action: "Toggle shuffle" },
  { keys: "R", action: "Cycle repeat mode" },
  { keys: "/", action: "Focus search" },
  { keys: "Esc", action: "Close fullscreen player" },
]

export function ShortcutsDialog() {
  const open = useUIStore((s) => s.shortcutsOpen)
  const setOpen = useUIStore((s) => s.setShortcutsOpen)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Drive the whole player without leaving the keyboard.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-1.5 max-h-[50vh] overflow-y-auto lyra-scroll">
          {SHORTCUTS.map(({ keys, action }) => (
            <div key={keys} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-secondary/40">
              <span className="text-muted-foreground">{action}</span>
              <kbd className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-semibold">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
