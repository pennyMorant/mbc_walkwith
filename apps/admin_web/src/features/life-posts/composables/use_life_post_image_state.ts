import { useMutation } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { uploadLifePostImage } from "@/core/api/life_posts";

type Translate = (key: string) => string;

type LifePostImageForm = {
  imageUrl: string;
};

type UseLifePostImageStateInput = {
  form: LifePostImageForm;
  t: Translate;
  showToast: (message: string, color?: string) => void;
  nullableTrimmed: (value: string) => string | null;
};

const maxLifePostImageBytes = 8 * 1024 * 1024;
const allowedLifePostImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export function useLifePostImageState(input: UseLifePostImageStateInput) {
  const { form, t, showToast, nullableTrimmed } = input;
  const selectedImageUploadError = ref<string | null>(null);
  const imagePreviewUrl = computed(() => nullableTrimmed(form.imageUrl));

  const uploadImageMutation = useMutation({
    mutationFn: uploadLifePostImage,
    onSuccess: (url) => {
      form.imageUrl = url;
      showToast(t("Image uploaded."));
    }
  });

  const imageUploadErrorMessage = computed(
    () =>
      selectedImageUploadError.value ||
      formatApiErrorMessage(uploadImageMutation.error.value, t("common.error"))
  );

  function uploadSelectedImage(files: File | File[] | null) {
    const file = Array.isArray(files) ? files[0] : files;
    if (file) {
      const validationError = validateImageUpload(file, t);
      if (validationError) {
        selectedImageUploadError.value = validationError;
        return;
      }
      selectedImageUploadError.value = null;
      uploadImageMutation.mutate(file);
    }
  }

  function clearImage() {
    form.imageUrl = "";
    selectedImageUploadError.value = null;
  }

  return {
    imagePreviewUrl,
    uploadImageMutation,
    imageUploadErrorMessage,
    uploadSelectedImage,
    clearImage
  };
}

function validateImageUpload(file: File, t: Translate) {
  if (file.size <= 0) {
    return t("Image file is empty.");
  }
  if (file.size > maxLifePostImageBytes) {
    return t("Image file is too large.");
  }
  if (file.type && !allowedLifePostImageTypes.has(file.type)) {
    return t("Unsupported image file type.");
  }
  return null;
}
