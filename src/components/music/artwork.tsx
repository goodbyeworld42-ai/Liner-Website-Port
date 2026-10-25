"use client"

import { useState } from "react"
import { Music2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArtworkProps {
  src?: string | null
  alt: string
  className?: string
  rounded?: string
  iconSize?: number
}

/** Artwork image with a graceful gradient fallback. */
export function Artwork({ src, alt, className, rounded = "rounded-lg", iconSize = 20 }: ArtworkProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!src || failed) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-neutral-700/60 via-neutral-800/60 to-neutral-900/60",
          "dark:from-neutral-700/60 dark:via-neutral-800/60 dark:to-black",
          "not-dark:from-red-100 not-dark:via-rose-50 not-dark:to-orange-50",
          rounded,
          className
        )}
      >
        <Music2 className="text-foreground/30" style={{ width: iconSize, height: iconSize }} />
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", rounded, className)}>
      {!loaded && <div className="absolute inset-0 lyra-skeleton" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={cn("h-full w-full object-cover lyra-img", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  )
}
