export const GRAPH_WINDOW_STYLES = `
  :root { color-scheme: light dark; font: 14px system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #f7f8fa; color: #202124; }
  #app { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; }
  header { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: rgba(255,255,255,.94); border-bottom: 1px solid #dfe1e5; }
  h1 { margin: 0 auto 0 0; font-size: 17px; white-space: nowrap; }
  label { display: flex; gap: 8px; align-items: center; white-space: nowrap; color: #5d6875; font-size: 12px; font-weight: 600; }
  input[type=search] { width: 220px; padding: 7px 10px; border: 1px solid #c8ccd1; border-radius: 6px; }
  input[type=range] { width: 128px; height: 18px; margin: 0; accent-color: #475569; cursor: pointer; appearance: none; background: transparent; }
  input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, #cbd5e1, #64748b); box-shadow: inset 0 0 0 1px rgba(71,85,105,.14); }
  input[type=range]::-webkit-slider-thumb { width: 15px; height: 15px; margin-top: -5.5px; border: 3px solid #fff; border-radius: 50%; background: #334155; box-shadow: 0 1px 4px rgba(15,23,42,.3); appearance: none; transition: transform .15s ease, box-shadow .15s ease; }
  input[type=range]:hover::-webkit-slider-thumb, input[type=range]:focus-visible::-webkit-slider-thumb { transform: scale(1.16); box-shadow: 0 0 0 4px rgba(100,116,139,.18), 0 1px 5px rgba(15,23,42,.35); }
  input[type=range]::-moz-range-track { height: 4px; border-radius: 999px; background: #94a3b8; }
  input[type=range]::-moz-range-thumb { width: 11px; height: 11px; border: 3px solid #fff; border-radius: 50%; background: #334155; box-shadow: 0 1px 4px rgba(15,23,42,.3); }
  header label span { min-width: 58px; color: #334155; font-variant-numeric: tabular-nums; }
  main { min-height: 0; display: grid; grid-template-columns: 1fr 310px; }
  #canvas { min-width: 0; min-height: 0; background: radial-gradient(circle at center, #ffffff, #f1f3f5); }
  aside { overflow: auto; background: #fff; border-left: 1px solid #dfe1e5; padding: 16px; }
  #summary { color: #5d6875; margin-bottom: 12px; font-weight: 600; }
  #legend { display: flex; gap: 12px; margin-bottom: 14px; color: #5d6875; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 10px; height: 10px; display: inline-block; border-radius: 50%; }
  .legend-dot.author { background: #d1d5db; border: 1px solid #9ca3af; }
  .legend-dot.tag { background: #374151; }
  #gesture-help { color: #73777c; font-size: 12px; margin: -4px 0 15px; }
  #detail-title { margin: 0 0 10px; font-size: 16px; }
  #papers { list-style: none; padding: 0; margin: 0; }
  #papers li { padding: 9px 7px; border-bottom: 1px solid #eceff1; cursor: default; border-radius: 5px; }
  #papers li:hover { background: #edf4ff; }
  .paper-title { font-weight: 600; }
  .paper-meta { color: #73777c; font-size: 12px; margin-top: 3px; }
  #empty { display: none; padding: 32px; color: #62676d; text-align: center; }
  @media (prefers-color-scheme: dark) {
    body, #canvas { background: #202124; color: #e8eaed; }
    header, aside { background: rgba(41,42,45,.96); border-color: #44464b; }
    #canvas { background: radial-gradient(circle at center, #292a2d, #202124); }
    input[type=search] { color: #e8eaed; background: #202124; border-color: #5f6368; }
    label, header label span { color: #cbd5e1; }
    input[type=range]::-webkit-slider-runnable-track { background: linear-gradient(90deg, #475569, #cbd5e1); }
    input[type=range]::-webkit-slider-thumb, input[type=range]::-moz-range-thumb { border-color: #292a2d; background: #e2e8f0; }
    #papers li { border-color: #44464b; }
    #papers li:hover { background: #374151; }
  }
`;
