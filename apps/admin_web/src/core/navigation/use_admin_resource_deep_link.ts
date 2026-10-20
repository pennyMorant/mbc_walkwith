import { ref, watch } from "vue";
import { useRoute } from "vue-router";

export function useAdminResourceDeepLink<T>(
  load: (resourceId: string) => Promise<T>,
  open: (resource: T) => void
) {
  const route = useRoute();
  const error = ref<unknown>(null);
  const pending = ref(false);
  let requestSequence = 0;

  watch(
    () => route.query.open,
    async (value) => {
      if (typeof value !== "string" || !value.trim()) return;
      const sequence = ++requestSequence;
      error.value = null;
      pending.value = true;
      try {
        const resource = await load(value);
        if (sequence === requestSequence) open(resource);
      } catch (loadError) {
        if (sequence === requestSequence) error.value = loadError;
      } finally {
        if (sequence === requestSequence) pending.value = false;
      }
    },
    { immediate: true }
  );

  return { error, pending };
}
