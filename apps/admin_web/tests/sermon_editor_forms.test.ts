import { describe, expect, test } from "bun:test";
import { ref } from "vue";

import { useSermonEditorForms } from "../src/features/sermons/composables/use_sermon_editor_forms";

describe("sermon editor file imports", () => {
  test("keeps only the latest manual manuscript result", async () => {
    const forms = createForms();
    const first = deferred<string>();
    const second = deferred<string>();

    const firstImport = forms.importManualManuscriptFile(
      textFile("first.md", first.promise)
    );
    const secondImport = forms.importManualManuscriptFile(
      textFile("second.md", second.promise)
    );

    second.resolve("second manuscript");
    await secondImport;
    first.resolve("stale manuscript");
    await firstImport;

    expect(forms.manualSermonForm.transcriptText).toBe("second manuscript");
    expect(forms.manualSermonForm.transcriptSource).toBe("second.md");
    expect(forms.manualManuscriptImportPending.value).toBeFalse();
  });

  test("reset invalidates an in-flight manual manuscript read", async () => {
    const forms = createForms();
    const content = deferred<string>();
    const importing = forms.importManualManuscriptFile(
      textFile("old.md", content.promise)
    );

    forms.resetManualSermonForm();
    content.resolve("must not be restored");
    await importing;

    expect(forms.manualSermonForm.transcriptText).toBe("");
    expect(forms.manualSermonForm.transcriptSource).toBe("manual");
    expect(forms.manualManuscriptImportPending.value).toBeFalse();
  });

  test("keeps only the latest selected-sermon transcript result", async () => {
    const forms = createForms();
    const first = deferred<string>();
    const second = deferred<string>();

    const firstImport = forms.importTranscriptFile(
      textFile("first.txt", first.promise)
    );
    const secondImport = forms.importTranscriptFile(
      textFile("second.txt", second.promise)
    );

    second.resolve("current transcript");
    await secondImport;
    first.resolve("stale transcript");
    await firstImport;

    expect(forms.editForm.transcriptText).toBe("current transcript");
    expect(forms.editForm.transcriptSource).toBe("second.txt");
    expect(forms.transcriptImportPending.value).toBeFalse();
  });

  test("exposes a failed file read and releases its pending state", async () => {
    const forms = createForms();
    const content = deferred<string>();
    const importing = forms.importManualManuscriptFile(
      textFile("broken.md", content.promise)
    );

    content.reject(new Error("read failed"));
    await importing;

    expect(forms.manualManuscriptImportError.value).toBeInstanceOf(Error);
    expect(forms.manualManuscriptImportPending.value).toBeFalse();
  });
});

function createForms() {
  return useSermonEditorForms({
    selectedSermon: ref(null),
    authStore: { can: () => true },
    t: (key) => key
  });
}

function textFile(name: string, content: Promise<string>) {
  return { name, text: () => content } as unknown as File;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}
