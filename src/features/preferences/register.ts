export async function registerPreferencesPane(): Promise<void> {
  await Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    id: "zotero-puls-preferences",
    src: `chrome://${addon.data.config.addonRef}/content/preferences.xhtml`,
    scripts: [`chrome://${addon.data.config.addonRef}/content/preferences.js`],
  });
}
