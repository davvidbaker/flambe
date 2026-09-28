import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-emszFagi.js";import{Ct as n,Et as r,Ht as i,It as a,Lt as o,Ut as s,Vt as c,b as l,h as u,jt as d,m as ee,n as te,t as ne}from"./createChartStore-DsEdmBcb.js";import{n as f,t as p}from"./fixtureTrace-SwujOBjs.js";import{n as m,t as h}from"./styled-components.browser.esm-BHt5eeED.js";import{n as re,t as ie}from"./AppModal-PKBm73GR.js";import{n as ae,r as g}from"./chunk-62JRHF6Z-BtnV3t1f.js";import{n as _,o as v}from"./rolldown-runtime-C0FnF6B9.js";function y(e){if(!e)return`never`;let t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString()}function b(){let[e,t]=(0,x.useState)([]),[n,r]=(0,x.useState)(`agent`),[i,a]=(0,x.useState)(null),[o,s]=(0,x.useState)(null),c=(0,x.useCallback)(async()=>{let e=await fetch(`/api/api-tokens`,{credentials:`include`});if(!e.ok){s(`Could not load API tokens.`);return}let n=await e.json();t(n.data)},[]);(0,x.useEffect)(()=>{c()},[c]);let l=async e=>{e.preventDefault(),s(null);let t=await fetch(`/api/api-tokens`,{method:`POST`,credentials:`include`,headers:{"content-type":`application/json`},body:JSON.stringify({api_token:{name:n}})});if(!t.ok){s(`Could not create that token.`);return}let i=await t.json();a(i.data.raw_token),r(`agent`),await c()},u=async e=>{if(s(null),!(await fetch(`/api/api-tokens/${e}`,{method:`DELETE`,credentials:`include`})).ok){s(`Could not revoke that token.`);return}i&&a(null),await c()};return(0,S.jsxs)(C,{children:[(0,S.jsx)(`h2`,{children:`API tokens`}),(0,S.jsx)(`p`,{children:`Create a token for the flambe CLI. The secret is shown only once.`}),(0,S.jsxs)(`form`,{onSubmit:l,children:[(0,S.jsx)(`input`,{"aria-label":`Token name`,value:n,onChange:e=>r(e.target.value),maxLength:100,required:!0}),(0,S.jsx)(`button`,{type:`submit`,children:`Create token`})]}),i&&(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`p`,{children:`Copy this token now. It will not be shown again.`}),(0,S.jsx)(`code`,{children:i}),(0,S.jsx)(`button`,{type:`button`,onClick:async()=>{i&&await navigator.clipboard.writeText(i)},children:`Copy token`})]}),o&&(0,S.jsx)(`p`,{children:o}),(0,S.jsx)(`ul`,{children:e.map(e=>(0,S.jsxs)(`li`,{children:[(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`strong`,{children:e.name}),(0,S.jsxs)(`span`,{children:[`created `,y(e.inserted_at),`; last used`,` `,y(e.last_used_at)]})]}),(0,S.jsx)(`button`,{type:`button`,onClick:()=>void u(e.id),children:`Revoke`})]},e.id))})]})}var x,S,C;function w(){return(w=_((()=>{x=v(e()),m(),S=t(),C=h.section`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ddd;

  h2 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  p {
    margin: 0 0 8px;
    color: #666;
  }

  form {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }

  input {
    flex: 1;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 8px;
  }

  code {
    display: block;
    margin: 8px 0;
    padding: 6px;
    word-break: break-all;
    background: #f6f6f6;
  }
`,b.__docgenInfo={description:``,methods:[],displayName:`ApiTokensPanel`}})))()}function T(e){return!e||e===`unknown`?e||`unknown`:e.length>7?e.slice(0,7):e}function E(e){return!e||e===`unknown`?null:`${D}/${e}`}function oe(){return O||=fetch(`/api/health`,{credentials:`include`}).then(async e=>{if(!e.ok)throw Error(`health ${e.status}`);let t=await e.json();return{git_sha:typeof t.git_sha==`string`&&t.git_sha?t.git_sha:`unknown`}}).catch(e=>{throw O=null,e}),O}var D,O;function k(){return(k=_((()=>{D=`https://github.com/davvidbaker/flambe/commit`,O=null})))()}function A({setting:e,copy:t,description:n,number:r,select:i,subsettings:a},o,s,c){return(0,M.jsx)(`li`,{children:(0,M.jsxs)(F,{children:[(0,M.jsx)(`input`,{checked:!!o[e],onChange:()=>s(e),type:`checkbox`,id:e}),(0,M.jsx)(`label`,{htmlFor:e,children:t}),(0,M.jsx)(`span`,{children:n}),r&&(0,M.jsxs)(I,{$disabled:!o[e],children:[(0,M.jsx)(`label`,{htmlFor:r.setting,children:r.copy}),(0,M.jsx)(R,{id:r.setting,type:`number`,min:r.min,max:r.max,step:1,value:Number(o[r.setting]),disabled:!o[e],onChange:e=>c(r.setting,e.target.valueAsNumber)})]}),i&&(0,M.jsxs)(I,{$disabled:!o[e],children:[(0,M.jsx)(`label`,{htmlFor:i.setting,children:i.copy}),(0,M.jsx)(L,{id:i.setting,value:String(o[i.setting]),disabled:!o[e],onChange:e=>c(i.setting,e.target.value),children:i.options.map(e=>(0,M.jsx)(`option`,{value:e,children:e},e))})]}),a&&a.map(({copy:t,description:n,setting:r})=>(0,M.jsx)(F,{children:(0,M.jsxs)(I,{$disabled:!o[e],children:[(0,M.jsx)(`input`,{checked:!!o[r],onChange:()=>s(r),type:`checkbox`,id:r,disabled:!o[e]}),(0,M.jsx)(`label`,{htmlFor:r,children:t}),(0,M.jsx)(`span`,{children:n})]})},r))]})},e)}var j,M,N,P,F,I,L,R,z,B,V,H,U;function W(){return(W=_((()=>{j=v(e()),s(),m(),re(),w(),r(),k(),l(),ee(),M=t(),N=[{setting:`attentionFlows`,copy:`Attention Flows`},{setting:`attentionDrivenThreadOrder`,copy:`Attention Driven Thread Order`,description:`Threads are ordered by what was worked on most recently`},{setting:`activityMute`,copy:`Mute Activities`,description:`Dim every activity except the focused one (⌘M / Ctrl+M).`},{setting:`reactiveThreadHeight`,copy:`Reactive Thread Height`,description:`The height of a thread dynamically adjusts its height depending on how many levels are in the visible window.`},{setting:`suspendResumeFlows`,copy:`Suspend/Resume Flows`,subsettings:[{copy:`Only show flows for the focused  activity.`,setting:`suspendResumeFlowsOnlyForFocusedActivity`,description:`This should be more performant than showing all the flows.`}]},{setting:`uniformBlockHeight`,copy:`Uniform Block Height`,description:`In collapsed threads, all blocks are the same height.`},{setting:`darkerAsWeGoDown`,copy:`Darker as we go down`,description:`Shade nested activities darker at each deeper level.`},{setting:`rightAlignTimelineText`,copy:`Right-align Timeline Text`,description:`Draw activity names against the right edge of each block.`},{setting:`absoluteTimeLabels`,copy:`Absolute Time Labels`,description:`Show clock times on the timeline axis instead of time ago. Granularity follows the visible zoom level.`,subsettings:[{setting:`twelveHourClock`,copy:`12-hour clock`,description:`Use AM/PM instead of 24-hour time.`}]}],P=[{setting:`showActivityIds`,copy:`Show Activity IDs`,description:`Label flame-chart blocks with activity id instead of name, for matching what you see to database events.`},{setting:`swyzzle`,copy:`Swyzzle`,description:`After the configured idle time, melt the flame chart. Move the pointer to stir it. Space or Escape clears it.`,number:{copy:`Idle seconds`,setting:`swyzzleIdleSeconds`,min:1,max:60},select:{copy:`Shader`,setting:`swyzzleEffect`,options:u}}],F=h.div`
  span {
    display: block;
    color: #999;
    font-size: 0.8em;
  }
  input {
    margin-left: 0;
  }
`,I=h.div`
  margin-left: 20px;

  color: ${e=>e.$disabled?`lightgrey`:`inherit`};
`,L=h.select`
  display: block;
  margin-top: 4px;
  font-size: 11px;
`,R=h.input`
  display: block;
  margin-top: 4px;
  font-size: 11px;
  width: 4.5em;
`,z=h.div`
  font-size: 11px;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    margin-bottom: 5px;
  }
`,B=h.div`
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 4px;
  background: #f0f0f0;
  border: 1px solid #ddd;

  h2 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  li:last-child {
    margin-bottom: 0;
  }
`,V=h.div`
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #ddd;

  dt {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  dd {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    word-break: break-all;
  }

  a {
    color: inherit;
  }

  button {
    margin-left: 8px;
    font-size: 11px;
  }
`,H=({settingsVisible:e,hideSettings:t,settings:n,setSetting:r,toggleSetting:i})=>{let[a,o]=(0,j.useState)(null);(0,j.useEffect)(()=>{if(!e)return;let t=!1;return oe().then(e=>{t||o(e)}).catch(()=>{t||o({git_sha:`unknown`})}),()=>{t=!0}},[e]);let s=a?.git_sha??`…`,c=a?E(a.git_sha):null;return(0,M.jsx)(ie,{isOpen:e,onRequestClose:t,children:(0,M.jsxs)(z,{children:[(0,M.jsx)(`h1`,{style:{marginTop:0},children:`Settings`}),(0,M.jsx)(`ul`,{children:N.map(e=>A(e,n,i,r))}),(0,M.jsxs)(B,{children:[(0,M.jsx)(`h2`,{children:`Developer`}),(0,M.jsx)(`ul`,{children:P.map(e=>A(e,n,i,r))}),(0,M.jsxs)(V,{children:[(0,M.jsx)(`dt`,{children:`Deployed commit`}),(0,M.jsxs)(`dd`,{children:[c?(0,M.jsx)(`a`,{href:c,rel:`noreferrer`,target:`_blank`,title:s,children:T(s)}):(0,M.jsx)(`span`,{title:s,children:T(s)}),a&&a.git_sha!==`unknown`&&(0,M.jsx)(`button`,{type:`button`,onClick:()=>{navigator.clipboard.writeText(a.git_sha)},children:`Copy SHA`})]})]})]}),(0,M.jsx)(b,{})]})})},U=i(e=>({settingsVisible:e.settingsVisible,settings:e.settings}),e=>({hideSettings:()=>e(n()),setSetting:(t,n)=>e(d(t,n)),toggleSetting:t=>e(o(t))}))(H),H.__docgenInfo={description:``,methods:[],displayName:`Settings`,props:{hideSettings:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},settings:{required:!0,tsType:{name:`SettingsState`},description:``},settingsVisible:{required:!0,tsType:{name:`boolean`},description:``},setSetting:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(setting: string, value: boolean | string | number) => unknown`,signature:{arguments:[{type:{name:`string`},name:`setting`},{type:{name:`union`,raw:`boolean | string | number`,elements:[{name:`boolean`},{name:`string`},{name:`number`}]},name:`value`}],return:{name:`unknown`}}},description:``},toggleSetting:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(setting: BooleanSettingKey) => unknown`,signature:{arguments:[{type:{name:`unknown`},name:`setting`}],return:{name:`unknown`}}},description:``}}}})))()}function G({swyzzle:e=!1}){let[t]=(0,K.useState)(()=>{let t=ne(J);return t.dispatch(a()),e&&t.dispatch(d(`swyzzle`,!0)),t});return(0,q.jsx)(ae,{children:(0,q.jsxs)(c,{store:t,children:[(0,q.jsx)(`div`,{style:{minHeight:`100vh`,background:`#eee`}}),(0,q.jsx)(U,{})]})})}var K,q,J,Y,X,Z,Q;function $(){return($=_((()=>{K=e(),s(),g(),W(),r(),te(),f(),q=t(),J=p(),Y={title:`App/Settings`,component:U,parameters:{layout:`fullscreen`,controls:{disable:!0}}},X={render:()=>(0,q.jsx)(G,{})},Z={render:()=>(0,q.jsx)(G,{swyzzle:!0})},Q=[`Open`,`SwyzzleOn`]})))()}$();export{X as Open,Z as SwyzzleOn,Q as __namedExportsOrder,Y as default};