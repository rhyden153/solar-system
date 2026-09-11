import { projectToScreen } from '../rendering/projection'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { Vector } from '../physics/types'
import { vector } from '../physics/vector'

export function useCamera(canvas: Ref<HTMLCanvasElement | null>, displayScale: Readonly<Ref<number>>, draw: () => void) {
  const zoomLevel = ref(1)
  const cameraOffset = ref<Vector>(vector())
  const canvasPan = ref<{ pointerId: number; x: number; y: number } | null>(null)
  const isPanned = computed(() => cameraOffset.value.x !== 0 || cameraOffset.value.y !== 0)

  function setZoom(multiplier: number) { zoomLevel.value = Math.min(10, Math.max(0.25, zoomLevel.value * multiplier)) }

  function recenterCamera() { stopCanvasPan(); cameraOffset.value = vector(); draw() }

  function worldToScreen(position: Vector, width: number, height: number, focus: Vector) { return projectToScreen(position, width, height, focus, cameraOffset.value, displayScale.value) }

  function startCanvasPan(event: PointerEvent) {
    if (event.button !== 2 || !canvas.value || canvasPan.value) return
    event.preventDefault()
    canvas.value.setPointerCapture(event.pointerId)
    canvasPan.value = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }

  function moveCanvasPan(event: PointerEvent) {
    const pan = canvasPan.value
    if (!pan || event.pointerId !== pan.pointerId) return
    if (!(event.buttons & 2)) { stopCanvasPan(); return }
    event.preventDefault()
    cameraOffset.value = {
      x: cameraOffset.value.x - (event.clientX - pan.x) / displayScale.value,
      y: cameraOffset.value.y + (event.clientY - pan.y) / displayScale.value,
    }
    pan.x = event.clientX
    pan.y = event.clientY
    draw()
  }

  function stopCanvasPan() {
    const pan = canvasPan.value
    canvasPan.value = null
    if (pan && canvas.value?.hasPointerCapture(pan.pointerId)) canvas.value.releasePointerCapture(pan.pointerId)
  }

  function endCanvasPan(event: PointerEvent) {
    if (event.pointerId === canvasPan.value?.pointerId) stopCanvasPan()
  }

  function handleWheel(event: WheelEvent) { event.preventDefault(); setZoom(event.deltaY > 0 ? .88 : 1.14) }

  return { zoomLevel, cameraOffset, canvasPan, isPanned, setZoom, recenterCamera, worldToScreen, startCanvasPan, moveCanvasPan, stopCanvasPan, endCanvasPan, handleWheel }
}
