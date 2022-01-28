import { watch, reactive, type Ref, onBeforeUnmount } from 'vue'

export default function useNodeSize<T extends HTMLElement = HTMLElement>(nodeRef: Ref<T | undefined>) {
  const rect = reactive({ width: 0, height: 0 })
  const observer = new ResizeObserver(() => {
    if (nodeRef.value) {
      const { width, height } = nodeRef.value.getBoundingClientRect()
      rect.width = width
      rect.height = height
    }
  })
  watch(nodeRef, (nextNode) => {
    observer.disconnect()
    if (nextNode) {
      const { width, height } = nextNode.getBoundingClientRect()
      rect.width = width
      rect.height = height
      observer.observe(nextNode)
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    observer && observer.disconnect()
  })
  return rect
}