import { onScopeDispose, ref, watch } from "vue";
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
      const sequence = ++requestSequence;
      error.value = null;
      if (typeof value !== "string" || !value.trim()) {
        pending.value = false;
        return;
      }
      pending.value = true;
      try {
        const resource = await load(value.trim());
        if (sequence === requestSequence) open(resource);
      } catch (loadError) {
        if (sequence === requestSequence) error.value = loadError;
      } finally {
        if (sequence === requestSequence) pending.value = false;
      }
    },
    { immediate: true }
  );

  onScopeDispose(() => {
    requestSequence += 1;
  });

  return { error, pending };
}
