import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-DpdXv4ob.js";import{Et as n,Ft as r,Ht as i,St as a,Ut as o,Vt as s,n as c,t as l}from"./createChartStore-DsEdmBcb.js";import{n as u,t as d}from"./fixtureTrace-SwujOBjs.js";import{n as f,t as p}from"./styled-components.browser.esm-BHt5eeED.js";import{n as m,t as h}from"./AppModal-fbRstz_Z.js";import{n as g,r as _}from"./chunk-62JRHF6Z-BtnV3t1f.js";import{n as v}from"./rolldown-runtime-C0FnF6B9.js";function y(e=typeof navigator>`u`?``:navigator.platform,t=typeof navigator>`u`?``:navigator.userAgent){return/Mac|iPhone|iPad|iPod/i.test(e)||/Mac OS X/i.test(t)}function b(e,t=y()){switch(e){case`Mod`:return t?`⌘`:`Ctrl`;case`Shift`:return t?`⇧`:`Shift`;case`Option`:return t?`⌥`:`Alt`;default:return e}}var x;function S(){return(S=v((()=>{x=[{title:`General`,shortcuts:[{id:`shortcuts`,label:`Keyboard shortcuts`,keys:[`Mod`,`/`]},{id:`settings`,label:`Open settings`,keys:[`Mod`,`,`]},{id:`commander`,label:`Command palette`,keys:[`Mod`,`Shift`,`P`]},{id:`undo`,label:`Undo last command`,keys:[`Mod`,`Z`]},{id:`mute`,label:`Mute / unmute other activities`,keys:[`Mod`,`M`]},{id:`collapse-threads`,label:`Collapse all threads`,keys:[`Shift`,`{`]},{id:`expand-threads`,label:`Expand all threads`,keys:[`Shift`,`}`]}]},{title:`Search`,shortcuts:[{id:`find`,label:`Find`,keys:[`Mod`,`F`]},{id:`advanced-search`,label:`Advanced search`,keys:[`Mod`,`Shift`,`F`]}]},{title:`Timeline`,note:`When focus is not in a text field.`,shortcuts:[{id:`zoom-now`,label:`Jump to now`,keys:[`N`]},{id:`zoom-chord`,label:`Zoom to a period, then H / D / W / M / Y / A`,keys:[`Z`]}]},{title:`Focused activity`,note:`After selecting a block, while focus is not in a text field.`,shortcuts:[{id:`details`,label:`Edit / view details`,keys:[`Space`]},{id:`end`,label:`End`,keys:[`E`]},{id:`reject`,label:`End by rejection`,keys:[`J`]},{id:`resolve`,label:`End by resolution`,keys:[`V`]},{id:`suspend`,label:`Suspend (active activities)`,keys:[`S`]}]}]})))()}function C({keys:e,apple:t}){return(0,w.jsx)(A,{children:e.map((e,n)=>(0,w.jsx)(j,{children:b(e,t)},`${e}-${n}`))})}var w,T,E,D,O,k,A,j,M,N;function P(){return(P=v((()=>{e(),o(),f(),m(),n(),S(),w=t(),T=p.div`
  font-size: 12px;
  min-width: min(90vw, 480px);

  h1 {
    margin: 0 0 12px;
    font-size: 16px;
  }
`,E=p.section`
  & + & {
    margin-top: 14px;
  }

  h2 {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  p {
    margin: 0 0 8px;
    color: #999;
    font-size: 0.9em;
  }
`,D=p.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`,O=p.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`,k=p.span`
  color: #222;
`,A=p.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
`,j=p.kbd`
  display: inline-block;
  min-width: 1.4em;
  padding: 1px 6px;
  border: 1px solid #ccc;
  border-bottom-width: 2px;
  border-radius: 3px;
  background: #f7f7f7;
  color: #333;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
`,M=({keyboardShortcutsVisible:e,hideKeyboardShortcuts:t})=>{let n=y();return(0,w.jsx)(h,{contentLabel:`Keyboard shortcuts`,isOpen:e,onRequestClose:t,wide:!0,children:(0,w.jsxs)(T,{children:[(0,w.jsx)(`h1`,{children:`Keyboard shortcuts`}),x.map(e=>(0,w.jsxs)(E,{children:[(0,w.jsx)(`h2`,{children:e.title}),e.note?(0,w.jsx)(`p`,{children:e.note}):null,(0,w.jsx)(D,{children:e.shortcuts.map(e=>(0,w.jsxs)(O,{children:[(0,w.jsx)(k,{children:e.label}),(0,w.jsx)(C,{keys:e.keys,apple:n})]},e.id))})]},e.title))]})})},N=i(e=>({keyboardShortcutsVisible:e.keyboardShortcutsVisible}),e=>({hideKeyboardShortcuts:()=>e(a())}))(M),M.__docgenInfo={description:``,methods:[],displayName:`KeyboardShortcuts`,props:{hideKeyboardShortcuts:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},keyboardShortcutsVisible:{required:!0,tsType:{name:`boolean`},description:``}}}})))()}function F(){let[e]=(0,I.useState)(()=>{let e=l(R);return e.dispatch(r()),e});return(0,L.jsx)(g,{children:(0,L.jsxs)(s,{store:e,children:[(0,L.jsx)(`div`,{style:{minHeight:`100vh`,background:`#eee`}}),(0,L.jsx)(N,{})]})})}var I,L,R,z,B,V;function H(){return(H=v((()=>{I=e(),o(),_(),P(),n(),c(),u(),L=t(),R=d(),z={title:`App/KeyboardShortcuts`,component:N,parameters:{layout:`fullscreen`,controls:{disable:!0}}},B={render:()=>(0,L.jsx)(F,{})},V=[`Open`]})))()}H();export{B as Open,V as __namedExportsOrder,z as default};