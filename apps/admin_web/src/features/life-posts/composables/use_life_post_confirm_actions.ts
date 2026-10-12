import { reactive } from "vue";

type Translate = (key: string) => string;

type UseLifePostConfirmActionsInput = {
  t: Translate;
  archive: () => void;
  deletePost: () => void;
};

export function useLifePostConfirmActions(
  input: UseLifePostConfirmActionsInput
) {
  const { t, archive, deletePost } = input;
  const confirmDialog = reactive({
    show: false,
    title: "",
    message: "",
    confirmLabel: "",
    color: "error",
    action: null as null | (() => void)
  });

  function requestArchive() {
    confirmDialog.title = t("Archive life post?");
    confirmDialog.message = t("Archived life posts are hidden from the app.");
    confirmDialog.confirmLabel = t("Archive");
    confirmDialog.color = "secondary";
    confirmDialog.action = archive;
    confirmDialog.show = true;
  }

  function requestDelete() {
    confirmDialog.title = t("Delete life post?");
    confirmDialog.message = t("This cannot be undone.");
    confirmDialog.confirmLabel = t("Delete");
    confirmDialog.color = "error";
    confirmDialog.action = deletePost;
    confirmDialog.show = true;
  }

  function confirmPendingAction() {
    const action = confirmDialog.action;
    confirmDialog.show = false;
    confirmDialog.action = null;
    action?.();
  }

  return {
    confirmDialog,
    requestArchive,
    requestDelete,
    confirmPendingAction
  };
}
