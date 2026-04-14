import { ref } from "vue";

/**
 * Prevents accidental dialog dismissal when the user starts a drag or
 * selects text inside the dialog and releases the mouse over the backdrop.
 * Only closes when both mousedown AND mouseup land on the backdrop itself.
 *
 * Usage in template:
 *   @mousedown.self="backdropDown = true" @mouseup="onBackdropMouseup"
 */
export function useBackdropClose(onClose: () => void) {
  const backdropDown = ref(false);

  function onBackdropMouseup(e: MouseEvent) {
    if (backdropDown.value && e.target === e.currentTarget) onClose();
    backdropDown.value = false;
  }

  return { backdropDown, onBackdropMouseup };
}
