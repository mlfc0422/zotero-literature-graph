import { normalizeTags } from "./core";

export async function previewAiTags(
  sourceWin: Window,
  suggestedTags: string[],
): Promise<string[] | undefined> {
  return new Promise((resolve) => {
    const dialogData: Record<string, unknown> = {};
    const dialog = new ztoolkit.Dialog(1, 1)
      .addCell(0, 0, {
        tag: "div",
        namespace: "html",
        id: "zotero-puls-ai-preview",
      })
      .addButton("取消", "cancel")
      .addButton("应用标签", "apply")
      .setDialogData(dialogData);
    const collect = () => {
      const doc = dialog.window.document;
      const selected = [
        ...doc.querySelectorAll<HTMLInputElement>("input[data-ai-tag]:checked"),
      ].map((input) => input.value);
      const extra =
        (
          doc.getElementById("zotero-puls-ai-extra-tags") as HTMLInputElement
        )?.value.split(",") ?? [];
      return normalizeTags([...selected, ...extra], 20);
    };
    dialogData.loadCallback = () => {
      const doc = dialog.window.document;
      const host = doc.getElementById("zotero-puls-ai-preview")!;
      const heading = doc.createElement("p");
      heading.textContent =
        "勾选要写入的英文标签，也可在下方补充（逗号分隔）。";
      host.appendChild(heading);
      for (const tag of suggestedTags) {
        const label = doc.createElement("label");
        label.style.display = "block";
        const input = doc.createElement("input");
        input.type = "checkbox";
        input.checked = true;
        input.value = tag;
        input.setAttribute("data-ai-tag", "true");
        label.append(input, ` ${tag}`);
        host.appendChild(label);
      }
      const extra = doc.createElement("input");
      extra.id = "zotero-puls-ai-extra-tags";
      extra.placeholder = "Add tags, separated by commas";
      extra.style.width = "100%";
      host.appendChild(doc.createElement("br"));
      host.appendChild(extra);
    };
    dialogData.beforeUnloadCallback = () => {
      resolve(dialogData._lastButtonId === "apply" ? collect() : undefined);
    };
    dialog.open("AI 标签预览", {
      width: 480,
      height: 420,
      centerscreen: true,
      resizable: true,
      fitContent: false,
      noDialogMode: true,
    });
    sourceWin.focus();
  });
}
