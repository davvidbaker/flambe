import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-emszFagi.js";import{n,t as r}from"./styled-components.browser.esm-BHt5eeED.js";import{n as i,t as a}from"./tinycolor-8-749W-X.js";import{n as o}from"./rolldown-runtime-C0FnF6B9.js";function s(e){return Object.values(e).filter(e=>e.status===`suspended`||e.status===`unstarted`&&e.scheduled_start==null&&e.scheduled_end==null).map(e=>({activity:e})).sort((e,t)=>String(e.activity.name).localeCompare(String(t.activity.name)))}function c(){return(c=o((()=>{})))()}function l(e,t){let n=t.find(t=>String(t.id)===String(e.categories?.[0]))?.color_background??p;return{fill:i(n).isValid()?i(n).toHexString():p}}function u({activity:e,beginActivity:t,categories:n,deleteActivity:r,focusActivity:i}){let a=e.status===`unstarted`,{fill:o}=l(e,n),s=n.find(t=>String(t.id)===String(e.categories?.[0])),c=e.name??`Untitled activity`;return(0,f.jsxs)(D,{$accent:o,$draggable:a,$paused:!a,draggable:a,onDragStart:t=>{t.dataTransfer.setData(`text/flambe-activity`,String(e.id))},children:[(0,f.jsxs)(O,{type:`button`,title:c,onClick:()=>i(e.id),children:[(0,f.jsx)(k,{children:c}),(0,f.jsxs)(A,{children:[s?.name&&(0,f.jsx)(`span`,{children:s.name}),typeof e.weight==`number`&&Number.isFinite(e.weight)&&(0,f.jsxs)(j,{children:[`weight `,e.weight]})]})]}),(0,f.jsxs)(M,{children:[a&&e.thread_id!==void 0&&(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(N,{type:`button`,onClick:()=>t(e.id),children:`Begin`}),(0,f.jsx)(N,{type:`button`,$destructive:!0,onClick:()=>r(e.id,e.thread_id),children:`Give up`})]}),!a&&(0,f.jsx)(`span`,{style:{color:_,fontSize:10},children:`Select to view`})]})]})}function d({activities:e,beginActivity:t,categories:n,deleteActivity:r,focusActivity:i}){let a=s(e),o=a.filter(e=>e.activity.status===`unstarted`),c=a.filter(e=>e.activity.status===`suspended`);return(0,f.jsxs)(v,{"aria-label":`Limbo`,children:[(0,f.jsxs)(y,{children:[(0,f.jsx)(b,{children:`Limbo`}),(0,f.jsx)(x,{children:a.length===0?`No unscheduled or paused work`:`Drag unstarted work onto the timeline to schedule it`})]}),a.length>0&&(0,f.jsxs)(S,{children:[o.length>0&&(0,f.jsxs)(C,{children:[(0,f.jsxs)(w,{children:[`Not started `,(0,f.jsx)(T,{children:o.length})]}),(0,f.jsx)(E,{children:o.map(({activity:e})=>(0,f.jsx)(u,{activity:e,beginActivity:t,categories:n,deleteActivity:r,focusActivity:i},String(e.id)))})]}),c.length>0&&(0,f.jsxs)(C,{children:[(0,f.jsxs)(w,{children:[`Paused `,(0,f.jsx)(T,{children:c.length})]}),(0,f.jsx)(E,{children:c.map(({activity:e})=>(0,f.jsx)(u,{activity:e,beginActivity:t,categories:n,deleteActivity:r,focusActivity:i},String(e.id)))})]})]})]})}var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N;function P(){return(P=o((()=>{e(),n(),a(),f=t(),p=`#c47b2b`,m=`#ffffff`,h=`#f4f3f0`,g=`#262421`,_=`#6f6b63`,v=r.section`
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid #d9d6d0;
  background: ${h};
  color: ${g};
  font-family: sans-serif;
`,y=r.header`
  min-height: 36px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-bottom: 1px solid #dfdcd6;
`,b=r.strong`
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`,x=r.span`
  overflow: hidden;
  color: ${_};
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
`,S=r.div`
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  overflow: auto;
`,C=r.section`
  min-width: 0;
  padding: 9px 12px 12px;
  border-right: 1px solid #dfdcd6;

  &:last-child {
    border-right: 0;
  }
`,w=r.h3`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  color: ${_};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`,T=r.span`
  min-width: 16px;
  padding: 1px 5px;
  border-radius: 10px;
  background: #e4e1dc;
  color: #57534d;
  text-align: center;
  letter-spacing: 0;
`,E=r.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 0 5px;
`,D=r.article`
  position: relative;
  box-sizing: border-box;
  width: 218px;
  min-width: 218px;
  height: 92px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d8d5cf;
  border-top: 4px solid ${e=>e.$accent};
  border-radius: 6px;
  background: ${m};
  box-shadow: 0 1px 2px rgba(35, 31, 25, 0.07);
  cursor: ${e=>e.$draggable?`grab`:`default`};
  opacity: ${e=>e.$paused?.82:1};
  transition: border-color 100ms ease, box-shadow 100ms ease, transform 100ms ease;

  &:hover,
  &:focus-within {
    border-color: #aaa59d;
    box-shadow: 0 3px 10px rgba(35, 31, 25, 0.13);
    transform: translateY(-1px);
  }

  &:active {
    cursor: ${e=>e.$draggable?`grabbing`:`default`};
  }
`,O=r.button`
  min-height: 0;
  flex: 1;
  padding: 9px 10px 4px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid #4c7ac7;
    outline-offset: -2px;
  }
`,k=r.span`
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`,A=r.span`
  display: flex;
  gap: 6px;
  margin-top: 5px;
  color: ${_};
  font-size: 10px;
`,j=r.span`
  padding: 1px 5px;
  border-radius: 8px;
  background: #eeece8;
`,M=r.div`
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 0 7px 5px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 100ms ease;

  ${D}:hover &,
  ${D}:focus-within & {
    opacity: 1;
    pointer-events: auto;
  }

  @media (hover: none) {
    opacity: 1;
    pointer-events: auto;
  }
`,N=r.button`
  padding: 2px 6px;
  border: 1px solid ${e=>e.$destructive?`#d8b0aa`:`#cbc7c0`};
  border-radius: 4px;
  background: ${m};
  color: ${e=>e.$destructive?`#9e3328`:`#4d4943`};
  cursor: pointer;
  font-size: 10px;

  &:hover {
    background: ${e=>e.$destructive?`#fff1ef`:`#f2f0ec`};
  }
`,d.__docgenInfo={description:``,methods:[],displayName:`LimboPane`,props:{activities:{required:!0,tsType:{name:`Record`,elements:[{name:`string`},{name:`ProcessedActivity`}],raw:`Record<string, ProcessedActivity>`},description:``},beginActivity:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(id: EntityId) => unknown`,signature:{arguments:[{type:{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]},name:`id`}],return:{name:`unknown`}}},description:``},categories:{required:!0,tsType:{name:`Array`,elements:[{name:`Category`}],raw:`Category[]`},description:``},deleteActivity:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(id: EntityId, threadId: EntityId) => unknown`,signature:{arguments:[{type:{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]},name:`id`},{type:{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]},name:`threadId`}],return:{name:`unknown`}}},description:``},focusActivity:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(id: EntityId) => unknown`,signature:{arguments:[{type:{name:`union`,raw:`number | string`,elements:[{name:`number`},{name:`string`}]},name:`id`}],return:{name:`unknown`}}},description:``}}}})))()}export{s as i,P as n,c as r,d as t};