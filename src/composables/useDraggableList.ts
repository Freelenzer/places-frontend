import { ref } from "vue";

/**
 * Provides native HTML5 drag-and-drop reordering for a reactive array.
 *
 * Usage in template (on each list item):
 *   draggable="true"
 *   @dragstart="onDragStart(index)"
 *   @dragover.prevent="onDragOver(index)"
 *   @drop.prevent="onDrop"
 *   @dragend="onDragEnd"
 *   :class="{ 'drag-over': dragOverIndex === index, 'dragging': dragIndex === index }"
 */
export function useDraggableList<T>(list: { value: T[] }) {
  const dragIndex = ref<number | null>(null);
  const dragOverIndex = ref<number | null>(null);

  function onDragStart(index: number) {
    dragIndex.value = index;
  }

  function onDragOver(index: number) {
    if (dragIndex.value === null || dragIndex.value === index) return;
    dragOverIndex.value = index;
  }

  function onDrop() {
    if (dragIndex.value === null || dragOverIndex.value === null) return;
    if (dragIndex.value === dragOverIndex.value) return;

    const items = [...list.value];
    const [moved] = items.splice(dragIndex.value, 1);
    items.splice(dragOverIndex.value, 0, moved);
    list.value = items;

    dragIndex.value = null;
    dragOverIndex.value = null;
  }

  function onDragEnd() {
    dragIndex.value = null;
    dragOverIndex.value = null;
  }

  return { dragIndex, dragOverIndex, onDragStart, onDragOver, onDrop, onDragEnd };
}
