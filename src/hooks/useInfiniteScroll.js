import { useEffect, useRef, useCallback } from 'react'

export const useInfiniteScroll = (callback, hasMore, loading) => {
  const observer = useRef()
  const loadingRef = useRef(loading)
  const hasMoreRef = useRef(hasMore)

  // Update refs to avoid stale closures
  useEffect(() => {
    loadingRef.current = loading
    hasMoreRef.current = hasMore
  }, [loading, hasMore])

  const lastElementRef = useCallback(
    node => {
      if (loadingRef.current) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          callback()
        }
      })

      if (node) observer.current.observe(node)
    },
    [callback]
  )

  return lastElementRef
}
