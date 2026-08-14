import { createZToolkit } from "./utils/ztoolkit";
import { buildCurrentCollectionGraph } from "./modules/graphData";
import { graphWindowController } from "./modules/graphWindow";
import {
  registerGraphFeature,
  shutdownGraphFeature,
  unregisterGraphFeature,
} from "./features/graph/register";
import {
  registerAiTagFeature,
  unregisterAiTagFeature,
} from "./features/aiTags/register";
import {
  registerEasyScholarFeature,
  registerEasyScholarColumn,
  registerEasyScholarNotifier,
  shutdownEasyScholarFeature,
  unregisterEasyScholarFeature,
} from "./features/easyScholar/register";
import { registerPreferencesPane } from "./features/preferences/register";
import {
  registerPublicationResolverFeature,
  unregisterPublicationResolverFeature,
} from "./features/publicationResolver/register";
import { findPublishedVersion } from "./modules/publicationResolver";
import {
  registerCollectionCountFeature,
  registerCollectionCountNotifier,
  shutdownCollectionCountFeature,
  unregisterCollectionCountFeature,
} from "./features/collectionCounts/register";
import {
  registerPdfTranslateFeature,
  unregisterPdfTranslateFeature,
} from "./features/pdfTranslate/register";

async function onStartup(): Promise<void> {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
  await registerPreferencesPane();
  registerEasyScholarColumn();
  registerEasyScholarNotifier();
  registerCollectionCountNotifier();
  registerPdfTranslateFeature();
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  addon.data.ztoolkit = createZToolkit();
  registerGraphFeature(win);
  registerAiTagFeature(win);
  registerEasyScholarFeature(win);
  registerPublicationResolverFeature(win);
  registerCollectionCountFeature(win);
}

async function onMainWindowUnload(win: Window): Promise<void> {
  unregisterGraphFeature(win);
  unregisterAiTagFeature(win);
  unregisterEasyScholarFeature(win);
  unregisterPublicationResolverFeature(win);
  unregisterCollectionCountFeature(win);
}

function onShutdown(): void {
  shutdownGraphFeature();
  shutdownEasyScholarFeature();
  shutdownCollectionCountFeature();
  unregisterPdfTranslateFeature();
  for (const win of Zotero.getMainWindows()) void onMainWindowUnload(win);
  ztoolkit.unregisterAll();
  addon.data.alive = false;
  // @ts-expect-error Plugin instance is intentionally removed on shutdown
  delete Zotero[addon.data.config.addonInstance];
}

export default { onStartup, onShutdown, onMainWindowLoad, onMainWindowUnload };

export const pluginApi = {
  buildCurrentCollectionGraph,
  findPublishedVersion,
  openGraphWindow: (win?: _ZoteroTypes.MainWindow) =>
    graphWindowController.openOrRefresh(win),
};
