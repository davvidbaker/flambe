import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-HCqfBhaJ.js";import{Ct as n,Dt as r,Ht as i,It as a,Ut as o,Wt as s,n as c,t as l}from"./createChartStore-DCxU9j_K.js";import{n as u,t as d}from"./fixtureTrace-SwujOBjs.js";import{n as f,t as p}from"./styled-components.browser.esm-BHt5eeED.js";import{n as m,t as h}from"./AppModal-Cuc1vV7o.js";import{n as g,r as _}from"./chunk-62JRHF6Z-BtnV3t1f.js";import{a as v,i as y,n as b,t as x}from"./keyboardShortcuts-DnI_kWdK.js";import{n as S}from"./rolldown-runtime-C0FnF6B9.js";function C({keys:e,apple:t}){return(0,w.jsx)(A,{children:e.map((e,n)=>(0,w.jsx)(j,{children:b(e,t)},`${e}-${n}`))})}var w,T,E,D,O,k,A,j,M,N;function P(){return(P=S((()=>{e(),s(),f(),m(),r(),y(),w=t(),T=p.div`
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
`,M=({keyboardShortcutsVisible:e,hideKeyboardShortcuts:t})=>{let n=v();return(0,w.jsx)(h,{contentLabel:`Keyboard shortcuts`,isOpen:e,onRequestClose:t,wide:!0,children:(0,w.jsxs)(T,{children:[(0,w.jsx)(`h1`,{children:`Keyboard shortcuts`}),x.map(e=>(0,w.jsxs)(E,{children:[(0,w.jsx)(`h2`,{children:e.title}),e.note?(0,w.jsx)(`p`,{children:e.note}):null,(0,w.jsx)(D,{children:e.shortcuts.map(e=>(0,w.jsxs)(O,{children:[(0,w.jsx)(k,{children:e.label}),(0,w.jsx)(C,{keys:e.keys,apple:n})]},e.id))})]},e.title))]})})},N=o(e=>({keyboardShortcutsVisible:e.keyboardShortcutsVisible}),e=>({hideKeyboardShortcuts:()=>e(n())}))(M),M.__docgenInfo={description:``,methods:[],displayName:`KeyboardShortcuts`,props:{hideKeyboardShortcuts:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},keyboardShortcutsVisible:{required:!0,tsType:{name:`boolean`},description:``}}}})))()}function F(){let[e]=(0,I.useState)(()=>{let e=l(R);return e.dispatch(a()),e});return(0,L.jsx)(g,{children:(0,L.jsxs)(i,{store:e,children:[(0,L.jsx)(`div`,{style:{minHeight:`100vh`,background:`#eee`}}),(0,L.jsx)(N,{})]})})}var I,L,R,z,B,V;function H(){return(H=S((()=>{I=e(),s(),_(),P(),r(),c(),u(),L=t(),R=d(),z={title:`App/KeyboardShortcuts`,component:N,parameters:{layout:`fullscreen`,controls:{disable:!0}}},B={render:()=>(0,L.jsx)(F,{})},V=[`Open`]})))()}H();export{B as Open,V as __namedExportsOrder,z as default};