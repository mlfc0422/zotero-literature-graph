import { config } from "../package.json";
import type { GraphData } from "./modules/graphData";
import hooks, { pluginApi } from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
import type {
  PluginErrorContext,
  PluginErrorRecord,
} from "./platform/errorReporter";

class Addon {
  public data: {
    alive: boolean;
    config: typeof config;
    // Env type, see build.js
    env: "development" | "production";
    initialized?: boolean;
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: {
    buildCurrentCollectionGraph: (win?: _ZoteroTypes.MainWindow) => GraphData;
    openGraphWindow: (win?: _ZoteroTypes.MainWindow) => void;
    reportError: (
      error: unknown,
      context: PluginErrorContext,
    ) => PluginErrorRecord;
    getRecentErrors: () => readonly PluginErrorRecord[];
  };

  constructor() {
    this.data = {
      alive: true,
      config,
      env: __env__,
      initialized: false,
      ztoolkit: createZToolkit(),
    };
    this.hooks = hooks;
    this.api = {
      buildCurrentCollectionGraph: (win) =>
        pluginApi.buildCurrentCollectionGraph(win),
      openGraphWindow: (win) => pluginApi.openGraphWindow(win),
      reportError: (error, context) => pluginApi.reportError(error, context),
      getRecentErrors: () => pluginApi.getRecentErrors(),
    };
  }
}

export default Addon;
