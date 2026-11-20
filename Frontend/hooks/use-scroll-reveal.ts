"use client"

import { useEffect, useRef } from "react"

export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReduced) {
      node.classList.add("is-revealed")
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        node.classList.add("is-revealed")
        observer.unobserve(node)
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return ref
}
