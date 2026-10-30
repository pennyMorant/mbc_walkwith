import { ref } from "vue";

type TranscriptTarget = {
  transcriptText: string;
  transcriptSource: string;
};

type UseSermonFileImportsInput = {
  manualTarget: TranscriptTarget;
  transcriptTarget: TranscriptTarget;
};

export function useSermonFileImports(input: UseSermonFileImportsInput) {
  const selectedManualManuscriptFile = ref<File | File[] | null>(null);
  const selectedTranscriptFile = ref<File | File[] | null>(null);
  const manualManuscriptImportPending = ref(false);
  const manualManuscriptImportError = ref<unknown>(null);
  const transcriptImportPending = ref(false);
  const transcriptImportError = ref<unknown>(null);
  let manualImportGeneration = 0;
  let transcriptImportGeneration = 0;

  async function importManualManuscriptFile(value: File | File[] | null) {
    const file = firstInputFile(value);
    const generation = ++manualImportGeneration;
    if (!file) {
      manualManuscriptImportPending.value = false;
      manualManuscriptImportError.value = null;
      return;
    }
    manualManuscriptImportPending.value = true;
    manualManuscriptImportError.value = null;
    try {
      const text = await file.text();
      if (generation !== manualImportGeneration) return;
      input.manualTarget.transcriptText = text;
      input.manualTarget.transcriptSource = file.name;
    } catch (error) {
      if (generation === manualImportGeneration) {
        manualManuscriptImportError.value = error;
      }
    } finally {
      if (generation === manualImportGeneration) {
        manualManuscriptImportPending.value = false;
      }
    }
  }

  async function importTranscriptFile(value: File | File[] | null) {
    const file = firstInputFile(value);
    const generation = ++transcriptImportGeneration;
    if (!file) {
      transcriptImportPending.value = false;
      transcriptImportError.value = null;
      return;
    }
    transcriptImportPending.value = true;
    transcriptImportError.value = null;
    try {
      const text = await file.text();
      if (generation !== transcriptImportGeneration) return;
      input.transcriptTarget.transcriptText = text;
      input.transcriptTarget.transcriptSource = file.name;
    } catch (error) {
      if (generation === transcriptImportGeneration) {
        transcriptImportError.value = error;
      }
    } finally {
      if (generation === transcriptImportGeneration) {
        transcriptImportPending.value = false;
      }
    }
  }

  function resetManualManuscriptImport() {
    manualImportGeneration += 1;
    selectedManualManuscriptFile.value = null;
    manualManuscriptImportPending.value = false;
    manualManuscriptImportError.value = null;
  }

  function resetTranscriptImport() {
    transcriptImportGeneration += 1;
    selectedTranscriptFile.value = null;
    transcriptImportPending.value = false;
    transcriptImportError.value = null;
  }

  return {
    importManualManuscriptFile,
    importTranscriptFile,
    manualManuscriptImportError,
    manualManuscriptImportPending,
    resetManualManuscriptImport,
    resetTranscriptImport,
    selectedManualManuscriptFile,
    selectedTranscriptFile,
    transcriptImportError,
    transcriptImportPending
  };
}

function firstInputFile(value: File | File[] | null) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
