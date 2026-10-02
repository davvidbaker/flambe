import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-HCqfBhaJ.js";import{At as n,D as r,Dt as i,E as a,F as o,Gt as s,Kt as c,Mt as l,N as u,O as d,Rt as ee,Ut as f,Wt as p,_t as te,j as m,jt as ne,k as h,kt as re}from"./createChartStore-DCxU9j_K.js";import{n as g,t as _}from"./styled-components.browser.esm-BHt5eeED.js";import{n as v,t as y}from"./tinycolor-8-749W-X.js";import{d as ie,n as ae,t as oe,u as se}from"./Unbutton-BqlnFA1i.js";import{n as b,r as ce,t as x}from"./styles-D6Mg8Yoa.js";import{n as le,r as S,t as ue}from"./Button-BSEyao1U.js";import{i as de,r as fe,t as pe}from"./chunk-62JRHF6Z-BtnV3t1f.js";import{i as me,r as he}from"./keyboardShortcuts-DnI_kWdK.js";import{n as C,o as w}from"./rolldown-runtime-C0FnF6B9.js";var T,E,D;function O(){return(O=C((()=>{T=w(e()),S(),E=t(),D=class extends T.Component{state={toggledOn:!1};toggle=()=>{this.setState(({toggledOn:e})=>({toggledOn:!e}))};render(){let{unstyled:e,title:t,toggles:n,children:r}=this.props;return(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(ue,{title:t,onClick:this.toggle,unstyled:e,children:r}),this.state.toggledOn?n(this.toggle):null]})}},D.__docgenInfo={description:``,methods:[{name:`toggle`,docblock:null,modifiers:[],params:[],returns:{type:{name:`void`}}}],displayName:`ToggleButton`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``},title:{required:!0,tsType:{name:`string`},description:``},toggles:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(toggle: () => void) => ReactNode`,signature:{arguments:[{type:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},name:`toggle`}],return:{name:`ReactNode`}}},description:``},unstyled:{required:!1,tsType:{name:`boolean`},description:``}}}})))()}function ge(e,t,n){if(t===n||t<0||n<0||t>=e.length||n>=e.length)return e;let r=[...e],[i]=r.splice(t,1);return r.splice(n,0,i),r}var k,A,j,M,N,P,F,I;function L(){return(L=C((()=>{k=w(e()),g(),o(),A=t(),j=_.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
`,M=_.li`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  opacity: ${e=>e.$dimmed?.45:1};
  background: ${e=>e.$dragging?`#eee`:`transparent`};
`,N=_.button`
  all: unset;
  cursor: grab;
  color: #888;
  font-size: 12px;
  letter-spacing: -1px;
  padding: 0 2px;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`,P=_.label`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
`,F=_.p`
  margin: 8px 0 0;
  color: #999;
  font-size: 0.8em;
`,I=({allThreads:e={},attentionDrivenThreadOrder:t,filterExcludes:n,onHideChange:r,onReorder:i,onToggleAttentionOrder:a,orderedThreadIds:o})=>{let[s,c]=(0,k.useState)(null),l=new Set(n.map(String)),d=Object.keys(u(n,e)).length,ee=(e,t)=>{!t&&d<=1||r(t?n.filter(t=>String(t)!==String(e)):[...n,e])},f=e=>{s!==null&&String(s)!==String(e)&&(i(ge(o,o.findIndex(e=>String(e)===String(s)),o.findIndex(t=>String(t)===String(e)))),c(null))};return(0,A.jsxs)(`div`,{children:[(0,A.jsx)(j,{children:o.map(t=>{let n=e[String(t)];if(!n)return null;let r=l.has(String(t));return(0,A.jsxs)(M,{$dimmed:r,$dragging:String(s)===String(t),draggable:!0,onDragStart:e=>{c(t),e.dataTransfer.setData(`text/plain`,String(t)),e.dataTransfer.effectAllowed=`move`},onDragEnd:()=>c(null),onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect=`move`},onDrop:e=>{e.preventDefault(),f(t)},children:[(0,A.jsx)(N,{type:`button`,"aria-label":`Reorder ${n.name}`,onClick:e=>e.preventDefault(),children:`::`}),(0,A.jsx)(`input`,{id:`thread-visible-${t}`,"aria-label":`Show ${n.name}`,checked:!r,disabled:!r&&d<=1,onChange:e=>ee(t,e.target.checked),type:`checkbox`}),(0,A.jsx)(P,{htmlFor:`thread-visible-${t}`,children:n.name})]},String(t))})}),(0,A.jsxs)(`label`,{children:[(0,A.jsx)(`input`,{checked:t,onChange:a,type:`checkbox`}),` `,`Order by recent attention`]}),(0,A.jsx)(F,{children:`Uncheck a thread to hide it. Drag to reorder; that stores a manual order and turns off attention-driven sorting.`})]})},I.__docgenInfo={description:``,methods:[],displayName:`ThreadFilter`,props:{allThreads:{required:!1,tsType:{name:`Record`,elements:[{name:`string`},{name:`intersection`,raw:`Thread & { suspendedActivityCount?: number }`,elements:[{name:`Thread`},{name:`signature`,type:`object`,raw:`{ suspendedActivityCount?: number }`,signature:{properties:[{key:`suspendedActivityCount`,value:{name:`number`,required:!1}}]}}]}],raw:`Record<string, FilterThread>`},description:``,defaultValue:{value:`{}`,computed:!1}},attentionDrivenThreadOrder:{required:!0,tsType:{name:`boolean`},description:``},filterExcludes:{required:!0,tsType:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},description:``},onHideChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(hiddenIds: EntityId[]) => unknown`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},name:`hiddenIds`}],return:{name:`unknown`}}},description:``},onReorder:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(orderedIds: EntityId[]) => unknown`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},name:`orderedIds`}],return:{name:`unknown`}}},description:``},onToggleAttentionOrder:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},orderedThreadIds:{required:!0,tsType:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},description:``}}}})))()}var R,z;function B(){return(B=C((()=>{R=e(),z=class extends R.Component{state={on:!1};setOn=()=>this.setState({on:!0});setOff=()=>this.setState({on:!1});toggle=()=>this.setState(({on:e})=>({on:!e}));render(){return this.props.children({on:this.state.on,setOff:this.setOff,setOn:this.setOn,toggle:this.toggle})}},z.__docgenInfo={description:``,methods:[{name:`setOn`,docblock:null,modifiers:[],params:[],returns:{type:{name:`void`}}},{name:`setOff`,docblock:null,modifiers:[],params:[],returns:{type:{name:`void`}}},{name:`toggle`,docblock:null,modifiers:[],params:[],returns:{type:{name:`void`}}}],displayName:`Toggle`,props:{children:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(props: ToggleRenderProps) => ReactNode`,signature:{arguments:[{type:{name:`ToggleRenderProps`},name:`props`}],return:{name:`ReactNode`}}},description:``}}}})))()}var V;function H(){return(H=C((()=>{V=`data:image/svg+xml,%3csvg%20width='11'%20height='14'%20viewBox='0%200%2011%2014'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%201H1V2.35616L4.90984%206.57534V10.3425L5.86885%2012V10.3425V6.57534L10%202.35616V1Z'%20fill='%23A4FFE9'%20fill-opacity='0.42'%20stroke='black'%20stroke-width='0.596419'/%3e%3c/svg%3e`})))()}function _e(e){return Object.fromEntries(Object.entries(e).map(([e,t])=>[e,{...t}]))}var U,ve,ye,be,W,xe;function Se(){return(Se=C((()=>{e(),p(),g(),y(),i(),m(),r(),L(),B(),ae(),b(),H(),U=t(),ve=_.div`
  width: 16rem;
  position: absolute;
  top: 0;
  left: 125%;
  z-index: 100;
  padding: 8px 10px;
  background: ${x.background};
  border: 1px solid ${v(x.background).darken(15).toString()};
  font-size: 12px;
`,ye=_.span`
  position: relative;
  display: inline-flex;
`,be=_.span`
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: #666;
  color: #fff;
  font-size: 9px;
  line-height: 14px;
  text-align: center;
  pointer-events: none;
`,W=({attentionDrivenThreadOrder:e,attentionShifts:t,filterExcludes:n=[],reorderThreads:r,setHiddenThreads:i,setSetting:a,threads:o={},toggleSetting:s})=>{let c=e?se(t,_e(o)):o,l=ie(c).map(([e])=>e),u=n.length;return(0,U.jsx)(z,{children:({on:t,toggle:c})=>(0,U.jsxs)(`div`,{style:{position:`relative`},children:[(0,U.jsxs)(ye,{children:[(0,U.jsx)(oe,{type:`button`,"aria-label":`Manage threads`,onClick:c,children:(0,U.jsx)(`img`,{height:`24px`,src:V,alt:`filter`})}),u>0&&(0,U.jsx)(be,{children:u})]}),t&&(0,U.jsx)(ve,{children:(0,U.jsx)(I,{allThreads:o,attentionDrivenThreadOrder:e,filterExcludes:n,onHideChange:i,onReorder:t=>{r(t),e&&a(`attentionDrivenThreadOrder`,!1)},onToggleAttentionOrder:()=>s(`attentionDrivenThreadOrder`),orderedThreadIds:l})})]})})},xe=f(e=>({threads:h(e).threads,filterExcludes:d(e),attentionDrivenThreadOrder:e.settings.attentionDrivenThreadOrder,attentionShifts:a(e).attentionShifts}),e=>({setHiddenThreads:t=>e(ne(t)),reorderThreads:t=>e(re(t)),setSetting:(t,n)=>e(l(t,n)),toggleSetting:t=>e(ee(t))}))(W),W.__docgenInfo={description:``,methods:[],displayName:`TraceThreadFilter`,props:{attentionDrivenThreadOrder:{required:!0,tsType:{name:`boolean`},description:``},attentionShifts:{required:!0,tsType:{name:`Array`,elements:[{name:`AttentionShift`}],raw:`AttentionShift[]`},description:``},filterExcludes:{required:!1,tsType:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},description:``,defaultValue:{value:`[]`,computed:!1}},reorderThreads:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(orderedIds: EntityId[]) => unknown`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},name:`orderedIds`}],return:{name:`unknown`}}},description:``},setHiddenThreads:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(hiddenIds: EntityId[]) => unknown`,signature:{arguments:[{type:{name:`Array`,elements:[{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]}],raw:`EntityId[]`},name:`hiddenIds`}],return:{name:`unknown`}}},description:``},setSetting:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(setting: string, value: boolean) => unknown`,signature:{arguments:[{type:{name:`string`},name:`setting`},{type:{name:`boolean`},name:`value`}],return:{name:`unknown`}}},description:``},threads:{required:!1,tsType:{name:`Record`,elements:[{name:`string`},{name:`Thread`}],raw:`Record<string, Thread>`},description:``,defaultValue:{value:`{}`,computed:!1}},toggleSetting:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(setting: string) => unknown`,signature:{arguments:[{type:{name:`string`},name:`setting`}],return:{name:`unknown`}}},description:``}}}})))()}var Ce;function we(){return(we=C((()=>{g(),y(),b(),Ce=_.ul`
  position: absolute;
  z-index: 2;
  list-style: none;
  padding: 5px 10px;
  background: ${x.background};
  border: 1px solid ${v(x.background).darken(15).toString()};
  width: 17rem;
  margin: 0;

  li {
    margin-bottom: 5px;
  }
`})))()}var Te,G,K,Ee;function De(){return(De=C((()=>{Te=w(e()),p(),i(),S(),G=t(),K=class extends Te.Component{submitNewTrace=e=>{this.props.createTrace(e)};render(){return(0,G.jsx)(`div`,{children:(0,G.jsx)(le,{submit:this.submitNewTrace,children:`New Trace`})})}},Ee=f(null,e=>({createTrace:t=>e(te(t))}))(K),K.__docgenInfo={description:``,methods:[{name:`submitNewTrace`,docblock:null,modifiers:[],params:[{name:`value`,optional:!1,type:{name:`string`}}],returns:{type:{name:`void`}}}],displayName:`NewTrace`,props:{createTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(name: string) => unknown`,signature:{arguments:[{type:{name:`string`},name:`name`}],return:{name:`unknown`}}},description:``}}}})))()}var q,Oe,ke,Ae,je,Me,J,Y;function Ne(){return(Ne=C((()=>{e(),fe(),g(),y(),we(),De(),b(),q=t(),Oe=_(Ce)`
  top: ${ce.headerHeight};
  left: 5px;
  width: 18rem;
  padding: 6px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

  li {
    margin-bottom: 0;
  }

  button,
  textarea {
    font-size: 13px;
    font-weight: 600;
    min-width: 0;
  }
`,ke=_.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${e=>e.$current?x[`focus-activity-bg`]:`transparent`};

  &:hover {
    background: ${x[`hover-activity-bg`]};
  }
`,Ae=_(pe)`
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: ${e=>e.$current?700:500};

  &:hover {
    text-decoration: underline;
  }
`,je=_.button`
  flex: 0 0 auto;
  margin: 0;
  padding: 2px 6px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #888;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${x.hover};
    color: ${x.red};
  }
`,Me=_.li`
  display: flex;
  justify-content: center;
  padding: 8px 10px 4px;
  border-top: 1px solid ${v(x.background).darken(10).toString()};
`,J=({trace:e,deleteTrace:t,onDeleteCurrent:n,toggle:r,selectTrace:i,current:a})=>(0,q.jsxs)(ke,{$current:a,children:[(0,q.jsx)(Ae,{$current:a,"aria-current":a?`page`:void 0,onClick:()=>{r(),i(e)},to:`/traces/${e.id}`,children:e.name}),(0,q.jsx)(je,{type:`button`,onClick:r=>{r.preventDefault(),r.stopPropagation(),a?n(e.id):t(e.id)},children:`Delete`})]}),Y=({traces:e,toggle:t,selectTrace:n,deleteTrace:r,currentTrace:i,deleteCurrentTrace:a})=>{let o=de(),s=i=>{let s=e.filter(e=>e.id!==i);a(),r(i),t(),s[0]?(n(s[0]),o(`/traces/${s[0].id}`)):o(`/`)};return(0,q.jsxs)(Oe,{children:[e.map(e=>(0,q.jsx)(J,{trace:e,toggle:t,selectTrace:n,current:!!(i&&e.id===i.id),deleteTrace:r,onDeleteCurrent:s},e.id)),(0,q.jsx)(Me,{children:(0,q.jsx)(Ee,{})})]})},Y.__docgenInfo={description:``,methods:[],displayName:`TraceList`,props:{currentTrace:{required:!1,tsType:{name:`union`,raw:`Trace | null`,elements:[{name:`Trace`},{name:`null`}]},description:``},deleteCurrentTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},deleteTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(id: EntityId) => unknown`,signature:{arguments:[{type:{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]},name:`id`}],return:{name:`unknown`}}},description:``},selectTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(trace: Trace) => unknown`,signature:{arguments:[{type:{name:`Trace`},name:`trace`}],return:{name:`unknown`}}},description:``},toggle:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},traces:{required:!0,tsType:{name:`Array`,elements:[{name:`Trace`}],raw:`Trace[]`},description:``}}}})))()}var X,Pe,Z;function Fe(){return(Fe=C((()=>{e(),g(),y(),O(),Se(),S(),Ne(),b(),me(),X=t(),Pe=_.header`
  position: relative;
  width: 100%;
  padding: 5px;
  background: #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  height: ${ce.headerHeight};
  box-sizing: border-box;

  > * {
    min-width: 0;
  }

  /* Only header chrome — not the traces dropdown nested inside ToggleButton. */
  > button,
  > textarea {
    font-weight: bold;
    font-size: large;
  }

  h1 {
    margin: 0;
    min-width: 0;
    text-align: center;
    font-size: 2em;
    color: ${v(x.background).darken(25).toString()};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    justify-content: flex-start;
    gap: 4px;
    height: 44px;
    padding: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: 0 0 auto;
    }

    > button {
      min-height: 34px;
      font-size: 12px;
    }

    > textarea {
      min-height: 34px;
      font-size: 16px;
    }

    h1 {
      max-width: 40vw;
      font-size: 14px;
      line-height: 34px;
      text-align: left;
    }
  }
`,Z=({traces:e,currentTrace:t,selectTrace:n,deleteTrace:r,deleteCurrentTrace:i,currentMantra:a,createMantra:o,onOpenCommander:s,logout:c})=>(0,X.jsxs)(Pe,{children:[e&&(0,X.jsx)(D,{title:`Toggle traces`,toggles:a=>(0,X.jsx)(Y,{traces:e,toggle:a,selectTrace:n,currentTrace:t,deleteCurrentTrace:i,deleteTrace:r},`traces-list`),children:`Traces`}),(0,X.jsx)(xe,{}),(0,X.jsx)(le,{submit:o,placeholderIsDefaultValue:!0,children:a||`Note to self`}),t&&(0,X.jsx)(`h1`,{children:t.name}),(0,X.jsx)(`button`,{type:`button`,onClick:s,title:`Command palette`,"aria-label":`Command palette`,children:he([`Mod`,`Shift`,`P`],!0)}),(0,X.jsx)(`button`,{type:`button`,onClick:c,children:`Log out`})]}),Z.__docgenInfo={description:``,methods:[],displayName:`Header`,props:{createMantra:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(name: string) => unknown`,signature:{arguments:[{type:{name:`string`},name:`name`}],return:{name:`unknown`}}},description:``},currentMantra:{required:!1,tsType:{name:`string`},description:``},currentTrace:{required:!1,tsType:{name:`union`,raw:`Trace | null`,elements:[{name:`Trace`},{name:`null`}]},description:``},deleteCurrentTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},deleteTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(id: EntityId) => unknown`,signature:{arguments:[{type:{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]},name:`id`}],return:{name:`unknown`}}},description:``},logout:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:``},onOpenCommander:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => unknown`,signature:{arguments:[],return:{name:`unknown`}}},description:`Opens the command palette (same as Mod+Shift+P).`},selectTrace:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(trace: Trace) => unknown`,signature:{arguments:[{type:{name:`Trace`},name:`trace`}],return:{name:`unknown`}}},description:``},traces:{required:!0,tsType:{name:`Array`,elements:[{name:`Trace`}],raw:`Trace[]`},description:``}}}})))()}function Ie(){let e=s(),t=c(e=>a(e)),r=c(e=>h(e).trace),i=r?.id?{id:r.id,name:r.name??``}:null;return(0,Le.jsx)(Z,{traces:t.traces,currentTrace:i,selectTrace:t=>e(n(t)),deleteTrace:Q,deleteCurrentTrace:Q,currentMantra:t.mantras[t.mantras.length-1]?.name,createMantra:Q,onOpenCommander:Q,logout:Q})}var Le,Q;function $(){return($=C((()=>{p(),Fe(),i(),m(),r(),Le=t(),Q=()=>void 0,Ie.__docgenInfo={description:``,methods:[],displayName:`StoryHeader`}})))()}export{$ as n,Ie as t};