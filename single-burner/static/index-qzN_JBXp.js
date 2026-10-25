import{a as e,r as t}from"./rolldown-runtime-B0Z9INg1.js";import{A as n,C as r,D as i,E as a,M as o,N as s,O as c,P as l,S as u,T as d,_ as f,a as p,c as m,d as h,f as g,g as _,h as v,i as y,j as b,k as x,l as S,m as C,n as w,o as T,p as E,r as ee,s as D,t as O,u as te,v as ne,w as re,x as ie}from"./framework-Cpw-o916.js";import{a as ae,i as k,n as oe,o as A,r as se,t as ce}from"./ui-CfVAyOo3.js";import{i as le,n as ue,r as de,t as fe}from"./services-BWO3J-XS.js";import{a as pe,c as me,i as he,n as ge,o as _e,r as ve,s as ye,t as be}from"./vendor-Ywoyfi61.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var j=e(l()),xe=e(s()),Se=o(),Ce=`flambe.thread-hidden-state.v1`;function we(){try{let e=window.localStorage.getItem(Ce),t=e?JSON.parse(e):{};return t&&typeof t==`object`?t:{}}catch{return{}}}function Te(e){return Array.isArray(e)?e.map(e=>Number(e)).filter(e=>Number.isFinite(e)&&e>0):[]}function Ee(e){return e?Te(we()[String(e)]):[]}function De(e,t){if(e)try{window.localStorage.setItem(Ce,JSON.stringify({...we(),[String(e)]:Te(t)}))}catch{}}var Oe=`PROCESS_TIMELINE_TRACE`,ke=`TIMELINE_ZOOM`,Ae=`TIMELINE_PAN`,je=`TIMELINE_SET`,Me=`DELETE_CURRENT_TRACE`,Ne=`KEY_DOWN`,Pe=`KEY_UP`,Fe=`ACTIVITY_CREATE_B`,Ie=`ACTIVITY_PLAN`,Le=`ACTIVITY_BEGIN`,Re=`ACTIVITY_CREATE_Q`,ze=`ACTIVITY_DELETE`,Be=`ACTIVITY_END`,Ve=`ACTIVITY_REJECT`,He=`ACTIVITY_RESOLVE`,Ue=`ACTIVITY_RESUME`,We=`ACTIVITY_RESURRECT`,Ge=`ACTIVITY_SUSPEND`,Ke=`ACTIVITY_UPDATE`,qe=`ACTIVITY_DETAILS_SHOW`,Je=`ACTIVITY_DETAILS_HIDE`,Ye=`ATTENTION_SHIFT`,Xe=`BLOCK_FOCUS`,Ze=`BLOCK_HOVER`,Qe=`CATEGORY_CREATE`,$e=`CATEGORY_UPDATE`,et=`CATEGORY_MANAGER_SHOW`,tt=`CATEGORY_MANAGER_HIDE`,nt=`COMMAND_RUN`,rt=`EVENT_UPDATE`,it=`EVENT_DELETE`,at=`UNDO_LAST_COMMAND`,ot=`REDO_LAST_COMMAND`,st=`UNDO_RECORD`,ct=`LOG_OUT`,lt=`MANTRA_CREATE`,ut=`SEARCH`,dt=`SEARCH_RESULT`,ft=`SEARCH_MATCH_INCREMENT`,pt=`SEARCH_BLOCK_INCREMENT`,mt=`SEARCH_MATCH_INCREMENT_RESULT`,ht=`SEARCH_BLOCK_INCREMENT_RESULT`,gt=`TOGGLE_SEARCH_OPTION`,_t=`ADVANCED_SEARCH_SHOW`,vt=`ADVANCED_SEARCH_HIDE`,yt=`SETTING_SET`,bt=`SETTING_TOGGLE`,xt=`SETTINGS_SHOW`,St=`SETTINGS_HIDE`,Ct=`SHARE_TIMELINE_SHOW`,wt=`SHARE_TIMELINE_HIDE`,Tt=`KEYBOARD_SHORTCUTS_SHOW`,Et=`KEYBOARD_SHORTCUTS_HIDE`,Dt=`KEYBOARD_SHORTCUTS_TOGGLE`,Ot=`THREAD_CREATE`,kt=`THREAD_DELETE`,At=`THREAD_COLLAPSE`,jt=`THREAD_EXPAND`,Mt=`THREAD_UPDATE`,Nt=`THREAD_HIDE`,Pt=`THREADS_COLLAPSE_ALL`,Ft=`THREADS_REORDER`,It=`THREADS_EXPAND_ALL`,Lt=`TOAST_CREATE`,Rt=`TOAST_POP`,zt=`TRACE_CREATE`,Bt=`TRACE_DELETE`,Vt=`TRACE_SELECT`,Ht=`TRACE_FETCH`,Ut=`TRACE_FILTER`,Wt=`USER_FETCH`,Gt=`USER_SETTINGS_UPDATE`,Kt=`VIEW_CHANGE`,qt=`SEARCH_TERMS_EVENT`,Jt=`TABS_EVENT`,Yt=`CATEGORIES_EVENT`,Xt=`SET_THREAD_INCLUDE_LIST`,Zt=`SET_THREAD_EXCLUDE_LIST`;function Qt(e){return{type:pt,direction:e}}function $t(e){return{type:ft,direction:e}}function en(e,t,n=[]){return{type:Oe,events:e,threads:t,unstarted:n}}function tn(e,t){return{type:nt,operand:e,command:t}}function nn(e,t){return{type:Ot,name:e,rank:t}}function rn(e){return{type:At,id:e}}function an(e){return{type:Nt,id:e}}function on(e){return{type:Ft,orderedIds:e}}function sn(e){return{type:jt,id:e}}function cn(){return{type:Pt}}function ln(){return{type:It}}function un({activity_id:e,name:t,color_background:n,color_text:r}){return{type:Qe,activity_id:e,name:t,color_background:n,color_text:r}}function dn(e,t){return{type:$e,id:e,updates:t}}function fn(e){return{type:lt,name:e}}function pn(e,t){return{type:Mt,id:e,updates:t}}function mn(e){return{type:Wt,id:e}}function hn(e){return{type:zt,name:e}}function gn(e){return{type:Bt,id:e}}function _n(e){return{type:kt,id:e}}function vn({name:e,timestamp:t,description:n,thread_id:r,category_id:i,phase:a,editName:o}){return{type:Fe,name:e,timestamp:t,description:n,thread_id:r,category_id:i,phase:a,editName:o}}function yn({name:e,timestamp:t,description:n,thread_id:r,category_id:i,phase:a}){return{type:Re,name:e,timestamp:t,description:n,thread_id:r,category_id:i,phase:a}}function bn({id:e,timestamp:t,message:n,thread_id:r,eventFlavor:i=`E`}){return{type:Be,id:e,timestamp:t,message:n,thread_id:r,eventFlavor:i}}function xn({id:e,timestamp:t,message:n,thread_id:r,weight:i}){return{type:Ge,id:e,timestamp:t,message:n,thread_id:r,weight:i}}function Sn({id:e,timestamp:t,message:n,thread_id:r}){return{type:Ue,id:e,timestamp:t,message:n,thread_id:r}}function Cn({id:e,timestamp:t,message:n,thread_id:r}){return{type:We,id:e,timestamp:t,message:n,thread_id:r}}function wn(e){return{type:Le,id:e,timestamp:Date.now()}}function Tn({name:e,thread_id:t,scheduled_start:n,scheduled_end:r}){return{type:Ie,name:e,thread_id:t,scheduled_start:n,scheduled_end:r}}function En(e,t){return{type:ze,id:e,thread_id:t}}function Dn(e,t){return{type:Ke,id:e,updates:t}}function On(e,t){return{type:rt,id:e,updates:t}}function kn(){return{type:at}}function An(){return{type:ot}}function jn(e){return{type:st,target:e}}function Mn({editName:e=!1}={}){return{type:qe,editName:e}}function Nn(){return{type:Je}}function Pn(){return{type:et}}function Fn(){return{type:tt}}function In(){return{type:xt}}function Ln(){return{type:St}}function Rn(){return{type:Ct}}function zn(){return{type:wt}}function Bn(){return{type:Tt}}function Vn(){return{type:Et}}function Hn(){return{type:Dt}}function Un({index:e,activity_id:t,activityStatus:n,thread_id:r}){return{type:Xe,index:e,activity_id:t,activityStatus:n,thread_id:r}}function Wn(e){return{type:Ze,index:e}}function Gn(e){return{type:Ne,key:e}}function Kn(e){return{type:Pe,key:e}}function qn(e){return{type:Vt,trace:{...e,filterExcludes:e.filterExcludes??Ee(e.id)}}}function Jn(e){return{type:Ht,trace:e}}function Yn(){return{type:Me}}function Xn(e,t){return{type:Kt,view:e,thread_id:t}}function Zn(e){return{type:bt,setting:e}}function Qn(e,t){return{type:yt,setting:e,value:t}}function $n(e,t){return{type:Lt,message:e,notificationType:t}}function er(e=0){return{type:Rt,index:e}}function tr(e,t){return{type:ut,searchTerm:e,options:t}}function nr(e){return{type:gt,option:e}}function rr(e,t){return{type:je,leftBoundaryTime:e,rightBoundaryTime:t}}function ir(e,t){return{type:Xt,thread_ids:e,inputValue:t}}function ar(e,t){return{type:Zt,thread_ids:e,inputValue:t}}function or(e){return{type:Ut,filterExcludes:e}}function sr(){return{type:_t}}function cr(){return{type:vt}}function lr(e,t){return{type:Ye,thread_id:e,timestamp:t}}var M={background:`#fff`,hover:`#ddd`,"hover-activity-bg":`hsla(216, 68%, 54%, 0.2)`,"focus-activity-bg":`hsla(216, 68%, 54%, 0.1)`,text:`#000`,red:`#e85050`,flames:{main:`#efc360`},dropTarget:`hsl(130, 61%, 74%)`},ur={headerHeight:`40px`},dr=`sans-serif`;function fr(e=!1){return`${e?`bold `:``}11px ${dr}`}var N=ie();function pr(e){return e===`error`?M.red:`green`}var mr=A.div`
  background: ${e=>pr(e.$type)};
  font-size: 0.8em;
  border: 1px solid
    ${e=>k(pr(e.$type)).darken(25).toString()};
  border-radius: 2px;
  color: white;
  opacity: 0.9;
  margin: 0.5em;

  div:first-child {
    padding: 0.5em;
  }
`,hr=A.div`
  width: 100%;
  height: 5px;
  position: relative;
  background: pink;

  /* &::after {
    content: ''; */
  /* position: absolute; */
  left: 0;
  bottom: 0;
  animation: slide 10s linear;
  background: linear-gradient(to left, #40e0d0, #ff8c00, #ff0080, transparent);

  animation-play-state: ${e=>e.$playing?`running`:`paused`};
  animation-fill-mode: forwards;
  /* height: 100%; */
  width: 100%;
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);

  @keyframes slide {
    to {
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
  }
  /* } */
`,gr=class extends j.Component{state={playing:!0};componentDidMount(){}onMouseEnter=()=>{this.setState({playing:!1})};onMouseLeave=()=>{this.setState({playing:!0})};pop=()=>{this.props.popToast(this.props.ind)};render(){return(0,N.jsxs)(mr,{$type:this.props.type,onMouseEnter:this.onMouseEnter,onMouseLeave:this.onMouseLeave,onClick:this.pop,children:[(0,N.jsx)(`div`,{children:this.props.message}),(0,N.jsx)(hr,{$playing:this.state.playing,onAnimationEnd:this.pop})]})}},_r=A.div`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 10000;
`,vr=document.querySelector(`#toaster-root`),yr=class extends j.Component{el;constructor(e){super(e),this.el=document.createElement(`div`)}componentDidMount(){vr?.appendChild(this.el)}componentWillUnmount(){vr?.contains(this.el)&&vr.removeChild(this.el)}render(){let{toaster:e,popToast:t}=this.props;return xe.createPortal((0,N.jsx)(_r,{children:e.map(({message:e,type:n},r)=>(0,N.jsx)(gr,{message:e,type:n,popToast:t,ind:r},`${e}_${r}`))}),this.el)}},br=b(e=>({toaster:e.toaster}),e=>({popToast:t=>e(er(t))}))(yr),xr=`AGENT_CONTACTS_RECEIVED`,Sr=6e4,Cr=15e3,wr={name:`david`,username:`david`,id:`1`,traces:[],categories:[],agents:[],mantras:[],observations:[],attentionShifts:[],searchTerms:[],tabs:[]},P=e=>e.user;function Tr(e){return{...e,timestamp:new Date(e.timestamp).getTime()}}function Er(e=[]){return e.map(Tr).sort((e,t)=>e.timestamp-t.timestamp)}function Dr(e=wr,t){switch(t.type){case xr:return t.agents?{...e,agents:t.agents}:e;case Qe:return{...e,categories:[...e.categories,{name:t.name??``,id:`optimisticCategory`,color_background:t.color_background??``,color_text:t.color_text??`#000000`}]};case lt:return{...e,mantras:[...e.mantras,{name:t.name??``,timestamp:Date.now()}]};case`${Qe}_SUCCEEDED`:return{...e,categories:e.categories.map(e=>e.id===`optimisticCategory`?{...e,id:t.data?.id}:e)};case $e:return{...e,categories:e.categories.map(e=>e.id===t.id?{...e,...t.updates}:e)};case Ye:{let n=e.attentionShifts[e.attentionShifts.length-1];return t.thread_id===void 0||t.thread_id===n?.thread_id?e:{...e,attentionShifts:[...e.attentionShifts,{timestamp:t.timestamp??Date.now(),thread_id:t.thread_id}]}}case Bt:return{...e,traces:e.traces.filter(e=>e.id!==t.id)};case zt:return{...e,traces:[...e.traces,{name:t.name??``,id:-1}]};case`${zt}_SUCCEEDED`:return{...e,traces:e.traces.map(e=>e.name===t.data?.name?{...e,id:t.data?.id}:e)};case`${Wt}_SUCCEEDED`:{let e=t.data??{};return{...wr,...e,attentionShifts:(e.attentionShifts??[]).map(e=>Tr(e)),mantras:Er(e.mantras),observations:Er(e.observations??[]),searchTerms:Er(e.searchTerms),tabs:Er(e.tabs),agents:e.agents??[]}}case`${Wt}_FAILED`:return e;case qt:return{...e,searchTerms:[...e.searchTerms,{term:t.term??``,timestamp:t.timestamp??Date.now()}]};case Jt:return{...e,tabs:[...e.tabs,{count:t.tabs_count??0,timestamp:t.timestamp??Date.now(),window_count:t.window_count??0}]};case Yt:return Array.isArray(t.data)?{...e,categories:t.data}:e;default:return e}}var Or=A.div`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: ${e=>e.$overflowY??`hidden`};
  border: 5px solid #ff5826;
  /* Inset frame — outline + invalid outline-box sizing overflowed the
     phone viewport and clipped the right edge. */
  box-shadow: inset 0 0 0 5px #ffd12f;
`,kr=A.div`
  box-sizing: border-box;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
  text-align: center;
`,Ar=A.form`
  width: min(100%, 320px);
  text-align: left;

  label {
    display: block;
    margin-top: 12px;
    font-size: 14px;
  }

  input {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    margin-top: 4px;
    padding: 8px 10px;
    font-size: 16px;
  }

  button[type='submit'] {
    margin-top: 16px;
    min-height: 44px;
    padding: 8px 16px;
    font-size: 16px;
  }
`,jr=A.div`
  padding: 12px 0 8px;
`,Mr=({children:e})=>(0,N.jsx)(Or,{"data-auth-shell":`true`,$overflowY:`auto`,children:(0,N.jsx)(kr,{children:e})}),Nr=A.div`
  position: relative;
  width: max-content;
  z-index: 1;
`,Pr=A.h1`
  font-size: ${e=>e.$size}px;
  font-family: 'Yesteryear', cursive, sans-serif;
  position: relative;
  font-weight: normal;

  &::after {
    content: '🔥';
    position: absolute;
    right: 0;
    transform-origin: top right;
    transform: translate(27%, 23%) scale(0.5) rotate(30deg);
    z-index: -2;
  ${e=>e.$isAnimated?`
    filter: hue-rotate(0);
    animation: rotateHue 1s infinite alternate;
  }

  &:hover {
    &::after {
      animation: bluerRotate 0.5s infinite alternate linear;
    }
  }


  @keyframes rotateHue {
    to {
      filter: hue-rotate(-45deg);
    }
  }

  @keyframes bluerRotate {
    to {
      filter: hue-rotate(-180deg);
    }
  }
  `:`
  }`}
`,Fr=({size:e,isAnimated:t})=>(0,N.jsx)(Nr,{children:(0,N.jsx)(Pr,{$isAnimated:t,$size:e||40,children:`flambé`})}),Ir=()=>{let[e,t]=(0,j.useState)(null),n=async(e={})=>{let n=await fetch(`/auth/identity/callback`,{method:`POST`,credentials:`include`,headers:{"content-type":`application/json`},body:JSON.stringify(e)});if(!n.ok){t(`Unable to start Single Burner.`);return}let{data:r}=await n.json(),i=JSON.parse(localStorage.getItem(`state`)||`{}`);localStorage.setItem(`state`,JSON.stringify({...i,user:{...i.user,...r},loggedIn:!0})),window.location.assign(r.trace_id?`/${r.username}/traces/${r.trace_id}`:`/${r.username}`)};return(0,j.useEffect)(()=>{n()},[]),(0,N.jsxs)(Mr,{children:[(0,N.jsx)(jr,{children:(0,N.jsx)(Fr,{isAnimated:!0,size:90})}),(0,N.jsx)(`h1`,{children:`Lighting Single Burner…`}),e&&(0,N.jsx)(`p`,{children:e})]})},Lr=()=>{let[e,t]=(0,j.useState)(null);return(0,N.jsxs)(Mr,{children:[(0,N.jsx)(jr,{children:(0,N.jsx)(Fr,{size:90})}),(0,N.jsx)(`h1`,{children:`Create your account`}),(0,N.jsxs)(Ar,{onSubmit:async e=>{e.preventDefault();let n=new FormData(e.currentTarget);if(!(await fetch(`/api/register`,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify({invite_code:n.get(`invite_code`),user:{name:n.get(`name`),username:n.get(`username`),credentials:[{email:n.get(`email`),password:n.get(`password`)}]}})})).ok){t(`Could not create that account. Try a different username or email.`);return}window.location.assign(`/login`)},children:[(0,N.jsx)(`label`,{htmlFor:`register-name`,children:`Name`}),(0,N.jsx)(`input`,{id:`register-name`,name:`name`,required:!0}),(0,N.jsx)(`label`,{htmlFor:`register-username`,children:`Username`}),(0,N.jsx)(`input`,{id:`register-username`,name:`username`,required:!0,maxLength:20}),(0,N.jsx)(`label`,{htmlFor:`register-email`,children:`Email`}),(0,N.jsx)(`input`,{id:`register-email`,name:`email`,type:`email`,required:!0}),(0,N.jsx)(`label`,{htmlFor:`register-password`,children:`Password`}),(0,N.jsx)(`input`,{id:`register-password`,name:`password`,type:`password`,required:!0,minLength:6}),(0,N.jsx)(`label`,{htmlFor:`register-invite`,children:`Invite code`}),(0,N.jsx)(`input`,{id:`register-invite`,name:`invite_code`,autoComplete:`off`}),(0,N.jsx)(`button`,{type:`submit`,children:`Create account`})]}),e&&(0,N.jsx)(`p`,{children:e}),(0,N.jsx)(`p`,{children:(0,N.jsx)(`a`,{href:`/login`,children:`Back to login`})})]})},Rr=class extends j.Component{root=null;dragging=!1;state={size:this.props.defaultSize??0};componentWillUnmount(){this.stopDragging()}setRoot=e=>{this.root=e};getSize=()=>this.props.size??this.state.size;getBounds=()=>{if(!this.root)return null;let e=this.root.getBoundingClientRect(),t=(this.props.split===`horizontal`?e.height:e.width)-6;return{bounds:e,minSize:Math.min(this.props.minSize??0,t/2),totalSize:t}};changeSize=e=>{this.props.size===void 0&&this.setState({size:e}),this.props.onChange?.(e)};handleMouseMove=e=>{if(!this.dragging)return;let t=this.getBounds();if(!t)return;let{bounds:n,minSize:r,totalSize:i}=t,a=this.props.split===`horizontal`?e.clientY-n.top:e.clientX-n.left,o=this.props.primary===`second`?i-a:a;this.changeSize(Math.max(r,Math.min(o,i-r)))};stopDragging=()=>{this.dragging=!1,window.removeEventListener(`mousemove`,this.handleMouseMove),window.removeEventListener(`mouseup`,this.stopDragging)};startDragging=e=>{e.button===0&&(e.preventDefault(),this.dragging=!0,window.addEventListener(`mousemove`,this.handleMouseMove),window.addEventListener(`mouseup`,this.stopDragging))};render(){let e=j.Children.toArray(this.props.children);if(e.length!==2)return null;let t=this.props.primary??`first`,n=this.getSize(),r=this.props.split===`horizontal`,i={flex:`1 1 0`,minHeight:0,minWidth:0,overflow:`hidden`,position:`relative`},a={...i,flex:`0 0 ${n}px`,...r?{height:n}:{width:n}};return(0,N.jsxs)(`div`,{ref:this.setRoot,style:{display:`flex`,flexDirection:r?`column`:`row`,height:`100%`,overflow:`hidden`,width:`100%`},children:[(0,N.jsx)(`div`,{style:t===`first`?a:i,children:e[0]}),(0,N.jsx)(`div`,{"aria-label":`Resize ${this.props.split} panes`,"aria-orientation":r?`horizontal`:`vertical`,"aria-valuenow":Math.round(n),onMouseDown:this.startDragging,role:`separator`,style:{background:`#e9e9e9`,cursor:r?`row-resize`:`col-resize`,flex:`0 0 6px`,position:`relative`,userSelect:`none`,zIndex:1}}),(0,N.jsx)(`div`,{style:t===`second`?a:i,children:e[1]})]})}},zr=e(se()),Br=A.div`
  width: min(400px, calc(100vw - 16px));
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  font-size: small;
  border: 1px solid #ddd;

  input {
    width: 100%;
    padding: 5px;
    font-size: 1em;
    border: none;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: #bababa;
    }
  }
`;function Vr(e,t){return e[t.key]!==void 0}function Hr(e){return!!(e.parameters&&e.parameters.length>0)}function Ur(e,t){for(let n of e.parameters??[])if(Vr(t,n))continue;else return!1;return!0}function Wr(e,t){for(let n of e.parameters??[])if(Vr(t,n))continue;else return n;return null}function Gr(e,t){return e.parameters?.find(({key:e})=>e===t)}function Kr(e,t,n){return!t.selector||!t.itemReturnKey||!t.itemStringKey?e:n(t.selector).find(n=>typeof n==`object`&&!!n&&n[t.itemReturnKey]===e)?.[t.itemStringKey]??e}function qr(e,t){return{...e,...t}}var Jr=ue({types:{},id:`field`,initial:`initial`,context:({input:e})=>({command:null,parameters:{},...e}),states:{initial:{always:[{target:`fully_loaded`,guard:`commandFullyLoaded`},{target:`parameters`,guard:`commandNotNull`},{target:`command`}]},command:{on:{COMMAND_SELECT:[{target:`parameters`,guard:`commandHasParameters`,actions:`setCommand`},{target:`fully_loaded`,actions:`setCommand`}]}},parameters:{on:{PARAMETER_COMMIT:[{target:`parameter_committed`,actions:`commitParameter`}]}},parameter_committed:{always:[{target:`fully_loaded`,guard:`commandFullyLoaded`},{target:`parameters`}]},fully_loaded:{entry:`submitCommand`}}},{actions:{commitParameter:de(({context:e,event:t})=>({parameters:t.type===`PARAMETER_COMMIT`?{...e.parameters,[t.parameter.key]:t.parameter.value}:e.parameters})),setCommand:de(({context:e,event:t})=>({command:t.type===`COMMAND_SELECT`?t.command:e.command}))},guards:{commandFullyLoaded:({context:e})=>!!(e.command&&Ur(e.command,e.parameters)),commandHasParameters:({event:e})=>e.type===`COMMAND_SELECT`&&Hr(e.command),commandNotNull:({context:e})=>e.command!==null}});function Yr(e,t={}){let n=(0,j.useRef)(t);n.current=t;let r=(0,j.useRef)(null);r.current||=le(e,{input:t.input});let i=r.current,[a,o]=(0,j.useState)(i.getSnapshot());return(0,j.useEffect)(()=>{let e=r.current,t=e.subscribe(e=>{n.current.log&&console.log(`STATE`,e),o(e)});return e.start(),o(e.getSnapshot()),()=>{t.unsubscribe(),e.stop()}},[]),[a,e=>r.current?.send(e)]}var Xr=e(me()),Zr=A.div`
  .commander-result {
    padding: 5px;
    display: flex;

    &:first-child {
      border-top: 1px solid #ccc;
    }
  }

  .commander-result-item {
    flex: auto;
  }
`,Qr=({onChange:e,placeholder:t,items:n,itemStringKey:r,onInputChange:i,initialInputValue:a=``,onBlur:o})=>{let s=e=>e?String(e[r]??``):``,[c,l]=j.useState(a),u=c.length===0?n:Xr.default.filter(n,c,{key:r}),{getInputProps:d,getItemProps:f,getLabelProps:p,getMenuProps:m,highlightedIndex:h}=oe({isOpen:!0,initialInputValue:a,items:u,inputValue:c,defaultHighlightedIndex:0,itemToString:s,onInputValueChange:({inputValue:e})=>{l(e||``),i&&i(e)},onSelectedItemChange:({selectedItem:t})=>{t&&(e(t),l(a))}});return(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`label`,{...p()}),(0,N.jsx)(`input`,{autoFocus:!0,...d({placeholder:t,onBlur:o})}),(0,N.jsx)(Zr,{...m(),children:u.map((e,t)=>(0,N.jsxs)(`div`,{className:`commander-result`,...f({index:t,item:e,style:{backgroundColor:h===t?`#f5f5f5`:`white`}}),children:[(0,N.jsxs)(`div`,{className:`commander-result-item`,children:[e.label&&(0,N.jsx)(`span`,{className:`item-label`,style:{background:e.label.background??void 0,color:`white`,padding:`1px 3px`,borderRadius:`2px`,marginRight:`5px`},children:e.label.copy}),c.length===0?(0,N.jsx)(`span`,{children:String(e[r]??``)}):(0,N.jsx)(`span`,{dangerouslySetInnerHTML:{__html:Xr.default.wrap(String(e[r]??``),c)}})]}),e.shortcut&&(0,N.jsx)(`div`,{className:`item-shortcut`,children:(0,N.jsx)(`span`,{className:`item-shortcut`,style:{textAlign:`right`,color:`steelblue`},children:e.shortcut})})]},String(e[r]??t)))})]})};function $r({initialInputValue:e,onBlur:t,placeholder:n,onSubmit:r}){let[i,a]=j.useState(e),o=j.useRef(null),s=j.useRef(!1);return j.useLayoutEffect(()=>{s.current||(s.current=!0,o.current?.setSelectionRange(0,i.length))}),(0,N.jsx)(`input`,{autoFocus:!0,type:`text`,value:i,onChange:e=>a(e.target.value),onKeyDown:e=>{e.key===`Enter`&&(a(``),r(i))},placeholder:n,onBlur:t,ref:o})}var ei=A.span`
  padding: 5px;
  font-size: 0.75em;
  font-weight: bold;
`,ti=A.ul`
  list-style: none;
  font-size: 0.75em;
  padding: 5px 10px;
  margin: 0;
  li + li { margin-top: 3px; }
`,ni=A.li` position: relative; `,ri=A.div`
  display: inline-block;
  position: absolute;
  top: -5px;
  transform: translateX(-2px);
  z-index: 10000;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05),
    0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
`,ii=A.span` &:hover { background: #ccf1ff; } `,ai=({command:e,availableCommands:t,onChange:n,editing:r})=>r?(0,N.jsx)(Qr,{items:t,onChange:n,itemStringKey:`copy`}):(0,N.jsx)(ei,{children:e&&e.copy}),oi=({parameter:e,onSubmit:t,getItems:n,initialInputValue:r=``,onBlur:i=()=>{}})=>e?e.selector?(0,N.jsx)(Qr,{items:n(e.selector),itemStringKey:e.itemStringKey??`name`,onChange:n=>t({key:e.key,value:n[e.itemReturnKey??`value`]}),placeholder:e.placeholder,initialInputValue:r,onBlur:i}):(0,N.jsx)($r,{onSubmit:n=>t({key:e.key,value:n}),onBlur:i,placeholder:e.placeholder,initialInputValue:r}):null,si=({parameters:e,command:t,getItems:n,commitParameter:r})=>{let[i,a]=j.useState(null);return(0,N.jsx)(ti,{children:Object.entries(e).map(([e,o])=>{let s=Gr(t,e);return s?(0,N.jsxs)(ni,{onClick:()=>a(s),children:[(0,N.jsx)(`span`,{children:s.placeholder}),`:`,` `,i&&i.key===e?(0,N.jsx)(ri,{children:(0,N.jsx)(oi,{onSubmit:e=>{a(null),r(e)},getItems:n,parameter:s,initialInputValue:String(Kr(o,s,n)),onBlur:()=>{a(null)}})}):(0,N.jsx)(ii,{children:String(Kr(o,s,n))})]},e):null})})},ci=({command:e,parameters:t,commitParameter:n,getItems:r})=>(0,N.jsxs)(`div`,{children:[e&&Object.keys(t).length>0&&(0,N.jsx)(si,{parameters:t,command:e,getItems:r,commitParameter:n}),e&&(0,N.jsx)(oi,{onSubmit:n,getItems:r,parameter:Wr(e,t)},Wr(e,t)?.key||`complete`)]});function li({availableCommands:e,getItems:t,field:n={command:null,parameters:{}},onFullyLoaded:r}){let[i,a]=Yr(Jr.provide({actions:{submitCommand:({context:e})=>{e.command&&r(qr(e.command,e.parameters))}}}),{input:n,log:!0}),{command:o,parameters:s}=i.context;return(0,N.jsxs)(`div`,{children:[(0,N.jsx)(ai,{command:o,availableCommands:e,onChange:e=>a({type:`COMMAND_SELECT`,command:e}),editing:i.value===`command`}),(0,N.jsx)(ci,{parameters:s,command:o,getItems:t,commitParameter:e=>a({type:`PARAMETER_COMMIT`,parameter:e})})]})}var ui={overlay:{zIndex:20},content:{padding:0,border:`none`,borderRadius:0,background:`none`,overflow:`unset`,right:`unset`,bottom:`unset`,position:`unset`}};function di({commands:e,onSubmit:t,hideCommander:n,appElement:r,isOpen:i,getItems:a,field:o=void 0}){return(0,N.jsx)(zr.default,{appElement:r,style:ui,isOpen:i,onRequestClose:n,children:(0,N.jsx)(Br,{children:(0,N.jsx)(li,{availableCommands:e,field:o,getItems:a,onFullyLoaded:t})})})}var fi=di,pi=e(ye()),mi=class extends j.Component{element=null;observer=null;animationFrame=null;view=null;mounted=!1;componentDidMount(){this.mounted=!0,this.startObserving()}componentWillUnmount(){this.mounted=!1,this.animationFrame!==null&&this.view&&this.view.cancelAnimationFrame(this.animationFrame),this.observer?.disconnect()}startObserving=()=>{if(!this.mounted||!this.element)return;this.view=this.element.ownerDocument.defaultView;let e=this.view?.ResizeObserver;if(!e)return;let t=this.observer;t||(t=new e(this.handleResize),this.observer=t,this.reportBounds()),t.observe(this.element)};getBounds=()=>{if(!this.element)return null;let{width:e,height:t,top:n,right:r,bottom:i,left:a}=this.element.getBoundingClientRect();return{width:e,height:t,top:n,right:r,bottom:i,left:a}};reportBounds=()=>{let e=this.getBounds();e&&this.props.onResize({bounds:e})};handleResize=()=>{let e=this.getBounds();!e||!this.view||(this.animationFrame!==null&&this.view.cancelAnimationFrame(this.animationFrame),this.animationFrame=this.view.requestAnimationFrame(()=>{this.animationFrame=null,this.observer&&this.props.onResize({bounds:e})}))};measureRef=e=>{e!==this.element&&(this.observer&&this.element&&this.observer.unobserve(this.element),this.element=e,this.startObserving())};render(){return this.props.children({measureRef:this.measureRef})}},F=6e5;function hi(e,t,n,r){return t+e*(n-t)/r}function gi(e,t,n,r){return(e-t)*r/(n-t)}function _i(e,t,n){return e*(1+t)+n}function vi(e,t){return Math.max(4,e-t*2)}function yi(e,t,n,r,i,a,o,s){let c=t??o,l=gi(Math.max(e,a),a,o,s);return{blockX:l,blockY:_i(n,r,i),blockWidth:gi(c,a,o,s)-l}}function bi(e,t,n,r,i){let a=Date.now();if(a>=n)return;let o=gi(a,t,n,r);e.globalAlpha=.2,e.fillStyle=`#B6C8E8`,e.strokeStyle=`#7B9EDE`,e.fillRect(o,0,r-o+10,i),e.strokeRect(o,0,r-o+10,i)}function xi(e,t,n){let{startTime:r,endTime:i}=e;return r>t&&r<n||i!==void 0&&i>t&&i<n||r<t&&i!==void 0&&i>n||r<t&&!i}function Si(e,t,n,r){if(!(n>t)||!(r>0))return!1;if(e.scheduledPoint)return e.startTime>=t&&e.startTime<=n;let i=Math.max(e.startTime,t);return(Math.min(e.endTime??n,n)-i)*r>=n-t}function Ci(e,t,n,r){return!!e.scheduled&&!e.scheduledPoint&&e.endTime==null&&t<=r-12&&n>=r-12&&n<=r}function wi(e,t,n){return e.scheduledPoint?{thread_id:n,scheduled_end_integer:Math.floor((e.endTime??e.startTime)+t)}:{thread_id:n,scheduled_start_integer:Math.floor(e.startTime+t),...e.endTime==null?{}:{scheduled_end_integer:Math.floor(e.endTime+t)}}}function Ti(e,t,n,r,i){let a=Object.fromEntries(Object.entries(i).map(([e])=>[e,{current:0,max:0}]));return e.filter(e=>xi(e,n,r)).forEach(e=>{let n=t[String(e.activity_id)]?.thread_id;if(n===void 0)return;let r=String(n),i=a[r]??{current:0,max:0};a[r]={current:e.level,max:Math.max(i.max,e.level+1)}}),a}function Ei(e=[],t={}){let n=0,r=new Set;return[...e].reverse().forEach(({thread_id:e})=>{let i=String(e);r.has(i)||(r.add(i),t[i]&&(t[i].rank=n),n+=1)}),t}function Di(e={}){return Object.entries(e).sort(([,e],[,t])=>(e.rank??0)-(t.rank??0)).map(([e,t])=>[Number(e),t])}function Oi(e,t,n,r,{min:i=-1/0,max:a=1/0}={}){let o=1.1**(e/120);return{start:Math.max(t+(n-t)*o,i),end:Math.min(t+(r-t)*o,a)}}function ki(e,t,n,r,i,a,o,s=0){let c=Oi(e,n,r,i,{min:s});return{leftBoundaryTime:c.start,rightBoundaryTime:c.end}}function Ai(e,t){let n=Number.isFinite(t)?Math.max(0,t):1/0;return Math.min(Math.max(0,Number.isFinite(e)?e:0),n)}function ji(e,t,n,r,i,a,o,s,c=1/0){let l=r-n,u=r+l/i*e,d=u-l;return d<s&&(d=s,u=s+l),{leftBoundaryTime:d,rightBoundaryTime:u,topOffset:Ai(a+t,c)}}var Mi=`flambe.thread-collapse-state.v1`;function Ni(){try{let e=window.localStorage.getItem(Mi),t=e?JSON.parse(e):{};return t&&typeof t==`object`?t:{}}catch{return{}}}function Pi(e){return e&&Ni()[e]||{}}function Fi(e,t){if(!e||!t||Object.keys(t).length===0)return;let n=Ni(),r=Object.entries(t).reduce((e,[t,n])=>({...e,[t]:!!n.collapsed}),{});try{window.localStorage.setItem(Mi,JSON.stringify({...n,[e]:r}))}catch{}}function Ii(){if(typeof window>`u`)return null;let e=Number(window.localStorage.getItem(`lbt`)),t=Number(window.localStorage.getItem(`rbt`));return!Number.isFinite(e)||!Number.isFinite(t)||t<=e?null:{leftBoundaryTime:e,rightBoundaryTime:t}}function Li(e){return String(e).padStart(2,`0`)}function Ri(e){let t=new Date(e);return`${t.getFullYear()}-${Li(t.getMonth()+1)}-${Li(t.getDate())}T${Li(t.getHours())}:${Li(t.getMinutes())}:${Li(t.getSeconds())}`}function zi(e){let t=new Date(e).getTime();return Number.isFinite(t)?t:null}var Bi=(e,t)=>e!=null&&String(e)===String(t),Vi=(e,t,n,r,i,a)=>Bi(i,a)||t>=n&&e<=r;function Hi(e){return 1-(1-Math.max(0,Math.min(1,e)))**3}var Ui=(e,t,n,r,i)=>{let a=1-e;return a**3*t+3*a**2*e*n+3*a*e**2*r+e**3*i};function Wi(e,t,n){let r=0,i=1;for(let a=0;a<18;a+=1){let a=(r+i)/2;Ui(a,e.x,e.outX,t.inX,t.x)<n?r=a:i=a}return(r+i)/2}function Gi(e){return t=>{let n=Math.max(0,Math.min(1,t));if(n===0||n===1)return n;let r=e.findIndex(e=>e.x>=n),i=Math.max(0,r-1),a=e[i],o=e[Math.min(i+1,e.length-1)];return Ui(Wi(a,o,n),a.y,a.outY,o.inY,o.y)}}function Ki(e,t,n,r=Hi,i=r){let a=r(n),o=i(n),s=(e.leftBoundaryTime+e.rightBoundaryTime)/2,c=(t.leftBoundaryTime+t.rightBoundaryTime)/2,l=Math.max(1,e.rightBoundaryTime-e.leftBoundaryTime),u=Math.max(1,t.rightBoundaryTime-t.leftBoundaryTime),d=s+(c-s)*a,f=l*(u/l)**o;return{leftBoundaryTime:d-f/2,rightBoundaryTime:d+f/2}}function qi(e=typeof window>`u`?void 0:window.matchMedia?.bind(window)){if(!e)return!1;try{return e(`(prefers-reduced-motion: reduce)`).matches}catch{return!1}}var Ji=[{x:0,y:0,inX:0,inY:0,outX:.11,outY:.5},{x:.52,y:.92,inX:.3,inY:.82,outX:.68,outY:1.04},{x:1,y:1,inX:.86,inY:1,outX:1,outY:1}],Yi={durationMs:320,curvesLinked:!1,panCurve:Ji,zoomCurve:Ji},Xi=`flambe.timeline.preset-zoom.v1`,I=(e,t,n,r)=>{let i=Number(e);return Number.isFinite(i)?Math.max(t,Math.min(n,i)):r};function Zi(e){return Math.round(I(e,100,1e3,320))}function Qi(e){if(!Array.isArray(e)||e.length<2||e.length>8)return Ji;let t=e.map((e,t)=>{let n=Ji[Math.min(t,2)],r=e&&typeof e==`object`?e:{};return{x:I(r.x,0,1,n.x),y:I(r.y,-1,2,n.y),inX:I(r.inX,0,1,n.inX),inY:I(r.inY,-1,2,n.inY),outX:I(r.outX,0,1,n.outX),outY:I(r.outY,-1,2,n.outY)}}).sort((e,t)=>e.x-t.x);t[0]={...t[0],x:0,y:0,inX:0,inY:0},t[t.length-1]={...t[t.length-1],x:1,y:1,outX:1,outY:1};for(let e=0;e<t.length-1;e+=1){let n=t[e],r=t[e+1];n.outX=I(n.outX,n.x,r.x,n.x),r.inX=I(r.inX,n.x,r.x,r.x)}return t}function $i(e){try{return Qi(JSON.parse(e))}catch{return Ji}}function ea(e){return JSON.stringify(Qi(e))}function ta(){if(typeof window>`u`)return Yi;try{let e=JSON.parse(window.localStorage.getItem(Xi)||`null`);if(!e||typeof e!=`object`)return Yi;let t=e.x1===void 0?e.curve:[{x:0,y:0,inX:0,inY:0,outX:e.x1,outY:e.y1},{x:1,y:1,inX:e.x2,inY:e.y2,outX:1,outY:1}],n=e.x1===void 0?e.curve:t;return{durationMs:Zi(e.durationMs),curvesLinked:!!e.curvesLinked,panCurve:Qi(e.panCurve??n),zoomCurve:Qi(e.zoomCurve??n)}}catch{return Yi}}function na(e){if(!(typeof window>`u`))try{window.localStorage.setItem(Xi,JSON.stringify(e))}catch{}}var ra=1e3,L=60*ra,ia=60*L,R=24*ia,aa=7*R,oa=4*aa,z=e(_e()),sa=[1,2,5,10,20,25,50,100,200,250,500,ra,2*ra,5*ra,10*ra,15*ra,30*ra,L,2*L,5*L,10*L,15*L,30*L,ia,2*ia,3*ia,4*ia,6*ia,12*ia,R,2*R,7*R,14*R],ca=30*R,la=365*R;function ua(e,t,n){let r=e/Math.max(1,t/Math.max(1,n));for(let e of sa)if(e>=r)return{kind:`ms`,ms:e};return r<=ca?{kind:`month`}:{kind:`year`}}function da(e,t){if(t>=864e5){let n=Math.round(t/R);if(n===7||n===14){let t=(0,z.default)(e).startOf(`week`);return t.valueOf()<e&&(t=t.add(n===14?2:1,`week`)),t.valueOf()}let r=(0,z.default)(e).startOf(`day`);if(r.valueOf()<e&&(r=r.add(1,`day`)),n>1){let e=(Math.floor(r.startOf(`day`).valueOf()/R)%n+n)%n;e!==0&&(r=r.add(n-e,`day`))}return r.valueOf()}if(864e5%t==0){let n=(0,z.default)(e).startOf(`day`).valueOf();return e<=n?n:n+Math.ceil((e-n)/t)*t}return Math.ceil(e/t)*t}function fa(e,t){if(t.kind===`year`)return(0,z.default)(e).add(1,`year`).valueOf();if(t.kind===`month`)return(0,z.default)(e).add(1,`month`).valueOf();if(t.ms>=864e5){let n=Math.round(t.ms/R);return n===7?(0,z.default)(e).add(1,`week`).valueOf():n===14?(0,z.default)(e).add(2,`week`).valueOf():(0,z.default)(e).add(n,`day`).valueOf()}return e+t.ms}function pa(e,t){if(t.kind===`year`){let t=(0,z.default)(e).startOf(`year`);return t.valueOf()<e&&(t=t.add(1,`year`)),t.valueOf()}if(t.kind===`month`){let t=(0,z.default)(e).startOf(`month`);return t.valueOf()<e&&(t=t.add(1,`month`)),t.valueOf()}return da(e,t.ms)}function ma(e,t,n){let r=[],i=pa(e,n);for(;i<=t;){r.push(i);let e=fa(i,n);if(e<=i||(i=e,r.length>500))break}return r}function ha(e){return e.kind===`year`?la:e.kind===`month`?ca:e.ms}function ga(e=[],t){let n=new Set(e.map(String));return Object.fromEntries(Object.entries(t).filter(([e])=>!n.has(e)))}function _a(e,t){let n=Object.fromEntries(Object.entries(t).map(([e,t])=>[e,{...t,suspendedActivityCount:0}]));return Object.values(e).forEach(e=>{if(e.status!==`suspended`||e.thread_id===void 0)return;let t=n[String(e.thread_id)];t&&(t.suspendedActivityCount+=1)}),n}var va=e=>`rgba(${e}, 0, 0, 0.5)`;function ya(e,t){return t.filter(t=>t.activity_id===e)}function ba(e,t){let n=[];return t.forEach((t,r)=>{String(t.activity_id)===String(e)&&n.push([r,t])}),n}function xa(e,t,n=window){if(typeof n.requestIdleCallback==`function`)return n.requestIdleCallback(e,t);let r=Date.now();return n.setTimeout(()=>{e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-r))})},1)}function Sa(e=typeof navigator>`u`?``:navigator.platform,t=typeof navigator>`u`?``:navigator.userAgent){return/Mac|iPhone|iPad|iPod/i.test(e)||/Mac OS X/i.test(t)}function Ca(e,t=Sa()){switch(e){case`Mod`:return t?`⌘`:`Ctrl`;case`Shift`:return t?`⇧`:`Shift`;case`Option`:return t?`⌥`:`Alt`;default:return e}}function wa(e,t=Sa()){let n=e.map(e=>Ca(e,t));return t?n.join(` `):n.join(`+`)}function Ta(e){return!(e.metaKey||e.ctrlKey)||e.altKey||e.shiftKey?!1:e.key===`/`||e.code===`Slash`}var Ea=[{title:`General`,shortcuts:[{id:`shortcuts`,label:`Keyboard shortcuts`,keys:[`Mod`,`/`]},{id:`settings`,label:`Open settings`,keys:[`Mod`,`,`]},{id:`commander`,label:`Command palette`,keys:[`Mod`,`Shift`,`P`]},{id:`undo`,label:`Undo last command`,keys:[`Mod`,`Z`]},{id:`redo`,label:`Redo last undone command`,keys:[`Mod`,`Shift`,`Z`]},{id:`mute`,label:`Mute / unmute other activities`,keys:[`Mod`,`M`]},{id:`collapse-threads`,label:`Collapse all threads`,keys:[`Shift`,`{`]},{id:`expand-threads`,label:`Expand all threads`,keys:[`Shift`,`}`]}]},{title:`Search`,shortcuts:[{id:`find`,label:`Find`,keys:[`Mod`,`F`]},{id:`advanced-search`,label:`Advanced search`,keys:[`Mod`,`Shift`,`F`]}]},{title:`Timeline`,note:`When focus is not in a text field.`,shortcuts:[{id:`zoom-now`,label:`Jump to now`,keys:[`N`]},{id:`zoom-chord`,label:`Zoom to a period, then H / D / W / M / Y / A`,keys:[`Z`]}]},{title:`Focused activity`,note:`After selecting a block, while focus is not in a text field.`,shortcuts:[{id:`details`,label:`Edit / view details`,keys:[`Space`]},{id:`end`,label:`End`,keys:[`E`]},{id:`reject`,label:`End by rejection`,keys:[`J`]},{id:`resolve`,label:`End by resolution`,keys:[`V`]},{id:`suspend`,label:`Suspend (active activities)`,keys:[`S`]}]}];function Da(e){return!(e.metaKey||e.ctrlKey)||e.altKey||e.key.toLowerCase()!==`z`?null:e.shiftKey?`redo`:`undo`}var Oa=class{modifiedZ=!1;keyDown(e){return e.key.toLowerCase()===`z`&&(this.modifiedZ=e.metaKey||e.ctrlKey||e.altKey||!!e.defaultPrevented,this.modifiedZ)}keyUp(e){if(e.key.toLowerCase()!==`z`)return!1;let t=this.modifiedZ||e.metaKey||e.ctrlKey||e.altKey||!!e.defaultPrevented;return this.modifiedZ=!1,t}};function ka(e){let t=typeof e==`number`?e:Number(e);return Number.isFinite(t)?Math.min(60,Math.max(1,Math.round(t))):7}function Aa(e){return ka(e)*1e3}function ja(e){return e.code===`Space`||e.key===` `||e.key===`Escape`}function Ma(e,t,n){return!t||!ja(e)?!1:(n.add(e.code),!0)}function Na(e,t){return t.has(e.code)?(t.delete(e.code),!0):!1}var Pa=new Set([`text`,`password`,`search`,`email`,`url`,`tel`,`number`,``]);function Fa(e){return`tagName`in e?String(e.tagName??``).toUpperCase():``}function Ia(e){if(typeof e!=`object`||!e)return!1;if(typeof HTMLTextAreaElement<`u`&&e instanceof HTMLTextAreaElement||typeof HTMLSelectElement<`u`&&e instanceof HTMLSelectElement)return!0;if(typeof HTMLInputElement<`u`&&e instanceof HTMLInputElement)return Pa.has(e.type);let t=Fa(e);if(t===`TEXTAREA`||t===`SELECT`)return!0;if(t===`INPUT`){let t=`type`in e?String(e.type??`text`):`text`;return Pa.has(t)}return`isContentEditable`in e&&e.isContentEditable?!0:typeof Element<`u`&&e instanceof Element&&!!e.closest(`input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="reset"]):not([type="file"]), textarea, select, [contenteditable="true"]`)}function La(e,t=typeof document>`u`?null:document.activeElement){return Ia(e.target)||Ia(t)}var Ra=class{idleMs;onChange;timeouts;showing=!1;timer=null;constructor(e,t,n={setTimeout:(e,t)=>globalThis.setTimeout(e,t),clearTimeout:e=>globalThis.clearTimeout(e)}){this.idleMs=e,this.onChange=t,this.timeouts=n}start(){this.schedule()}stop(){this.clearTimer(),this.setShowing(!1)}notePointerMove(){this.showing||this.schedule()}noteWake(){this.setShowing(!1),this.schedule()}schedule(){this.clearTimer(),this.timer=this.timeouts.setTimeout.call(globalThis,()=>{this.timer=null,this.setShowing(!0)},this.idleMs)}clearTimer(){this.timer!==null&&(this.timeouts.clearTimeout.call(globalThis,this.timer),this.timer=null)}setShowing(e){this.showing!==e&&(this.showing=e,this.onChange(e))}},za=.0045,Ba=`data-native-scroll`;function Va(e){return!e||typeof e.closest!=`function`?!1:!!e.closest(`[${Ba}]`)}function Ha(e,t){return Math.abs(t.clientX-e.clientX)>=Math.abs(t.clientY-e.clientY)?`x`:`y`}function Ua(e,t){let n=e.clientX-t.clientX,r=e.clientY-t.clientY;return Math.hypot(n,r)}function Wa(e,t,n=8){return Ua(e,t)>=n}function Ga(e,t){return{clientX:(e.clientX+t.clientX)/2,clientY:(e.clientY+t.clientY)/2}}function Ka(e){return!(e>0)||!Number.isFinite(e)?0:120*Math.log(1/e)/Math.log(1.1)}function qa(e,t){return e-t}function Ja(e,t,n,r=.35){if(!(n>0)||!Number.isFinite(n))return e;let i=t/n,a=Math.min(1,Math.max(0,r));return e*(1-a)+i*a}function Ya(e,t,n=za){return!(t>0)||!Number.isFinite(t)?e:e*Math.exp(-Math.max(0,n)*t)}function Xa(e){return Number.isFinite(e)&&Math.abs(e)>=.02}var Za=class extends j.Component{componentDidMount(){this.props.eventListeners.forEach(([e,t])=>this.props.node.addEventListener(e,t))}componentWillUnmount(){this.props.eventListeners.forEach(([e,t])=>this.props.node.removeEventListener(e,t))}render(){return this.props.children()}},Qa=e(pe()),B=e=>String(e);function $a(e,t){return[...e].reverse().find(e=>e.activity_id===t)}function eo(e,t,n){let r=B(t);return{...n,[r]:(n[r]??[]).filter(t=>t!==e)}}function to(e){return Math.max(0,e-1)}function no(e,t,n){let r=new Set,i=n[B(e)]?.parent_id;for(;i!=null&&!r.has(i);){if(i===t)return!0;r.add(i),i=n[B(i)]?.parent_id}return!1}function ro(e,t){let n=new Set([e.id]),r=0,i=e.parent_id;for(;i!=null&&!n.has(i);)r+=1,n.add(i),i=t[B(i)]?.parent_id;return r}function io(e,t,n){let r=ro(e,t),i=new Set(n.filter(n=>n.endTime===void 0&&t[B(n.activity_id)]?.thread_id===e.thread_id).map(e=>e.level)),a=r;for(;i.has(a);)a+=1;return a}function ao(e,t,n,r,i=``,a){let o=$a(e,t);return o?(o.endTime=n,o.ending=r,o.endMessage=i,a!==void 0&&o.events.push(a),e):e}function oo(e,t,n){let r=e.scheduled_start??void 0,i=e.scheduled_end??void 0;if(r==null&&i==null)return null;let a=r==null&&i!=null,o=r??i,s=io({...e,thread_id:e.thread?.id??e.thread_id},t,n);return{activity_id:e.id,beginning:`B`,events:[],level:s,scheduled:!0,scheduledPoint:a,startTime:o,...a?{endTime:i}:i==null?{}:{endTime:i}}}function so(e,t,n,r){let i=e.thread?.id??e.thread_id;if(i===void 0)return;let a=B(e.id),o=t[a];if(o?.status&&o.status!==`unstarted`)return;let s=o??{...e,categories:e.categories??[],events:[],suspendedChildren:[],thread_id:i,status:`unstarted`};s.status=`unstarted`,s.scheduled_start=e.scheduled_start,s.scheduled_end=e.scheduled_end,s.weight=e.weight,s.thread_id=i,t[a]=s;let c=oo(s,t,n);if(!c)return;n.push(c);let l=B(i),u=r[l]??{current:0,max:0};r[l]=u,u.max=Math.max(c.level+1,u.max)}function co(e=[],t=[],n=[]){let r={},i={},a={};if(t.forEach(e=>{let t=B(e.id);a[t]=e,r[t]={current:0,max:0},i[t]=[]}),e.length===0&&n.length===0){let t=Date.now();return{activities:{},blocks:[],events:e,max:t+1e3,min:t,threadLevels:r,threads:a}}let o=[...e].sort((e,t)=>e.timestamp-t.timestamp),s={},c=[],l=Date.now(),u=o[0]?.timestamp??l,d=o[0]?.timestamp??l,f,p;return o.forEach((e,t)=>{let n=e.activity;if(!n)return;let a=n.thread?.id??n.thread_id;if(a===void 0)return;let l=B(a),m=B(n.id),h=r[l]??{current:0,max:0};r[l]=h,i[l]??=[];let g=s[m]??{...n,categories:[],events:[],suspendedChildren:[]};switch(s[m]=g,g.events.push(e.id),g.description??=n.description,g.parent_id??=n.parent_id,g.categories=(0,Qa.default)([...g.categories,...n.categories]),n.agent_id!==void 0&&(g.agent_id=n.agent_id,g.agent_name=n.agent_name??null),e.phase){case`S`:{if(g.status===`suspended`||g.status===`parent_suspended`)break;ao(c,n.id,e.timestamp,e.phase,e.message,e.id),h.current=to(h.current),g.status=`suspended`;let t=eo(n.id,a,i);i[l]=t[l],[...i[l]].forEach(t=>{if(!no(t,n.id,s))return;g.suspendedChildren.push(t);let r=s[B(t)];r&&(r.status=`parent_suspended`),ao(c,t,e.timestamp,e.phase,e.message),h.current=to(h.current),i[l]=eo(t,a,i)[l]});break}case`X`:case`R`:{if(e.phase===`R`&&(g.status===`parent_suspended`||g.status===`active`))break;let t=io(g,s,c);c.push({activity_id:n.id,beginning:e.phase,events:[e.id],level:t,startMessage:e.message,startTime:e.timestamp}),h.current+=1,h.max=Math.max(t+1,h.max),e.phase===`R`&&(g.suspendedChildren.forEach(t=>{let n=s[B(t)];n&&(n.status=`active`);let r=io(n,s,c);c.push({activity_id:t,beginning:e.phase,events:[e.id],level:r,startTime:e.timestamp}),h.current+=1,h.max=Math.max(r+1,h.max),i[l].push(t)}),g.suspendedChildren=[]),i[l].push(n.id),g.status=`active`;break}case`Q`:case`B`:if(g.startTime??=e.timestamp,g.name=n.name,g.weight=n.weight,g.description=n.description,g.thread_id=a,g.flavor=e.phase===`Q`?`question`:`task`,g.status===`active`){let e=$a(c,n.id);if(e&&e.endTime===void 0)break}g.status=`active`,g.startTime=e.timestamp;let t=io(g,s,c);c.push({activity_id:n.id,beginning:e.phase,events:[e.id],level:t,startMessage:e.message,startTime:e.timestamp}),i[l].push(n.id),h.current+=1,h.max=Math.max(t+1,h.max);break;case`E`:case`J`:case`V`:if(g.status===`suspended`){g.status=`complete`;break}g.endTime=e.timestamp,g.status=`complete`,[...i[l]].forEach(t=>{let r=s[B(t)];!r||!no(t,n.id,s)||(ao(c,t,e.timestamp,e.phase,e.message,e.id),h.current=to(h.current),r.status=`complete`,i[l]=eo(t,a,i)[l])}),ao(c,n.id,e.timestamp,e.phase,e.message,e.id),h.current=to(h.current),i[l]=eo(n.id,a,i)[l]}d=Math.max(d,e.timestamp),u=Math.min(u,e.timestamp),f=g.categories[0]??null,t===o.length-1&&(p=g.thread_id)}),n.forEach(e=>so(e,s,c,r)),{activities:s,blocks:c,events:e,lastCategory_id:f,lastThread_id:p,max:d,min:u,threadLevels:r,threads:a}}function lo(e,t){return t?Object.fromEntries(Object.entries(e).map(([e,n])=>{let r=t[e];return r?[e,{...n,agent_id:r.agent_id,agent_name:r.agent_name}]:[e,n]})):e}var uo=(e,t)=>Object.fromEntries(Object.entries(e).map(([e,n])=>[e,t(n,e)])),fo=(e,t)=>{let n=new Set(t.map(String));return Object.fromEntries(Object.entries(e).filter(([e])=>!n.has(e)))};function po(e){return Array.isArray(e)?e.map(e=>Number(e)).filter(e=>Number.isFinite(e)):[]}function mo(e){return Object.keys(e).map(Number).filter(e=>Number.isFinite(e))}function ho(e,t,n){let r=new Set(mo(t).map(String)),i=po(e).filter(e=>r.has(String(e)));return r.size>0&&i.length>=r.size?n:i}function go(e,t){let n=[String(e)],r=!0;for(;r;){r=!1;for(let[e,i]of Object.entries(t))n.includes(e)||i.parent_id!==null&&i.parent_id!==void 0&&n.includes(String(i.parent_id))&&(n.push(e),r=!0)}return n}function _o(e,t){let n=String(e.thread_id),r=e.parent_id??null,i=new Set;for(;r!=null&&!i.has(String(r));){i.add(String(r));let e=t[String(r)];if(!e)return null;if(String(e.thread_id)===n)return e.id;r=e.parent_id??null}return null}var V=e=>e.timeline,vo=e=>e.timeline.trace?.filterExcludes??[],yo=e=>{let t=vo(e)||[],n=V(e),r=new Set(t.map(String)),i=Object.fromEntries(Object.entries(n.activities).filter(([,e])=>!r.has(String(e.thread_id))));return{...n,activities:i,blocks:n.blocks.filter(e=>Object.keys(i).map(e=>Number(e)).includes(e.activity_id)),threads:ga(t,n.threads),lastThread_id:r.has(String(e.lastThread_id))?e.lastThread_id:null,threadLevels:ga(t,n.threadLevels)}},bo={trace:{id:null,name:null,filterExcludes:[]},focusedBlockIndex:null,focusedBlockActivity_id:null,activities:{},blocks:[],events:[],threads:{},threadLevels:{},leftBoundaryTime:0,rightBoundaryTime:0,flameChartTopOffset:0,lastThread_id:null,lastCategory_id:null};function xo(e,t,n){let r=n[e];return{...n,[e]:{current:r.current+t,max:t>0?Math.max(r.current+t,r.max):r.max}}}function So(e,t,n,r,i=`optimisticActivity`,a=`B`,o=`optimisticEvent`){return e||=[],{blocks:[...e,{level:r[t].current,startTime:n,activity_id:i,beginning:a,events:[o]}],threadLevels:xo(t,1,r)}}function Co(e=bo,t){switch(t.type){case`${Ht}_SUCCEEDED`:return{...e,trace:{...e.trace,...t.data}};case ke:let{leftBoundaryTime:n,rightBoundaryTime:r}=ki(t.deltaY,t.zoomCenter,t.zoomCenterTime,t.leftBoundaryTime,t.rightBoundaryTime,t.width,t.nowTime,t.minTime);return{...e,leftBoundaryTime:n,rightBoundaryTime:r};case Ae:let{leftBoundaryTime:i,rightBoundaryTime:a,topOffset:o}=ji(t.deltaX,t.deltaY,t.leftBoundaryTime,t.rightBoundaryTime,t.width,t.topOffset,t.nowTime,t.minTime);return{...e,leftBoundaryTime:i,rightBoundaryTime:a,flameChartTopOffset:o};case Oe:let{activities:s,blocks:c,min:l,max:u,threadLevels:d,threads:f,lastCategory_id:p,lastThread_id:m,events:h}=co(t.events,t.threads,t.unstarted??[]);return{...e,processedTraceId:e.trace?.id??null,minTime:l-6e5,maxTime:u,activities:s,blocks:c,threadLevels:d,threads:f,lastCategory_id:p??null,lastThread_id:m??null,events:h};case Vt:return{...e,trace:{id:t.trace.id??null,name:t.trace.name??null,filterExcludes:po(t.trace.filterExcludes)}};case Ut:return{...e,trace:{id:e.trace?.id??null,name:e.trace?.name??null,filterExcludes:ho(t.filterExcludes,e.threads,e.trace?.filterExcludes??[])}};case Nt:{let n=new Set((e.trace?.filterExcludes??[]).map(String));return n.add(String(t.id)),{...e,trace:{id:e.trace?.id??null,name:e.trace?.name??null,filterExcludes:ho([...n],e.threads,e.trace?.filterExcludes??[])}}}case Ft:{let n=Object.fromEntries(po(t.orderedIds).map((e,t)=>[String(e),t]));return{...e,threads:uo(e.threads,(e,t)=>n[t]===void 0?e:{...e,rank:n[t]})}}case Me:return{...e,trace:null};case Fe:case Re:return{...e,lastThread_id:t.thread_id,activities:{...e.activities,optimisticActivity:{id:`optimisticActivity`,name:t.name,flavor:t.phase===`Q`?`question`:`task`,startTime:t.timestamp,categories:[t.category_id],status:`active`,thread_id:t.thread_id,events:[],suspendedChildren:[]}},...So(e.blocks,t.thread_id,t.timestamp,e.threadLevels)};case`${Fe}_SUCCEEDED`:case`${Re}_SUCCEEDED`:return{...e,blocks:e.blocks.map(e=>e.activity_id===`optimisticActivity`?{...e,activity_id:t.data.activity.id,events:[t.data.event.id]}:e),activities:Object.fromEntries(Object.entries(e.activities).map(([e,n])=>[e===`optimisticActivity`?t.data.activity.id:e,n]))};case Ue:return{...e,activities:{...e.activities,[t.id]:{...e.activities[t.id],endTime:t.timestamp,status:`active`}},...So(e.blocks,t.thread_id,t.timestamp,e.threadLevels,t.id,`R`,`optimisticResumeEvent`)};case`${Ue}_SUCCEEDED`:return{...e,blocks:e.blocks.map(e=>e.events.includes(`optimisticResumeEvent`)?{...e,events:e.events.map(e=>t.data.id)}:e)};case We:return{...e,activities:{...e.activities,[t.id]:{...e.activities[t.id],endTime:t.timestamp,status:`active`}},...So(e.blocks,t.thread_id,t.timestamp,e.threadLevels,t.id,`X`)};case ze:let g=e.blocks.filter(e=>e.activity_id!==t.id),_=e.blocks.filter(e=>e.activity_id===t.id);for(let n=0;n<g.length;n++)if(e.activities[g[n].activity_id].thread_id===t.thread_id)for(let e=0;e<_.length;e++)_[e].endTime?_[e].startTime<g[n].startTime&&(_[e].endTime??1/0)>(g[n].endTime??1/0)&&g[n].level--:_[e].startTime<g[n].startTime&&g[n].level--;return{...e,activities:fo(e.activities,[t.id]),focusedBlockIndex:null,focusedBlockActivity_id:null,lastThread_id:t.thread_id,blocks:g,threadLevels:xo(t.thread_id,-1,e.threadLevels)};case Be:return{...e,activities:{...e.activities,[t.id]:{...e.activities[t.id],endTime:t.timestamp,status:`complete`}},blocks:e.activities[t.id].status===`suspended`?e.blocks:ao(e.blocks,t.id,t.timestamp,t.eventFlavor||`E`,t.message),lastThread_id:t.thread_id,threadLevels:xo(t.thread_id,-1,e.threadLevels)};case Ge:return{...e,activities:{...e.activities,[t.id]:{...e.activities[t.id],endTime:t.timestamp,status:`suspended`,events:[...e.activities[t.id].events,`optimisticActivitySuspension`]}},events:[...e.events,{timestamp:t.timestamp,phase:`S`,message:t.message,id:`optimisticActivitySuspension`,activity:{...e.activities[t.id],id:t.id}}],blocks:ao(e.blocks,t.id,t.timestamp,`S`,t.message,`optimisticActivitySuspension`),lastThread_id:t.thread_id,threadLevels:{...e.threadLevels,[t.thread_id]:{current:e.threadLevels[t.thread_id].current-1,max:e.threadLevels[t.thread_id].max}}};case`${Ge}_SUCCEEDED`:return{...e,activities:uo(e.activities,e=>e.events.includes(`optimisticActivitySuspension`)?{...e,events:e.events.map(e=>e===`optimisticActivitySuspension`?t.data.id:e)}:e),blocks:e.blocks.map(e=>e.events.includes(`optimisticActivitySuspension`)?{...e,events:e.events.map(e=>e===`optimisticActivitySuspension`?t.data.id:e)}:e),events:e.events.map(e=>e.id===`optimisticActivitySuspension`?{...e,id:t.data.id}:e)};case Ke:{let n=e.activities[t.id];if(!n)return e;let r=t.updates.thread_id,i=Object.prototype.hasOwnProperty.call(t.updates,`scheduled_start_integer`),a=Object.prototype.hasOwnProperty.call(t.updates,`scheduled_end_integer`),o=t.updates.move_child_ids,s,c=[];if(r===void 0)s=[String(t.id)];else if(o!==void 0){let n=new Set(o.map(String)),r=Object.entries(e.activities).filter(([,e])=>e.parent_id!==null&&e.parent_id!==void 0&&String(e.parent_id)===String(t.id)).map(([e])=>e);c=r.filter(e=>!n.has(e)),s=[String(t.id)];for(let t of r)n.has(t)&&s.push(...go(t,e.activities));s=[...new Set(s)]}else s=go(t.id,e.activities);let l=new Set(s),u=r!==void 0&&n.parent_id!==null&&n.parent_id!==void 0&&!l.has(String(n.parent_id)),d={...e.activities};for(let e of s){let n=d[e];n&&(d[e]={...n,name:e===String(t.id)&&t.updates.name?t.updates.name:n.name,categories:e===String(t.id)&&Array.isArray(t.updates.category_ids)?t.updates.category_ids:n.categories,startTime:e===String(t.id)&&t.updates.startTime?t.updates.startTime:n.startTime,endTime:e===String(t.id)&&t.updates.endTime?t.updates.endTime:n.endTime,weight:e===String(t.id)&&t.updates.weight?t.updates.weight:n.weight,...r===void 0?{}:{thread_id:r},...e===String(t.id)&&i?{scheduled_start:t.updates.scheduled_start_integer}:{},...e===String(t.id)&&a?{scheduled_end:t.updates.scheduled_end_integer}:{},...u&&e===String(t.id)?{parent_id:null}:{},...e===String(t.id)&&Object.prototype.hasOwnProperty.call(t.updates,`agent_id`)?{agent_id:t.updates.agent_id??null,agent_name:t.updates.agent_id?t.updates.agent_name??n.agent_name:null}:{}})}let f=_o(n,e.activities);for(let e of c){let t=d[e];t&&(d[e]={...t,parent_id:f})}let p=Object.prototype.hasOwnProperty.call(t.updates,`agent_id`)?e.events.map(e=>String(e.activity?.id)===String(t.id)?{...e,activity:e.activity?{...e.activity,agent_id:t.updates.agent_id??null,agent_name:t.updates.agent_id?t.updates.agent_name??e.activity.agent_name:null}:e.activity}:e):e.events;return{...e,lastThread_id:t.thread_id,activities:d,blocks:i||a?e.blocks.map(e=>{if(!e.scheduled||String(e.activity_id)!==String(t.id))return e;let n=d[String(t.id)],r=n.scheduled_start??null,i=n.scheduled_end??null,a=r===null&&i!==null;return{...e,scheduledPoint:a,startTime:r??i??e.startTime,...i===null?{endTime:void 0}:{endTime:i}}}):e.blocks,events:p}}case`${Ke}_SUCCEEDED`:{let n=t.data;if(!n||n.id===void 0||n.id===null||!Object.prototype.hasOwnProperty.call(n,`agent_id`))return e;let r=String(n.id),i=e.activities[r];if(!i)return e;let a=n.agent_id??null,o=a?n.agent_name??i.agent_name:null;return{...e,activities:{...e.activities,[r]:{...i,agent_id:a,agent_name:o}},events:e.events.map(e=>String(e.activity?.id)===r?{...e,activity:e.activity?{...e.activity,agent_id:a,agent_name:o}:e.activity}:e)}}case Qe:{if(t.activity_id==null)return e;let n=e.activities[t.activity_id];return n?{...e,activities:{...e.activities,[t.activity_id]:{...n,categories:[...n.categories,`optimisticCategory`]}}}:e}case`${Qe}_SUCCEEDED`:return{...e,activities:uo(e.activities,e=>e.categories.includes(`optimisticCategory`)?{...e,categories:e.categories.map(e=>e===`optimisticCategory`?t.data.id:e)}:e)};case Ot:return{...e,threads:{...e.threads,optimisticThread:{id:`optimisticThread`,name:t.name,rank:t.rank,collapsed:!1}},threadLevels:{...e.threadLevels,optimisticThread:{current:0,max:0}}};case`${Ot}_SUCCEEDED`:let v=e.threads.optimisticThread,y=t.data;return!v||!y||!y.id?e:{...e,threads:{...fo(e.threads,[`optimisticThread`]),[y.id]:{...v,...y}},threadLevels:{...fo(e.threadLevels,[`optimisticThread`]),[y.id]:e.threadLevels.optimisticThread}};case kt:let b={};return Object.entries(e.activities).forEach(([e,n])=>{n.thread_id!==t.id&&(b[e]=n)}),{...e,threads:fo(e.threads,[t.id]),activities:b,threadLevels:fo(e.threadLevels,[t.id]),trace:e.trace?{...e.trace,filterExcludes:(e.trace.filterExcludes??[]).filter(e=>String(e)!==String(t.id))}:e.trace};case At:return{...e,threads:{...e.threads,[t.id]:{...e.threads[t.id],collapsed:!0}}};case jt:return{...e,threads:{...e.threads,[t.id]:{...e.threads[t.id],collapsed:!1}}};case Mt:return{...e,threads:{...e.threads,[t.id]:{...e.threads[t.id],...t.updates}}};case It:return{...e,threads:uo(e.threads,e=>({...e,collapsed:!1}))};case Pt:return{...e,threads:uo(e.threads,e=>({...e,collapsed:!0}))};case Xe:return{...e,focusedBlockIndex:t.index,focusedBlockActivity_id:t.activity_id,thread_id:t.thread_id};case Ze:return e.hoveredBlockIndex==null&&t.index==null||String(e.hoveredBlockIndex)===String(t.index)?e:{...e,hoveredBlockIndex:t.index,hoveredBlockActivity_id:t.activity_id};case je:let{leftBoundaryTime:x,rightBoundaryTime:S}=t;return{...e,leftBoundaryTime:x,rightBoundaryTime:S};default:return e}}var wo=`
  background: ${M.background};
  outline: none;
  border: 1px solid transparent;
  padding: 1px 7px 2px;
  border-radius: 4px;
  text-align: center;
  min-width: 100px;

  &:focus {
    border: 1px solid ${M.flames.main};
    box-shadow: 0 0 20px ${M.flames.main};
  }
`,H=A.button`
  ${e=>e.unstyled?``:wo}
  cursor: ${e=>e.disabled?`default`:`pointer`};

  ${e=>e.disabled?``:`&:hover {
    background: ${k(M.hover).darken(5).toString()};
  }`}

  &:active {
    background: ${k(M.hover).darken(10).toString()};
  }

  ${e=>e.looksLikeButton?`border-color: #ccc`:``};
  ${e=>e.additionalStyles||``};
`,To=A.textarea`
  vertical-align: middle;
  line-height: unset;
  ${wo};
`,Eo=class extends j.Component{button=null;transformedInput=null;didAutoFocus=!1;state={height:0,isInput:!!this.props.startAsInput,width:0};focusInput=(e=this.transformedInput)=>{e&&(e.focus(),e.setSelectionRange(0,e.value.length))};transformIntoInput=()=>{this.setState({isInput:!0},()=>{this.focusInput()})};componentDidMount(){this.state.isInput&&requestAnimationFrame(()=>{requestAnimationFrame(()=>this.focusInput())})}onKeyPress=e=>{e.key===`Enter`&&(e.preventDefault(),(this.props.canBeBlank||e.currentTarget.value.length>0)&&(this.props.submit(e.currentTarget.value),this.transformIntoButton()))};stopShortcutKeys=e=>{e.stopPropagation()};transformIntoButton=()=>this.setState({isInput:!1});setTextareaSize=({width:e,height:t})=>this.setState({width:e,height:t});render(){let{children:e,looksLikeButton:t,placeholder:n,placeholderIsDefaultValue:r}=this.props,i=typeof e==`string`?e:``;return this.state.isInput?(0,N.jsx)(To,{style:{width:`${this.state.width||160}px`,height:`${this.state.height||28}px`},placeholder:n||i,onBlur:this.transformIntoButton,onKeyDown:this.stopShortcutKeys,onKeyUp:this.stopShortcutKeys,onKeyPress:this.onKeyPress,defaultValue:r?n||i:void 0,ref:e=>{this.transformedInput=e,e&&this.state.isInput&&!this.didAutoFocus&&(this.didAutoFocus=!0,this.focusInput(e))}}):(0,N.jsx)(mi,{bounds:!0,onResize:({bounds:e})=>{e.height!==this.state.height&&this.setTextareaSize(e)},children:({measureRef:n})=>(0,N.jsx)(H,{ref:e=>{n(e),this.button=e},onClick:this.transformIntoInput,looksLikeButton:t,children:e})})}},Do=class extends j.Component{openDialog=()=>{let{dialogLabel:e,message:t,onConfirm:n}=this.props;window.confirm(`${e} Please confirm!\n\n${t}`)&&n()};render(){return(0,N.jsx)(`button`,{onClick:this.openDialog,children:this.props.children||`Delete`})}},Oo=class extends j.Component{updateName=e=>{this.props.id!==null&&this.props.updateThread(this.props.id,{name:e})};delete=()=>{this.props.id!==null&&(this.props.closeThreadDetail(),this.props.deleteThread(this.props.id))};hide=()=>{this.props.id===null||!this.props.canHide||(this.props.closeThreadDetail(),this.props.hideThread(this.props.id))};render(){let e=Object.values(this.props.activities).filter(e=>e.thread_id===this.props.id&&e.status===`suspended`);return(0,N.jsxs)(zr.default,{contentLabel:`Thread Details`,isOpen:!!this.props.id,shouldCloseOnOverlayClick:!0,onRequestClose:this.props.closeThreadDetail,children:[(0,N.jsx)(`h1`,{children:`Thread Details`}),(0,N.jsx)(Eo,{submit:this.updateName,placeholderIsDefaultValue:!0,children:this.props.name??``}),(0,N.jsx)(`button`,{disabled:!this.props.canHide,onClick:this.hide,title:this.props.canHide?void 0:`Keep at least one thread visible`,type:`button`,children:`Hide thread`}),(0,N.jsx)(Do,{dialogLabel:`Delete Thread?`,message:`All activities will be removed from the thread and lost forever. There is no undo.`,onConfirm:this.delete}),(0,N.jsx)(`h2`,{children:`Suspended Activities`}),(0,N.jsx)(`ul`,{children:e.map(e=>(0,N.jsx)(`li`,{children:e.name},e.name))})]})}},ko=b(e=>{let t=V(e).threads??{},n=new Set(vo(e).map(String));return{canHide:Object.keys(t).filter(e=>!n.has(e)).length>1}},e=>({updateThread:(t,n)=>e(pn(t,n)),deleteThread:t=>e(_n(t)),hideThread:t=>e(an(t))}))(Oo);function Ao(e){let t=e.toLowerCase();return t.includes(`jev`)?`Jev`:t.includes(`luna`)?`Luna`:t.includes(`terra`)?`Terra`:e}function jo(e){if(!e)return null;let t=/(?:^|\s|\|)model=([^\s|]+)/.exec(e);if(!t)return null;let n=t[1].split(`->`);return n[n.length-1]||null}function Mo(e){return e.split(/\s*\|\s*/).map(e=>e.trim()).filter(Boolean).map(e=>{let t=e.indexOf(`=`);return t<=0?{value:e}:{key:e.slice(0,t),value:e.slice(t+1)}})}function No(e,t){let n=e.filter(e=>e.phase===`reducer_decision`&&e.activity&&String(e.activity.id)===String(t)).sort((e,t)=>e.timestamp-t.timestamp||Number(e.id)-Number(t.id)),r=n[n.length-1],i=jo(r?.message);return i?{agent:Ao(i),model:i}:null}var Po=`ACTIVITIES_SELECT`,Fo=`ACTIVITIES_BULK_MOVE`,Io=`ACTIVITIES_BULK_DELETE`,Lo=e=>({type:Po,ids:e});function Ro(e=[],t){switch(t.type){case Po:return[...new Set((t.ids??[]).map(String))];case Xe:case Vt:case ct:return[];default:return e}}var zo={key:`thread_id`,placeholder:`thread`,selector:e=>Di(e.settings.attentionDrivenThreadOrder?Ei(e.attentionShifts,e.threads):e.threads).map(([e,t])=>t),itemStringKey:`name`,itemReturnKey:`id`};function Bo(e){return e.length<2?[]:[{action:Fo,copy:`move ${e.length} activities to thread...`,activity_ids:e,parameters:[zo]},{action:Io,copy:`delete ${e.length} activities...`,activity_ids:e}]}var Vo=e=>({copy:` `,background:e}),Ho={key:`category_id`,placeholder:`category`,selector:e=>{let t=e.user.categories.map(e=>({...e,label:Vo(e.color_background)})).sort((e,t)=>k(e.color_background).spin(180).toHsl().h-k(t.color_background).spin(180).toHsl().h);return[{name:`none`,id:null,label:Vo(null)},...t]},itemStringKey:`name`,itemReturnKey:`id`,label:e=>Vo(e.color)},Uo={copy:`Activity`,background:M.flames.main},Wo=[{action:Fe,copy:`start a new task/activity...`,parameters:[{key:`name`,placeholder:`gist/description of the activity`},zo,Ho]},{action:Re,copy:`ask a question...`,parameters:[{key:`name`,placeholder:`what the fuck is happening?`},zo,Ho]},{action:Ie,copy:`add to limbo...`,parameters:[{key:`name`,placeholder:`idea / unstarted work`},zo]},{action:Ot,copy:`new thread...`,parameters:[{key:`name`,placeholder:`thread name`}]},{action:Pt,copy:`collapse all threads`,shortcut:`⇧ {`},{action:It,copy:`expand all threads`,shortcut:`⇧ }`},{action:Ye,copy:`shift attention to...`,parameters:[zo]},{action:et,copy:`manage categories`},{action:xt,copy:`open settings`,shortcut:`⌘ ,`},{action:Ct,copy:`share timeline...`},{action:Tt,copy:`keyboard shortcuts`,shortcut:`⌘ /`},{action:Kt,copy:`change view...`,parameters:[{key:`view`,placeholder:`select a view`,selector:()=>[{name:`single thread`,value:`singlethread`},{name:`multithread`,value:`multithread`}],itemStringKey:`name`,itemReturnKey:`value`},zo]}],Go={key:`message`,placeholder:`why?`},Ko=[{action:Be,copy:`just end it`,status:[`active`,`suspended`],label:Uo,shortcut:`E`},{action:Ve,copy:`end by rejection...`,parameters:[Go],status:[`active`,`suspended`],label:Uo,shortcut:`J`},{action:He,copy:`end by resolution...`,parameters:[{key:`message`,placeholder:`closing remarks?`}],status:[`active`,`suspended`],label:Uo,shortcut:`V`},{action:Ue,copy:`resume...`,parameters:[Go],status:[`suspended`],label:Uo},{action:We,copy:`resurrect...`,parameters:[Go],status:[`complete`],label:Uo},{action:Ge,copy:`suspend...`,parameters:[{key:`message`,placeholder:`how bout a message?`},{key:`weight`,placeholder:`give it a weight? 1+     ...or don't`}],status:[`active`],label:Uo,shortcut:`S`},{action:ze,copy:`delete`,status:[`active`,`suspended`,`complete`],label:Uo},{action:qe,copy:`edit/view details`,status:[`active`,`suspended`,`complete`],label:Uo,shortcut:`Space`}];function qo(e){return Ko.filter(t=>t.status?.includes(e))}var U=`human`,Jo={claude:`#d97706`,cursor:`#2563eb`,codex:`#7c3aed`,gpt:`#059669`,openai:`#059669`,grok:`#db2777`},Yo=[`#2563eb`,`#7c3aed`,`#db2777`,`#059669`,`#d97706`,`#0891b2`];function W(e){return String(e)}function G(e){return`${e.activity_id}@${e.startTime}@${e.beginning}`}function Xo(e){return e.agent_id===null||e.agent_id===void 0?U:`agent:${e.agent_id}`}function Zo(e){return e.agent_id===null||e.agent_id===void 0?`Human`:e.agent_name||String(e.agent_id)}function Qo(e){let t={},n=r=>{let i=W(r);if(i in t)return t[i];let a=e[i];if(!a||Xo(a)===U)return t[i]=null,null;let o=a.parent_id??null;if(o===null)return t[i]=a.id,a.id;let s=e[W(o)];if(!s)return t[i]=a.id,a.id;if(Xo(s)===Xo(a)){let e=n(s.id);return t[i]=e,e}return t[i]=a.id,a.id},r={};for(let t of Object.values(e))r[String(t.id)]=n(t.id);return{flames:Object.values(e).flatMap(t=>{let n=r[String(t.id)];if(!n||n!==t.id||Xo(t)===U)return[];let i=t.parent_id??null,a=i===null?void 0:e[W(i)];return[{actorKey:Xo(t),actorName:Zo(t),parentActivityId:a?a.id:null,rootActivityId:t.id}]}),rootIdByActivity:r}}function $o(e,t){return e.filter(e=>String(e.activity_id)===String(t)).sort((e,t)=>e.startTime-t.startTime)[0]??null}function es(e,t){return $o(t,e)?.startTime??1/0}function ts(e,t){let n=$o(t,e.rootActivityId);if(!n||e.parentActivityId===null)return{parentBlock:null,rootBlock:n};let r=t.filter(t=>String(t.activity_id)===String(e.parentActivityId)).sort((e,t)=>e.startTime-t.startTime),i=n.startTime,a=r.find(e=>e.startTime<=i&&(e.endTime===void 0||e.endTime>=i)),o=[...r].reverse().find(e=>(e.endTime??e.startTime)<=i);return{parentBlock:a??o??r[0]??null,rootBlock:n}}function ns(e,t,n,r){return t<0||e>n?null:Math.max(e,r)}function rs(e,t,n){let r=e.trim();if(!r||t<=0)return``;if(n(r)<=t)return r;let i=r.split(/\s+/).filter(Boolean).map(e=>e[0].toUpperCase()).join(``);if(i&&n(i)<=t)return i;let a=r;for(;a.length>1;){a=a.slice(0,-1);let e=`${a}…`;if(n(e)<=t)return e}let o=r[0]??``;return n(o)<=t?o:``}function is(e){if(!e)return U;let t=e.startsWith(`agent:`)?e.slice(6):e,n=t.indexOf(`:`);return n>0?t.slice(0,n).toLowerCase():`unknown`}function as(e){if(e===U)return`#6b7280`;let t=is(e);if(Jo[t])return Jo[t];let n=0;for(let e=0;e<t.length;e+=1)n=(n<<5)-n+t.charCodeAt(e)|0;return Yo[Math.abs(n)%Yo.length]}function os(e,t,n){let r=new Set(e.map(String)),i=n.filter(e=>{let n=t[String(e.activity_id)];return n!=null&&r.has(String(n))});if(!i.length)return null;let a=Math.min(...i.map(e=>e.startTime));return i.some(e=>e.endTime===void 0)?{startTime:a,endTime:null}:{startTime:a,endTime:Math.max(...i.map(e=>e.endTime))}}function ss(e){let t=[...new Set(e.filter(e=>Number.isFinite(e)))].sort((e,t)=>e-t);if(!t.length)return[];let n=[],r=t[0],i=t[0];for(let e of t.slice(1)){if(e===i+1){i=e;continue}n.push({rowStart:r,rowEnd:i}),r=e,i=e}return n.push({rowStart:r,rowEnd:i}),n}function cs(e,t,n){let r=new Set(e.map(String)),i=e=>{let n=t.rootIdByActivity[String(e)];return n!=null&&r.has(String(n))},a=new Set,o=1/0,s=-1/0;for(let e of n){if(!i(e.activity_id))continue;let n=t.rowByBlock[G(e)];n!==void 0&&(a.add(n),o=Math.min(o,e.startTime),e.endTime===void 0?s=1/0:s!==1/0&&(s=Math.max(s,e.endTime)))}if(!a.size||!Number.isFinite(o))return[];let c=o,l=Number.isFinite(s)?s:null,u=[...a].sort((e,t)=>e-t),d=[],f=u[0],p=u[0],m=()=>d.push({rowStart:f,rowEnd:p,startTime:c,endTime:l});for(let e of u.slice(1))e===p+1?p=e:(m(),f=e,p=e);return m(),d}function ls(e,t,n=0,r=Date.now()){let i=new Map;for(let t of e.lanes){let e=[String(t.threadId),t.actorKey,String(t.parentLaneRootId??``),String(t.depth)].join(`|`),n=i.get(e)??[];n.push(t),i.set(e,n)}let a=[];for(let n of i.values()){let r=n[0],i=n.map(e=>e.rootActivityId),o=os(i,e.rootIdByActivity,t);if(!o||!Number.isFinite(o.startTime))continue;let s=cs(i,e,t);s.length||s.push({rowStart:Math.min(...n.map(e=>e.rowStart)),rowEnd:Math.max(...n.map(e=>e.rowEnd)),startTime:o.startTime,endTime:o.endTime});let c=ss(s.flatMap(e=>{let t=[];for(let n=e.rowStart;n<=e.rowEnd;n+=1)t.push(n);return t}));i.sort((e,t)=>Number(e)-Number(t)),a.push({actorKey:r.actorKey,actorName:r.actorName,depth:r.depth,endTime:o.endTime,parentLaneRootId:r.parentLaneRootId,providerKey:is(r.actorKey),rootActivityIds:i,rowEnd:Math.max(...c.map(e=>e.rowEnd)),rowStart:Math.min(...c.map(e=>e.rowStart)),startTime:o.startTime,threadId:r.threadId,washRowRanges:c,washRects:s})}return a.sort((e,t)=>e.depth-t.depth||e.startTime-t.startTime||e.rowStart-t.rowStart)}function us(e,t){return e.parentActivityId===null?null:t[String(e.parentActivityId)]??null}function ds(e,t){return e.start<t.end&&t.start<e.end}function fs(e,t){return t.some(t=>e.some(e=>ds(e,t)))}function ps(e,t){let{flames:n,rootIdByActivity:r}=Qo(e),i={},a={},o=[],s={},c=Object.fromEntries(n.map(e=>[String(e.rootActivityId),e])),l=new Map,u=e=>{let t=W(e),n=l.get(t);return n||(n=new Map,l.set(t,n)),n},d=(e,t,n,r=1)=>{let i=u(e),a=Math.max(0,t);for(;;){let e=!0;for(let t=0;t<r;t+=1)if(fs(i.get(a+t)??[],n)){e=!1;break}if(e)return a;a+=1}},f=(e,t,n,r)=>{let i=r.filter(e=>Number.isFinite(e.start));if(!i.length)return;let a=u(e);for(let e=t;e<=n;e+=1){let t=a.get(e)??[];t.push(...i),a.set(e,t)}},p=t=>{let n=0,r=e[W(t)],i=new Set;for(;r&&r.parent_id!=null&&!i.has(W(r.id));)i.add(W(r.id)),n+=1,r=e[W(r.parent_id)];return n},m=e=>{let t=0,n=us(e,r),i=new Set;for(;n!==null&&!i.has(String(n));){i.add(String(n)),t+=1;let e=c[String(n)];if(!e)break;n=us(e,r)}return t},h=t=>{let n=e[W(t)],i=new Set;for(;n&&!i.has(W(n.id));){i.add(W(n.id));let t=r[W(n.id)];if(t!=null){let e=c[W(t)];for(;e;){let t=us(e,r);if(t===null)return e.rootActivityId;e=c[W(t)]}return t}let a=n.parent_id??null;if(a===null)return null;n=e[W(a)]}return null},g=(e,n)=>t.filter(t=>String(t.activity_id)===String(e)).sort((e,t)=>e.startTime-t.startTime).find(e=>e.startTime<=n&&(e.endTime===void 0||e.endTime>=n))??null,_=new Map;for(let n of t){let t=e[W(n.activity_id)];if(!t||t.thread_id===void 0||t.thread_id===null)continue;let r=W(t.thread_id),i=_.get(r)??[];i.push(n),_.set(r,i)}for(let[i,l]of _){let u=e[W(l[0].activity_id)]?.thread_id;if(u==null)continue;let _=l.slice().sort((e,t)=>Number(!!e.scheduled)-Number(!!t.scheduled)||e.startTime-t.startTime||p(e.activity_id)-p(t.activity_id)||Number(e.activity_id)-Number(t.activity_id)),v=t=>{let n=h(t);if(n===null)return U;let r=e[W(n)];return r?Xo(r):U},y=new Map;for(let e of _){let t=v(e.activity_id),n=y.get(t)??1/0;y.set(t,Math.min(n,e.startTime))}let b=[...y.keys()].sort((e,t)=>e===U?t===U?0:-1:t===U?1:y.get(e)-y.get(t)||e.localeCompare(t)),x=(t,n,r)=>{let a=e[W(t.activity_id)]?.parent_id??null;if(a===null||String(e[W(a)]?.thread_id)!==i||v(a)!==n||a===null)return 0;let o=g(a,t.startTime),s=o?r(o):void 0;return s===void 0?0:s+1},S=0;for(let t of b){let n=_.filter(e=>v(e.activity_id)===t);if(!n.length)continue;if(t===U){let e=-1;for(let r of n){let n={start:r.startTime,end:r.endTime??1/0},i=d(u,x(r,t,e=>a[G(e)]),[n],1);a[G(r)]=i,f(u,i,i,[n]),e=Math.max(e,i)}S=e+1;continue}let i=new Map,o={},s=0,l=1/0,p=-1/0,h=new Map;for(let t of n){let n=Xo(e[W(t.activity_id)]);h.set(n,[...h.get(n)??[],t])}let g=e=>Math.min(...e.map(e=>{let t=r[W(e.activity_id)],n=t==null?void 0:c[W(t)];return n?m(n):0})),y=[...h.values()].sort((e,t)=>g(e)-g(t)||e[0].startTime-t[0].startTime);for(let e of y){let n={},r=new Map,a=0,c=Math.min(...e.map(e=>e.startTime)),u=Math.max(...e.map(e=>e.endTime??1/0)),d={start:c,end:u};l=Math.min(l,c),p=Math.max(p,u);for(let i of e){let e={start:i.startTime,end:i.endTime??1/0},o=x(i,t,e=>n[G(e)]),s=Math.max(0,o);for(;fs(r.get(s)??[],[e]);)s+=1;n[G(i)]=s,r.set(s,[...r.get(s)??[],e]),a=Math.max(a,s+1)}let f=0;for(;Array.from({length:a},(e,t)=>f+t).some(e=>fs(i.get(e)??[],[d]));)f+=1;for(let t of e)o[G(t)]=f+n[G(t)];for(let e=f;e<f+a;e+=1)i.set(e,[...i.get(e)??[],d]);s=Math.max(s,f+a)}if(!Number.isFinite(l))continue;let b={start:l,end:p},C=d(u,S,[b],s);for(let e of n){let t=o[G(e)];t!==void 0&&(a[G(e)]=C+t)}f(u,C,C+s-1,[b])}let C=n.filter(t=>{let n=e[W(t.rootActivityId)];return n!==void 0&&String(n.thread_id)===i}),w={},T=C.slice().sort((e,t)=>m(t)-m(e)||Number(e.rootActivityId)-Number(t.rootActivityId));for(let e of T){let t=[];for(let n of l){if(String(r[W(n.activity_id)])!==String(e.rootActivityId))continue;let i=a[G(n)];i!==void 0&&t.push(i)}let n=Object.values(w).filter(t=>String(t.parentLaneRootId)===String(e.rootActivityId)).map(e=>e.rowEnd),i=t.length?Math.min(...t):0,o=Math.max(i,...t,...n);w[W(e.rootActivityId)]={actorKey:e.actorKey,actorName:e.actorName,depth:m(e),parentActivityId:e.parentActivityId,parentLaneRootId:us(e,r),rootActivityId:e.rootActivityId,rowStart:i,rowEnd:o,threadId:u}}let E=C.slice().sort((e,n)=>es(e.rootActivityId,t)-es(n.rootActivityId,t)||Number(e.rootActivityId)-Number(n.rootActivityId));for(let e of E){let t=w[W(e.rootActivityId)];t&&o.push(t)}let ee=-1;for(let e of l){let t=a[G(e)];t!==void 0&&(ee=Math.max(ee,t))}s[i]=Math.max(0,ee+1)}for(let n of Object.values(e)){let e=t.filter(e=>String(e.activity_id)===String(n.id)).sort((e,t)=>e.startTime-t.startTime);if(e.length){let t=a[G(e[0])];t!==void 0&&(i[W(n.id)]=t)}}for(let t of Object.values(e)){let e=W(t.id);if(e in i||t.thread_id===void 0||t.thread_id===null)continue;i[e]=0;let n=W(t.thread_id);s[n]=Math.max(s[n]??0,1)}return{flames:n,lanes:o,rowByActivity:i,rowByBlock:a,rootIdByActivity:r,maxRowsByThread:s}}var ms={id:null,name:`Human`};function hs(e){return e.trim().toLowerCase()}function gs(e,t,n={}){let r=new Map,i=(e,t)=>{let n=hs(t);!n||r.has(n)||r.set(n,{id:e,name:t})};for(let e of t)i(e.agent_id,e.name);for(let e of Object.values(n))e.agent_id&&i(e.agent_id,e.agent_name||e.agent_id);let a=e.agent_id??null,o=a===null?null:hs(Zo(e)),s=[];a!==null&&s.push(ms);for(let e of r.values())e.id!==a&&(o&&hs(e.name)===o||s.push(e));return s}var _s=A.div`
  display: grid;
  align-items: center;
  grid-template-columns: ${({showTime:e})=>e?`90px 1fr`:`1fr`};
  max-width: 100%;
  width: 100%;
  overflow-x: scroll;

  font-size: ${11}px;
  font-family: ${dr};

  p {
    margin: 0;
  }

  .time-message {
    overflow: hidden;
    overflow-x: visible;

    .time {
      color: #bbb;
      font-size: 0.75em;
    }
  }

  .message-container {
    display: flex;
    width: 100%;
    min-height: 5px;
    height: ${({message:e})=>e?`100%`:`5px`};

    .message {
      background: white;
      border: 1px solid lightgray;
      border-left: none;
      opacity: 0.9;
      padding: 5px;

      &.reducer-fields {
        flex-wrap: wrap;
        align-items: baseline;
        gap: 6px 12px;
      }

      .part {
        display: inline-flex;
        align-items: baseline;
        gap: 5px;
        white-space: nowrap;
      }

      .part.prose {
        flex: 0 1 100%;
        white-space: normal;
      }

      .key {
        color: #666;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.92em;
        background: #f3f1ee;
        border-radius: 3px;
        padding: 0 4px;
      }
    }

    > div {
      display: flex;
      align-items: center;
      &:last-of-type {
        flex-grow: 1;
      }
    }
  }

  .timeline-marker {
    width: 5px;
  }

  .B,
  .R {
    background: grey;
  }

  .V {
    background: mediumseagreen;
  }

  .E {
    background: lightgrey;
  }

  .J {
    background: #d9646a;
  }

  .S {
    background: #6746a3;
  }

  .X {
    background: #2d2d2d;
  }

  .reducer_decision,
  .reducer_incoming,
  .reducer_created {
    background: #8a5a2b;
  }
`,vs=A.div`
  color: #aaa;
  position: relative;

  ${({eventType:e})=>e===`X`?`
    &::after {
      content: "🧟";
      display: block;
      position: absolute;
      font-size: 2em;
      right: 0;
      top: 0;
    }
`:``};
`,ys={B:`Began`,J:`Rejected`,Q:`Questioned`,R:`Resumed`,S:`Suspended`,V:`Resolved`,X:`Resurrected`,reducer_created:`Created`,reducer_decision:`Reducer`,reducer_incoming:`Message`},bs=new Set([`model`,`assessment`,`direction`,`rule`,`applied`,`categories`,`thread`]);function xs(e,t){return e===`reducer_decision`?Mo(t).map((e,t)=>{let n=e.key===`rationale`||!e.key&&e.value.includes(` `),r=!n&&(!e.key||bs.has(e.key));return(0,N.jsxs)(`span`,{className:n?`part prose`:`part`,children:[e.key?(0,N.jsx)(`span`,{className:`key`,children:e.key}):null,r?(0,N.jsx)(`code`,{children:e.value}):e.value]},`${e.key??`text`}-${t}`)}):t}var Ss=({showTime:e,eventType:t,time:n,message:r})=>!t&&!r?null:(0,N.jsxs)(_s,{showTime:e,message:r,children:[e&&(0,N.jsxs)(`div`,{className:`time-message`,children:[(0,N.jsx)(vs,{eventType:t,children:t?ys[t]:``}),(0,N.jsx)(`div`,{className:`time`,children:(0,z.default)(n).format(`YYYY-MM-DD`)})]}),(0,N.jsxs)(`div`,{className:`${t} message-container`,children:[(0,N.jsx)(`div`,{className:`timeline-marker`}),r?(0,N.jsx)(`div`,{className:t===`reducer_decision`?`message reducer-fields`:`message`,children:xs(t,r)}):null]})]}),Cs=A.div`
  margin-bottom: 10px;
  width: 100%;
`,ws=({beginning:e,startMessage:t,startTime:n,endMessage:r,endTime:i,ending:a,showTime:o})=>(0,N.jsxs)(Cs,{children:[(0,N.jsx)(Ss,{eventType:e,time:n,message:t,showTime:o}),(0,N.jsx)(Ss,{eventType:a,time:i,message:r,showTime:o})]}),Ts=({activityBlocks:e})=>(0,N.jsx)(`div`,{children:e&&e.map(({beginning:e,startMessage:t,endMessage:n,ending:r,startTime:i,endTime:a})=>(0,N.jsx)(ws,{beginning:e,startMessage:t,endMessage:n,ending:r,startTime:i,endTime:a,showTime:!0},i||a))}),Es=new Intl.RelativeTimeFormat(`en`,{numeric:`always`});function Ds(e,t=Date.now()){let n=e?Date.parse(e):NaN;if(!Number.isFinite(n)||n>t)return{kind:`unknown`,lastSeenTime:null,label:`No contact recorded`,title:`Flambe has no last-contact timestamp for this agent.`};let r=t-n,i=`Last heard from ${new Date(n).toLocaleString()}`;if(r<=6e4)return{kind:`recent`,lastSeenTime:n,label:`Recent contact`,title:`${i}. Contact with Flambe within the past minute.`};let[a,o]=[[`day`,864e5],[`hour`,36e5],[`minute`,6e4],[`second`,1e3]].find(([,e])=>r>=e);return{kind:`stale`,lastSeenTime:n,label:`Last heard from ${Es.format(-Math.floor(r/o),a)}`,title:i}}function Os(e,t=Date.now()){let n=e.flatMap(e=>{let n=Ds(e.last_seen_at,t);return n.kind===`recent`?[n.lastSeenTime+Sr+1]:[]});return n.length?Math.min(...n):null}function ks(e,t){return new Set(e.flatMap(e=>{let n=t[String(e.activity_id)]?.agent_id;return n&&!e.scheduled&&e.endTime==null?[n]:[]}))}var As=A.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 12px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border: 1px solid #8a929b;
    border-radius: 50%;
    flex: 0 0 auto;
  }

  &[data-contact='recent']::before {
    border-color: #15803d;
    background: #15803d;
  }
`;function js({lastSeenAt:e}){let[t,n]=(0,j.useState)(Date.now);(0,j.useEffect)(()=>{let t,r=()=>{t!==void 0&&clearTimeout(t);let i=Date.now();if(n(i),document.visibilityState===`hidden`)return;let a=Os([{agent_id:``,name:``,last_seen_at:e}],i);t=setTimeout(r,Math.min(Cr,a===null?1/0:a-i))};return r(),document.addEventListener(`visibilitychange`,r),()=>{t!==void 0&&clearTimeout(t),document.removeEventListener(`visibilitychange`,r)}},[e]);let r=Ds(e,t);return(0,N.jsx)(As,{"data-contact":r.kind,title:r.title,children:r.label})}var Ms=A.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.4;
  background: ${e=>e.$background};
  color: ${e=>e.$color};
`,Ns=A.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,Ps=A.button`
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 0 0 2px;
  opacity: 0.75;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`,Fs=({category:e,onRemove:t})=>(0,N.jsxs)(Ms,{$background:e.color_background,$color:e.color_text||`#000000`,children:[(0,N.jsx)(Ns,{children:e.name}),t&&(0,N.jsx)(Ps,{type:`button`,"aria-label":`Remove ${e.name}`,onClick:()=>t(e.id),children:`×`})]}),Is=A.div`
  position: relative;
  z-index: ${e=>e.$open?8:`auto`};
`,Ls=A.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 8;
  max-height: 180px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  visibility: ${e=>e.$open?`visible`:`hidden`};
  pointer-events: ${e=>e.$open?`auto`:`none`};

  .commander-result {
    padding: 6px 8px;
    display: flex;
    cursor: pointer;
  }

  .commander-result-item {
    flex: auto;
    min-width: 0;
  }
`,Rs=({autoFocus:e=!1,onBlur:t,onChange:n,placeholder:r,items:i,itemStringKey:a})=>{let o=e=>e?String(e[a]??``):``,[s,c]=j.useState(``),l=s.length===0?i:Xr.default.filter(i,s,{key:a}),{getInputProps:u,getItemProps:d,getLabelProps:f,getMenuProps:p,highlightedIndex:m,isOpen:h}=oe({items:l,inputValue:s,selectedItem:null,defaultHighlightedIndex:0,itemToString:o,onInputValueChange:({inputValue:e})=>c(e||``),onSelectedItemChange:({selectedItem:e})=>{e&&(n(e),c(``))}}),g=h&&l.length>0;return(0,N.jsxs)(Is,{$open:g,children:[(0,N.jsx)(`label`,{...f()}),(0,N.jsx)(`input`,{autoFocus:e,style:{width:`100%`},...u({placeholder:r,"aria-label":r,onBlur:t})}),(0,N.jsx)(Ls,{...p(),$open:g,children:g&&l.map((e,t)=>(0,N.jsxs)(`div`,{className:`commander-result`,...d({index:t,item:e,style:{backgroundColor:m===t?`#f5f5f5`:`white`}}),children:[(0,N.jsxs)(`div`,{className:`commander-result-item`,children:[e.label&&(0,N.jsx)(`span`,{className:`item-label`,style:{background:e.label.background,color:`white`,padding:`1px 3px`,borderRadius:`2px`,marginRight:`5px`},children:e.label.copy}),s.length===0?(0,N.jsx)(`span`,{children:String(e[a]??``)}):(0,N.jsx)(`span`,{dangerouslySetInnerHTML:{__html:Xr.default.wrap(String(e[a]??``),s)}})]}),e.shortcut&&(0,N.jsx)(`div`,{className:`item-shortcut`,children:(0,N.jsx)(`span`,{className:`item-shortcut`,style:{textAlign:`right`,color:`steelblue`},children:e.shortcut})})]},String(e[a]??t)))})]})},zs=({children:e,onChange:t,...n})=>{let[r,i]=j.useState(!1);return r?(0,N.jsx)(Rs,{...n,autoFocus:!0,onBlur:()=>i(!1),onChange:e=>{t(e),i(!1)}}):(0,N.jsx)(H,{onClick:()=>i(!0),children:e})};function Bs(e){return e.alreadyFocusedSameActivity||e.coarsePointer||e.narrowViewport||e.hoverNone===!0}function Vs(e=typeof window<`u`?window.matchMedia.bind(window):void 0){if(typeof e!=`function`)return!1;try{return e(`(pointer: coarse)`).matches}catch{return!1}}function Hs(e=typeof window<`u`?window.matchMedia.bind(window):void 0){if(typeof e!=`function`)return!1;try{return e(`(hover: none)`).matches}catch{return!1}}function Us(e=typeof window<`u`?window.matchMedia.bind(window):void 0,t=typeof window<`u`?window.innerWidth:void 0){if(typeof e==`function`)try{if(e(`(max-width: 640px)`).matches)return!0}catch{}return typeof t==`number`&&Number.isFinite(t)&&t<=640}var Ws={overlay:{display:`flex`,justifyContent:`center`,alignItems:`center`,backgroundColor:`transparent`},content:{bottom:`unset`,overflow:`visible`,padding:0,border:`none`,borderRadius:0,position:`static`,background:`none`,pointerEvents:`none`}},Gs={overlay:{display:`flex`,justifyContent:`center`,alignItems:`flex-end`,backgroundColor:`rgba(0, 0, 0, 0.35)`},content:{inset:`unset`,top:`unset`,left:0,right:0,bottom:0,overflow:`visible`,padding:0,border:`none`,borderRadius:0,position:`absolute`,background:`none`,pointerEvents:`none`,width:`100%`}},Ks=A.div`
  border-radius: ${e=>e.$sheet?`12px 12px 0 0`:`4px`};
  background: white;
  border: 1px solid rgb(204, 204, 204);
  padding: ${e=>e.$sheet?`12px 16px`:`10px`};
  padding-bottom: ${e=>e.$sheet?`max(16px, env(safe-area-inset-bottom, 0px))`:`10px`};
  pointer-events: all;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2);
  display: ${e=>e.$split?`flex`:`block`};
  flex-direction: column;
  /* Split chrome+body so a sticky-less header (e.g. Activity close) cannot
     scroll away on long mobile sheets. Unsplit modals keep one scroller. */
  overflow: ${e=>e.$split?`hidden`:`auto`};
  max-height: ${e=>e.$sheet?`min(88dvh, 100%)`:`min(80vh, 640px)`};
  max-width: ${e=>e.$sheet?`100%`:e.$wide?`min(90vw, 640px)`:`min(90vw, 420px)`};
  width: ${e=>e.$sheet?`100%`:`auto`};
  -webkit-overflow-scrolling: touch;
`,qs=A.div`
  flex: 0 0 auto;
`,Js=A.div`
  ${e=>e.$split?`
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  `:``}
`;function Ys(){let e=(0,j.useMemo)(()=>`(max-width: 640px)`,[]),[t,n]=(0,j.useState)(()=>{if(typeof window>`u`||typeof window.matchMedia!=`function`)return!1;try{return window.matchMedia(e).matches}catch{return!1}});return(0,j.useEffect)(()=>{if(typeof window>`u`||typeof window.matchMedia!=`function`)return;let t;try{t=window.matchMedia(e)}catch{return}let r=()=>n(t.matches);return r(),typeof t.addEventListener==`function`?(t.addEventListener(`change`,r),()=>t.removeEventListener(`change`,r)):(t.addListener(r),()=>t.removeListener(r))},[e]),t}var Xs=({isOpen:e,children:t,chrome:n,onRequestClose:r,contentLabel:i=`Dialog`,shouldFocusAfterRender:a=!0,wide:o=!1})=>{let s=Ys(),c=n!=null;return(0,N.jsx)(zr.default,{contentLabel:i,onRequestClose:r,isOpen:e,shouldFocusAfterRender:a,style:s?Gs:Ws,children:(0,N.jsxs)(Ks,{$sheet:s,$wide:o,$split:c,"data-app-modal-sheet":s?`true`:`false`,onWheel:e=>{e.stopPropagation()},children:[c?(0,N.jsx)(qs,{"data-app-modal-chrome":`true`,children:n}):null,(0,N.jsx)(Js,{$split:c,"data-app-modal-body":`true`,children:t})]})})},Zs=`flambe-categories`;function Qs(){typeof window>`u`||window.open(`/settings/categories`,Zs,`popup=yes,width=720,height=800`)}var $s=A.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  & > button {
    min-height: 36px;
  }

  @media (max-width: 640px) {
    & > button {
      min-height: 44px;
      flex: 1 1 auto;
    }
  }
`,ec=A(H)`
  display: none;

  @media (max-width: 640px) {
    display: inline-flex;
  }
`,tc=A.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 6px 12px;
  align-items: start;
  margin: 10px 0;
  font-size: 13px;
`,nc=A.div`
  color: #666;
  padding-top: 4px;
`,rc=A.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
`,ic=A.div`
  color: #666;
  font-size: 12px;

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.92em;
    background: #f3f1ee;
    border-radius: 3px;
    padding: 0 4px;
  }
`,ac=A.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
`,oc=A.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;

  button,
  a {
    appearance: none;
    border: 0;
    background: none;
    padding: 0;
    color: #2a6f97;
    cursor: pointer;
    text-decoration: underline;
    font: inherit;
  }
`,sc=A.div`
  position: relative;
  overflow: visible;

  input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 13px;
  }
`,cc=A.div`
  min-width: 260px;
  font-size: 12px;

  h2 {
    margin: 0 0 8px;
    font-size: 14px;
  }

  p {
    margin: 0 0 10px;
    color: #555;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 12px;
    max-height: 200px;
    overflow: auto;
  }

  li {
    margin-bottom: 6px;
  }

  label {
    display: flex;
    gap: 8px;
    align-items: baseline;
    cursor: pointer;
  }

  .child-meta {
    color: #888;
    font-size: 0.9em;
  }
`,lc=A.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`,uc=A.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;

  input { font: inherit; min-width: 0; }
  button { font: inherit; }
`;function dc({activity:e,updateActivity:t}){let[n,r]=j.useState(e.scheduled_end==null?``:Ri(e.scheduled_end));j.useEffect(()=>{r(e.scheduled_end==null?``:Ri(e.scheduled_end))},[e.id,e.scheduled_end]);let i=e.scheduled_start,a=zi(n),o=a!==null&&a>=i;return(0,N.jsxs)(tc,{children:[(0,N.jsx)(nc,{children:`Scheduled end`}),(0,N.jsxs)(rc,{children:[(0,N.jsxs)(uc,{children:[(0,N.jsx)(`input`,{type:`datetime-local`,step:`1`,"aria-label":`Scheduled end`,min:Ri(i),value:n,onChange:e=>r(e.target.value)}),(0,N.jsx)(H,{looksLikeButton:!0,disabled:!o||a===e.scheduled_end,onClick:()=>{o&&t(e.id,{scheduled_end_integer:a})},children:`Save end`}),e.scheduled_end!=null&&(0,N.jsx)(H,{looksLikeButton:!0,onClick:()=>t(e.id,{scheduled_end_integer:null}),children:`Clear end`})]}),n&&!o&&(0,N.jsx)(ic,{children:`End must be at or after the scheduled start.`})]})]})}var fc=b(e=>({activity_id:V(e).focusedBlockActivity_id,agents:P(e).agents??[],categories:P(e).categories,editName:e.activityDetailEditName,events:V(e).events,threads:V(e).threads}),e=>({beginActivity:t=>e(wn(t)),hideActivityDetailModal:()=>e(Nn()),showCategoryManager:()=>e(Pn()),updateActivity:(t,n)=>e(Dn(t,n))}))(e=>{let{activities:t,activity_id:n,agents:r,beginActivity:i,blocks:a,editName:o=!1,hideActivityDetailModal:s,updateActivity:c,categories:l,showCategoryManager:u,submitCommand:d,threads:f,events:p}=e,[m,h]=j.useState(null);if(n===null)return(0,N.jsx)(`div`,{children:`no activity`});let g=t[String(n)],_=g?{...g,id:n}:void 0;if(!_)return(0,N.jsx)(`div`,{children:`no activity`});if(_.thread_id===void 0)return(0,N.jsx)(`div`,{children:`activity has no thread`});let v=_.thread_id,y=f[String(v)],b=Object.values(f).filter(e=>String(e.id)!==String(v)).map(e=>({id:e.id,name:e.name})),x=Object.values(t).filter(e=>e.parent_id!==null&&e.parent_id!==void 0&&String(e.parent_id)===String(_.id)&&String(e.thread_id)===String(v)).sort((e,t)=>Number(e.id)-Number(t.id)),S=_.categories??[],C=e=>{S.some(t=>String(t)===String(e))||c(n,{category_ids:[...S,e]})},w=e=>{c(n,{category_ids:S.filter(t=>String(t)!==String(e))})},T=l.filter(e=>!S.some(t=>String(t)===String(e.id))),E=e=>{if(String(e.id)!==String(v)){if(x.length===0){c(_.id,{thread_id:e.id});return}h({thread:e,selectedChildIds:x.map(e=>e.id)})}},ee=e=>{h(t=>{if(!t)return t;let n=t.selectedChildIds.some(t=>String(t)===String(e));return{...t,selectedChildIds:n?t.selectedChildIds.filter(t=>String(t)!==String(e)):[...t.selectedChildIds,e]}})},D=()=>{m&&(c(_.id,{thread_id:m.thread.id,move_child_ids:m.selectedChildIds}),h(null))},O=ya(n,a),te=gs(_,r,t),ne=new Set(O.flatMap(({events:e})=>e).map(String)),re=_.events.filter(e=>!ne.has(String(e))).map(e=>p.find(({id:t})=>String(t)===String(e))).filter(e=>e!==void 0).map(e=>({endMessage:e.message,endTime:e.timestamp,ending:e.phase})),ie=No(p,_.id);return(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(Eo,{placeholderIsDefaultValue:!0,startAsInput:o,submit:e=>{c(_.id,{name:e})},children:_.name},`name-${_.id}-${o?`edit`:`view`}`),(0,N.jsxs)(tc,{children:[(0,N.jsx)(nc,{children:`Thread`}),(0,N.jsx)(rc,{children:b.length>0?(0,N.jsx)(sc,{children:(0,N.jsx)(zs,{itemStringKey:`name`,onChange:E,placeholder:`Move to thread…`,items:b,children:y?.name??v})}):(0,N.jsx)(`div`,{children:y?.name??v})})]}),ie&&(0,N.jsxs)(tc,{children:[(0,N.jsx)(nc,{children:`Reducer`}),(0,N.jsxs)(rc,{children:[(0,N.jsx)(`div`,{children:ie.agent}),(0,N.jsx)(ic,{children:(0,N.jsx)(`code`,{children:ie.model})})]})]}),(0,N.jsxs)(tc,{children:[(0,N.jsx)(nc,{children:`Agent`}),(0,N.jsxs)(rc,{children:[te.length>0?(0,N.jsx)(sc,{children:(0,N.jsx)(zs,{itemStringKey:`name`,onChange:e=>{let t=Object.prototype.hasOwnProperty.call(e,`id`)?e.id:null;c(_.id,{agent_id:t,agent_name:t?String(e.name??``):null})},placeholder:`Assign an agent…`,items:te,children:Zo(_)})}):(0,N.jsx)(`div`,{children:Zo(_)}),_.agent_id&&(0,N.jsx)(js,{lastSeenAt:r.find(e=>e.agent_id===_.agent_id)?.last_seen_at})]})]}),(0,N.jsxs)(tc,{children:[(0,N.jsx)(nc,{children:`Weight`}),(0,N.jsx)(rc,{children:(0,N.jsx)(Eo,{placeholder:`🏋`,submit:e=>{c(_.id,{weight:Number(e)})},children:_.weight||`🏋`})})]}),(0,N.jsxs)(tc,{children:[(0,N.jsx)(nc,{children:`Categories`}),(0,N.jsxs)(rc,{children:[(0,N.jsx)(ac,{children:S.map(e=>{let t=l.find(t=>String(t.id)===String(e));return t?(0,N.jsx)(`li`,{children:(0,N.jsx)(Fs,{category:t,onRemove:w})},String(t.id)):null})}),T.length>0&&(0,N.jsx)(sc,{children:(0,N.jsx)(Rs,{itemStringKey:`name`,onChange:e=>C(e.id),placeholder:`Assign a category…`,items:T.map(e=>({...e,label:{background:e.color_background,copy:` `}}))})}),(0,N.jsxs)(oc,{children:[(0,N.jsx)(`button`,{type:`button`,onClick:u,children:`Edit categories`}),(0,N.jsx)(`button`,{type:`button`,onClick:Qs,children:`Edit in new window`})]})]})]}),_.status===`unstarted`&&_.scheduled_start!=null&&(0,N.jsx)(dc,{activity:_,updateActivity:c}),(0,N.jsxs)(`div`,{children:[`Description:`,(0,N.jsx)(Eo,{placeholderIsDefaultValue:!0,submit:e=>{c(_.id,{description:e})},children:_.description||"Add notes in here (you can type in `whoa`"})]}),(0,N.jsx)(Ts,{activityBlocks:[...O,...re]}),(0,N.jsxs)($s,{children:[_.status===`unstarted`&&(0,N.jsxs)(N.Fragment,{children:[_.scheduled_start!=null&&(0,N.jsx)(H,{looksLikeButton:!0,onClick:()=>{c(_.id,{scheduled_start:null,scheduled_end:null})},children:`Unschedule`}),(0,N.jsx)(H,{looksLikeButton:!0,onClick:()=>{i(_.id),s()},children:`Begin`}),(0,N.jsx)(H,{looksLikeButton:!0,onClick:()=>{d({action:`ACTIVITY_DELETE`,copy:`delete`,activity_id:_.id,thread_id:v}),s()},children:`delete`})]}),_.status&&_.status!==`parent_suspended`&&_.status!==`unstarted`&&qo(_.status).filter(e=>e.action!==`ACTIVITY_DETAILS_SHOW`).map(e=>e.parameters&&e.parameters.length>0?(0,N.jsx)(Eo,{looksLikeButton:!0,canBeBlank:!0,submit:t=>{d({...e,message:t,activity_id:_.id,thread_id:v})},placeholder:e.parameters[0].placeholder,children:e.copy},e.copy):(0,N.jsx)(H,{looksLikeButton:!0,onClick:()=>d({...e,activity_id:_.id,thread_id:v}),children:e.copy},e.copy)),(0,N.jsx)(ec,{looksLikeButton:!0,"data-mobile-dismiss":`true`,onClick:s,children:`close`})]}),(0,N.jsx)(Xs,{isOpen:m!==null,onRequestClose:()=>h(null),children:m&&(0,N.jsxs)(cc,{children:[(0,N.jsx)(`h2`,{children:`Move children too?`}),(0,N.jsxs)(`p`,{children:[`Moving`,` `,(0,N.jsx)(`strong`,{children:_.name}),` `,`to`,` `,(0,N.jsx)(`strong`,{children:m.thread.name}),`. Choose which direct children come along (each brings its subtree). Unchecked children stay on this thread under the remaining ancestor.`]}),(0,N.jsx)(`ul`,{children:x.map(e=>{let t=m.selectedChildIds.some(t=>String(t)===String(e.id));return(0,N.jsx)(`li`,{children:(0,N.jsxs)(`label`,{children:[(0,N.jsx)(`input`,{type:`checkbox`,checked:t,onChange:()=>ee(e.id)}),(0,N.jsxs)(`span`,{children:[e.name||`(unnamed)`,(0,N.jsxs)(`span`,{className:`child-meta`,children:[` `,`#`,e.id]})]})]})},String(e.id))})}),(0,N.jsxs)(lc,{children:[(0,N.jsx)(H,{looksLikeButton:!0,onClick:()=>h(null),children:`Cancel`}),(0,N.jsx)(H,{looksLikeButton:!0,onClick:D,children:`Move`})]})]})})]})}),pc=A.button`
  /* ⚠️ lacks comprehensive browser suppport */
  /* // https://developer.mozilla.org/en-US/docs/Web/CSS/all */
  all: unset;
  user-select: none;
  cursor: pointer;
`,mc=A.div`
  background: black;
  width: 1.5em;
  height: 1.5em;
  background: none;
  position: relative;

  &:hover {
    background: lightgrey;
  }

  &:active {
    background: darkgrey;
  }

  &::before,
  &::after {
    content: '';
    background: grey;
    position: absolute;
    top: 0.7em;
    left: 0.25em;

    width: 1em;
    height: 0.2em;
  }

  &:active::before, &:active::after {
    background: white;
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`,hc=A(pc)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  margin: -12px -12px -12px 0;
`,gc=({onClick:e})=>(0,N.jsx)(hc,{title:`close`,onClick:e,children:(0,N.jsx)(mc,{})}),_c=A.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
`,vc=A.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`,yc=b(e=>({activityDetailEditName:e.activityDetailEditName,activityDetailModalVisible:e.activityDetailModalVisible}),e=>({hideActivityDetailModal:()=>e(Nn())}))(e=>{let{activityDetailEditName:t,activityDetailModalVisible:n,hideActivityDetailModal:r,...i}=e;return(0,N.jsx)(Xs,{contentLabel:`Activity details`,isOpen:n,onRequestClose:r,shouldFocusAfterRender:!t,chrome:(0,N.jsxs)(_c,{children:[(0,N.jsx)(vc,{children:`Activity`}),(0,N.jsx)(gc,{onClick:r})]}),children:(0,N.jsx)(`div`,{"data-activity-detail":`true`,children:(0,N.jsx)(fc,{...i})})})});function bc(){try{let e=window.localStorage.getItem(`state`);return e===null?void 0:JSON.parse(e)}catch{return}}function xc(e){try{let t=JSON.stringify(e);window.localStorage.setItem(`state`,t)}catch(e){console.error(e)}}var Sc=(e,t)=>{if(e.length<=t)return String(e);let n=t>>1,r=t-n-1;return(e.codePointAt(e.length-r-1)??0)>=65536&&(--r,++n),n>0&&(e.codePointAt(n-1)??0)>=65536&&--n,`${e.substr(0,n)}\u2026${e.substr(e.length-r,r)}`},Cc=(e,t)=>{if(e.length<=t)return String(e);let n=Math.max(0,t-1);return n>0&&(e.codePointAt(n-1)??0)>=65536&&--n,`${e.substr(0,n).trimEnd()}\u2026`},wc=(e,t,n,r)=>{if(n<=10)return``;t.length>200&&(t=r(t,200));let i=e.measureText(t).width;if(i<=n)return t;let a=0,o=t.length,s=0,c=i;for(;a<o&&s!==c&&s!==n;){let i=Math.ceil(a+(o-a)*(n-s)/(c-s)),l=e.measureText(r(t,i)).width;l<=n?(a=i,s=l):(o=i-1,c=l)}return t=r(t,a),t===`…`?``:t},Tc=(e,t,n)=>wc(e,t,n,(e,t)=>Sc(e,t)),Ec=(e,t,n)=>wc(e,t,n,(e,t)=>Cc(e,t));he();var Dc=e(ve()).default.humanizer({language:`shortEn`,round:!0,spacer:``,delimiter:` `,largest:2,languages:{shortEn:{y(){return`y`},mo(){return`mo`},w(){return`w`},d(){return`d`},h(){return`h`},m(){return`m`},s(){return`s`},ms(){return`ms`}}}}),Oc={withMs:`HH:mm:ss.SSS`,withSeconds:`HH:mm:ss`,withMinutes:`HH:mm`},kc={withMs:`h:mm:ss.SSS A`,withSeconds:`h:mm:ss A`,withMinutes:`h:mm A`};function Ac(e,{absolute:t=!1,twelveHour:n=!1,visibleSpanMs:r,previousTimestamp:i}){if(!t)return Dc(Date.now()-e);let a=(0,z.default)(e),o=Number.isFinite(r)?Math.max(0,r):0,s=n?kc:Oc,c=i==null||!a.isSame((0,z.default)(i),`day`),l=i==null||!a.isSame((0,z.default)(i),`month`),u=i==null||!a.isSame((0,z.default)(i),`year`);return o<=2e3?a.format(s.withMs):o<=12e4?a.format(s.withSeconds):o<=432e5||o<=1728e5?c?a.format(`MMM D ${s.withMinutes}`):a.format(s.withMinutes):o<=145152e5?c?a.format(`MMM D`):a.format(`D`):o<=94608e6?l?a.format(`MMM YYYY`):a.format(`MMM`):u?a.format(`YYYY`):``}var jc=(e,t,n)=>(e<t?e=t:e>n&&(e=n),e),Mc=`#C45C26`,Nc=/^(\d{4})-(\d{2})-(\d{2})/;function Pc(e){let t=Nc.exec(e.trim());if(!t)return NaN;let n=Number(t[1]),r=Number(t[2]),i=Number(t[3]);return new Date(n,r-1,i).getTime()}function Fc(e){let t=new Date(e);return new Date(t.getFullYear(),t.getMonth(),t.getDate()+1).getTime()}function Ic(e){if(e.observed_on){let t=Pc(e.observed_on);if(Number.isFinite(t))return t}return e.timestamp}function Lc(e){if(e===`carbon`)return Mc;let t=0;for(let n=0;n<e.length;n+=1)t=t*31+e.charCodeAt(n)|0;return`hsl(${Math.abs(t)%360} 55% 38%)`}function Rc(e){return!e||typeof e!=`object`||Array.isArray(e)?[]:Object.entries(e).flatMap(([e,t])=>typeof t==`number`&&Number.isFinite(t)?[[e,t]]:[])}function zc(e){let t=e.payload??{},n=Rc(t.series),r=e.kind===`carbon`?Rc(t.ba_g_per_kwh):[],i=n.length>0?n:r;return i.length>0?i.map(([t,n])=>({key:`${e.kind}::${t}`,label:t,value:n})):Number.isFinite(e.value)?[{key:e.kind,label:e.kind,value:e.value}]:[]}function Bc(e=[]){let t=new Map;return e.forEach(e=>{let n=Ic(e);if(!Number.isFinite(n))return;let r=!!e.observed_on;zc(e).forEach(({key:i,label:a,value:o})=>{let s={key:i,kind:e.kind,label:a,time:n,value:o,unit:e.unit,dated:r},c=t.get(i)??[];c.push(s),t.set(i,c)})}),[...t.entries()].map(([e,t])=>{let n=[...t].sort((e,t)=>e.time-t.time),r=n.length>0&&n.every(e=>e.dated),i=[...n].reverse().find(e=>e.unit)?.unit??null,a=n[0]?.kind??e;return{key:e,kind:a,label:n[0]?.label??a,dated:r,unit:i,color:Lc(a),points:n}})}function Vc(e){if(e.length===0)return{min:0,max:1};let t=Math.min(...e),n=Math.max(...e);if(t===n){let e=t===0?1:Math.abs(t)*.1;return{min:t-e,max:n+e}}return{min:t,max:n}}function Hc(e){return Number(e.toPrecision(12))}function Uc(e,t){if(!(e>0)||!Number.isFinite(e))return 1;let n=Math.floor(Math.log10(e)),r=e/10**n,i;return i=t?r<1.5?1:r<3?2:r<7?5:10:r<=1?1:r<=2?2:r<=5?5:10,i*10**n}function Wc(e,t,n=5){if(!Number.isFinite(e)||!Number.isFinite(t)||t<e)return{min:0,max:1,ticks:[0,1]};if(e===t){let t=Vc([e]);return Wc(t.min,t.max,n)}let r=Uc(Uc(t-e,!1)/Math.max(1,n-1),!0),i=Hc(Math.floor(e/r)*r),a=Hc(Math.ceil(t/r)*r),o=[],s=a+r*.5;for(let e=i;e<=s;e=Hc(e+r))o.push(Hc(e));return{min:i,max:a,ticks:o}}function Gc(e,t=5){if(e.length===0)return Wc(0,1,t);let{min:n,max:r}=Vc(e);return e.every(e=>e>=0)?n=0:e.every(e=>e<=0)&&(r=0),Wc(n,r,t)}function Kc(e,t){return e.length===0?null:t.length===0?e[0]:e.find(e=>e.key===t[0].key)??e[0]}function qc(e,t,n){let{points:r}=e;if(r.length===0||n<t)return[];let i=r.findIndex(e=>e.time>=t),a=i===-1?r.length-1:i-1,o=[];if(a>=0){let i=r[a],s=r[a+1];e.dated?(s?.time??Fc(i.time))>t&&o.push(i):s&&s.time>=t&&i.time<=n&&o.push(i)}return r.forEach(e=>{e.time>=t&&e.time<=n&&o.push(e)}),o}function Jc(e,t){let{points:n}=e;if(n.length===0)return null;if(e.dated){let e=null;for(let r of n)if(r.time<=t)e=r;else break;return e&&t<(n.find(t=>t.time>e.time)?.time??Fc(e.time))?e.value:null}if(t<n[0].time||t>n[n.length-1].time)return null;for(let e=0;e<n.length-1;e+=1){let r=n[e],i=n[e+1];if(t===r.time)return r.value;if(t>r.time&&t<=i.time){let e=i.time-r.time;if(e===0)return i.value;let n=(t-r.time)/e;return r.value+(i.value-r.value)*n}}return n[n.length-1].value}function Yc(e,t){return e.flatMap(e=>{let n=Jc(e,t);return n===null?[]:[{key:e.key,kind:e.kind,label:e.label,value:n,unit:e.unit,color:e.color}]})}function Xc(e,t,n,r,i){return n===t?i+r/2:i+r-(e-t)*r/(n-t)}function Zc(e){if(Number.isInteger(e))return String(e);let t=Math.round(e*10)/10;return Number.isInteger(t)?String(t):t.toFixed(1)}var Qc=`#48A2ED`,$c=`#90BD71`,el=6e4,tl=A.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min-content, 120px));
  font-size: 11px;
  visibility: ${({$hidden:e})=>e?`hidden`:`visible`};
`,nl=A.div`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
  max-width: calc(100% - 12px);
  font: 11px sans-serif;

  button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 6px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.88);
    color: #333;
    cursor: pointer;
    font: inherit;
  }

  button:hover, button:focus-visible {
    background: #fff;
  }
`,rl=A.div`
  position: absolute;
  top: calc(100% + 3px);
  right: 0;
  box-sizing: border-box;
  width: min(260px, calc(100vw - 24px));
  max-height: 220px;
  overflow: auto;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);

  header { margin-bottom: 3px; color: #555; font-weight: 600; }
  div { display: flex; align-items: center; gap: 6px; min-height: 16px; }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`,il=A.i`
  flex: 0 0 12px;
  height: 0;
  border-top: 2px solid ${({$color:e})=>e};
`,al=class e extends j.Component{static textPadding={x:5,y:13.5};static chartPadding={x:0,y:15};blockHeight=20;canvas=null;ctx=null;leftBoundaryTime=Date.now();rightBoundaryTime=Date.now()+1e3;width=300;observationSeries=[];state={openLegendKind:null,mouseIsOver:!1,hoverWindowCount:0,hoverTabCount:0,hoverObservations:[],cursor:{x:0,y:0},canvasWidth:300,canvasHeight:150};chartHeight=()=>Math.max(0,this.state.canvasHeight-e.chartPadding.y*2);componentDidMount(){this.ctx=this.canvas?.getContext(`2d`)??null,this.setCanvasSize({width:300,height:150})}componentDidUpdate(){this.draw(this.leftBoundaryTime,this.rightBoundaryTime,this.width)}setCanvasSize=({width:e,height:t})=>{let n=Math.max(1,e),r=Math.max(1,t),i=window.devicePixelRatio||1;this.canvas&&(this.canvas.width=Math.round(n*i),this.canvas.height=Math.round(r*i)),(n!==this.state.canvasWidth||r!==this.state.canvasHeight)&&this.setState({canvasWidth:n,canvasHeight:r})};onMouseEnter=()=>this.setState({mouseIsOver:!0});onMouseLeave=()=>this.setState({mouseIsOver:!1,hoverObservations:[]});onMouseMove=e=>{let{offsetX:t,offsetY:n}=e.nativeEvent,r=this.pixelsToTime(t),i=this.props.tabs.find(({timestamp:e})=>r<e),a=Bc(this.props.observations);this.setState({cursor:{x:t,y:n},hoverWindowCount:i?.window_count??0,hoverTabCount:i?.count??0,hoverObservations:Yc(a,r)})};render(){let e=window.devicePixelRatio||1,t=Bc(this.props.observations),n=[...new Set(t.map(e=>e.kind))].map(e=>({kind:e,series:t.filter(t=>t.kind===e)})),r=n.find(e=>e.kind===this.state.openLegendKind);return(0,N.jsxs)(`div`,{style:{width:`100%`,height:`100%`,position:`relative`},children:[(0,N.jsx)(mi,{bounds:!0,onResize:({bounds:e})=>{(e.width!==this.state.canvasWidth||e.height!==this.state.canvasHeight)&&this.setCanvasSize(e)},children:({measureRef:t})=>(0,N.jsx)(`canvas`,{ref:e=>{t(e),this.canvas=e,this.ctx=e?.getContext(`2d`)??null},style:{width:`100%`,height:`100%`},height:Math.round(this.state.canvasHeight*e),width:Math.round(this.state.canvasWidth*e),onMouseMove:this.onMouseMove,onMouseEnter:this.onMouseEnter,onMouseLeave:this.onMouseLeave})}),t.length>0&&(0,N.jsxs)(nl,{children:[n.map(({kind:e,series:t})=>(0,N.jsxs)(`button`,{type:`button`,"aria-expanded":this.state.openLegendKind===e,"aria-label":`${e}: ${t.length} plotted series; ${this.state.openLegendKind===e?`hide`:`show`} legend`,onClick:()=>this.setState(({openLegendKind:t})=>({openLegendKind:t===e?null:e})),children:[(0,N.jsx)(il,{$color:t[0].color}),e,` `,t.length>1?t.length:``,` `,this.state.openLegendKind===e?`▴`:`▾`]},e)),r&&(0,N.jsxs)(rl,{children:[(0,N.jsxs)(`header`,{children:[r.kind,r.series[0].unit?` (${r.series[0].unit})`:``]}),r.series.map(e=>(0,N.jsxs)(`div`,{title:e.label,children:[(0,N.jsx)(il,{$color:e.color}),(0,N.jsx)(`span`,{children:e.label})]},e.key))]})]}),(0,N.jsxs)(tl,{$hidden:!this.state.mouseIsOver,children:[(0,N.jsxs)(`div`,{style:{color:Qc},children:[`windows: `,this.state.hoverWindowCount]}),(0,N.jsxs)(`div`,{style:{color:$c},children:[`tabs: `,this.state.hoverTabCount]}),this.state.hoverObservations.map(e=>(0,N.jsxs)(`div`,{style:{color:e.color},children:[e.label===e.kind?e.kind:`${e.kind} · ${e.label}`,`: `,` `,Zc(e.value),e.unit?` ${e.unit}`:``]},e.key))]})]})}draw(e,t,n){this.leftBoundaryTime=e,this.rightBoundaryTime=t,this.width=n,this.observationSeries=Bc(this.props.observations);let{ctx:r}=this;if(!r||!this.canvas)return;let i=window.devicePixelRatio||1;r.save(),r.setTransform(i,0,0,i,0,0),r.font=`11px sans-serif`,r.fillStyle=`#ffffff`,r.globalAlpha=1,r.fillRect(0,0,n,this.state.canvasHeight),bi(r,e,t,n,this.state.canvasHeight),this.drawMantras(),this.drawTabs(),this.drawObservations(),this.drawObservationAxis(),this.drawSearchTerms(),r.restore()}drawMantras(){let{ctx:e}=this;e&&(e.globalAlpha=1,this.props.mantras.forEach(({name:t,timestamp:n},r)=>{let{blockX:i,blockY:a,blockWidth:o}=this.getBlockTransform(n,this.props.mantras[r+1]?.timestamp?this.props.mantras[r+1].timestamp-1:Date.now(),0,this.blockHeight,0);i>this.width||i+o<=0||(e.fillStyle=r%2?`#fafafa`:`#fff`,e.fillRect(i,0,o,100),e.fillStyle=`#000`,e.fillText(Tc(e,t,o),i,a+11))}))}drawTabs(){let{ctx:e}=this,t=this.props.tabs;if(!e||t.length===0)return;let n=t.map(({timestamp:e,...t})=>({...t,timestamp:e,x:this.timeToPixels(e)})),r=Math.max(0,...n.map(({count:e})=>e)),i=Math.max(0,...n.map(({window_count:e})=>e)),a=[...this.props.tabs].reverse().find(({timestamp:e})=>e<this.leftBoundaryTime),o=n[n.length-1];e.lineWidth=1,e.strokeStyle=$c,e.fillStyle=$c,e.beginPath(),e.moveTo(0,this.countToY(a?.count??0,r)),n.forEach(({count:t,x:i},a)=>{e.lineTo(n[a-1]?.x??0,this.countToY(t,r)),e.lineTo(i,this.countToY(t,r))}),e.lineTo(this.timeToPixels(Date.now()),this.countToY(o.count,r)),e.stroke(),this.state.mouseIsOver&&(e.beginPath(),e.arc(this.state.cursor.x,this.countToY(this.state.hoverTabCount,r),2,0,2*Math.PI),e.fill());let s=[...this.props.tabs].reverse().find(({timestamp:e})=>e<this.leftBoundaryTime);e.strokeStyle=Qc,e.fillStyle=Qc,e.beginPath(),e.moveTo(0,this.countToY(s?.window_count??0,i)),n.forEach(({window_count:t,x:r},a)=>{e.lineTo(n[a-1]?.x??0,this.countToY(t,i)),e.lineTo(r,this.countToY(t,i))}),e.lineTo(this.timeToPixels(Date.now()),this.countToY(o.window_count,i)),e.stroke(),this.state.mouseIsOver&&(e.beginPath(),e.arc(this.state.cursor.x,this.countToY(this.state.hoverWindowCount,i),2,0,2*Math.PI),e.fill())}seriesScale(e){return{points:qc(e,this.leftBoundaryTime,this.rightBoundaryTime),scale:Gc(this.observationSeries.filter(t=>t.kind===e.kind&&t.unit===e.unit).flatMap(e=>qc(e,this.leftBoundaryTime,this.rightBoundaryTime).map(e=>e.value)))}}axisSeries(){let{hoverObservations:t,mouseIsOver:n,cursor:r}=this.state;if(!n||t.length<=1)return Kc(this.observationSeries,n?t:[]);let i=this.chartHeight(),a=e.chartPadding.y,o=null,s=1/0;return t.forEach(e=>{let t=this.observationSeries.find(t=>t.key===e.key);if(!t)return;let{scale:n}=this.seriesScale(t),c=Xc(e.value,n.min,n.max,i,a),l=Math.abs(c-r.y);l<s&&(s=l,o=t)}),o??this.observationSeries[0]??null}drawObservations(){let{ctx:t}=this;if(!t)return;let n=this.chartHeight(),r=e.chartPadding.y,i=this.pixelsToTime(this.state.cursor.x);this.observationSeries.forEach(e=>{let{points:a,scale:o}=this.seriesScale(e);if(a.length===0)return;let s=this.observationSeries.filter(t=>t.kind===e.kind&&t.unit===e.unit).length;t.globalAlpha=s>1?.24:1,t.lineWidth=s>1?1.5:2,t.strokeStyle=e.color,t.fillStyle=e.color,t.beginPath();let c=0;if(a.forEach((i,a)=>{let s=Math.max(0,Math.min(this.width,this.timeToPixels(i.time))),l=Xc(i.value,o.min,o.max,n,r);a===0?t.moveTo(i.time<this.leftBoundaryTime?0:s,l):(e.dated&&t.lineTo(s,c),t.lineTo(s,l)),c=l}),e.dated){let n=a[a.length-1],r=e.points.find(e=>e.time>n.time),i=Math.min(r?.time??Fc(n.time),this.rightBoundaryTime);t.lineTo(Math.max(0,Math.min(this.width,this.timeToPixels(i))),c)}if(t.stroke(),t.globalAlpha=1,this.state.mouseIsOver){let a=Jc(e,i);a!==null&&(t.beginPath(),t.arc(this.state.cursor.x,Xc(a,o.min,o.max,n,r),2,0,2*Math.PI),t.fill())}})}drawObservationAxis(){let{ctx:t}=this,n=this.axisSeries();if(!t||!n)return;let{points:r,scale:i}=this.seriesScale(n);if(r.length===0)return;let a=this.chartHeight(),o=e.chartPadding.y;t.save(),t.font=`11px sans-serif`,t.textBaseline=`middle`,t.strokeStyle=n.color,t.lineWidth=1;let s=(e,r,i)=>{let a=t.measureText(e).width;t.fillStyle=`rgba(255,255,255,0.82)`,t.fillRect(r-2,i-7,a+4,14),t.fillStyle=n.color,t.fillText(e,r,i)};i.ticks.forEach(e=>{let n=Xc(e,i.min,i.max,a,o);t.globalAlpha=.18,t.beginPath(),t.moveTo(0,n),t.lineTo(this.width,n),t.stroke(),t.globalAlpha=1,t.beginPath(),t.moveTo(4,n),t.lineTo(9,n),t.stroke(),s(Zc(e),12,n)}),t.restore()}pixelsToTime(e){return hi(e,this.leftBoundaryTime,this.rightBoundaryTime,this.width)}timeToPixels(e){return gi(e,this.leftBoundaryTime,this.rightBoundaryTime,this.width)}getBlockTransform(e,t,n,r,i){return yi(e,t,n,r,i,this.leftBoundaryTime,this.rightBoundaryTime,this.width)}countToY(t,n){let r=this.chartHeight();return n<=0?e.chartPadding.y+r:e.chartPadding.y+r-t*r/n}drawSearchTerms(){let{ctx:e}=this;e&&this.props.searchTerms.forEach(({timestamp:t,term:n})=>{let{blockX:r,blockY:i,blockWidth:a}=this.getBlockTransform(t,t+10*el,0,this.blockHeight,0);if(r+a<=0||r>this.width)return;let o=Tc(e,n,a);e.globalAlpha=.5,e.fillStyle=`#000`,e.fillText(o||`🔎`,r,i+this.blockHeight+25)})}};function ol(e,t,n,r){let i=ls(e,n),a=ls(t,n),o=1-(1-Math.max(0,Math.min(1,r)))**3,s=(e,t)=>e+(t-e)*o;return a.map(e=>{let t=i.find(t=>t.actorKey===e.actorKey&&t.threadId===e.threadId&&t.parentLaneRootId===e.parentLaneRootId&&t.depth===e.depth);if(!t)return e;let n=e.washRects.map((n,r)=>{let i=e.washRects.length===1?{rowStart:t.rowStart,rowEnd:t.rowEnd}:t.washRects[Math.min(r,t.washRects.length-1)]??n;return{...n,rowStart:s(i.rowStart,n.rowStart),rowEnd:s(i.rowEnd,n.rowEnd)}});return{...e,rowStart:s(t.rowStart,e.rowStart),rowEnd:s(t.rowEnd,e.rowEnd),washRects:n,washRowRanges:n.map(({rowStart:e,rowEnd:t})=>({rowStart:e,rowEnd:t}))}})}function sl(e,t,n,r,i=n){let a=new Map(e.flames.map(e=>[String(e.rootActivityId),e])),o=t=>{let n=e.rootIdByActivity[String(t.activity_id)],i=new Set;for(;n!=null&&!i.has(String(n));){i.add(String(n));let t=a.get(String(n))?.parentActivityId,r=t==null?null:e.rootIdByActivity[String(t)];if(r==null)break;n=r}return`${r[String(t.activity_id)]?.thread_id}|${n==null?`human`:a.get(String(n))?.actorKey}`},s=new Set(n.map(G)),c=new Map;for(let e of i){if(!s.has(G(e))&&t.rowByBlock[G(e)]===void 0)continue;let n=o(e);c.set(n,[...c.get(n)??[],e])}let l={},u={},d={...t.maxRowsByThread},f=[],p=e=>Math.min(...e.map(e=>t.rowByBlock[G(e)]??1/0)),m=[...c.values()].sort((e,t)=>Number(o(t[0]).endsWith(`|human`))-Number(o(e[0]).endsWith(`|human`))||p(e)-p(t)||Math.min(...e.map(e=>e.startTime))-Math.min(...t.map(e=>e.startTime)));for(let n of m){let i=String(r[String(n[0].activity_id)]?.thread_id),a=n.filter(e=>t.rowByBlock[G(e)]!==void 0),s=a.length?p(a):void 0,c=Math.min(...n.map(t=>e.rowByBlock[G(t)]??1/0)),m=new Map(a.map(e=>[G(e),t.rowByBlock[G(e)]-s])),h=(e,t)=>e.startTime<(t.endTime??1/0)&&t.startTime<(e.endTime??1/0);for(let t of n.slice().sort((t,n)=>(e.rowByBlock[G(t)]??0)-(e.rowByBlock[G(n)]??0))){let i=G(t);if(m.has(i))continue;let a=Math.max(0,(e.rowByBlock[i]??c)-c),o=r[String(t.activity_id)]?.parent_id,s=n.find(e=>e.activity_id===o&&e.startTime<=t.startTime&&(e.endTime??1/0)>=t.startTime);s&&m.has(G(s))&&(a=Math.max(a,m.get(G(s))+1));let l=n.filter(e=>r[String(e.activity_id)]?.parent_id===t.activity_id).map(e=>m.get(G(e))).filter(e=>e!==void 0),u=Math.min(...l);if(u<=a)for(let[e,t]of m)t>=u&&m.set(e,t+a-u+1);for(;n.some(e=>m.get(G(e))===a&&(r[String(e.activity_id)]?.agent_id!==r[String(t.activity_id)]?.agent_id||h(e,t)));)a+=1;m.set(i,a)}let g=Math.max(...m.values())+1,_=Math.min(...n.map(e=>e.startTime)),v=Math.max(...n.map(e=>e.endTime??1/0)),y=s??(o(n[0]).endsWith(`|human`)?0:d[i]??0);for(;;){let e=f.find(e=>e.thread===i&&_<e.end&&e.start<v&&y<e.base+e.height&&e.base<y+g);if(!e)break;y=e.base+e.height}f.push({thread:i,base:y,height:g,start:_,end:v}),d[i]=Math.max(d[i]??0,y+g);for(let e of n)l[G(e)]=y+m.get(G(e)),u[String(e.activity_id)]=l[G(e)]}let h=e.lanes.map(t=>{let n=i.filter(n=>String(e.rootIdByActivity[String(n.activity_id)])===String(t.rootActivityId)).map(e=>l[G(e)]).filter(e=>e!==void 0);return n.length?{...t,rowStart:Math.min(...n),rowEnd:Math.max(...n)}:t});return{...e,rowByBlock:l,rowByActivity:u,maxRowsByThread:d,lanes:h}}function cl(e,t,n){if(n>=1)return t;let r=1-(1-Math.max(0,Math.min(1,n)))**3,i=(e,t)=>(e??t)+(t-(e??t))*r,a=(e,t)=>Object.fromEntries(Object.entries(t).map(([t,n])=>[t,i(e[t],n)]));return{...t,rowByBlock:a(e.rowByBlock,t.rowByBlock),rowByActivity:a(e.rowByActivity,t.rowByActivity),maxRowsByThread:a(e.maxRowsByThread,{...Object.fromEntries(Object.keys(e.maxRowsByThread).map(e=>[e,0])),...t.maxRowsByThread}),lanes:t.lanes.map(t=>{let n=e.lanes.find(e=>e.rootActivityId===t.rootActivityId);return{...t,rowStart:i(n?.rowStart,t.rowStart),rowEnd:i(n?.rowEnd,t.rowEnd)}})}}var ll=`#000000`,ul=`#ffffff`;function dl(e,t){if(t&&k.isReadable(t,e,{level:`AA`,size:`small`}))return t;let n=k.mostReadable(e,[ll,ul]);return n?n.toHexString():ll}var fl=()=>{if(typeof window>`u`)return!1;let e=typeof window.matchMedia==`function`?window.matchMedia.bind(window):void 0;return!Vs(e)&&!Hs(e)&&!Us(e,window.innerWidth)};function pl(e,t){return[...new Set(t.filter(t=>t.width>0&&t.height>0&&t.x<e.x+e.width&&t.x+t.width>e.x&&t.y<e.y+e.height&&t.y+t.height>e.y).map(e=>String(e.activityId)))]}var ml=A.div`
  height: 100%;
  position: absolute;
  width: 100%;

  canvas:last-of-type {
    position: absolute;
    top: 0;
    left: 0;
  }
`;function hl(e,t){return t==null||!e[Number(t)]?null:e[Number(t)].activity_id}var gl=620,_l=b(e=>({agents:e.user.agents??[],arrivalBlocks:e.timeline.blocks,arrivalTraceId:e.timeline.processedTraceId,selectedActivityIds:e.activitySelection,absoluteTimeLabels:e.settings.absoluteTimeLabels,twelveHourClock:e.settings.twelveHourClock,activityMute:e.settings.activityMute,activityMuteOpacity:e.settings.activityMuteOpacity,uniformBlockHeight:e.settings.uniformBlockHeight,darkerAsWeGoDown:e.settings.darkerAsWeGoDown,rightAlignTimelineText:e.settings.rightAlignTimelineText,reactiveThreadHeight:e.settings.reactiveThreadHeight,showActivityIds:e.settings.showActivityIds,showAttentionFlows:e.settings.attentionFlows,showSuspendResumeFlows:e.settings.suspendResumeFlows,showSuspendResumeFlowsOnlyForFocusedActivity:e.settings.suspendResumeFlowsOnlyForFocusedActivity}),{showActivityDetails:Mn,selectActivities:Lo},null,{forwardRef:!0})(class e extends j.Component{ctx;canvas;tooltip=null;minTextWidth=0;selectedForDrawing=new Set;marquee=null;selectionRectangle=()=>{let e=this.marquee;return e?{x:Math.min(e.startX,e.x),y:Math.min(e.startY,e.y),width:Math.abs(e.x-e.startX),height:Math.abs(e.y-e.startY)}:null};onSelectionKeyDown=e=>{e.key!==`Escape`||!fl()||e.target instanceof HTMLElement&&e.target.closest(`input, textarea, [contenteditable="true"], [role="dialog"]`)||(this.cancelMarquee(),this.props.selectActivities([]))};cancelMarquee=()=>{this.marquee=null,window.removeEventListener(`mousemove`,this.onMarqueeMove),window.removeEventListener(`mouseup`,this.onMarqueeUp),window.removeEventListener(`blur`,this.cancelMarquee),this.redrawMeasurement()};onMarqueeMove=e=>{let t=this.marquee;if(!t)return;let n=this.canvas.getBoundingClientRect();t.x=Math.max(0,Math.min(this.width,e.clientX-n.left)),t.y=Math.max(0,Math.min(this.state.canvasHeight,e.clientY-n.top)),t.moved||=Math.hypot(t.x-t.startX,t.y-t.startY)>4,this.redrawMeasurement()};onMarqueeUp=()=>{let e=this.selectionRectangle();if(this.marquee?.moved&&e){let t=this.paintableBlocks.flatMap(e=>{let t=this.renderActivities[String(e.activity_id)];if(!t||this.props.threads[String(t.thread_id)]?.collapsed)return[];let n=this.getAnimatedBlockTransform(e,t);return[{activityId:e.activity_id,x:n.blockX,y:n.blockY,width:e.scheduledPoint?Math.max(n.blockWidth,8):n.blockWidth,height:n.blockHeight}]});this.props.focusBlock({index:null,activity_id:null,thread_id:null}),this.props.selectActivities(pl(e,t)),this.suppressNextClick=!0,window.setTimeout(()=>{this.suppressNextClick=!1},0)}this.cancelMarquee()};static textPadding={x:5,y:13.5};static foldedThreadHeight=100;static threadHeaderHeight=20;static actorLaneGutter=18;static actorLaneDepthInset=6;static actorLaneNestedPad=2;static actorLaneVerticalMargin=2;static actorLaneWashPad=1;state={canvasHeight:150};blockHeight=20;cursor={x:0,y:0};draggingThread=null;dropTargetThread=null;hoverThreadEllipsis=null;mousedown=!1;mousedownX=null;measuring=!1;measurement={left:null,right:null};offsets={};otherThreadCaptures=[];resizing=!1;resizingBlock=null;movingScheduledBlock=null;movingScheduledStartX=0;movingScheduledTargetThread=null;movingScheduledDidMove=!1;suppressNextClick=!1;redrawFrame=null;measurementFrame=null;measurementCanvas=null;pendingActivityEntrance=null;activityEntrances=new Map;seenArrivalActivityIds=new Set;lastArrivalBlocks=null;lastArrivalTraceId;optimisticArrival=null;lastBlockTransforms=new Map;lastBlockViewport=``;reflowTransforms=new Map;reflowStartedAt=null;requestedTopOffset=0;appliedTopOffset=0;maxTopOffset=0;contentHeight=0;width=300;leftBoundaryTime=Date.now();rightBoundaryTime=Date.now()+1e3;dividersData={offsets:[]};threadLevels={};threadsSortedByRank=[];maxThreadLevels=0;threadStatuses={};threadCapture=null;hoverActivity_id=null;focusActivity_id=null;actorLaneLayout=null;navigationSettleTimer=null;navigationHeldLayout=null;navigationTransition=null;actorChromeBands=[];actorContactHits=[];contactExpiryTimer=null;paintableBlockEntries=[];paintableBlocks=[];paintableBlockSet=new Set;renderBlocks=this.props.blocks;renderActivities=this.props.activities;actorLaneLayoutInput=null;constructor(e){super(e),this.threadStatuses={},Object.values(e.threads).forEach(({id:e})=>{this.threadStatuses[e]={status:`ok`,suspendedActivity:{startTime:null,endTime:null}}})}componentDidMount(){window.addEventListener(`keydown`,this.onSelectionKeyDown),document.addEventListener(`visibilitychange`,this.onContactVisibilityChange),this.scheduleContactExpiry();let e=this.canvas.getContext(`2d`);e&&(this.ctx=e,this.setCanvasSize({width:300,height:150}))}componentWillUnmount(){this.activityEntrances.clear(),this.pendingActivityEntrance=null,this.navigationSettleTimer!=null&&clearTimeout(this.navigationSettleTimer),this.contactExpiryTimer!=null&&clearTimeout(this.contactExpiryTimer),typeof document<`u`&&document.removeEventListener(`visibilitychange`,this.onContactVisibilityChange),window.removeEventListener(`keydown`,this.onSelectionKeyDown),window.removeEventListener(`mousemove`,this.onMarqueeMove),window.removeEventListener(`mouseup`,this.onMarqueeUp),window.removeEventListener(`blur`,this.cancelMarquee),this.redrawFrame!=null&&cancelAnimationFrame(this.redrawFrame),this.measurementFrame!=null&&cancelAnimationFrame(this.measurementFrame)}shouldComponentUpdate(e,t){return e.agents!==this.props.agents&&(this.scheduleContactExpiry(e.agents),this.redrawChart()),e.selectedActivityIds!==this.props.selectedActivityIds&&(this.redrawChart(),this.redrawMeasurement()),!1}onContactVisibilityChange=()=>{this.scheduleContactExpiry(),document.visibilityState!==`hidden`&&this.redrawChart()};scheduleContactExpiry=(e=this.props.agents??[])=>{if(this.contactExpiryTimer!=null&&clearTimeout(this.contactExpiryTimer),this.contactExpiryTimer=null,typeof document<`u`&&document.visibilityState===`hidden`)return;let t=Date.now(),n=Os(e,t);n!==null&&(this.contactExpiryTimer=setTimeout(()=>{this.redrawChart(),this.scheduleContactExpiry()},n-t))};setFlamechartState=e=>{Object.entries(e).forEach(([e,t])=>{this[e]=t})};setOffsets=(t,n)=>{if(t&&n&&Object.keys(t).length===Object.keys(n).length){let r={};this.threadsSortedByRank=Di(t)||[];let i=0;return this.threadsSortedByRank.reduce((t,[a,o],s)=>{let c=s>0?4:0;r[a]=t+c;let l=n[a]&&n[a].max||0,u=t+(o.collapsed?e.threadHeaderHeight:(this.blockHeight+1)*l+e.threadHeaderHeight)+c;return i=u,u},0),this.contentHeight=i,this.maxTopOffset=Math.max(0,i-(this.state.canvasHeight||0)),this.appliedTopOffset=Ai(this.requestedTopOffset,this.maxTopOffset),this.appliedTopOffset===0?r:Object.fromEntries(Object.entries(r).map(([e,t])=>[e,t-this.appliedTopOffset]))}return this.contentHeight=0,this.maxTopOffset=0,this.appliedTopOffset=0,{}};setCanvasSize=({width:t,height:n})=>{this.width=t;let r=window.devicePixelRatio||1;this.canvas&&(this.canvas.width=Math.round(t*r),this.canvas.height=Math.round(n*r)),this.measurementCanvas&&(this.measurementCanvas.width=Math.round(t*r),this.measurementCanvas.height=Math.round(n*r),this.redrawMeasurement()),this.setState({canvasHeight:n}),this.canvas&&this.ctx&&(this.minTextWidth=e.textPadding.x+this.ctx.measureText(`…`).width),this.ctx&&this.dividersData&&Number.isFinite(this.leftBoundaryTime)&&Number.isFinite(this.rightBoundaryTime)&&this.width>0&&this.draw(this.leftBoundaryTime,this.rightBoundaryTime,this.width,this.dividersData)};hitTest=t=>{let n=t.nativeEvent.offsetX,r=t.nativeEvent.offsetY;this.ensureActorLaneLayout();let i=Object.keys(this.props.threads||{}),a=e=>Object.keys(e||{}).length===i.length,o=a(this.threadLevels)?this.threadLevels:a(this.props.threadLevels)?this.threadLevelsFromLayout(this.props.threadLevels):this.threadLevelsFromLayout(i.reduce((e,t)=>({...e,[t]:{current:0,max:0}}),{}));this.threadLevels=o,this.offsets=this.setOffsets(this.props.threads,o);let s=this.pixelsToTime(n),c=this.pixelsToThreadId(r),l=c===null?null:this.offsets[c],u=l!==null&&r>=l&&r<l+e.threadHeaderHeight,d=this.pixelsToLevel(r);if(u){let e=this.width-34,t=this.width-14;return n>=e&&n<=t?{type:`thread_ellipsis`,value:c}:{type:`thread_header`,value:c}}let f=this.paintableBlockEntries.filter(([,e])=>e.scheduledPoint?Math.abs(n-this.timeToPixels(e.startTime))<=8:s>e.startTime&&(e.endTime===void 0||s<e.endTime)).filter(([,e])=>this.displayRowForBlock(e)===d).filter(([,e])=>this.props.activities[String(e.activity_id)]?.thread_id===c);if(f.length===0)return null;f.length!==1&&console.error(`multiple hits! something is wrong!`,f);let p=f[0];if(Ci(p[1],this.timeToPixels(p[1].startTime),n,this.width))return{type:`block_edge_right`,value:p};if(n>10&&n<this.width-10){let e=this.timeToPixels(p[1].startTime),t=p[1].scheduled&&p[1].endTime==null?this.width:p[1].endTime&&this.timeToPixels(p[1].endTime);if(!t||t-e>20){if(n-e<10)return{type:`block_edge_left`,value:p};if(t&&t-n<10)return{type:`block_edge_right`,value:p}}}return this.props.activities[String(p[1].activity_id)]?{type:`block`,value:p}:null};onContextMenu=e=>{e.preventDefault()};onClick=e=>{if(this.suppressNextClick){this.suppressNextClick=!1;return}let t=this.hitTest(e);if(fl()&&(e.metaKey||e.ctrlKey)&&t&&(t.type===`block`||t.type===`block_edge_left`||t.type===`block_edge_right`)){let e=String(t.value[1].activity_id),n=this.props.selectedActivityIds??[],r=hl(this.props.blocks,this.props.focusedBlockIndex),i=n.length?n:r==null?[]:[String(r)],a=i.includes(e)?i.filter(t=>t!==e):[...i,e];this.props.focusBlock({index:null,activity_id:null,thread_id:null}),this.props.selectActivities(a);return}if(this.props.selectActivities([]),t)switch(t.type){case`thread_ellipsis`:this.props.showThreadDetail(t.value);break;case`thread_header`:let e=this.props.threads[t.value];e&&this.props.toggleThread(t.value,e.collapsed);break;case`block`:case`block_edge_left`:case`block_edge_right`:{let e=Number(t.value[0]),n=this.props.blocks[e],r=this.props.activities[String(n.activity_id)],i=hl(this.props.blocks,this.props.focusedBlockIndex),a=i!==null&&String(i)===String(n.activity_id);this.props.focusBlock({index:e,activity_id:n.activity_id,activityStatus:r.status,thread_id:r.thread_id??null}),Bs({alreadyFocusedSameActivity:a,coarsePointer:Vs(),narrowViewport:Us(),hoverNone:Hs()})&&this.props.showActivityDetails();break}}else this.props.focusBlock({index:null,activity_id:null,activityStatus:null,thread_id:null})};onMouseMove=e=>{let t=this.actorContactHits.find(t=>Math.hypot(e.nativeEvent.offsetX-t.x,e.nativeEvent.offsetY-t.y)<=6);if(this.canvas.title=t?.title??``,!this.marquee){if(this.setFlamechartState({cursor:{x:e.nativeEvent.offsetX,y:e.nativeEvent.offsetY}}),this.props.onCursorTimeChange?.(this.pixelsToTime(e.nativeEvent.offsetX)),this.measuring){let t=this.pixelsToTime(e.nativeEvent.offsetX);this.measurement=this.mousedown&&this.mousedownX!==null?{left:Math.min(t,this.mousedownX),right:Math.max(t,this.mousedownX)}:{left:t,right:null},this.redrawMeasurement();return}if((this.measurement.left!==null||this.measurement.right!==null)&&(this.measurement={left:null,right:null},this.redrawMeasurement()),this.movingScheduledBlock&&this.mousedown){this.canvas.style.cursor=`grabbing`;let t=this.props.activities[String(this.movingScheduledBlock[1].activity_id)],n=this.pixelsToThreadId(e.nativeEvent.offsetY)??t?.thread_id??null;this.movingScheduledTargetThread=n,this.movingScheduledDidMove=this.movingScheduledDidMove||Math.abs(e.nativeEvent.offsetX-this.movingScheduledStartX)>3||String(n)!==String(t?.thread_id),this.movingScheduledDidMove&&this.redrawChart()}else if(this.resizing)this.redrawChart();else{let t=this.hitTest(e);if(t)switch(t.type){case`thread_ellipsis`:this.canvas.style.cursor=`pointer`,this.props.hoverBlock(null),this.setFlamechartState({hoverThreadEllipsis:t.value});break;case`thread_header`:this.canvas.style.cursor=`pointer`,this.props.hoverBlock(null),this.setFlamechartState({hoverThreadEllipsis:null});break;case`block`:this.props.hoverBlock(t.value[0]),this.canvas.style.cursor=t.value[1].scheduled?`grab`:`default`,this.setFlamechartState({hoverThreadEllipsis:null});break;case`block_edge_left`:this.props.hoverBlock(null),this.canvas.style.cursor=`w-resize`,this.setFlamechartState({hoverThreadEllipsis:null});break;case`block_edge_right`:this.props.hoverBlock(null),this.canvas.style.cursor=`e-resize`,this.setFlamechartState({hoverThreadEllipsis:null});break;default:this.canvas.style.cursor=`default`,this.setFlamechartState({hoverThreadEllipsis:null})}else this.props.hoverBlock(null),this.canvas.style.cursor=`default`,this.hoverThreadEllipsis&&this.setFlamechartState({hoverThreadEllipsis:null})}}};getBlockDetails=e=>{if(e!=null){if(this.props.blocks[e]&&this.isEnteringBlock(this.props.blocks[e]))return!1;let t=this.renderBlocks[e];if(!t)return!1;let n=this.renderActivities[String(t.activity_id)];if(!n||n.thread_id===void 0||this.isEnteringBlock(t)||this.threadCollapsed(n.thread_id))return!1;this.ensureActorLaneLayout();let{blockX:r,blockY:i,blockWidth:a,blockHeight:o}=this.getAnimatedBlockTransform(t,n),{startMessage:s,endMessage:c,ending:l}=t;return this.renderBlocks.filter(e=>t.activity_id===e.activity_id),{blockHeight:o,blockWidth:a,blockX:r,blockY:i,startMessage:s,ending:l,endMessage:c,otherMessages:this.renderBlocks.filter((n,r)=>t.activity_id===n.activity_id&&Number(e)!==r).map(({startMessage:e,endMessage:t})=>({startMessage:e,endMessage:t}))}}};onMouseDown=e=>{if(e.button!==0)return;if(fl()&&!e.shiftKey){let t=this.hitTest(e);if((e.metaKey||e.ctrlKey)&&t&&(t.type===`block`||t.type===`block_edge_left`||t.type===`block_edge_right`))return;if(!t){e.preventDefault(),this.marquee={startX:e.nativeEvent.offsetX,startY:e.nativeEvent.offsetY,x:e.nativeEvent.offsetX,y:e.nativeEvent.offsetY,moved:!1},window.addEventListener(`mousemove`,this.onMarqueeMove),window.addEventListener(`mouseup`,this.onMarqueeUp),window.addEventListener(`blur`,this.cancelMarquee);return}}let t=this.pixelsToTime(e.nativeEvent.offsetX);if(this.setFlamechartState({mousedown:!0,mousedownX:t}),this.props.modifiers.shift)this.setFlamechartState({measuring:!0,measurement:{left:t,right:t}}),this.redrawMeasurement();else{let t=this.hitTest(e);t&&(t.type===`block_edge_left`||t.type===`block_edge_right`?this.setFlamechartState({resizing:t.type===`block_edge_left`?`left`:`right`,resizingBlock:t.value}):t.type===`block`&&t.value[1].scheduled?(this.movingScheduledBlock=t.value,this.movingScheduledStartX=e.nativeEvent.offsetX,this.movingScheduledTargetThread=this.props.activities[String(t.value[1].activity_id)]?.thread_id??null,this.movingScheduledDidMove=!1,this.canvas.style.cursor=`grabbing`):t.type)}};onDoubleClick=e=>{let t=this.hitTest(e);if(t&&(t.type===`block`||t.type===`block_edge_left`||t.type===`block_edge_right`))return;let n=this.pixelsToThreadId(e.nativeEvent.offsetY);if(n==null||!this.props.createAt)return;let r=Math.floor(this.pixelsToTime(e.nativeEvent.offsetX));this.pendingActivityEntrance=qi()?null:{threadId:n,time:r,x:e.nativeEvent.offsetX,y:e.nativeEvent.offsetY,existingActivityIds:new Set(Object.keys(this.props.activities)),clickedAt:performance.now()},this.redrawMeasurement(),this.props.createAt(n,r)};isLimboActivityDrag=e=>Array.from(e.dataTransfer.types).includes(`text/flambe-activity`);redrawChart=()=>{this.redrawFrame??=requestAnimationFrame(()=>{this.redrawFrame=null,this.draw(this.leftBoundaryTime,this.rightBoundaryTime,this.width,this.dividersData)})};redrawMeasurement=()=>{this.measurementFrame??=requestAnimationFrame(()=>{this.measurementFrame=null;let e=this.measurementCanvas?.getContext(`2d`);if(!e)return;let t=window.devicePixelRatio||1;if(e.setTransform(t,0,0,t,0,0),e.clearRect(0,0,this.width,this.state.canvasHeight),this.drawMeasurementWindow(e,this.measurement),fl()){let t=this.selectionRectangle();t&&this.marquee?.moved&&(e.fillStyle=`rgba(100, 160, 255, 0.15)`,e.strokeStyle=`#8bbcff`,e.lineWidth=1,e.fillRect(t.x,t.y,t.width,t.height),e.strokeRect(t.x,t.y,t.width,t.height));let n=(this.props.selectedActivityIds??[]).filter(e=>this.props.activities[e]).length;if(n){e.font=`13px sans-serif`;let t=`${n} selected · Cmd/Ctrl+Shift+P for actions · Esc to clear`,r=e.measureText(t).width+20;e.fillStyle=`#202636`,e.fillRect(10,this.state.canvasHeight-34,r,26),e.fillStyle=`#fff`,e.fillText(t,20,this.state.canvasHeight-16)}}this.drawActivityEntrance(e)&&this.redrawMeasurement()})};trackActivityEntrances(){let e=this.props.arrivalBlocks??this.props.blocks,t=this.props.arrivalTraceId,n=this.lastArrivalBlocks==null||t!==this.lastArrivalTraceId;if(!n&&e===this.lastArrivalBlocks)return;if(this.lastArrivalBlocks=e,this.lastArrivalTraceId=t,n){this.seenArrivalActivityIds=new Set(e.map(e=>String(e.activity_id))),this.activityEntrances.clear(),this.pendingActivityEntrance=null,this.optimisticArrival=null,this.redrawMeasurement();return}let r=performance.now(),i=qi(),a=new Map(this.paintableBlocks.map(e=>[String(e.activity_id),e])),o=new Set,s=!1;for(let t of e){let e=String(t.activity_id);o.add(e);let n=this.renderActivities[e],c=this.activityEntrances.get(e);if(c&&G(c.block)===G(t)&&(c.block=t),this.seenArrivalActivityIds.has(e))continue;if(this.seenArrivalActivityIds.add(e),e===`optimisticActivity`)this.optimisticArrival={startTime:t.startTime,threadId:n?.thread_id,beginning:t.beginning};else if(this.optimisticArrival&&t.startTime===this.optimisticArrival.startTime&&t.beginning===this.optimisticArrival.beginning&&n?.thread_id===this.optimisticArrival.threadId){let n=this.activityEntrances.get(`optimisticActivity`);n&&this.activityEntrances.set(e,{...n,block:t}),this.activityEntrances.delete(`optimisticActivity`),this.optimisticArrival=null;continue}let l=a.get(e);if(i||!n||!l||n.thread_id==null||this.threadCollapsed(n.thread_id))continue;let u=this.getRenderedBlockTransform(l,n);if(u.blockY+u.blockHeight<0||u.blockY>this.state.canvasHeight)continue;let d=this.pendingActivityEntrance,f=d&&t.startTime===d.time&&String(n.thread_id)===String(d.threadId)&&!d.existingActivityIds.has(e);this.activityEntrances.set(e,{block:l,startedAt:r,...f?{origin:{x:d.x,y:d.y}}:{}}),f&&(this.pendingActivityEntrance=null),s=!0}for(let e of this.activityEntrances.keys())(!o.has(e)||!a.has(e)||i)&&this.activityEntrances.delete(e);o.has(`optimisticActivity`)||this.seenArrivalActivityIds.delete(`optimisticActivity`),s&&this.prepareActivityReflow(),this.redrawMeasurement()}drawActivityEntrance(e){let t=performance.now(),n=this.pendingActivityEntrance;n&&(t-n.clickedAt>5e3||qi()?this.pendingActivityEntrance=null:(e.save(),e.fillStyle=M.flames.main,e.globalAlpha=.7+.2*Math.sin((t-n.clickedAt)/130),e.beginPath(),e.arc(n.x,n.y,4,0,Math.PI*2),e.fill(),e.restore()));for(let[n,r]of this.activityEntrances){let i=this.renderActivities[n],a=Math.min(1,Math.max(0,(t-r.startedAt)/gl));if(a>=1||!i||qi()||i.thread_id==null||this.threadCollapsed(i.thread_id)){this.activityEntrances.delete(n),this.redrawChart(),this.props.onPreviewGeometryChange?.();continue}let o=this.getRenderedBlockTransform(r.block,i),s=r.origin?.x??Math.max(0,o.blockX)+Math.min(18,Math.max(4,o.blockWidth/2)),c=r.origin?.y??o.blockY+o.blockHeight/2,l=this.props.categories.find(e=>String(e.id)===String(i.categories[0]))?.color_background??M.flames.main,u=1-(1-a)**3,d=(1-a)**2;e.save(),e.strokeStyle=l,e.fillStyle=l,e.globalAlpha=.55*d,e.lineWidth=2*(1-a)+.5,e.beginPath(),e.ellipse(s,c,4+34*u,4+22*u,0,0,Math.PI*2),e.stroke();for(let t=0;t<7;t+=1){let n=t/7*Math.PI*2-Math.PI/2,r=7+(20+t%3*8)*u,i=s+Math.cos(n)*r,o=c+Math.sin(n)*r*.7+12*a*a;e.globalAlpha=d*.85,e.beginPath(),e.arc(i,o,(t%2?2:2.8)*(1-a)+.3,0,Math.PI*2),e.fill()}e.restore()}return this.pendingActivityEntrance!=null||this.activityEntrances.size>0}onDragOver=e=>{if(!this.isLimboActivityDrag(e))return;e.preventDefault(),e.dataTransfer.dropEffect=`move`;let t=this.pixelsToThreadId(e.nativeEvent.offsetY);t!==this.dropTargetThread&&(this.setFlamechartState({dropTargetThread:t}),this.redrawChart())};onDragLeave=e=>{!this.isLimboActivityDrag(e)||this.dropTargetThread==null||(this.setFlamechartState({dropTargetThread:null}),this.redrawChart())};onDrop=e=>{e.preventDefault();let t=e.dataTransfer.getData(`text/flambe-activity`),n=this.pixelsToThreadId(e.nativeEvent.offsetY);this.dropTargetThread!=null&&(this.setFlamechartState({dropTargetThread:null}),this.redrawChart()),!(!t||n==null||!this.props.dropLimboActivity)&&this.props.dropLimboActivity(t,{thread_id:n,scheduled_start_integer:Math.floor(this.pixelsToTime(e.nativeEvent.offsetX)),scheduled_end:null})};onMouseUp=()=>{if(this.resizing&&this.resizingBlock){let e=this.resizingBlock[1],t=Math.floor(this.pixelsToTime(this.cursor.x));if(e.scheduled&&this.props.updateScheduled){let n=this.resizing===`left`?t:e.startTime,r=this.resizing===`right`?t:e.endTime;(r==null||r>=n)&&this.props.updateScheduled(e.activity_id,{...this.resizing===`left`?{scheduled_start_integer:t}:{},...this.resizing===`right`?{scheduled_end_integer:t}:{}})}else this.props.updateEvent(e.events[this.resizing===`left`?0:1],{timestamp_integer:t})}else if(this.movingScheduledBlock&&this.movingScheduledDidMove){let e=this.movingScheduledBlock[1],t=this.props.activities[String(e.activity_id)],n=this.movingScheduledTargetThread??t?.thread_id;n!=null&&this.props.updateScheduled&&this.mousedownX!=null&&(this.props.updateScheduled(e.activity_id,wi(e,this.pixelsToTime(this.cursor.x)-this.mousedownX,n)),this.suppressNextClick=!0,window.setTimeout(()=>{this.suppressNextClick=!1},0))}else this.draggingThread;let e=this.movingScheduledDidMove||!!this.resizing;this.setFlamechartState({mousedown:!1,mousedownX:null,draggingThread:null,resizing:!1,resizingBlock:null,movingScheduledBlock:null,movingScheduledTargetThread:null,movingScheduledDidMove:!1,measuring:!1}),e&&this.redrawChart(),this.canvas.style.cursor=`default`};onMouseLeave=()=>{this.canvas.title=``,this.props.onCursorTimeChange?.(null),this.movingScheduledBlock&&(this.setFlamechartState({mousedown:!1,mousedownX:null,movingScheduledBlock:null,movingScheduledTargetThread:null,movingScheduledDidMove:!1}),this.redrawChart(),this.canvas.style.cursor=`default`)};render(){let e=Object.values(this.threadLevels||{}).map(({max:e})=>e);return this.maxThreadLevels=e.length>0?Math.max(...e):0,(0,N.jsxs)(ml,{id:`chart-wrapper`,children:[(0,N.jsx)(mi,{bounds:!0,onResize:e=>{(e.bounds.width!==this.width||e.bounds.height!==this.state.canvasHeight)&&this.setCanvasSize(e.bounds)},children:({measureRef:e})=>(0,N.jsx)(`canvas`,{ref:t=>{e(t),t&&(this.canvas=t)},onClick:this.onClick,onContextMenu:this.onContextMenu,onMouseMove:this.onMouseMove,onMouseLeave:this.onMouseLeave,onMouseDown:this.onMouseDown,onMouseUp:this.onMouseUp,onDoubleClick:this.onDoubleClick,onDragOver:this.onDragOver,onDragLeave:this.onDragLeave,onDrop:this.onDrop,style:{width:`100%`,height:`100%`,touchAction:`none`},height:this.state.canvasHeight*window.devicePixelRatio||300,width:this.width*window.devicePixelRatio||450})}),(0,N.jsx)(`canvas`,{ref:e=>{this.measurementCanvas=e},"aria-hidden":`true`,style:{width:`100%`,height:`100%`,pointerEvents:`none`},height:this.state.canvasHeight*window.devicePixelRatio||300,width:this.width*window.devicePixelRatio||450})]})}captureThread(e){let t=this.offsets[e];return this.ctx.getImageData(0,this.offsets[e]*window.devicePixelRatio,this.width*window.devicePixelRatio,((this.offsets[e+1]||this.state.canvasHeight)-t)*window.devicePixelRatio)}calcTooltipOffset(e){if(e){let t=e.clientWidth,n=e.clientHeight,r=e.parentElement?.clientWidth??this.width,i=e.parentElement?.clientHeight??this.state.canvasHeight,a=0,o=0;for(let e=0;e<4;++e){let s=e&2?-10-t:10,c=e&1?-6-n:6;if(a=jc(this.cursor.x+s,0,r-t),o=jc(this.cursor.y+c,0,i-n),a>=this.cursor.x||this.cursor.x>=a+t||o>=this.cursor.y||this.cursor.y>=o+n)break}return{x:a,y:o}}return{x:0,y:0}}clearCanvas(){this.ctx.fillStyle=M.background,this.ctx.fillRect(0,0,this.width,this.state.canvasHeight)}draw(e,t,n,r,i=this.requestedTopOffset){if(this.leftBoundaryTime=e,this.rightBoundaryTime=t,this.width=n,this.dividersData=r,this.requestedTopOffset=Number.isFinite(i)?Math.max(0,i):0,this.renderBlocks=this.props.blocks,this.renderActivities=this.props.activities,this.movingScheduledBlock&&this.movingScheduledDidMove&&this.mousedownX!=null){let[e,t]=this.movingScheduledBlock,n=this.props.activities[String(t.activity_id)],r=this.movingScheduledTargetThread??n?.thread_id;if(n&&r!=null){let i=this.pixelsToTime(this.cursor.x)-this.mousedownX;this.renderBlocks=this.props.blocks.map((n,r)=>r===Number(e)?{...t,startTime:t.startTime+i,...t.endTime==null?{}:{endTime:t.endTime+i}}:n),this.renderActivities={...this.props.activities,[String(n.id)]:{...n,thread_id:r}}}}else if(this.resizing&&this.resizingBlock){let[e,t]=this.resizingBlock;this.renderBlocks=this.props.blocks.map((n,r)=>r===Number(e)?{...t,...this.resizing===`left`?{startTime:this.pixelsToTime(this.cursor.x)}:{endTime:this.pixelsToTime(this.cursor.x)}}:n)}this.ensureActorLaneLayout(),this.actorChromeBands=this.navigationTransition?ol(this.navigationTransition.from,this.navigationTransition.to,this.paintableBlocks,(performance.now()-this.navigationTransition.startedAt)/280):ls(this.actorLaneLayout,this.paintableBlocks,this.dividersData.gridSliceTime??0);let a=this.renderActivities&&this.props.reactiveThreadHeight?Ti(this.paintableBlocks,this.renderActivities,this.leftBoundaryTime,this.rightBoundaryTime,this.props.threads):this.props.threadLevels;this.threadLevels=this.threadLevelsFromLayout(a),this.offsets=this.setOffsets(this.props.threads,this.threadLevels),this.trackActivityEntrances();let o=qi();for(let[e,t]of this.activityEntrances)(performance.now()-t.startedAt>=gl||o)&&(this.activityEntrances.delete(e),this.redrawMeasurement(),this.props.onPreviewGeometryChange?.());this.canvas&&(this.ctx.save(),this.ctx.scale(window.devicePixelRatio,window.devicePixelRatio),this.clearCanvas(),this.draggingThread===null?(this.hoverActivity_id=hl(this.renderBlocks,this.props.hoveredBlockIndex),this.focusActivity_id=hl(this.renderBlocks,this.props.focusedBlockIndex),this.drawGrid(this.ctx,this.dividersData),this.drawActorLaneChrome(`wash`),this.renderBlocks&&this.drawBlocks(),this.drawActorForks(),this.drawActorLaneChrome(`rail`),this.drawFutureWindow(),this.drawDropTargetThread(),this.drawThreadHeaders(this.ctx),this.drawAttention(this.ctx),this.props.showSuspendResumeFlows&&this.drawSuspendResumeFlows(this.props.showSuspendResumeFlowsOnlyForFocusedActivity)):this.drawDraggingThreads(),this.ctx.scale(.5,.5),this.ctx.restore()),(this.measurement.left!==null||(this.props.selectedActivityIds??[]).length||this.activityEntrances.size||this.pendingActivityEntrance)&&this.redrawMeasurement(),this.activityEntrances.size&&this.redrawChart();let s=`${this.leftBoundaryTime}:${this.rightBoundaryTime}:${this.width}`;this.lastBlockTransforms=new Map(this.paintableBlocks.flatMap(e=>{let t=this.renderActivities[String(e.activity_id)];return t?[[G(e),this.getRenderedBlockTransform(e,t)]]:[]})),this.lastBlockViewport=s,this.reflowStartedAt!=null&&(performance.now()-this.reflowStartedAt<160?this.redrawChart():(this.reflowStartedAt=null,this.reflowTransforms.clear())),(this.movingScheduledDidMove||this.resizing||this.reflowStartedAt!=null||this.navigationTransition!=null)&&this.props.onPreviewGeometryChange?.()}drawDropTargetThread(e=this.dropTargetThread){if(e==null)return;let t=this.threadsSortedByRank||[],n=t.findIndex(([t])=>Number(t)===e);if(n<0)return;let r=this.offsets[e];if(r==null)return;let i=t[n+1],a=i?this.offsets[i[0]]:this.state.canvasHeight;a==null||a<=r||(this.ctx.save(),this.ctx.globalAlpha=.35,this.ctx.fillStyle=M.dropTarget,this.ctx.fillRect(0,r,this.width,a-r),this.ctx.restore())}drawDraggingThreads(){if(this.draggingThread===null||!this.threadCapture)return;this.otherThreadCaptures.forEach(({id:e,capture:t})=>{this.ctx.putImageData(t,0,this.offsets[e]*window.devicePixelRatio)}),this.ctx.fillStyle=`#dadada`;let e=this.offsets[this.draggingThread];this.ctx.fillRect(0,e,this.width*window.devicePixelRatio,this.offsets[this.draggingThread+1]-e),this.ctx.putImageData(this.threadCapture,0,this.cursor.y*window.devicePixelRatio)}drawFutureWindow(){return bi(this.ctx,this.leftBoundaryTime,this.rightBoundaryTime,this.width,this.state.canvasHeight)}drawBlocks(){this.selectedForDrawing=new Set(fl()?this.props.selectedActivityIds:[]);for(let[,e]of this.paintableBlockEntries){let t=this.renderActivities[String(e.activity_id)];t&&(this.ctx.font=fr(!e.endTime),this.drawBlock(e,t))}}isEnteringBlock(e){let t=this.activityEntrances.get(String(e.activity_id));return t!=null&&G(t.block)===G(e)}ensureActorLaneLayout(){let e=this.actorLaneLayoutInput,t=e!=null&&(e.leftBoundaryTime!==this.leftBoundaryTime||e.rightBoundaryTime!==this.rightBoundaryTime),n=e!=null&&(e.blocks!==this.renderBlocks||e.activities!==this.renderActivities||e.width!==this.width);if(n&&(this.navigationSettleTimer!=null&&clearTimeout(this.navigationSettleTimer),this.navigationSettleTimer=null,this.navigationHeldLayout=null,this.navigationTransition=null),t&&!n&&this.actorLaneLayout&&(this.navigationHeldLayout??=this.navigationTransition?.to??this.actorLaneLayout,this.navigationSettleTimer!=null&&clearTimeout(this.navigationSettleTimer),this.navigationSettleTimer=setTimeout(()=>{this.navigationSettleTimer=null;let e=this.actorLaneLayout,t=ps(this.renderActivities,this.paintableBlocks);this.navigationHeldLayout=null,this.navigationTransition=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches?null:{from:e,to:t,startedAt:performance.now()},this.actorLaneLayout=t,this.redrawChart()},180)),this.actorLaneLayout&&e?.blocks===this.renderBlocks&&e.activities===this.renderActivities&&e.leftBoundaryTime===this.leftBoundaryTime&&e.rightBoundaryTime===this.rightBoundaryTime&&e.width===this.width)return this.animateNavigationLayout();this.paintableBlockEntries=this.renderBlocks.flatMap((e,t)=>Si(e,this.leftBoundaryTime,this.rightBoundaryTime,this.width)?[[String(t),e]]:[]),this.paintableBlocks=this.paintableBlockEntries.map(([,e])=>e),this.paintableBlockSet=new Set(this.paintableBlocks);let r=this.actorLaneLayout;if(this.actorLaneLayout=ps(this.renderActivities,this.paintableBlocks),this.navigationHeldLayout){this.actorLaneLayout=sl(this.actorLaneLayout,this.navigationHeldLayout,this.paintableBlocks,this.renderActivities,this.renderBlocks);let e=this.paintableBlocks.some(e=>{let t=G(e),n=this.navigationHeldLayout.rowByBlock[t];return n!==void 0&&n!==this.actorLaneLayout.rowByBlock[t]});this.navigationHeldLayout=this.actorLaneLayout,e&&r&&!window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches?this.navigationTransition={from:r,to:this.actorLaneLayout,startedAt:performance.now()}:this.navigationTransition&&(this.navigationTransition.to=this.actorLaneLayout)}return this.actorLaneLayoutInput={blocks:this.renderBlocks,activities:this.renderActivities,leftBoundaryTime:this.leftBoundaryTime,rightBoundaryTime:this.rightBoundaryTime,width:this.width},this.animateNavigationLayout()}animateNavigationLayout(){if(this.navigationTransition){let e=this.navigationTransition,t=(performance.now()-e.startedAt)/280;this.actorLaneLayout=cl(e.from,e.to,t),t<1?this.redrawChart():this.navigationTransition=null}return this.actorLaneLayout}threadLevelsFromLayout(e){let t=this.actorLaneLayout;return Object.keys(this.props.threads||{}).reduce((n,r)=>{let i=e[r]??{current:0,max:0},a=t?.maxRowsByThread[r]??0;return n[r]={current:i.current,max:Math.max(a,i.max,1)},n},{})}displayRowForActivity(e){return this.actorLaneLayout?.rowByActivity[String(e)]??0}displayRowForBlock(e){let t=this.actorLaneLayout;if(!t)return 0;let n=t.rowByBlock[G(e)];return n===void 0?this.displayRowForActivity(e.activity_id):n}nestedPadForActivity(t){let n=this.actorLaneLayout;if(!n)return 0;let r=n.rootIdByActivity[String(t)];if(r==null)return 0;let i=n.lanes.find(e=>String(e.rootActivityId)===String(r));return i===void 0?0:e.actorLaneVerticalMargin+(i.depth>0?e.actorLaneNestedPad:0)}getRenderedBlockTransform(t,n){let r=n.thread_id!==void 0&&this.threadCollapsed(n.thread_id),i=this.displayRowForBlock(t),a=r?0:this.nestedPadForActivity(n.id),{blockX:o,blockY:s,blockWidth:c}=this.getBlockTransform(t.startTime,t.endTime,r?-1:i,this.blockHeight,+!!r+(this.offsets[String(n.thread_id)]??0)+e.threadHeaderHeight+a);return{blockX:o,blockY:s,blockWidth:c,blockHeight:vi(this.blockHeight,a)}}getAnimatedBlockTransform(e,t){let n=this.getRenderedBlockTransform(e,t),r=this.reflowTransforms.get(G(e)),i=this.activityEntrances.get(String(e.activity_id));if(i&&this.isEnteringBlock(e)){let e=Math.max(0,Math.min(1,(performance.now()-i.startedAt)/gl)),t=1-(1-Math.min(1,e/.72))**3,r=1-Math.exp(-7*e)*Math.cos(12*e),a=i.origin?.x??Math.max(0,n.blockX)+Math.min(18,Math.max(4,n.blockWidth/2)),o=i.origin?.y??n.blockY+n.blockHeight/2,s=n.blockHeight*(.25+.75*r);return{blockX:a+(n.blockX-a)*t,blockY:o+(n.blockY+n.blockHeight/2-o)*t-s/2,blockWidth:4+(n.blockWidth-4)*t,blockHeight:s}}if(!r||this.reflowStartedAt==null)return n;let a=1-(1-Math.min(1,(performance.now()-this.reflowStartedAt)/160))**3;return{blockX:r.from.blockX+(r.to.blockX-r.from.blockX)*a,blockY:r.from.blockY+(r.to.blockY-r.from.blockY)*a,blockWidth:r.from.blockWidth+(r.to.blockWidth-r.from.blockWidth)*a,blockHeight:r.from.blockHeight+(r.to.blockHeight-r.from.blockHeight)*a}}prepareActivityReflow(){if(this.reflowTransforms.clear(),!window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches&&`${this.leftBoundaryTime}:${this.rightBoundaryTime}:${this.width}`===this.lastBlockViewport){for(let e of this.paintableBlocks){if(this.isEnteringBlock(e))continue;let t=this.lastBlockTransforms.get(G(e)),n=this.renderActivities[String(e.activity_id)];if(!t||!n)continue;let r=this.getRenderedBlockTransform(e,n);(Math.abs(t.blockX-r.blockX)>1||Math.abs(t.blockY-r.blockY)>1||Math.abs(t.blockWidth-r.blockWidth)>1||Math.abs(t.blockHeight-r.blockHeight)>1)&&this.reflowTransforms.set(G(e),{from:t,to:r})}this.reflowStartedAt=this.reflowTransforms.size>0?performance.now():null}}fillActorLaneRoundRect(e,t,n,r){this.ctx.beginPath(),typeof this.ctx.roundRect==`function`?this.ctx.roundRect(e,t,n,r,3):this.ctx.rect(e,t,n,r),this.ctx.fill()}actorChromeOpacity(e){if(!this.props.activityMute)return 1;let t=this.actorLaneLayout;if(!t)return this.props.activityMuteOpacity;let n=[this.focusActivity_id,this.hoverActivity_id].filter(e=>e!==null).map(e=>t.rootIdByActivity[String(e)]);return e.some(e=>n.some(t=>String(t)===String(e)))?1:this.props.activityMuteOpacity}drawActorLaneChrome(t=`wash`){if(t===`rail`&&(this.actorContactHits=[]),!this.actorLaneLayout)return;let n=this.actorChromeBands,r=t===`rail`?ks(this.paintableBlocks,this.renderActivities):new Set,i=new Map((this.props.agents??[]).map(e=>[e.agent_id,e])),a=Date.now();this.ctx.save();let o=e.actorLaneGutter;n.forEach(n=>{if(this.threadCollapsed(n.threadId))return;let s=n.depth*e.actorLaneDepthInset,c=this.offsets[String(n.threadId)]??0,l=Object.keys(this.offsets).sort((e,t)=>(this.offsets[e]??0)-(this.offsets[t]??0)),u=l.findIndex(e=>String(e)===String(n.threadId)),d=u>=0&&l[u+1]?this.offsets[l[u+1]]??this.state.canvasHeight:this.state.canvasHeight,f=this.blockHeight+1,p=n.depth>0?e.actorLaneNestedPad:0,m=e.actorLaneVerticalMargin,h=as(n.actorKey),g=this.actorChromeOpacity(n.rootActivityIds),_=n.washRects.length?n.washRects:[{rowStart:n.rowStart,rowEnd:n.rowEnd,startTime:n.startTime,endTime:n.endTime}],v=_.reduce((e,t)=>t.startTime<e.startTime||t.startTime===e.startTime&&t.rowStart<e.rowStart?t:e,_[0]),y=(t,n)=>{let r=n-t+1,i=m+p,a=e.actorLaneWashPad,o=c+e.threadHeaderHeight,s=o+t*f+i-a,l=o+n*f+(this.blockHeight-i)+a,u=Math.max(4,l-s);return{rowCount:r,top:s,height:Math.max(0,Math.min(u,d-s))}},b=this.timeToPixels(v.startTime)-o+s,x=-1/0;_.forEach(e=>{x=Math.max(x,this.timeToPixels(e.endTime===null?this.rightBoundaryTime:e.endTime))});let S=ns(b,x,this.width,s);if(S===null)return;let C=b<s;if(t===`wash`){this.ctx.globalAlpha=.16*g,this.ctx.fillStyle=h,_.forEach(e=>{let t=C||e===v,n=this.timeToPixels(e.startTime)+s,r=this.timeToPixels(e.endTime===null?this.rightBoundaryTime:e.endTime),i=t?Math.min(n-o,S):n,a=Math.max(i,-2),c=Math.min(r,this.width+2),l=Math.max(0,c-a);if(l<=0||c<0||a>this.width)return;let{top:u,height:d}=y(e.rowStart,e.rowEnd);d<=0||this.fillActorLaneRoundRect(a,u,l,d)});return}let{rowCount:w,top:T,height:E}=y(v.rowStart,v.rowEnd);if(E<=0)return;C&&(this.ctx.globalAlpha=1,this.ctx.fillStyle=M.background,this.fillActorLaneRoundRect(S,T,o,E),this.ctx.globalAlpha=.16*g,this.ctx.fillStyle=h,this.fillActorLaneRoundRect(S,T,o,E)),this.ctx.globalAlpha=.95*g,this.ctx.fillStyle=h,this.ctx.fillRect(S,T,3,E);let ee=n.actorKey.slice(6);if(r.has(ee)){let e=Ds(i.get(ee)?.last_seen_at,a),t=S+6,r=T+E/2;this.ctx.save(),this.ctx.globalAlpha=g,this.ctx.beginPath(),this.ctx.arc(t,r,2.25,0,Math.PI*2),this.ctx.fillStyle=e.kind===`recent`?`#15803d`:M.background,this.ctx.fill(),this.ctx.lineWidth=1,this.ctx.strokeStyle=e.kind===`recent`?`#15803d`:`#8a929b`,this.ctx.stroke(),this.ctx.restore(),this.actorContactHits.push({x:t,y:r,title:`${n.actorName}: ${e.label}. ${e.title}`})}let D=n.actorName;if(!D||E<8)return;let O=w===1;this.ctx.font=O?`bold 7px sans-serif`:`bold 9px sans-serif`;let te=rs(D,Math.max(0,E-(O?4:10)),e=>this.ctx.measureText(e).width);te&&(this.ctx.save(),this.ctx.globalAlpha=.95*g,this.ctx.fillStyle=h,this.ctx.textAlign=`right`,this.ctx.textBaseline=`bottom`,this.ctx.translate(S+o-(O?2:0),T+(O?2:5)),this.ctx.rotate(-Math.PI/2),this.ctx.fillText(te,0,0),this.ctx.restore())}),this.ctx.restore()}drawActorForks(){let e=this.actorLaneLayout;e&&(this.ctx.save(),this.ctx.globalCompositeOperation=`source-over`,this.ctx.lineWidth=1,this.ctx.lineCap=`round`,this.ctx.lineJoin=`round`,e.flames.forEach(e=>{let t=this.renderActivities[String(e.rootActivityId)];if(!t||t.thread_id===void 0||this.threadCollapsed(t.thread_id))return;let{parentBlock:n,rootBlock:r}=ts(e,this.paintableBlocks);if(!r)return;let i=this.getRenderedBlockTransform(r,t);if(i.blockX>this.width||i.blockX+i.blockWidth<0)return;let a=as(e.actorKey);this.ctx.globalAlpha=.3*this.actorChromeOpacity([e.rootActivityId]);let o=i.blockY+i.blockHeight/2;this.ctx.strokeStyle=a,this.ctx.fillStyle=a;let s=i.blockX+2;if(n&&e.parentActivityId!==null){let r=this.renderActivities[String(e.parentActivityId)];if(r&&r.thread_id===t.thread_id){let t=this.getRenderedBlockTransform(n,r),i=t.blockX,a=jc(s,i,t.blockX+t.blockWidth),c=t.blockY+t.blockHeight/2,l=c+(o-c)/2,u=Array.from(String(e.rootActivityId)).reduce((e,t)=>(e*31+t.charCodeAt(0))%997,0),d=this.actorChromeOpacity([e.rootActivityId]);for(let e=0;e<2;e+=1){let t=a,n=c;for(let r=1;r<=32;r+=1){let i=r/32,f=1-i,p=Math.sin(Math.PI*i),m=Math.sin(i*43+u+e*2)*.35+Math.sin(i*19+u*.7)*.3,h=f**3*a+3*f*f*i*a+3*f*i*i*s+i**3*s+p*(m+e*.45),g=f**3*c+3*f*f*i*l+3*f*i*i*l+i**3*o;this.ctx.globalAlpha=(e===0?.27:.1)*d,this.ctx.lineWidth=(e===0?.75:.45)+Math.sin(i*23+u)*.12,this.ctx.beginPath(),this.ctx.moveTo(t,n),this.ctx.lineTo(h,g),this.ctx.stroke(),t=h,n=g}}this.ctx.globalAlpha=.3*d,this.ctx.beginPath(),this.ctx.arc(s,o,1.6,0,Math.PI*2),this.ctx.fill()}}}),this.ctx.restore())}isVisible(e){return xi(e,this.leftBoundaryTime,this.rightBoundaryTime)}drawSuspendResumeFlows(e){this.ctx.save(),this.ctx.globalCompositeOperation=`source-over`;let t=this.renderBlocks.reduce((e,t)=>{let n=this.renderActivities[String(t.activity_id)];if(!n||n.thread_id===void 0)return e;let r=String(t.activity_id),i=this.paintableBlockSet.has(t);return(e[r]??=[]).push({...t,thread_id:n.thread_id,paintable:i,cat:i?this.props.categories.find(e=>String(e.id)===String(n.categories[0])):void 0}),e},{});Object.values(t).filter(e=>e.length>1).forEach(t=>{t.forEach((n,r)=>{if(r===0)return;let i=t[r-1];if(!n.paintable||!i.paintable||e&&n.activity_id!==this.focusActivity_id&&n.activity_id!==this.hoverActivity_id||this.threadCollapsed(n.thread_id))return;let a=this.timeToPixels(i.endTime??i.startTime)-this.timeToPixels(i.startTime),o=this.timeToPixels(n.endTime||Date.now())-this.timeToPixels(n.startTime),s=this.displayRowForBlock(t[r-1]),c=this.displayRowForBlock(n),l=this.timeToPixels(i.endTime??i.startTime),u=_i(s+1,this.blockHeight,0)+this.offsets[n.thread_id]-1,d=this.timeToPixels(n.startTime),f=_i(c+1,this.blockHeight,0)+this.offsets[n.thread_id]-1,p=(d-l)/3;this.ctx.globalAlpha=n.activity_id===this.hoverActivity_id||n.activity_id===this.focusActivity_id?.8:.1,this.ctx.strokeStyle=n.cat?n.cat.color_background:M.flames.main,this.ctx.lineWidth=s===c?this.blockHeight:2,this.ctx.beginPath(),this.ctx.moveTo(l-jc(a,0,5),u+this.blockHeight/2),u+this.blockHeight/2+(f-u)/2,this.ctx.bezierCurveTo(l+p,u+this.blockHeight/2,d-p,f+this.blockHeight/2,d+jc(o,0,5),f+this.blockHeight/2),this.ctx.stroke()})}),this.ctx.restore()}getBlockTransform(e,t,n,r,i){return yi(e,t,n,r,i,this.leftBoundaryTime,this.rightBoundaryTime,this.width)}drawBlock(t,n){if(n.thread_id===void 0)return;let r=this.threadCollapsed(n.thread_id),{blockX:i,blockY:a,blockWidth:o,blockHeight:s}=this.getAnimatedBlockTransform(t,n);if(i+o<0||i>this.width)return;let c=this.focusActivity_id===t.activity_id||this.hoverActivity_id===t.activity_id;this.ctx.globalAlpha=r?.4:this.props.activityMute&&!c?.1:1,this.ctx.fillStyle=M.flames.main;let l=M.text;if(n.categories.length>0&&n.categories[0]){let e=this.props.categories.find(e=>e.id===n.categories[0]);if(e){let n=this.props.darkerAsWeGoDown?ce(.1*t.level,e.color_background):e.color_background;this.ctx.fillStyle=n,l=dl(n,e.color_text)}}let u=this.blockHeight/Math.max(1,this.props.uniformBlockHeight?this.maxThreadLevels:this.threadLevels[String(n.thread_id)]?.max??1),d=t.scheduledPoint?Math.max(o,8):o,f=i,p=r?a+this.displayRowForBlock(t)*u:a,m=r?u:s;if(t.scheduled&&(this.ctx.globalAlpha*=.55),this.ctx.fillRect(f,p,d,m),this.selectedForDrawing.has(String(t.activity_id))&&(this.ctx.save(),this.ctx.globalAlpha=1,this.ctx.strokeStyle=`#b8d8ff`,this.ctx.lineWidth=2,this.ctx.strokeRect(f+1,p+1,Math.max(0,d-2),Math.max(0,m-2)),this.ctx.restore()),t.scheduled&&(this.ctx.setLineDash([4,3]),this.ctx.strokeStyle=l,this.ctx.strokeRect(f,p,d,m),this.ctx.setLineDash([]),t.endTime==null&&f+d>=this.width-1&&d>=12)){this.ctx.save(),this.ctx.globalAlpha=.8,this.ctx.fillStyle=l;let e=p+Math.max(1,(m-8)/2),t=Math.min(8,Math.max(2,m-2));this.ctx.fillRect(this.width-9,e,2,t),this.ctx.fillRect(this.width-5,e,2,t),this.ctx.restore()}if(this.ctx.globalAlpha=r?.4:this.props.activityMute&&!c?.1:1,o<this.minTextWidth)return;let h=this.props.showActivityIds?String(n.id):n.name||``,{width:g}=this.ctx.measureText(h);if(g+e.textPadding.x,r)return;let _=i+e.textPadding.x,v=this.actorLaneLayout?.rootIdByActivity[String(n.id)];if(v!=null&&t.startTime<this.leftBoundaryTime){let t=this.actorLaneLayout?.lanes.find(e=>String(e.rootActivityId)===String(v)),n=e.actorLaneGutter+(t?t.depth*e.actorLaneDepthInset:0);_=Math.max(_,n+e.textPadding.x)}let y=i+o-e.textPadding.x-_;if(y<=0)return;let b=Ec(this.ctx,h,y);this.ctx.fillStyle=l;let x=this.ctx.textBaseline;this.ctx.textBaseline=`middle`;let S=a+s/2;if(this.props.rightAlignTimelineText?(this.ctx.textAlign=`right`,this.ctx.fillText(b,i+o-e.textPadding.x,S),this.ctx.textAlign=`left`):this.ctx.fillText(b,_,S),this.ctx.textBaseline=x,t.beginning===`R`||t.beginning===`X`){this.ctx.fillStyle=`#ffffff`,this.ctx.beginPath(),this.ctx.moveTo(i-1,a);let e=jc(o/5,2,5);for(let t=0;t<6;t++)this.ctx.lineTo(i+(t%2?e:-1),a+t*s/6);this.ctx.lineTo(i-1,a+s),this.ctx.fill()}if(t.ending===`S`){this.ctx.fillStyle=`#ffffff`,this.ctx.beginPath(),this.ctx.moveTo(i+o+1,a);let e=jc(o/5,2,5);for(let t=0;t<6;t++)this.ctx.lineTo(i+o-(t%2?e:-1),a+t*s/6);this.ctx.lineTo(i+o+1,a+s),this.ctx.fill()}}threadCollapsed(e){return this.props.threads[e]?.collapsed||!1}pixelsToThreadId(e){let t=this.threadsSortedByRank||[];for(let n=0;n<t.length;n++){let[r]=t[n],i=t[n+1],a=this.offsets[r],o=i?this.offsets[i[0]]:this.state.canvasHeight;if(e>=a&&e<o)return Number(r)}return null}pixelsToLevel(t){let n=Object.values(this.offsets||{}).sort((e,t)=>t-e),r=0;for(;t<n[r];)r++;let i=t-((n[r]??0)+e.threadHeaderHeight);return Math.floor(i/(1+this.blockHeight))}drawThreadHeaders(t){t.globalAlpha=1,Object.entries(this.props.threads).forEach(([n,r])=>{let i=Number(n),a=ge(),o,s=[];for(;o=a.exec(r.name);)s.push(o[0]);t.globalAlpha=.75,t.fillStyle=`white`;let{width:c}=t.measureText(r.name);t.fillRect(0,this.offsets[i],c+25,this.blockHeight),t.fillStyle=M.text,t.globalAlpha=1,t.font=`bold 18px sans-serif`,t.fillText(s.toString(),e.textPadding.x-2,this.offsets[i]+e.textPadding.y+3),t.font=`bold 11px sans-serif`,t.fillText(`${r.name}`,e.textPadding.x+20,this.offsets[i]+e.textPadding.y),t.measureText(r.name),t.save(),this.props.currentAttention===i&&(t.fillStyle=`#ff0000`,t.beginPath(),t.arc(this.width-7.5,this.offsets[i]+10,2,0,360),t.fill()),t.fillStyle=va((r.suspendedActivityCount??0)*5),r.suspendedActivityCount&&t.fillText(` (${r.suspendedActivityCount})`,this.width-60,this.offsets[i]+e.textPadding.y),t.fillStyle=this.hoverThreadEllipsis===i?`#000000`:`#dddddd`;for(let e=0;e<3;e++)t.beginPath(),t.arc(this.width-30+6*e,this.offsets[i]+10,2,0,360),t.fill();t.restore()})}drawAttention(e){this.props.attentionShifts.forEach(({thread_id:t,timestamp:n},r)=>{let i=this.offsets[t],a=this.timeToPixels(n),o=r<this.props.attentionShifts.length-1?this.timeToPixels(this.props.attentionShifts[r+1].timestamp):this.timeToPixels(this.rightBoundaryTime);e.beginPath(),e.moveTo(a,i),e.lineTo(o,i),e.moveTo(o,i);let s=this.timeToPixels(r<this.props.attentionShifts.length-2?this.props.attentionShifts[r+2].timestamp:o),c=Math.min(10,Math.min(Math.abs(o-a),Math.abs(s-o)));this.props.showAttentionFlows&&r<this.props.attentionShifts.length-1&&this.drawAttentionFlow(e,o,i,this.offsets[this.props.attentionShifts[r+1].thread_id],c),e.strokeStyle=`red`,e.stroke()})}drawAttentionFlow(e,t,n,r,i){let a=(e,t)=>(e+t)/2,o=[t,n],s=[t,a(n,r)],c=[t,r],l=(e,t)=>[e[0]+t[0],e[1]+t[1]];e.bezierCurveTo(...l(o,[i,0]),...s,...s),e.bezierCurveTo(...s,...l(c,[-i,0]),...c)}drawGrid(t,n){t.save(),t.strokeStyle=`#e7e7e7`,t.fillStyle=`#a0a0a0`,t.lineWidth=1,t.font=`10px sans-serif`;let r=Math.floor(t.canvas.height/window.devicePixelRatio),i=this.rightBoundaryTime-this.leftBoundaryTime,a=-1/0,o=null;t.translate(.5,.5),t.beginPath(),n.offsets.forEach(n=>{let s=n.position,c=n.time??this.pixelsToTime(s);if(t.moveTo(n.position,0),t.lineTo(n.position,r),s<a)return;let l=Ac(c,{absolute:this.props.absoluteTimeLabels,twelveHour:this.props.twelveHourClock,visibleSpanMs:i,previousTimestamp:o});if(!l)return;let u=t.measureText(l).width;t.fillText(l,s+e.textPadding.x,11),a=s+e.textPadding.x+u+8,o=c}),t.stroke(),t.beginPath(),Object.values(this.offsets).forEach((e,n)=>{n>0&&this.hLine(t,e-2)}),t.stroke(),t.restore()}drawMeasurementWindow(t,n){let r=n.left===null?null:this.timeToPixels(n.left),i=n.right===null?null:this.timeToPixels(n.right);if(t.save(),t.lineWidth=2,t.strokeStyle=`#377C9C`,t.fillStyle=`#377C9C`,r&&i==null)this.vLine(t,r);else if(r&&i){t.globalAlpha=.2,t.fillRect(r,0,i-r,this.state.canvasHeight),t.globalAlpha=1,this.vLine(t,r),this.vLine(t,i);let a=Dc((n.right??0)-(n.left??0)),o=t.measureText(a).width,s=i-r>o?r+(i-r-o)/2:r;t.fillStyle=M.text,t.fillText(a,s,this.state.canvasHeight-(e.textPadding.y-11))}t.restore()}hLine(e,t){e.moveTo(0,t),e.lineTo(this.width*window.devicePixelRatio,t)}vLine(e,t,n=this.state.canvasHeight){e.beginPath(),e.moveTo(t,0),e.lineTo(t,n),e.stroke()}timeToPixels(e){return gi(e,this.leftBoundaryTime,this.rightBoundaryTime,this.width)}pixelsToTime(e){return hi(e,this.leftBoundaryTime,this.rightBoundaryTime,this.width)}});function vl(e){return Object.values(e).filter(e=>e.status===`suspended`||e.status===`unstarted`&&e.scheduled_start==null&&e.scheduled_end==null).map(e=>({activity:e,weighted:typeof e.weight==`number`&&Number.isFinite(e.weight)})).sort((e,t)=>String(e.activity.name).localeCompare(String(t.activity.name)))}var yl=4;function bl(e){return e*Math.sqrt(3)/2}function xl(e,t=0,n=0){let r=e.filter(e=>e.weighted).sort((e,t)=>(t.activity.weight??0)-(e.activity.weight??0));if(r.length===0)return[];let i=Math.max(...r.map(e=>e.activity.weight??1)),a=r.map(e=>30+26*Math.sqrt(Math.max(0,e.activity.weight??1)/(i||1))),o=2*bl(Math.max(...a))+yl;return r.map((e,r)=>{let{q:i,r:s}=Cl(r);return{id:String(e.activity.id),radius:a[r],x:t+o*(i+s/2),y:n+o*(s*Math.sqrt(3)/2)}})}var Sl=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];function Cl(e){if(e===0)return{q:0,r:0};let t=1,n=e-1;for(;n>=6*t;)n-=6*t,t+=1;let r=Sl[4][0]*t,i=Sl[4][1]*t,a=Math.floor(n/t);for(let e=0;e<a;e+=1)r+=Sl[e][0]*t,i+=Sl[e][1]*t;let o=n%t;return r+=Sl[a][0]*o,i+=Sl[a][1]*o,{q:r,r:i}}function wl(e){if(!e)return[];let t=ge(),n=[],r;for(;r=t.exec(e);)n.push(r[0]);return n}function Tl(e){return wl(e).join(``)}var El=`#f4f3f0`,Dl=`#ffffff`,Ol=`#262421`,kl=`#6f6b63`,K=`#d9d6d0`,Al=`#c47b2b`,jl=`#efc360`,Ml=12,Nl=`polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`,Pl=A.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  background: ${El};
  color: ${Ol};
  overflow: hidden;
  font-family: sans-serif;
  touch-action: pan-x pan-y;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`,Fl=A.div`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;

  @media (max-width: 640px) {
    width: 100%;
  }
`,Il=A.div`
  display: flex;
  flex-direction: column;
  width: 280px;
  flex: none;
  border-left: 1px solid ${K};
  background: ${Dl};
  min-height: 0;

  @media (max-width: 640px) {
    width: 100%;
    max-height: 44%;
    border-left: 0;
    border-top: 1px solid ${K};
  }
`;function Ll(e,t){let n=t.find(t=>String(t.id)===String(e.categories?.[0])),r=n?.color_background??Al,i=e.status===`suspended`?k.mix(r,El,45).toHexString():r;return{fill:i,text:dl(i,n?.color_text)}}function Rl(e){return e.status===`suspended`?`suspended`:`not started`}function zl(e,t,n){let r=n.find(e=>String(e.id)===String(t.categories?.[0])),i=r?.color_background??jl,a=dl(i,r?.color_text),o=Math.min(window.devicePixelRatio||1,2),s=document.createElement(`canvas`);s.width=420*o,s.height=220*o,s.style.width=`420px`,s.style.height=`220px`,Object.assign(s.style,{filter:`drop-shadow(0 0 18px rgba(255, 74, 0, 0.85))`,left:`${e.clientX-100-18}px`,pointerEvents:`none`,position:`fixed`,top:`${e.clientY-140-8}px`,zIndex:`2147483647`});let c=s.getContext(`2d`);if(!c)return;c.scale(o,o);let l=Array.from(String(t.id)).reduce((e,t)=>e*31+t.charCodeAt(0)>>>0,2654435769),u=()=>(l=l*1664525+1013904223>>>0,l/4294967296),d=Array.from({length:15},(e,t)=>({x:105+t*15+(u()-.5)*8,width:12+u()*18,height:22+u()*43,lean:(u()-.5)*18,phase:u()*Math.PI*2,speed:2.2+u()*2.4})),f=Array.from({length:34},()=>({x:100+u()*220,rise:u()*62,radius:.6+u()*1.5,speed:13+u()*24,phase:u()*Math.PI*2,hot:u()>.35})),p=t.name||``;c.font=`11px sans-serif`;let m=p;for(;m.length>0&&c.measureText(m).width>210;)m=m.slice(0,-1);m!==p&&(m=`${m.slice(0,-1)}…`),document.body.appendChild(s);let h=document.createElement(`canvas`);h.width=1,h.height=1,e.dataTransfer.setDragImage(h,0,0);let g=performance.now(),_=0,v=!1,y=e=>{if(v)return;let t=(e-g)/1e3;c.clearRect(0,0,420,220),c.save(),c.globalCompositeOperation=`lighter`;let n=.84+Math.sin(t*4.5)*.16,r=c.createRadialGradient(210,125,2,210,125,95);r.addColorStop(0,`rgba(255, 228, 94, ${.34*n})`),r.addColorStop(.2,`rgba(255, 92, 0, ${.3*n})`),r.addColorStop(.55,`rgba(244, 31, 0, ${.15*n})`),r.addColorStop(1,`rgba(105, 0, 255, 0)`),c.fillStyle=r,c.fillRect(0,0,420,220);let o=c.createRadialGradient(210,140,0,210,140,70);o.addColorStop(0,`rgba(255, 255, 206, ${.4*n})`),o.addColorStop(.3,`rgba(255, 177, 31, ${.25*n})`),o.addColorStop(1,`rgba(255, 55, 0, 0)`),c.fillStyle=o,c.fillRect(30,70,360,140),c.restore(),c.save(),c.globalCompositeOperation=`lighter`,c.shadowColor=`rgba(255, 73, 0, 1)`,c.shadowBlur=21,d.forEach(e=>{let n=Math.sin(t*e.speed+e.phase),r=.83+Math.sin(t*e.speed*1.7+e.phase)*.17,i=e.height*r,a=e.lean+n*7,o=c.createLinearGradient(e.x,140,e.x+a,140-i);o.addColorStop(0,`rgba(255, 238, 125, 0.98)`),o.addColorStop(.28,`rgba(255, 133, 18, 0.92)`),o.addColorStop(.68,`rgba(255, 34, 0, 0.62)`),o.addColorStop(1,`rgba(126, 0, 255, 0)`),c.fillStyle=o,c.beginPath(),c.moveTo(e.x-e.width/2,141),c.bezierCurveTo(e.x-e.width*.45+n*2,140-i*.34,e.x+a-e.width*.08,140-i*.72,e.x+a,140-i),c.bezierCurveTo(e.x+a+e.width*.25,140-i*.62,e.x+e.width*.48-n*2,140-i*.3,e.x+e.width/2,141),c.closePath(),c.fill()}),c.shadowBlur=7,f.forEach(e=>{let n=(e.rise+t*e.speed)%62,r=e.x+Math.sin(t*3+e.phase)*4;c.globalAlpha=Math.max(0,1-n/62),c.fillStyle=e.hot?`#ffe08a`:`#ff4d00`,c.beginPath(),c.arc(r,140-n,e.radius,0,Math.PI*2),c.fill()}),c.restore(),c.save(),c.shadowColor=`rgba(255, 72, 0, 1)`,c.shadowBlur=22+Math.sin(t*7)*6,c.fillStyle=i,c.fillRect(100,140,220,20),c.restore(),c.fillStyle=i,c.fillRect(100,140,220,20),c.fillStyle=a,c.font=`11px sans-serif`,c.textBaseline=`middle`,c.fillText(m,105,150),_=requestAnimationFrame(y)},b=e=>{(e.clientX!==0||e.clientY!==0)&&(s.style.left=`${e.clientX-100-18}px`,s.style.top=`${e.clientY-140-8}px`)},x=e.currentTarget,S=()=>{v||(v=!0,cancelAnimationFrame(_),s.remove(),document.removeEventListener(`dragover`,b),x.removeEventListener(`drag`,b),x.removeEventListener(`dragend`,S),document.removeEventListener(`drop`,S))};document.addEventListener(`dragover`,b),x.addEventListener(`drag`,b),x.addEventListener(`dragend`,S,{once:!0}),document.addEventListener(`drop`,S,{once:!0}),_=requestAnimationFrame(y)}function Bl(e){let t=Number(e);return!Number.isFinite(t)||t<=0?null:t}function Vl({activityId:e,updateActivity:t}){let[n,r]=j.useState(``);if(!t)return null;let i=()=>{let i=Bl(n);i!=null&&(t(e,{weight:i}),r(``))};return(0,N.jsx)(`input`,{type:`number`,min:1,step:1,inputMode:`decimal`,placeholder:`🏋️`,title:`Set weight to place in the hex field`,value:n,onChange:e=>r(e.target.value),onBlur:i,onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),i())},style:{width:44,flex:`none`,padding:`2px 4px`,border:`1px solid ${K}`,borderRadius:3,background:Dl,color:Ol,fontSize:11}})}function Hl({activities:e,beginActivity:t,categories:n,collapsed:r=!1,deleteActivity:i,focusActivity:a,onToggleCollapsed:o,planInLimbo:s,threads:c={},updateActivity:l}){let[u,d]=j.useState(``),[f,p]=j.useState(!1),m=vl(e),h=m.filter(e=>e.weighted),g=m.filter(e=>!e.weighted),_=xl(h,0,0),v=e=>{let t=e.thread?.id??e.thread_id;return t===void 0?e.thread:c[String(t)]??e.thread},y=_.reduce((e,t)=>({minX:Math.min(e.minX,t.x-bl(t.radius)),minY:Math.min(e.minY,t.y-t.radius),maxX:Math.max(e.maxX,t.x+bl(t.radius)),maxY:Math.max(e.maxY,t.y+t.radius)}),{minX:1/0,minY:1/0,maxX:-1/0,maxY:-1/0}),b=_.length>0?y.maxX-y.minX+24:0,x=_.length>0?y.maxY-y.minY+24:0,S=()=>{let e=u.trim();!e||!s||(s(e),d(``),p(!1))};return r?(0,N.jsxs)(`div`,{"aria-label":`Limbo`,"data-native-scroll":`true`,style:{display:`flex`,alignItems:`center`,gap:8,height:36,flex:`none`,padding:`0 12px`,borderTop:`1px solid ${K}`,background:El,color:Ol,fontFamily:`sans-serif`},children:[(0,N.jsxs)(`button`,{type:`button`,title:`Expand limbo`,"aria-expanded":!1,onClick:()=>o?.(),style:{display:`flex`,alignItems:`center`,gap:10,flex:1,minWidth:0,height:`100%`,margin:0,padding:0,border:0,background:`transparent`,color:`inherit`,cursor:`pointer`,font:`inherit`,textAlign:`left`},children:[(0,N.jsx)(`strong`,{style:{fontSize:12,letterSpacing:`0.08em`,textTransform:`uppercase`},children:`Limbo`}),m.length>0&&(0,N.jsxs)(`span`,{style:{fontSize:11,color:kl},children:[h.length,` weighted · `,g.length,` unweighted`]}),m.length===0&&(0,N.jsx)(`span`,{style:{fontSize:11,color:kl},children:`Empty`}),(0,N.jsx)(`span`,{"aria-hidden":!0,style:{marginLeft:`auto`,fontSize:11,color:kl},children:`▲`})]}),s&&(f?(0,N.jsx)(`input`,{autoFocus:!0,value:u,placeholder:`Name the idea…`,"aria-label":`New limbo activity name`,onChange:e=>d(e.target.value),onBlur:()=>{u.trim()||p(!1)},onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),S()),e.key===`Escape`&&(d(``),p(!1))},style:{width:160,flex:`none`,padding:`3px 8px`,border:`1px solid ${K}`,borderRadius:4,background:Dl,color:Ol,fontSize:12}}):(0,N.jsx)(`button`,{type:`button`,title:`Add an untimed idea to limbo`,"aria-label":`New limbo activity`,onClick:()=>p(!0),style:{flex:`none`,padding:`2px 8px`,border:`1px solid ${K}`,borderRadius:4,background:Dl,color:Ol,cursor:`pointer`,fontSize:11},children:`New`}))]}):(0,N.jsxs)(Pl,{"aria-label":`Limbo`,"data-native-scroll":`true`,children:[(0,N.jsxs)(Fl,{role:`img`,"aria-label":`Limbo hex field`,children:[_.length>0&&(0,N.jsx)(`div`,{style:{position:`relative`,flex:`none`,margin:`auto`,width:b,height:x},children:_.map(e=>{let t=h.find(t=>String(t.activity.id)===e.id);if(!t)return null;let{activity:r}=t,i=bl(e.radius),{fill:o,text:s}=Ll(r,n),c=v(r),l=Tl(c?.name);return(0,N.jsxs)(`div`,{role:`button`,tabIndex:0,title:`${r.name??``} (${Rl(r)}, weight ${r.weight}${c?.name?`, ${c.name}`:``})`,draggable:!0,onDragStart:e=>{e.dataTransfer.setData(`text/flambe-activity`,String(r.id)),e.dataTransfer.effectAllowed=`move`,zl(e,r,n)},onClick:()=>a(r.id),onKeyDown:e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),a(r.id))},style:{position:`absolute`,left:e.x-i-y.minX+Ml,top:e.y-e.radius-y.minY+Ml,width:i*2,height:e.radius*2,padding:`${e.radius*.5}px ${i*.18}px`,boxSizing:`border-box`,display:`flex`,flexDirection:`column`,alignItems:`center`,justifyContent:`center`,gap:2,clipPath:Nl,background:o,color:s,border:`none`,cursor:`grab`,fontSize:Math.max(10,Math.min(13,e.radius/4)),lineHeight:1.15,fontStyle:r.status===`suspended`?`italic`:`normal`,userSelect:`none`},children:[l&&(0,N.jsx)(`span`,{"aria-hidden":!0,style:{flex:`none`,fontSize:Math.max(12,Math.min(18,e.radius/3)),fontStyle:`normal`,lineHeight:1},children:l}),(0,N.jsx)(`span`,{style:{display:`-webkit-box`,WebkitBoxOrient:`vertical`,WebkitLineClamp:l?2:3,overflow:`hidden`,overflowWrap:`anywhere`},children:r.name})]},e.id)})}),m.length===0&&(0,N.jsx)(`p`,{style:{margin:`auto`,color:kl},children:`Limbo is empty.`}),m.length>0&&_.length===0&&(0,N.jsx)(`p`,{style:{margin:`auto`,color:kl,fontSize:12},children:`Set a weight on the list to grow the hex field.`})]}),(g.length>0||s||o)&&(0,N.jsxs)(Il,{children:[(s||o)&&(0,N.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`flex-end`,gap:6,padding:`6px 8px`,borderBottom:g.length>0?`1px solid ${K}`:void 0,flex:`none`},children:[s&&(f?(0,N.jsx)(`input`,{autoFocus:!0,value:u,placeholder:`Name the idea…`,"aria-label":`New limbo activity name`,onChange:e=>d(e.target.value),onBlur:()=>{u.trim()||p(!1)},onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),S()),e.key===`Escape`&&(d(``),p(!1))},style:{flex:1,minWidth:0,padding:`3px 8px`,border:`1px solid ${K}`,borderRadius:4,background:Dl,color:Ol,fontSize:12}}):(0,N.jsx)(`button`,{type:`button`,title:`Add an untimed idea to limbo`,"aria-label":`New limbo activity`,onClick:()=>p(!0),style:{padding:`2px 8px`,border:`1px solid ${K}`,borderRadius:4,background:El,color:Ol,cursor:`pointer`,fontSize:11},children:`New`})),o&&(0,N.jsx)(`button`,{type:`button`,title:`Collapse limbo`,"aria-expanded":!0,"aria-label":`Collapse limbo`,onClick:()=>o(),style:{padding:`2px 6px`,border:`1px solid ${K}`,borderRadius:4,background:El,color:kl,cursor:`pointer`,fontSize:11},children:`▼`})]}),g.length>0&&(0,N.jsx)(`ul`,{style:{margin:0,padding:8,listStyle:`none`,overflow:`auto`,flex:1,minHeight:0},children:g.map(({activity:e})=>{let{fill:r}=Ll(e,n);return(0,N.jsxs)(`li`,{style:{display:`flex`,gap:6,marginBottom:6,alignItems:`center`},children:[(0,N.jsx)(`div`,{role:`button`,tabIndex:0,title:`${e.name??``} (${Rl(e)})`,draggable:!0,onDragStart:t=>{t.dataTransfer.setData(`text/flambe-activity`,String(e.id)),t.dataTransfer.effectAllowed=`move`,zl(t,e,n)},onClick:()=>a(e.id),onKeyDown:t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),a(e.id))},style:{flex:1,minWidth:0,textAlign:`left`,borderLeft:`6px solid ${r}`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,fontStyle:e.status===`suspended`?`italic`:`normal`,background:`transparent`,color:`inherit`,cursor:`grab`,padding:`4px 6px`,userSelect:`none`},children:e.name}),(0,N.jsx)(Vl,{activityId:e.id,updateActivity:l}),e.status===`unstarted`&&e.thread_id!==void 0&&(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`button`,{type:`button`,onClick:()=>t(e.id),children:`Begin`}),(0,N.jsx)(`button`,{type:`button`,onClick:()=>i(e.id,e.thread_id),children:`Give up`})]}),e.status===`suspended`&&(0,N.jsx)(`button`,{type:`button`,onClick:()=>a(e.id),children:`View`})]},String(e.id))})})]})]})}var Ul=j.memo(Hl),Wl=`
  float random(vec2 v) {
    return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noiseOverTime(vec2 v, float time) {
    vec2 iUv = floor(v * 12.1) * (1.0 + sin(time));
    vec2 fUv = fract(v * 12.1) * (1.0 + sin(time));
    float a = random(iUv);
    float b = random(iUv + vec2(1.0, 0.0));
    float c = random(iUv + vec2(0.0, 1.0));
    float d = random(iUv + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fUv);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float noiseWithoutTime(vec2 v) {
    vec2 iUv = floor(v * 10.1);
    vec2 fUv = fract(v * 10.1);
    float a = random(iUv);
    float b = random(iUv + vec2(1.0, 0.0));
    float c = random(iUv + vec2(0.0, 1.0));
    float d = random(iUv + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fUv);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float noise(vec2 v, float time) {
    vec2 iUv = floor(v * 12.1) * (1.0 + sin(time));
    vec2 fUv = fract(v * 12.1) * (1.0 + sin(time));
    float a = random(iUv);
    float b = random(iUv + vec2(1.0, 0.0));
    float c = random(iUv + vec2(0.0, 1.0));
    float d = random(iUv + vec2(1.0, 1.0));
    vec2 u = smoothstep(0.0, 1.0, fUv);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
`,Gl=`
  attribute vec2 aPosition;
  attribute vec2 aTexCoord;
  varying vec2 vUV;
  uniform float uFlipY;

  void main() {
    gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
    vUV = vec2(aTexCoord.x, mix(aTexCoord.y, 1.0 - aTexCoord.y, uFlipY));
  }
`,Kl=`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uTexture;

  void main() {
    gl_FragColor = texture2D(uTexture, vUV);
  }
`,ql={swyzzle:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
               f.y);
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float distanceFromPointer = length((vUV - uPointer) * aspect);
    float influence = exp(-distanceFromPointer * 13.0);
    vec2 drag = uVelocity * influence * 0.022;

    float bands = noise(vec2(vUV.x * 8.0, vUV.y * 2.0 + uTime * 0.08));
    float melt = smoothstep(0.35, 0.9, bands) * (0.002 + uTime * 0.000035);
    vec2 warped = clamp(vUV - drag + vec2((bands - 0.5) * 0.002, melt), 0.0, 1.0);

    vec4 fresh = texture2D(uImage, warped);
    vec4 previous = texture2D(uFeedback, clamp(warped + vec2(0.0, melt * 0.4), 0.0, 1.0));
    gl_FragColor = mix(fresh, previous, 0.91);
  }
`,fluid:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;

  void main() {
    vec2 pixel = 1.0 / max(uResolution, vec2(1.0));
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float distanceFromPointer = length((vUV - uPointer) * aspect);
    float influence = exp(-distanceFromPointer * 18.0);
    vec2 flow = uVelocity * influence * 0.035;
    flow += vec2(sin(vUV.y * 30.0 + uTime) * pixel.x,
                 cos(vUV.x * 24.0 + uTime * 0.8) * pixel.y) * 2.0;

    vec2 sampleUV = clamp(vUV - flow, 0.0, 1.0);
    vec4 previous = texture2D(uFeedback, sampleUV);
    vec4 fresh = texture2D(uImage, sampleUV);
    gl_FragColor = mix(fresh, previous, 0.965);
  }
`,og:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${Wl}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uv, pointer), 0.001);
    vec2 drag = 0.0001 * uVelocity / (dist * dist);

    vec2 transformedUV = vUV + drag;
    transformedUV.y -= uTime / 100000.0 * tan(vUV.x + 0.5 + noiseWithoutTime(sin(vUV.x) * vUV.xy)) * 0.0001 * noiseWithoutTime(vUV);
    transformedUV.x -= uTime / 100000.0 * tan(vUV.x + 0.5 + noiseWithoutTime(tan(vUV.x) * vUV.xy)) * 0.0001 * noiseWithoutTime(vUV);

    vec2 transformedUV2 = vUV + drag;
    transformedUV2.y = transformedUV.y - (vUV.x + noiseOverTime(vUV.xy, uTime)) * 0.01 * noiseOverTime(vUV, uTime);

    vec4 tex = texture2D(uFeedback, transformedUV);
    vec4 texOff2 = texture2D(uFeedback, transformedUV2);
    gl_FragColor = mix(tex, texOff2, 0.01);
  }
`,blendmelt:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${Wl}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uvForMouse = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uvForMouse, pointer), 0.001);
    vec2 speedTexel = vUV + 0.0001 * uVelocity / (dist * dist);

    vec4 texel = texture2D(uFeedback, vUV);
    vec2 pixel = 1.0 / max(uResolution, vec2(1.0));
    vec2 transformedUV = vUV;
    transformedUV.x += length(texel.rgb) * noiseOverTime(vUV, uTime) * sin(uTime) * pixel.x;
    transformedUV.y += length(texel.rgb) * noiseOverTime(vUV, uTime) * sin(uTime / 3.1414) * pixel.y;

    gl_FragColor = mix(texture2D(uFeedback, speedTexel), texture2D(uFeedback, transformedUV), 0.5);
  }
`,rgb:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${Wl}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uvForMouse = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uvForMouse, pointer), 0.001);
    vec2 velocity = 0.0001 * uVelocity / (dist * dist);

    vec4 texel = texture2D(uFeedback, vUV);
    vec4 texelr = texture2D(uFeedback, (noise(vUV * 100.0001, uTime) - 0.5) * 0.001 + vUV + velocity);
    vec4 texelg = texture2D(uFeedback, (noise(vUV * 100.0001, uTime) - 0.5) * 0.0011 + vUV + velocity * 1.2);
    vec4 texelb = texture2D(uFeedback, (noise(vUV * 100.0001, uTime) - 0.5) * 0.0012 + vUV + velocity * 1.1);
    vec4 texel2 = vec4(texelr.r, texelg.g, texelb.b, 1.0);
    gl_FragColor = mix(texel, texel2, 0.95);
  }
`,subtle:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  ${Wl}

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uvForMouse = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    float dist = max(distance(uvForMouse, pointer), 0.001);
    vec2 speedUV = vUV + 0.0001 * uVelocity / (dist * dist);

    vec4 texel = texture2D(uFeedback, speedUV);
    vec4 texel2 = texture2D(uFeedback, fract(vUV * 0.999 + 0.001 * noise(vUV, uTime)));
    gl_FragColor = mix(texel, texel2, 0.3);
  }
`,gameOfStrife:`
  precision highp float;
  varying vec2 vUV;
  uniform sampler2D uImage;
  uniform sampler2D uFeedback;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;

  vec4 maxNeighbor(vec4 center, vec4 n0, vec4 n1, vec4 n2, vec4 n3, vec4 n4, vec4 n5, vec4 n6, vec4 n7) {
    vec4 result = center;
    result = length(n0) > length(result) ? n0 : result;
    result = length(n1) > length(result) ? n1 : result;
    result = length(n2) > length(result) ? n2 : result;
    result = length(n3) > length(result) ? n3 : result;
    result = length(n4) > length(result) ? n4 : result;
    result = length(n5) > length(result) ? n5 : result;
    result = length(n6) > length(result) ? n6 : result;
    result = length(n7) > length(result) ? n7 : result;
    return result;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUV.x * aspect, vUV.y);
    vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
    vec2 pixel = 1.0 / max(uResolution, vec2(1.0));

    vec4 n0 = texture2D(uFeedback, vUV + pixel * vec2(-1.0, 1.0));
    vec4 n1 = texture2D(uFeedback, vUV + pixel * vec2(-1.0, 0.0));
    vec4 n2 = texture2D(uFeedback, vUV + pixel * vec2(-1.0, -1.0));
    vec4 n3 = texture2D(uFeedback, vUV + pixel * vec2(0.0, 1.0));
    vec4 n4 = texture2D(uFeedback, vUV + pixel * vec2(0.0, -1.0));
    vec4 n5 = texture2D(uFeedback, vUV + pixel * vec2(1.0, 1.0));
    vec4 n6 = texture2D(uFeedback, vUV + pixel * vec2(1.0, 0.0));
    vec4 n7 = texture2D(uFeedback, vUV + pixel * vec2(1.0, -1.0));

    vec4 tex = texture2D(uFeedback, vUV);
    float population = length((n0 + n1 + n2 + n3 + n4 + n5 + n6 + n7).rgb);
    bool alive = length(tex.rgb) > 0.2;
    vec4 outColor = tex;

    if (alive) {
      if (population < 2.0) outColor = tex / 1.05;
      else if (population < 4.0) outColor = mix(tex, maxNeighbor(tex, n0, n1, n2, n3, n4, n5, n6, n7), 0.5);
      else outColor = tex / 1.05;
    } else if (population > 2.0 && population < 4.0) {
      outColor = mix(tex, maxNeighbor(tex, n0, n1, n2, n3, n4, n5, n6, n7), 0.5);
    } else {
      outColor = tex / 1.05;
    }

    if (distance(pointer, uv) < 0.01) {
      outColor = vec4(1.0);
    }

    gl_FragColor = outColor;
  }
`},Jl=new Set([`gameOfStrife`]),Yl=[`basic`,...Object.keys(ql)],Xl=`swyzzle`,Zl=new Set(Yl);function Ql(e){return typeof e==`string`&&Zl.has(e)}function $l(e){return Ql(e)?e:Xl}function eu(e){let t=e;if(t.videoWidth&&t.videoHeight)return{width:t.videoWidth,height:t.videoHeight};let n=e;if(n.naturalWidth&&n.naturalHeight)return{width:n.naturalWidth,height:n.naturalHeight};let r=e;if(r.width&&r.height)return{width:r.width,height:r.height};throw TypeError(`The capture source has no readable dimensions.`)}function tu(e,t){if(e==null)throw Error(`Unable to create the WebGL ${t}.`);return e}var nu=class{canvas;gl;effect;pointer;velocity;startedAt;running;destroyed;source;sourceWidth;sourceHeight;frameHandle;lastPointer;programs;positionBuffer;sourceTexture;feedbackTextures;framebuffers;readIndex;constructor(e,t={}){if(!(e instanceof HTMLCanvasElement))throw TypeError(`SwyzzleRenderer requires an HTMLCanvasElement.`);this.canvas=e;let n=e.getContext(`webgl`,{alpha:!0,antialias:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!n)throw Error(`WebGL is not available.`);if(this.gl=n,this.effect=t.effect||`swyzzle`,!Zl.has(this.effect))throw RangeError(`Unknown effect: ${this.effect}`);this.pointer=[.5,.5],this.velocity=[0,0],this.startedAt=performance.now(),this.running=!1,this.destroyed=!1,this.source=null,this.sourceWidth=0,this.sourceHeight=0,this.frameHandle=null,this.lastPointer=null,this.programs=new Map,this.positionBuffer=this.createQuadBuffer(),this.sourceTexture=this.createTexture(),this.feedbackTextures=[this.createTexture(),this.createTexture()],this.framebuffers=[tu(this.gl.createFramebuffer(),`framebuffer`),tu(this.gl.createFramebuffer(),`framebuffer`)],this.readIndex=0,this.handlePointerMove=this.handlePointerMove.bind(this),window.addEventListener(`pointermove`,this.handlePointerMove,{passive:!0}),window.addEventListener(`resize`,this.resize,{passive:!0}),this.resize(),t.autoStart!==!1&&this.start()}static get effects(){return[...Zl]}createQuadBuffer(){let e=tu(this.gl.createBuffer(),`buffer`);return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([0,0,0,0,1,0,1,0,0,1,0,1,1,1,1,1]),this.gl.STATIC_DRAW),e}createTexture(){let e=tu(this.gl.createTexture(),`texture`);return this.gl.bindTexture(this.gl.TEXTURE_2D,e),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MIN_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_MAG_FILTER,this.gl.LINEAR),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_S,this.gl.CLAMP_TO_EDGE),this.gl.texParameteri(this.gl.TEXTURE_2D,this.gl.TEXTURE_WRAP_T,this.gl.CLAMP_TO_EDGE),e}compileProgram(e){let t=this.gl,n=(e,n)=>{let r=tu(t.createShader(e),`shader`);if(t.shaderSource(r,n),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS)){let e=t.getShaderInfoLog(r);throw t.deleteShader(r),Error(`Shader compilation failed: ${e}`)}return r},r=n(t.VERTEX_SHADER,Gl),i=n(t.FRAGMENT_SHADER,e),a=tu(t.createProgram(),`program`);if(t.attachShader(a,r),t.attachShader(a,i),t.linkProgram(a),t.deleteShader(r),t.deleteShader(i),!t.getProgramParameter(a,t.LINK_STATUS)){let e=t.getProgramInfoLog(a);throw t.deleteProgram(a),Error(`Shader linking failed: ${e}`)}return a}getProgram(e){let t=this.programs.get(e);if(t)return t;let n=e===`display`?Kl:ql[e];if(!n)throw RangeError(`Unknown effect: ${e}`);let r=this.compileProgram(n);return this.programs.set(e,r),r}setSource(e){this.assertAlive();let{width:t,height:n}=eu(e);return this.source=e,this.sourceWidth=t,this.sourceHeight=n,this.upload(this.sourceTexture,e),this.seedFeedback(),this.startedAt=performance.now(),this.render(),this}capture(e){return this.setSource(e)}refreshSource(e){this.assertAlive();let{width:t,height:n}=eu(e);return!this.source||t!==this.sourceWidth||n!==this.sourceHeight?this.setSource(e):(this.source=e,this.upload(this.sourceTexture,e),this)}upload(e,t){let n=this.gl;n.bindTexture(n.TEXTURE_2D,e),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,n.RGBA,n.UNSIGNED_BYTE,t)}seedFeedback(){if(this.source){for(let e of this.feedbackTextures)this.upload(e,this.source);this.feedbackTextures.forEach((e,t)=>{if(this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.framebuffers[t]),this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,e,0),this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)!==this.gl.FRAMEBUFFER_COMPLETE)throw Error(`Unable to create the WebGL feedback buffer.`)}),this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.readIndex=0}}setEffect(e){if(this.assertAlive(),!Zl.has(e))throw RangeError(`Unknown effect: ${e}`);return this.effect=e,this.source&&this.reset(),this}reset(){return this.assertAlive(),this.source&&(this.seedFeedback(),this.startedAt=performance.now(),this.velocity=[0,0],this.render()),this}start(){return this.assertAlive(),this.running||(this.running=!0,this.frameHandle=requestAnimationFrame(this.tick)),this}stop(){return this.running=!1,this.frameHandle!==null&&cancelAnimationFrame(this.frameHandle),this.frameHandle=null,this}tick=()=>{!this.running||this.destroyed||(this.render(),this.frameHandle=requestAnimationFrame(this.tick))};resize=()=>{if(this.destroyed)return;let e=window.devicePixelRatio||1,t=Math.max(1,Math.round(this.canvas.clientWidth*e)),n=Math.max(1,Math.round(this.canvas.clientHeight*e));(this.canvas.width!==t||this.canvas.height!==n)&&(this.canvas.width=t,this.canvas.height=n)};handlePointerMove(e){let t=this.canvas.getBoundingClientRect();if(!t.width||!t.height)return;let n=[Math.min(1,Math.max(0,(e.clientX-t.left)/t.width)),Math.min(1,Math.max(0,(e.clientY-t.top)/t.height))];this.lastPointer&&(this.velocity=[n[0]-this.lastPointer[0],n[1]-this.lastPointer[1]]),this.lastPointer=n,this.pointer=n}bindQuad(e){let t=this.gl;t.bindBuffer(t.ARRAY_BUFFER,this.positionBuffer);let n=t.getAttribLocation(e,`aPosition`),r=t.getAttribLocation(e,`aTexCoord`);t.enableVertexAttribArray(n),t.vertexAttribPointer(n,2,t.FLOAT,!1,16,0),t.enableVertexAttribArray(r),t.vertexAttribPointer(r,2,t.FLOAT,!1,16,8)}bindTexture(e,t,n,r,i=this.gl.LINEAR){let a=this.gl;a.activeTexture(a.TEXTURE0+n),a.bindTexture(a.TEXTURE_2D,r),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,i),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,i),a.uniform1i(a.getUniformLocation(e,t),n)}draw(e,t){let n=this.gl;this.bindQuad(e),n.uniform1f(n.getUniformLocation(e,`uFlipY`),+!!t),n.drawArrays(n.TRIANGLE_STRIP,0,4)}render(){if(!this.source||this.destroyed)return;let e=this.gl;this.resize();let t=this.sourceTexture;if(this.effect!==`basic`){let n=1-this.readIndex,r=this.getProgram(this.effect),i=Jl.has(this.effect)?e.NEAREST:e.LINEAR;e.bindFramebuffer(e.FRAMEBUFFER,this.framebuffers[n]),e.viewport(0,0,this.sourceWidth,this.sourceHeight),e.useProgram(r),this.bindTexture(r,`uImage`,0,this.sourceTexture,e.LINEAR),this.bindTexture(r,`uFeedback`,1,this.feedbackTextures[this.readIndex],i),e.uniform1f(e.getUniformLocation(r,`uTime`),(performance.now()-this.startedAt)/1e3),e.uniform2fv(e.getUniformLocation(r,`uPointer`),this.pointer),e.uniform2fv(e.getUniformLocation(r,`uVelocity`),this.velocity),e.uniform2f(e.getUniformLocation(r,`uResolution`),this.sourceWidth,this.sourceHeight),this.draw(r,!1),this.readIndex=n,t=this.feedbackTextures[this.readIndex]}let n=this.getProgram(`display`);e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,this.canvas.width,this.canvas.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.useProgram(n),this.bindTexture(n,`uTexture`,0,t),this.draw(n,!0),this.velocity[0]*=.86,this.velocity[1]*=.86}destroy(){if(!this.destroyed){this.stop(),window.removeEventListener(`pointermove`,this.handlePointerMove),window.removeEventListener(`resize`,this.resize);for(let e of this.programs.values())this.gl.deleteProgram(e);this.gl.deleteBuffer(this.positionBuffer),this.gl.deleteTexture(this.sourceTexture);for(let e of this.feedbackTextures)this.gl.deleteTexture(e);for(let e of this.framebuffers)this.gl.deleteFramebuffer(e);this.destroyed=!0,this.source=null}}assertAlive(){if(this.destroyed)throw Error(`This Swyzzle renderer has been destroyed.`)}},ru=`#chart-wrapper canvas`,iu=400;function au(){return document.querySelector(ru)}function ou(e,t){let n=t.getBoundingClientRect();e.style.position=`fixed`,e.style.left=`${n.left}px`,e.style.top=`${n.top}px`,e.style.width=`${n.width}px`,e.style.height=`${n.height}px`,e.style.pointerEvents=`none`,e.style.zIndex=`6`}function su({enabled:e,effect:t,idleSeconds:n}){let r=(0,j.useRef)(null),[i,a]=(0,j.useState)(!1),o=(0,j.useRef)(!1);return o.current=i,(0,j.useEffect)(()=>{if(!e){a(!1);return}let t=new Ra(Aa(n),a);t.start();let r=new Set,i=()=>t.notePointerMove(),s=()=>t.noteWake(),c=e=>{if(Ia(e.target)){t.noteWake();return}Ma(e,o.current,r)&&(e.preventDefault(),e.stopPropagation()),t.noteWake()},l=e=>{Na(e,r)&&(e.preventDefault(),e.stopPropagation())};return window.addEventListener(`pointermove`,i,{passive:!0}),window.addEventListener(`pointerdown`,s,{passive:!0}),window.addEventListener(`wheel`,s,{passive:!0}),window.addEventListener(`touchstart`,s,{passive:!0}),window.addEventListener(`keydown`,c,!0),window.addEventListener(`keyup`,l,!0),()=>{t.stop(),window.removeEventListener(`pointermove`,i),window.removeEventListener(`pointerdown`,s),window.removeEventListener(`wheel`,s),window.removeEventListener(`touchstart`,s),window.removeEventListener(`keydown`,c,!0),window.removeEventListener(`keyup`,l,!0)}},[e,n]),(0,j.useEffect)(()=>{if(!e||!i)return;let n=r.current;if(!n)return;let a=$l(t),o=null;try{o=new nu(n,{effect:a})}catch{return}let s=()=>{let e=au(),t=document.getElementById(`chart-wrapper`)??e;if(!(!e||!t||!e.width||!e.height)){ou(n,t);try{o?.source?o.refreshSource(e):o?.capture(e)}catch{}}};s();let c=window.setInterval(s,iu);return window.addEventListener(`resize`,s,{passive:!0}),()=>{window.clearInterval(c),window.removeEventListener(`resize`,s),o?.destroy()}},[e,i,t]),!e||!i?null:(0,N.jsx)(`canvas`,{ref:r,"aria-hidden":`true`,"data-swyzzle-overlay":`true`,"data-swyzzle-effect":$l(t),style:{position:`fixed`,pointerEvents:`none`,zIndex:6}})}var cu=b(e=>({enabled:e.settings.swyzzle,effect:e.settings.swyzzleEffect,idleSeconds:e.settings.swyzzleIdleSeconds}))(su),lu=A.div`
  background: ${M.background};
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  padding: 4px 8px;
  position: absolute;
  pointer-events: none;

  font-family: ${dr};
  font-size: ${11}px;
`,uu=(e,t,n)=>{if(!e.current||!t.current)return null;let{x:r,y:i}=t.current.calcTooltipOffset(e.current);return{x:r,y:i+n}},du=b(e=>{let t=V(e);return{focusedBlockActivity_id:t.focusedBlockActivity_id,focusedBlockIndex:t.focusedBlockIndex,hoveredBlockIndex:t.hoveredBlockIndex,showActivityIds:e.settings.showActivityIds}})(({activities:e,blocks:t,flameChartRef:n,hoveredBlockIndex:r,focusedBlockIndex:i,focusedBlockActivity_id:a,showActivityIds:o,yOffset:s})=>{let c=n.current&&r!=null&&n.current.getBlockDetails(r),l=c&&r!=null&&t[r]?e[String(t[r].activity_id)]:null,u=c?c.ending:void 0,d=c?c.endMessage:void 0,f=l?o?String(l.id):l.name:null,p=c?c.startMessage:void 0,m=j.useRef(null),h,g;if(m.current&&n&&n.current){let e=uu(m,n,s);e&&(h=`${e.x}px`,g=`${e.y}px`)}return(0,N.jsxs)(lu,{ref:m,style:h&&g&&f?{left:h,top:g}:{top:0,opacity:0},children:[(0,N.jsx)(`div`,{children:f}),(0,N.jsx)(ws,{startMessage:p,endMessage:d,ending:u},p||d)]})}),fu=A.div`
  position: absolute;
  pointer-events: none;
  background: ${M[`focus-activity-bg`]};
  outline: solid black 2px;
  outline-offset: -2px;
`,pu=A.div`
  position: absolute;
  pointer-events: none;
  background: ${M[`hover-activity-bg`]};
`,mu=class extends j.Component{render(){let{flameChartRef:e,focusedBlockIndex:t,hoveredBlockIndex:n,yOffset:r}=this.props,i=t===null?null:e.current?.getBlockDetails(t),a=n==null?null:e.current?.getBlockDetails(n);return(0,N.jsxs)(N.Fragment,{children:[a&&a.blockWidth>0&&(0,N.jsx)(pu,{style:{left:`${a.blockX}px`,top:`${a.blockY+r}px`,width:`${a.blockWidth}px`,height:`${a.blockHeight}px`}},`hover`),i&&i.blockWidth>0&&(0,N.jsx)(fu,{style:{left:`${i.blockX}px`,top:`${i.blockY+r}px`,width:`${i.blockWidth}px`,height:`${i.blockHeight}px`}},`focus`)]})}},hu=b(e=>({focusedBlockIndex:V(e).focusedBlockIndex,hoveredBlockIndex:V(e).hoveredBlockIndex}),null,null,{forwardRef:!0})(mu),gu=60,_u=100,vu=`flambe.timeline.viewport-trace-id.v1`,yu=`flambe.limbo.collapsed.v1`,q=e=>typeof e==`number`&&Number.isFinite(e)&&e>0;function bu(e){if(typeof window>`u`)return null;try{return window.localStorage.getItem(e)}catch{return null}}function xu(e,t){if(!(typeof window>`u`))try{window.localStorage.setItem(e,t)}catch{}}function Su(){return bu(yu)===`1`}var Cu=(e={})=>Object.values(e).reduce((e,{collapsed:t})=>e+ +!!t,0),wu=class extends j.Component{state={dividersData:{offsets:[],precision:0,gridSliceTime:0},composingZoomChord:!1,height:0,limboCollapsed:Su(),threadModal_id:null,timeSeriesHeight:100,width:0,zoomChord:``,zoomChordMultiplier:1};flameChart=j.createRef();timeSeries=j.createRef();focusedBlock=j.createRef();timelineSurface=null;touchPoints=new Map;touchMode=`none`;panAxis=null;panStartX=0;panStartY=0;panLastX=0;panLastY=0;touchVelocityX=0;touchVelocityY=0;touchLastMoveTime=0;touchInertiaFrame=null;touchInertiaLastFrameTime=0;pinchLastDistance=0;viewportTraceId=null;leftBoundaryTime=0;rightBoundaryTime=0;topOffset=0;dividersData={offsets:[],precision:0,gridSliceTime:0};viewportAnimationFrame=null;zoomChordTimeout=null;zoomShortcutGuard=new Oa;constructor(e){super(e);let t={lbt:bu(`lbt`),rbt:bu(`rbt`)};this.viewportTraceId=bu(vu);let n=t.lbt&&Number.parseFloat(t.lbt),r=t.rbt&&Number.parseFloat(t.rbt),i=this.calculateGridOffsets();this.setTimelineState({...n?{leftBoundaryTime:n}:{},...r?{rightBoundaryTime:r}:{},dividersData:i}),e.addCommand({action:e=>{this.zoomTo(e.timePeriod)},copy:`zoom to...`,parameters:[{key:`timePeriod`,placeholder:`time period`,selector:()=>[{name:`now`,value:`now`},{name:`the last day`,value:`day`},{name:`the last week`,value:`week`},{name:`the last month`,value:`month`}],itemStringKey:`name`,itemReturnKey:`value`}]})}onTimelineKeyDown=e=>{this.zoomShortcutGuard.keyDown(e)&&(this.clearZoomChordTimeout(),this.setState({composingZoomChord:!1,zoomChord:``,zoomChordMultiplier:1}))};onTimelineKeyUp=e=>{let t=e;if(!this.zoomShortcutGuard.keyUp(t)&&!t.metaKey&&!t.ctrlKey&&!t.altKey&&!La(t)){if(this.state.composingZoomChord){if(this.clearZoomChordTimeout(),this.state.zoomChord.length===0){let e=``;switch(t.key){case`n`:this.setState({composingZoomChord:!1}),this.zoomTo(`now`);break;case`h`:e=`hour`;break;case`d`:e=`day`;break;case`w`:e=`week`;break;case`m`:e=`month`;break;case`y`:e=`year`;break;case`a`:e=`all`;break;default:this.setState({composingZoomChord:!1})}this.zoomTo(e),this.setState({zoomChord:e}),e&&this.scheduleZoomChordTimeout()}else t.key.match(/\d/)?(this.setState({zoomChordMultiplier:Number(t.key)}),this.setState({composingZoomChord:!1})):this.setState({composingZoomChord:!1,zoomChord:``,zoomChordMultiplier:1})}else t.key===`n`?this.zoomTo(`now`):t.key===`z`&&(this.setState({composingZoomChord:!0,zoomChord:``,zoomChordMultiplier:1}),this.scheduleZoomChordTimeout())}};componentDidMount(){Fi(this.props.trace_id,this.props.threads),requestAnimationFrame(this.drawChildren.bind(this))}componentWillUnmount(){this.cancelViewportAnimation(),this.cancelTouchInertia(),this.clearZoomChordTimeout(),this.detachTouchListeners()}clearZoomChordTimeout=()=>{this.zoomChordTimeout!==null&&(clearTimeout(this.zoomChordTimeout),this.zoomChordTimeout=null)};scheduleZoomChordTimeout=()=>{this.clearZoomChordTimeout(),this.zoomChordTimeout=setTimeout(()=>{this.zoomChordTimeout=null,this.setState({composingZoomChord:!1,zoomChord:``,zoomChordMultiplier:1})},1500)};setTimelineSurface=e=>{e!==this.timelineSurface&&(this.detachTouchListeners(),this.timelineSurface=e,e&&(this.attachTouchListeners(e),this.writeViewportDataset(e)))};attachTouchListeners=e=>{e.addEventListener(`touchstart`,this.onTouchStart,{passive:!0}),e.addEventListener(`touchmove`,this.onTouchMove,{passive:!1}),e.addEventListener(`touchend`,this.onTouchEnd,{passive:!0}),e.addEventListener(`touchcancel`,this.onTouchEnd,{passive:!0})};detachTouchListeners=()=>{let e=this.timelineSurface;e&&(e.removeEventListener(`touchstart`,this.onTouchStart),e.removeEventListener(`touchmove`,this.onTouchMove),e.removeEventListener(`touchend`,this.onTouchEnd),e.removeEventListener(`touchcancel`,this.onTouchEnd))};syncTouchPoints=e=>{this.touchPoints.clear();for(let t=0;t<e.length;t+=1){let n=e.item(t);n&&this.touchPoints.set(n.identifier,{clientX:n.clientX,clientY:n.clientY})}};touchPointsList=()=>Array.from(this.touchPoints.values());resetTouchVelocity=(e=0)=>{this.touchVelocityX=0,this.touchVelocityY=0,this.touchLastMoveTime=e};onTouchStart=e=>{if(this.cancelTouchInertia(),this.resetTouchVelocity(e.timeStamp),Va(e.target)){this.touchMode=`native`,this.panAxis=null,this.touchPoints.clear(),this.pinchLastDistance=0;return}this.syncTouchPoints(e.touches);let t=this.touchPointsList();if(t.length>=2){this.touchMode=`pinch`,this.panAxis=null,this.pinchLastDistance=Ua(t[0],t[1]);return}t.length===1&&(this.touchMode=`none`,this.panAxis=null,this.panStartX=t[0].clientX,this.panStartY=t[0].clientY,this.panLastX=t[0].clientX,this.panLastY=t[0].clientY)};onTouchMove=e=>{if(this.touchMode===`native`)return;this.syncTouchPoints(e.touches);let t=this.touchPointsList(),n=this.state.width;if(!(!(n>0)||!q(this.leftBoundaryTime)||!q(this.rightBoundaryTime))){if(t.length>=2){e.preventDefault(),this.resetTouchVelocity(e.timeStamp);let[r,i]=t,a=Ua(r,i);if(!(this.pinchLastDistance>0)){this.touchMode=`pinch`,this.panAxis=null,this.pinchLastDistance=a;return}let o=a/this.pinchLastDistance;this.pinchLastDistance=a,this.touchMode=`pinch`,this.panAxis=null;let s=this.timelineSurface;if(!s||!(o>0)||o===1)return;let c=s.getBoundingClientRect(),l=Ga(r,i).clientX-c.left,u=hi(l,this.leftBoundaryTime,this.rightBoundaryTime,n);this.zoom(Ka(o),l,u,n),requestAnimationFrame(this.drawChildren.bind(this));return}if(t.length===1){let r=t[0].clientX,i=t[0].clientY;if(this.touchMode!==`pan`){if(!Wa({clientX:this.panStartX,clientY:this.panStartY},{clientX:r,clientY:i}))return;this.touchMode=`pan`,this.panAxis=Ha({clientX:this.panStartX,clientY:this.panStartY},{clientX:r,clientY:i})}e.preventDefault();let a=qa(this.panLastX,r),o=qa(this.panLastY,i);this.panLastX=r,this.panLastY=i;let s=this.panAxis??`x`,c=s===`x`?a:0,l=s===`y`?o:0;if(c===0&&l===0)return;let u=Math.max(1,e.timeStamp-this.touchLastMoveTime);this.touchLastMoveTime=e.timeStamp,this.touchVelocityX=s===`x`?Ja(this.touchVelocityX,c,u):0,this.touchVelocityY=s===`y`?Ja(this.touchVelocityY,l,u):0,this.pan(c,l,n),requestAnimationFrame(this.drawChildren.bind(this))}}};onTouchEnd=e=>{if(this.touchMode===`native`){e.touches.length===0&&(this.touchMode=`none`,this.panAxis=null);return}let t=this.touchMode===`pan`,n=this.panAxis;this.syncTouchPoints(e.touches);let r=this.touchPointsList();if(r.length>=2){this.touchMode=`pinch`,this.panAxis=null,this.resetTouchVelocity(e.timeStamp),this.pinchLastDistance=Ua(r[0],r[1]);return}if(r.length===1){this.touchMode=`none`,this.panAxis=null,this.resetTouchVelocity(e.timeStamp),this.panStartX=r[0].clientX,this.panStartY=r[0].clientY,this.panLastX=r[0].clientX,this.panLastY=r[0].clientY,this.pinchLastDistance=0;return}this.touchMode=`none`,this.panAxis=null,this.pinchLastDistance=0,t&&n&&this.startTouchInertia(n)};cancelTouchInertia=()=>{this.touchInertiaFrame!==null&&(cancelAnimationFrame(this.touchInertiaFrame),this.touchInertiaFrame=null),this.touchInertiaLastFrameTime=0};startTouchInertia=e=>{if(this.cancelTouchInertia(),qi()){this.resetTouchVelocity();return}let t=e===`x`?this.touchVelocityX:0,n=e===`y`?this.touchVelocityY:0;if(!Xa(e===`x`?t:n)){this.resetTouchVelocity();return}let r=i=>{if(this.touchInertiaLastFrameTime===0){this.touchInertiaLastFrameTime=i,this.touchInertiaFrame=requestAnimationFrame(r);return}let a=Math.min(32,Math.max(1,i-this.touchInertiaLastFrameTime));if(this.touchInertiaLastFrameTime=i,t=Ya(t,a),n=Ya(n,a),!Xa(e===`x`?t:n)){this.cancelTouchInertia(),this.resetTouchVelocity();return}let o=this.leftBoundaryTime,s=this.topOffset;if(this.pan(e===`x`?t*a:0,e===`y`?n*a:0,this.state.width,!1),this.drawChildren(),e===`x`?this.leftBoundaryTime===o:this.topOffset===s){this.cancelTouchInertia(),this.resetTouchVelocity();return}this.touchInertiaFrame=requestAnimationFrame(r)};this.touchInertiaFrame=requestAnimationFrame(r)};componentDidUpdate(e){this.syncTimelineToProps(this.props,e),requestAnimationFrame(this.drawChildren)}syncTimelineToProps(e,t){(e.leftBoundaryTimeOverride!==t.leftBoundaryTimeOverride||e.rightBoundaryTimeOverride!==t.rightBoundaryTimeOverride)&&(this.cancelViewportAnimation(),this.cancelTouchInertia(),this.viewportTraceId=String(e.trace_id),this.setTimelineState({leftBoundaryTime:e.leftBoundaryTimeOverride,rightBoundaryTime:e.rightBoundaryTimeOverride}));let n=q(e.leftBoundaryTimeOverride)&&q(e.rightBoundaryTimeOverride),r=q(this.leftBoundaryTime)&&q(this.rightBoundaryTime),i=q(e.minTime)&&q(e.maxTime),a=Vi(this.leftBoundaryTime,this.rightBoundaryTime,e.minTime??0,e.maxTime??0,this.viewportTraceId,e.trace_id);!n&&i&&(!r||!a)&&(this.cancelViewportAnimation(),this.cancelTouchInertia(),this.viewportTraceId=String(e.trace_id),this.setTimelineState({leftBoundaryTime:e.minTime,rightBoundaryTime:Math.max(e.maxTime,Date.now())+F})),Cu(e.threads)!==Cu(t.threads)&&requestAnimationFrame(this.drawChildren.bind(this)),Fi(e.trace_id,e.threads)}handleWheel=e=>{let t=hi(e.nativeEvent.offsetX,this.leftBoundaryTime,this.rightBoundaryTime,this.state.width);if(e.getModifierState(`Shift`)){let t=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;this.pan(0,t,this.state.width),requestAnimationFrame(this.drawChildren.bind(this))}else Math.abs(e.deltaX)>=Math.abs(e.deltaY)?(this.pan(e.deltaX,0,this.state.width),requestAnimationFrame(this.drawChildren.bind(this))):(this.zoom(e.deltaY,e.nativeEvent.offsetX,t,this.state.width),requestAnimationFrame(this.drawChildren.bind(this)))};drawChildren=()=>{let{leftBoundaryTime:e,rightBoundaryTime:t}=this.getVisibleTimeRange();if(!q(e)||!q(t))return;(!q(this.leftBoundaryTime)||!q(this.rightBoundaryTime))&&this.setTimelineState({leftBoundaryTime:e,rightBoundaryTime:t});let n=this.calculateGridOffsets(e,t);this.dividersData=n,this.timeSeries.current&&this.timeSeries.current.draw(e,t,this.state.width),this.flameChart.current&&this.flameChart.current.draw(e,t,this.state.width,n,this.topOffset),this.flameChart.current&&(this.topOffset=this.flameChart.current.appliedTopOffset,this.writeViewportDataset()),this.focusedBlock&&this.focusedBlock.current&&this.focusedBlock.current.forceUpdate()};getVisibleTimeRange=(e=this.props)=>{let t=q(this.leftBoundaryTime)&&q(this.rightBoundaryTime),n=q(e.minTime)&&q(e.maxTime),r=!n||Vi(this.leftBoundaryTime,this.rightBoundaryTime,e.minTime,e.maxTime,this.viewportTraceId,e.trace_id);return t&&r?{leftBoundaryTime:this.leftBoundaryTime,rightBoundaryTime:this.rightBoundaryTime}:n?{leftBoundaryTime:e.minTime,rightBoundaryTime:Math.max(e.maxTime,Date.now())+F}:{leftBoundaryTime:null,rightBoundaryTime:null}};calculateGridOffsets(e=this.leftBoundaryTime,t=this.rightBoundaryTime){let n=this.state.width;if(!q(e)||!q(t)||!Number.isFinite(n)||n<=0)return{offsets:[],precision:0,gridSliceTime:0};let r=t-e,i=n/r;if(this.props.absoluteTimeLabels){let a=ua(r,n,_u),o=t+_u/i,s=ha(a);return{offsets:ma(e,o,a).map(e=>({position:Math.floor(this.timeToPixels(e)),time:e})),precision:Math.max(0,-Math.floor(Math.log(s*1.01)/Math.LN10)),gridSliceTime:s}}let a=gu,o=n/a,s=r/o;s=10**Math.ceil(Math.log(s)/Math.LN10),s*i>=300&&(s/=5),s*i>=120&&(s/=2);let c=Math.ceil((e-0)/s)*s+0,l=t;l+=a/i,o=Math.ceil((l-c)/s),s||(o=0);let u=[];for(let e=0;e<o;++e){let t=c+s*e;u.push({position:Math.floor(this.timeToPixels(t)),time:t})}return{offsets:u,precision:Math.max(0,-Math.floor(Math.log(s*1.01)/Math.LN10)),gridSliceTime:s}}timeToPixels(e){let{leftBoundaryTime:t,rightBoundaryTime:n}=this.getVisibleTimeRange();return t===null||n===null?0:gi(e,t,n,this.state.width)}zoomTo(e){this.viewportTraceId=String(this.props.trace_id);let t=Date.now(),n=null;switch(e){case`now`:n={leftBoundaryTime:t-10*L,rightBoundaryTime:t+F};break;case`hour`:n={leftBoundaryTime:t-60*L,rightBoundaryTime:t+F};break;case`day`:n={leftBoundaryTime:t-R,rightBoundaryTime:t+F};break;case`week`:n={leftBoundaryTime:t-aa,rightBoundaryTime:t+F};break;case`month`:n={leftBoundaryTime:t-oa,rightBoundaryTime:t+F};break;case`year`:n={leftBoundaryTime:t-12*oa,rightBoundaryTime:t+F};break;case`all`:q(this.props.minTime)&&(n={leftBoundaryTime:this.props.minTime,rightBoundaryTime:t+F})}n&&q(n.leftBoundaryTime)&&q(n.rightBoundaryTime)&&this.animateToTimeRange(n)}cancelViewportAnimation=()=>{this.viewportAnimationFrame!==null&&(cancelAnimationFrame(this.viewportAnimationFrame),this.viewportAnimationFrame=null)};animateToTimeRange=e=>{this.cancelTouchInertia(),this.cancelViewportAnimation();let t=this.getVisibleTimeRange();if(!q(t.leftBoundaryTime)||!q(t.rightBoundaryTime)||qi()){this.setTimelineState(e),this.drawChildren();return}let n={leftBoundaryTime:t.leftBoundaryTime,rightBoundaryTime:t.rightBoundaryTime},r=Gi($i(this.props.presetPanCurve)),i=Gi($i(this.props.presetZoomCurve)),a=null,o=t=>{a??=t;let s=Math.min(1,(t-a)/this.props.presetZoomDurationMs),c=Ki(n,e,s,r,i);this.leftBoundaryTime=c.leftBoundaryTime,this.rightBoundaryTime=c.rightBoundaryTime,this.drawChildren(),s<1?this.viewportAnimationFrame=requestAnimationFrame(o):(this.viewportAnimationFrame=null,this.setTimelineState(e))};this.viewportAnimationFrame=requestAnimationFrame(o)};zoom=(e,t,n,r)=>{this.cancelTouchInertia(),this.cancelViewportAnimation(),this.viewportTraceId=String(this.props.trace_id);let i=this.calculateGridOffsets(),{leftBoundaryTime:a,rightBoundaryTime:o}=ki(e,t,n,this.leftBoundaryTime,this.rightBoundaryTime,r,Date.now(),-1/0);this.setTimelineState({leftBoundaryTime:a,rightBoundaryTime:o,dividersData:i})};pan=(e,t,n,r=!0)=>{r&&this.cancelTouchInertia(),this.cancelViewportAnimation(),this.viewportTraceId=String(this.props.trace_id);let i=this.calculateGridOffsets(),a=this.flameChart.current?.maxTopOffset??1/0,{leftBoundaryTime:o,rightBoundaryTime:s,topOffset:c}=ji(e,t,this.leftBoundaryTime,this.rightBoundaryTime,n,this.topOffset,Date.now(),-1/0,a);this.setTimelineState({leftBoundaryTime:o,rightBoundaryTime:s,dividersData:i,topOffset:c})};writeViewportDataset=(e=this.timelineSurface)=>{if(!e)return;Number.isFinite(this.leftBoundaryTime)&&(e.dataset.lbt=String(this.leftBoundaryTime)),Number.isFinite(this.rightBoundaryTime)&&(e.dataset.rbt=String(this.rightBoundaryTime)),e.dataset.topOffset=String(this.topOffset||0);let t=this.flameChart.current?.maxTopOffset;t!==void 0&&(e.dataset.maxTopOffset=String(t))};setTimelineState=e=>{Object.assign(this,e),this.writeViewportDataset(),xa(this.setLocalStorage.bind(this))};showThreadDetail=e=>{this.setState({threadModal_id:Number(e)})};closeThreadDetail=()=>{this.setState({threadModal_id:null})};handlePaneChange=e=>{this.setState({timeSeriesHeight:e})};toggleLimboCollapsed=()=>{this.setState(({limboCollapsed:e})=>{let t=!e;return xu(yu,t?`1`:`0`),{limboCollapsed:t}})};selectLimboActivity=e=>{let t=this.props.activities[String(e)];this.props.focusBlock({index:null,activity_id:e,activityStatus:t?.status,thread_id:t?.thread_id??null}),this.props.showActivityDetails()};setLocalStorage=(0,pi.default)(()=>{Number.isFinite(this.leftBoundaryTime)&&Number.isFinite(this.rightBoundaryTime)&&(localStorage.setItem(`lbt`,String(this.leftBoundaryTime)),localStorage.setItem(`rbt`,String(this.rightBoundaryTime)),this.viewportTraceId&&localStorage.setItem(vu,this.viewportTraceId))},1e3);render(){let{props:e}=this,t=this.rightBoundaryTime||e.maxTime,n=this.leftBoundaryTime||e.minTime,r=Array.isArray(e.threads)?{}:e.attentionDrivenThreadOrder?Ei(e.attentionShifts,e.threads):e.threads;r=_a(e.activities,r);let i=(0,N.jsx)(_l,{ref:this.flameChart,activities:e.activities,attentionShifts:e.attentionShifts,blocks:e.blocks,categories:e.categories,currentAttention:(e.attentionShifts||[]).length>0?e.attentionShifts[e.attentionShifts.length-1].thread_id:null,modifiers:e.modifiers,pan:this.pan,showThreadDetail:this.showThreadDetail,threadLevels:e.threadLevels,hoverBlock:e.hoverBlock,focusBlock:e.focusBlock,focusedBlockIndex:e.focusedBlockIndex,hoveredBlockIndex:e.hoveredBlockIndex,onPreviewGeometryChange:()=>this.focusedBlock.current?.forceUpdate(),onCursorTimeChange:e.onCursorTimeChange,threads:r,toggleThread:e.toggleThread,topOffset:this.topOffset||0,updateEvent:e.updateEvent,updateScheduled:e.updateActivity,dropLimboActivity:e.dropLimboActivity??e.updateActivity,createAt:e.createActivityAt,zoom:this.zoom});return(0,N.jsx)(Za,{node:document,eventListeners:[[`keydown`,this.onTimelineKeyDown],[`keyup`,this.onTimelineKeyUp]],children:()=>(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(mi,{bounds:!0,onResize:e=>{(e.bounds.width!==this.state.width||e.bounds.height!==this.state.height)&&this.setState({width:e.bounds.width,height:e.bounds.height})},children:({measureRef:a})=>(0,N.jsxs)(`div`,{ref:e=>{a(e),this.setTimelineSurface(e)},"data-timeline-surface":`true`,style:{position:`relative`,height:`100%`,touchAction:`none`},onWheel:this.handleWheel,children:[(0,N.jsxs)(Rr,{split:`horizontal`,size:this.state.timeSeriesHeight,onChange:this.handlePaneChange,children:[(0,N.jsx)(al,{ref:this.timeSeries,height:`${this.state.timeSeriesHeight}px`,mantras:e.mantras,observations:e.observations??[],pan:this.pan,searchTerms:e.searchTerms,tabs:e.tabs.filter(({timestamp:e})=>e>(n??0)&&e<(t??0)),zoom:this.zoom}),this.state.limboCollapsed?(0,N.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,height:`100%`,minHeight:0},children:[(0,N.jsx)(`div`,{style:{flex:`1 1 0`,minHeight:0,position:`relative`},children:i}),(0,N.jsx)(Ul,{activities:e.activities,beginActivity:e.beginActivity??(()=>void 0),categories:e.categories,collapsed:!0,deleteActivity:e.deleteActivity??(()=>void 0),focusActivity:this.selectLimboActivity,onToggleCollapsed:this.toggleLimboCollapsed,planInLimbo:e.planActivityInLimbo,threads:r,updateActivity:e.updateActivity})]}):(0,N.jsxs)(Rr,{split:`horizontal`,primary:`second`,defaultSize:this.state.width<800?120:180,minSize:120,children:[i,(0,N.jsx)(Ul,{activities:e.activities,beginActivity:e.beginActivity??(()=>void 0),categories:e.categories,deleteActivity:e.deleteActivity??(()=>void 0),focusActivity:this.selectLimboActivity,onToggleCollapsed:this.toggleLimboCollapsed,planInLimbo:e.planActivityInLimbo,threads:r,updateActivity:e.updateActivity})]})]}),this.flameChart&&this.flameChart.current&&[(0,N.jsx)(hu,{ref:this.focusedBlock,yOffset:this.state.timeSeriesHeight+6,flameChartRef:this.flameChart},`focus`),(0,N.jsx)(du,{flameChartRef:this.flameChart,yOffset:this.state.timeSeriesHeight+6,activities:e.activities,blocks:e.blocks},`tooltip`)],(0,N.jsx)(ko,{closeThreadDetail:this.closeThreadDetail,id:this.state.threadModal_id,name:this.state.threadModal_id===null?void 0:e.threads[this.state.threadModal_id]?.name,activities:e.activities}),(0,N.jsx)(cu,{})]})}),(0,N.jsx)(yc,{blocks:e.blocks,activities:e.activities,submitCommand:e.submitCommand}),this.state.composingZoomChord&&(0,N.jsxs)(`div`,{style:{position:`fixed`,bottom:0,left:0,padding:`3px 6px`,borderRadius:`0 4px 0 0`,background:`rgba(255, 255, 255, 0.82)`,zIndex:10},children:[`Zoom to... (Waiting for second key of chord)`,` `,this.state.zoomChord,` `,this.state.zoomChordMultiplier,` `,`hours ago`]})]})})}};function Tu(e){let t=yo(e);return{activities:t.activities,blocks:t.blocks,categories:P(e).categories,mantras:P(e).mantras,observations:P(e).observations,minTime:t.minTime,maxTime:t.maxTime,modifiers:e.modifiers,threadLevels:t.threadLevels,threads:t.threads,lastCategory_id:t.lastCategory_id,lastThread_id:t.lastThread_id,attentionShifts:P(e).attentionShifts,searchTerms:P(e).searchTerms,absoluteTimeLabels:e.settings.absoluteTimeLabels,twelveHourClock:e.settings.twelveHourClock,attentionDrivenThreadOrder:e.settings.attentionDrivenThreadOrder,presetPanCurve:e.settings.presetPanCurve,presetZoomCurve:e.settings.presetZoomCurve,presetZoomDurationMs:e.settings.presetZoomDurationMs,darkerAsWeGoDown:e.settings.darkerAsWeGoDown,rightAlignTimelineText:e.settings.rightAlignTimelineText,tabs:P(e).tabs,leftBoundaryTimeOverride:V(e).leftBoundaryTime,rightBoundaryTimeOverride:V(e).rightBoundaryTime,focusedBlockIndex:t.focusedBlockIndex,hoveredBlockIndex:t.hoveredBlockIndex}}function Eu(e){return{toggleThread:(t,n=!1)=>e(n?sn(t):rn(t)),updateEvent:(t,n)=>e(On(t,n)),updateActivity:(t,n)=>e(Dn(t,n)),beginActivity:t=>e(wn(t)),deleteActivity:(t,n)=>e(En(t,n)),createActivityAt:(t,n)=>e(n>Date.now()?Tn({name:`Scheduled`,thread_id:t,scheduled_start:n}):vn({name:`New activity`,timestamp:n,description:``,thread_id:t,category_id:null,phase:`B`,editName:!0})),focusBlock:({index:t,activity_id:n,activityStatus:r,thread_id:i})=>e(Un({index:t,activity_id:n,activityStatus:r,thread_id:i})),hoverBlock:t=>e(Wn(t)),showActivityDetails:()=>e(Mn()),dispatch:e}}function Du(e,t,n){let{dispatch:r,...i}=t;return{...n,...e,...i,dropLimboActivity:(t,n)=>{if(e.activities[String(t)]?.status!==`suspended`){r(Dn(t,n));return}let i=n.thread_id,a=Number(n.scheduled_start_integer);r(Dn(t,{thread_id:i})),r(Sn({id:t,timestamp:a,thread_id:i}))},planActivityInLimbo:t=>{let n=t.trim();if(!n)return;let i=e.lastThread_id??Object.values(e.threads)[0]?.id;i!==void 0&&r(Tn({name:n,thread_id:i,scheduled_start:null,scheduled_end:null}))}}}var Ou=b(Tu,Eu,Du)(wu);function ku(e){return e}function Au(e,t,n,r){return(e-t)*r/(n-t)}function ju(e,t,n,r,i,a,o,s){t??=r;let c=Au(e>n?e:n,n,r,o);return{blockX:ku(a),blockY:c,blockHeight:Au(t,n,r,s)-c}}var Mu=class extends j.Component{state={canvasWidth:300,canvasHeight:150,topBoundaryTime:0,bottomBoundaryTime:Date.now()};canvas=null;ctx=null;drawFrame=null;blockWidth=10;blockPadding=1;componentDidMount(){this.ctx=this.canvas?.getContext(`2d`)??null,this.setState({topBoundaryTime:this.props.minTime??0,bottomBoundaryTime:this.props.maxTime??Date.now()}),this.setCanvasSize({width:300,height:150})}componentDidUpdate(){this.drawFrame!==null&&cancelAnimationFrame(this.drawFrame),this.drawFrame=requestAnimationFrame(()=>this.draw())}componentWillUnmount(){this.drawFrame!==null&&cancelAnimationFrame(this.drawFrame)}setCanvasSize=({width:e,height:t})=>{this.setState({canvasWidth:e,canvasHeight:t})};render(){return(0,N.jsx)(`div`,{style:{width:`100%`},children:(0,N.jsx)(mi,{bounds:!0,onResize:e=>{(e.bounds.width!==this.state.canvasWidth||e.bounds.height!==this.state.canvasHeight)&&this.setCanvasSize(e.bounds)},children:({measureRef:e})=>(0,N.jsx)(`canvas`,{ref:t=>{e(t),this.canvas=t},style:{width:`100%`,height:`100%`},height:this.state.canvasHeight*window.devicePixelRatio||300,width:this.state.canvasWidth*window.devicePixelRatio||450})})})}draw(){this.ctx&&this.drawActivityColumns()}drawActivityColumns(){if(!this.ctx)return;let e=this.ctx;Object.entries(this.props.blocksByActivity).forEach(([t,n],r)=>{e.fillStyle=`#f00`;let i=this.props.activities[t];if(i.status===`suspended`&&e.fillRect(r*(this.blockWidth+1),this.state.canvasHeight/2,this.blockWidth,this.state.canvasHeight),e.fillStyle=M.flames.main,i.categories.length>0&&i.categories[0]){let t=this.props.categories.find(e=>e.id===i.categories[0]);t&&(e.fillStyle=t.color_background)}this.drawActivityColumn(r,n,i)})}drawActivityColumn(e,t,n){if(!this.ctx)return;let r=this.ctx;t.forEach(t=>{let{startTime:n,endTime:i}=t,{blockX:a,blockY:o,blockHeight:s}=this.getBlockTransform(n,i,e);r.fillRect(a,o,this.blockWidth,s)})}getBlockTransform(e,t,n){return ju(e,t,this.state.topBoundaryTime,this.state.bottomBoundaryTime,this.blockWidth,n*(this.blockWidth+1),this.state.canvasWidth,this.state.canvasHeight)}},Nu=A.div`
  overflow-y: scroll;
`,Pu=class extends j.Component{render(){let{thread:e,activities:t,blocks:n,categories:r}=this.props;if(!e)return null;let i=Object.values(t).filter(({thread_id:t})=>String(t)===String(e.id)),a=new Set(i.map(e=>String(e.id))),o=n.filter(e=>a.has(String(e.activity_id))),s=i.filter(({status:e})=>e===`suspended`),c=Object.fromEntries(i.map(e=>[String(e.id),e])),l=o.reduce((e,t)=>({...e,[String(t.activity_id)]:[...e[String(t.activity_id)]??[],t]}),{});return(0,N.jsxs)(Nu,{children:[(0,N.jsx)(`h1`,{children:e.name}),(0,N.jsx)(Mu,{blocksByActivity:l,activities:c,categories:r,minTime:this.props.minTime,maxTime:this.props.maxTime}),(0,N.jsx)(`h2`,{children:`suspended`}),(0,N.jsx)(`ul`,{children:s.map(e=>(0,N.jsx)(`li`,{children:Object.entries(e).join(` `)},`${e.name}_${e.startTime}`))}),(0,N.jsx)(`ul`,{children:i.map(e=>(0,N.jsx)(`li`,{children:e.name},`${e.name}_${e.startTime}`))})]})}},Fu=b(e=>({activities:V(e).activities,categories:P(e).categories,minTime:V(e).minTime,maxTime:V(e).maxTime,blocks:V(e).blocks}))(Pu),Iu=A.input`
  border-width: 0;
  flex-grow: 1;
  padding: ${e=>e.padding??`10px`};
  width: 100%;
  &:focus-within { outline: -webkit-focus-ring-color auto 5px; }
`,Lu=class extends j.Component{static defaultProps={placeholder:`find`};state={value:this.props.searchStack?.[0]??``,searchStackIndex:0,lastManualValue:``};onChange=e=>{this.setState({value:e.target.value,lastManualValue:e.target.value})};onKeyDown=e=>{let t=e.key===`ArrowDown`?-1:+(e.key===`ArrowUp`);if(!t)return;e.preventDefault();let n=this.state.searchStackIndex+t;if(n>=0&&n<this.props.searchStack.length){let t=this.props.searchStack[n];this.setState({searchStackIndex:n,value:t}),e.currentTarget.selectionStart=e.currentTarget.selectionEnd=t.length}else n===-1&&this.setState({searchStackIndex:n,value:this.state.lastManualValue})};onKeyPress=e=>{e.key===`Enter`&&(this.props.onSubmit(this.state.value),this.setState({lastManualValue:``}))};onBlur=e=>{this.props.onBlur?.(this.state.value)};render(){return(0,N.jsx)(Iu,{padding:this.props.padding,onBlur:this.onBlur,onChange:this.onChange,onKeyDown:this.onKeyDown,onKeyPress:this.onKeyPress,value:this.state.value,placeholder:this.props.placeholder,type:`text`,ref:this.props.inputRef})}},Ru=class extends j.Component{state={on:!1};setOn=()=>this.setState({on:!0});setOff=()=>this.setState({on:!1});toggle=()=>this.setState(({on:e})=>({on:!e}));render(){return this.props.children({on:this.state.on,setOff:this.setOff,setOn:this.setOn,toggle:this.toggle})}};function zu(e,t){let n=t.categories[0],r=e.find(({id:e})=>String(e)===String(n))||{color_background:M.flames.main,color_text:`#000`};return{background:r.color_background,text:r.color_text}}function Bu(e){return e.ending===`V`}function Vu(e){switch(e.status){case`active`:return`🔥`;case`complete`:return Bu(e)?`✅`:`❌`;case`parent_suspended`:case`suspended`:return`🙃`;default:return``}}var Hu=A(pc)`
  display: block;
  padding: 3px 0;
  width: 100%;
  &:hover { background: var(--secondary-panel-background-hover); }
`,Uu=A.ul`
  padding-left: 30px;
  list-style: none;
  li { padding: 3px 0; }
`,Wu=A.ul`
  height: 100%;
  overflow-y: auto;
  margin: -5px;
  padding: 5px;
`,Gu=A.div`
  color: grey;
  margin-bottom: 5px;
  padding: 0 5px;
`,Ku=A.div`
  padding: 0 5px;
  &::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 4px solid black;
    margin-right: 5px;
    ${({$open:e})=>e?`transform: rotate(45deg);`:``}
  }
`,qu=A.div`
  display: flex;
  align-items: center;
`,Ju=A.div`
  display: inline-block;
  margin-right: 5px;
`,Yu=A.div`
  padding-left: 10px;
  position: relative;
  display: inline-block;

  &::before {
    content: '';
    width: 2px;
    height: 100%;
    position: absolute;
    margin-left: -10px;
    background-color: ${({$categoryColor:e})=>e};
  }

  &:hover { background: var(--secondary-panel-background-hover); }
`,Xu=b(e=>({categories:e.user.categories}),e=>({setVisibleTimeline:(t,n)=>e(rr(t,n)),focusActivity:(t,n)=>{n.thread_id!==void 0&&e(Un({index:0,activity_id:t,activityStatus:n.status,thread_id:n.thread_id}))}}));function Zu({categories:e,match:t,focusActivity:n,setVisibleTimeline:r}){let[i,a]=t,{background:o}=zu(e,a);return(0,N.jsxs)(qu,{children:[(0,N.jsx)(Ju,{children:Vu(a)}),(0,N.jsx)(Yu,{$categoryColor:o,onClick:()=>{n(i,a);let e=Number.parseFloat(localStorage.getItem(`lbt`)??``),t=Number.parseFloat(localStorage.getItem(`rbt`)??``),o=a.startTime,s=a.endTime??t;o!==void 0&&Number.isFinite(e)&&Number.isFinite(t)&&(o>t||s<e)&&r(o,s)},children:a.name})]})}var Qu=Xu(Zu);function $u({name:e,matches:t}){return(0,N.jsx)(Ru,{children:({on:n,toggle:r})=>(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(Hu,{onClick:r,children:(0,N.jsx)(Ku,{$open:n,children:e})}),n&&(0,N.jsx)(Uu,{children:t.map(e=>(0,N.jsx)(`li`,{children:(0,N.jsx)(Qu,{match:e})},e[0]))})]})})}var ed=A.div`height: 100%;`,td=A.div`
  color: var(--secondary-panel-color);
  padding: 5px;
  font-size: 0.9em;
  label { display: block; margin: 5px 0; }
`;function nd(e,t){let n=e.trim().split(/[ ,]+/).join(`|`);if(!n)return[];let r;try{r=RegExp(`(${n})`)}catch{return[]}return Object.values(t).filter(e=>r.test(e.name)).map(e=>Number(e.id)).filter(Number.isFinite)}var rd=b(e=>({matches:e.search.matches,searchStack:e.search.searchStack,includeStack:e.search.includeStack,excludeStack:e.search.excludeStack}),e=>({search:t=>e(tr(t)),setThreadIncludeList:(t,n)=>e(ir(t,n)),setThreadExcludeList:(t,n)=>e(ar(t,n))}))(class extends j.Component{search=e=>{this.props.search(e)};excludeThreads=e=>{this.props.setThreadExcludeList(nd(e,this.props.threads),e)};includeThreads=e=>{this.props.setThreadIncludeList(nd(e,this.props.threads),e)};render(){let{matches:e,searchStack:t,includeStack:n,excludeStack:r,threads:i}=this.props,a=e.reduce((e,t)=>{let n=String(t[1].thread_id);return(e[n]??=[]).push(t),e},{});return(0,N.jsxs)(ed,{children:[(0,N.jsx)(`div`,{style:{height:`30px`,padding:`0 5px`},children:(0,N.jsx)(Lu,{onSubmit:this.search,onBlur:this.search,inputRef:this.props.inputRef,searchStack:t})}),(0,N.jsx)(Ru,{children:({on:e,toggle:t})=>(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`button`,{onClick:t,title:`toggle search details`,children:`...`}),e&&(0,N.jsxs)(td,{children:[(0,N.jsxs)(`label`,{children:[`threads to include`,(0,N.jsx)(Lu,{placeholder:``,onSubmit:this.includeThreads,onBlur:this.includeThreads,padding:`3px`,searchStack:n})]}),(0,N.jsxs)(`label`,{children:[`threads to exclude`,(0,N.jsx)(Lu,{placeholder:``,onSubmit:this.excludeThreads,onBlur:this.excludeThreads,padding:`3px`,searchStack:r})]})]})]})}),(0,N.jsxs)(Gu,{children:[e.length,` results in `,Object.keys(a).length,` threads`]}),(0,N.jsx)(Wu,{children:Object.entries(a).map(([e,t])=>{let n=i[e];return n?(0,N.jsx)(`li`,{children:(0,N.jsx)($u,{name:n.name,matches:t})},e):null})})]})}}),id=class extends j.Component{state={toggledOn:!1};toggle=()=>{this.setState(({toggledOn:e})=>({toggledOn:!e}))};render(){let{unstyled:e,title:t,toggles:n,children:r}=this.props;return(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(H,{title:t,onClick:this.toggle,unstyled:e,children:r}),this.state.toggledOn?n(this.toggle):null]})}};function ad(e,t,n){if(t===n||t<0||n<0||t>=e.length||n>=e.length)return e;let r=[...e],[i]=r.splice(t,1);return r.splice(n,0,i),r}var od=A.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
`,sd=A.li`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  opacity: ${e=>e.$dimmed?.45:1};
  background: ${e=>e.$dragging?`#eee`:`transparent`};
`,cd=A.button`
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
`,ld=A.label`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
`,ud=A.p`
  margin: 8px 0 0;
  color: #999;
  font-size: 0.8em;
`,dd=({allThreads:e={},attentionDrivenThreadOrder:t,filterExcludes:n,onHideChange:r,onReorder:i,onToggleAttentionOrder:a,orderedThreadIds:o})=>{let[s,c]=(0,j.useState)(null),l=new Set(n.map(String)),u=Object.keys(ga(n,e)).length,d=(e,t)=>{!t&&u<=1||r(t?n.filter(t=>String(t)!==String(e)):[...n,e])},f=e=>{s!==null&&String(s)!==String(e)&&(i(ad(o,o.findIndex(e=>String(e)===String(s)),o.findIndex(t=>String(t)===String(e)))),c(null))};return(0,N.jsxs)(`div`,{children:[(0,N.jsx)(od,{children:o.map(t=>{let n=e[String(t)];if(!n)return null;let r=l.has(String(t));return(0,N.jsxs)(sd,{$dimmed:r,$dragging:String(s)===String(t),draggable:!0,onDragStart:e=>{c(t),e.dataTransfer.setData(`text/plain`,String(t)),e.dataTransfer.effectAllowed=`move`},onDragEnd:()=>c(null),onDragOver:e=>{e.preventDefault(),e.dataTransfer.dropEffect=`move`},onDrop:e=>{e.preventDefault(),f(t)},children:[(0,N.jsx)(cd,{type:`button`,"aria-label":`Reorder ${n.name}`,onClick:e=>e.preventDefault(),children:`::`}),(0,N.jsx)(`input`,{id:`thread-visible-${t}`,"aria-label":`Show ${n.name}`,checked:!r,disabled:!r&&u<=1,onChange:e=>d(t,e.target.checked),type:`checkbox`}),(0,N.jsx)(ld,{htmlFor:`thread-visible-${t}`,children:n.name})]},String(t))})}),(0,N.jsxs)(`label`,{children:[(0,N.jsx)(`input`,{checked:t,onChange:a,type:`checkbox`}),` `,`Order by recent attention`]}),(0,N.jsx)(ud,{children:`Uncheck a thread to hide it. Drag to reorder; that stores a manual order and turns off attention-driven sorting.`})]})},fd=`data:image/svg+xml,%3csvg%20width='11'%20height='14'%20viewBox='0%200%2011%2014'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%201H1V2.35616L4.90984%206.57534V10.3425L5.86885%2012V10.3425V6.57534L10%202.35616V1Z'%20fill='%23A4FFE9'%20fill-opacity='0.42'%20stroke='black'%20stroke-width='0.596419'/%3e%3c/svg%3e`,pd=A.div`
  width: 16rem;
  position: absolute;
  top: 0;
  left: 125%;
  z-index: 100;
  padding: 8px 10px;
  background: ${M.background};
  border: 1px solid ${k(M.background).darken(15).toString()};
  font-size: 12px;
`,md=A.span`
  position: relative;
  display: inline-flex;
`,hd=A.span`
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
`;function gd(e){return Object.fromEntries(Object.entries(e).map(([e,t])=>[e,{...t}]))}var _d=b(e=>({threads:V(e).threads,filterExcludes:vo(e),attentionDrivenThreadOrder:e.settings.attentionDrivenThreadOrder,attentionShifts:P(e).attentionShifts}),e=>({setHiddenThreads:t=>e(or(t)),reorderThreads:t=>e(on(t)),setSetting:(t,n)=>e(Qn(t,n)),toggleSetting:t=>e(Zn(t))}))(({attentionDrivenThreadOrder:e,attentionShifts:t,filterExcludes:n=[],reorderThreads:r,setHiddenThreads:i,setSetting:a,threads:o={},toggleSetting:s})=>{let c=Di(e?Ei(t,gd(o)):o).map(([e])=>e),l=n.length;return(0,N.jsx)(Ru,{children:({on:t,toggle:u})=>(0,N.jsxs)(`div`,{style:{position:`relative`},children:[(0,N.jsxs)(md,{children:[(0,N.jsx)(pc,{type:`button`,"aria-label":`Manage threads`,onClick:u,children:(0,N.jsx)(`img`,{height:`24px`,src:fd,alt:`filter`})}),l>0&&(0,N.jsx)(hd,{children:l})]}),t&&(0,N.jsx)(pd,{children:(0,N.jsx)(dd,{allThreads:o,attentionDrivenThreadOrder:e,filterExcludes:n,onHideChange:i,onReorder:t=>{r(t),e&&a(`attentionDrivenThreadOrder`,!1)},onToggleAttentionOrder:()=>s(`attentionDrivenThreadOrder`),orderedThreadIds:c})})]})})}),vd=A.ul`
  position: absolute;
  z-index: 2;
  list-style: none;
  padding: 5px 10px;
  background: ${M.background};
  border: 1px solid ${k(M.background).darken(15).toString()};
  width: 17rem;
  margin: 0;

  li {
    margin-bottom: 5px;
  }
`,yd=class extends j.Component{submitNewTrace=e=>{this.props.createTrace(e)};render(){return(0,N.jsx)(`div`,{children:(0,N.jsx)(Eo,{submit:this.submitNewTrace,children:`New Trace`})})}},bd=b(null,e=>({createTrace:t=>e(hn(t))}))(yd),xd=A(vd)`
  top: ${ur.headerHeight};
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
`,Sd=A.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${e=>e.$current?M[`focus-activity-bg`]:`transparent`};

  &:hover {
    background: ${M[`hover-activity-bg`]};
  }
`,Cd=A(r)`
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
`,wd=A.button`
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
    background: ${M.hover};
    color: ${M.red};
  }
`,Td=A.li`
  display: flex;
  justify-content: center;
  padding: 8px 10px 4px;
  border-top: 1px solid ${k(M.background).darken(10).toString()};
`,Ed=({trace:e,deleteTrace:t,onDeleteCurrent:n,toggle:r,selectTrace:i,current:a})=>(0,N.jsxs)(Sd,{$current:a,children:[(0,N.jsx)(Cd,{$current:a,"aria-current":a?`page`:void 0,onClick:()=>{r(),i(e)},to:`/traces/${e.id}`,children:e.name}),(0,N.jsx)(wd,{type:`button`,onClick:r=>{r.preventDefault(),r.stopPropagation(),a?n(e.id):t(e.id)},children:`Delete`})]}),Dd=({traces:e,toggle:t,selectTrace:n,deleteTrace:r,currentTrace:i,deleteCurrentTrace:a})=>{let o=c(),s=i=>{let s=e.filter(e=>e.id!==i);a(),r(i),t(),s[0]?(n(s[0]),o(`/traces/${s[0].id}`)):o(`/`)};return(0,N.jsxs)(xd,{children:[e.map(e=>(0,N.jsx)(Ed,{trace:e,toggle:t,selectTrace:n,current:!!(i&&e.id===i.id),deleteTrace:r,onDeleteCurrent:s},e.id)),(0,N.jsx)(Td,{children:(0,N.jsx)(bd,{})})]})},Od=A.header`
  position: relative;
  width: 100%;
  padding: 5px;
  background: #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  height: ${ur.headerHeight};
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
    color: ${k(M.background).darken(25).toString()};
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
`,kd=({traces:e,currentTrace:t,selectTrace:n,deleteTrace:r,deleteCurrentTrace:i,currentMantra:a,createMantra:o,onOpenCommander:s,logout:c})=>(0,N.jsxs)(Od,{children:[e&&(0,N.jsx)(id,{title:`Toggle traces`,toggles:a=>(0,N.jsx)(Dd,{traces:e,toggle:a,selectTrace:n,currentTrace:t,deleteCurrentTrace:i,deleteTrace:r},`traces-list`),children:`Traces`}),(0,N.jsx)(_d,{}),(0,N.jsx)(Eo,{submit:o,placeholderIsDefaultValue:!0,children:a||`Note to self`}),t&&(0,N.jsx)(`h1`,{children:t.name}),(0,N.jsx)(`button`,{type:`button`,onClick:s,title:`Command palette`,"aria-label":`Command palette`,children:wa([`Mod`,`Shift`,`P`],!0)}),(0,N.jsx)(`button`,{type:`button`,onClick:c,children:`Log out`})]}),Ad=A.div`
  background: var(--secondary-panel-background);
  height: 100%;
  overflow: hidden;

  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    align-items: start;
  }

  h3 {
    padding-top: 5px;
    margin-top: 0;
    margin-left: 5px;
    text-transform: uppercase;
    font-size: 0.8em;
    font-weight: normal;
    color: var(--secondary-panel-color);
  }
`,jd=({title:e=``,children:t,closePanel:n})=>(0,N.jsxs)(Ad,{children:[(0,N.jsxs)(`header`,{children:[(0,N.jsx)(`h3`,{children:e}),(0,N.jsx)(gc,{onClick:n})]}),t]}),Md=A.button`
background: none;
outline: none;
border: 1px solid transparent;
border-radius: 4px;
text-align: center;
font-size: 1.5em;
padding: 0;

${e=>e.disabled?`
    filter: grayscale(100%);
    `:`&:hover {
  background: ${k(M.hover).darken(.1).toString()};
}`} &:focus {
  border: 1px solid ${M.flames.main};
}
`,Nd=A.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 5px;
  background: var(--secondary-panel-background);
  border-top: 1px solid #e0eef3;
`,Pd=A.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: 11px;
  color: lightgrey;
`,Fd=A.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #c8c8c8;
  border-radius: 2px;

  &:focus-within {
    border-color: #007fd4;
  }

  input {
    outline: none;
    min-width: 0;
    width: auto;
    flex: 1;
    padding: 6px 8px;
  }
`,Id=A.div`
  display: flex;
  align-items: center;
  padding-right: 4px;
  gap: 1px;
`,Ld=A(pc)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 3px;
  font-size: 12px;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  color: ${({$active:e})=>e?`#fff`:`#616161`};
  background: ${({$active:e})=>e?`#007fd4`:`transparent`};

  &:hover {
    background: ${({$active:e})=>e?`#007fd4`:`#e8e8e8`};
  }
`,Rd=A.span`
  text-decoration: underline;
  text-underline-offset: 1px;
`,zd=A.div`
  display: grid;
  height: 100%;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: repeat(3, 1fr);
  margin-left: 5px;
`,Bd=A.div`
  min-width: 52px;
  margin-left: 5px;
  color: var(--secondary-panel-color);
`,Vd={KeyC:`matchCase`,KeyW:`matchWholeWord`,KeyR:`useRegularExpression`},Hd=class extends j.Component{state={error:null,errorInfo:null};componentDidCatch(e,t){this.setState({error:e.message,errorInfo:t.componentStack??null})}search=e=>{this.props.search(e)};onNext=()=>{this.props.incrementMatch(1)};onPrevious=()=>{this.props.incrementMatch(-1)};onNextBlock=()=>{this.props.incrementBlock(1)};onPreviousBlock=()=>{this.props.incrementBlock(-1)};onToggleMouseDown=e=>{e.preventDefault()};onKeyDown=e=>{if(!e.altKey)return;let t=Vd[e.code];t&&(e.preventDefault(),this.props.toggleSearchOption(t))};render(){let e=this.props.matches.length,t=this.props.blocksForMatch.length,{matchIndex:n,hideSearchBar:r,inputRef:i,searchStack:a,options:o,searchError:s}=this.props;return this.state.error?(0,N.jsxs)(`div`,{children:[this.state.error,this.state.errorInfo]}):(0,N.jsxs)(Nd,{onKeyDown:this.onKeyDown,children:[(0,N.jsxs)(`div`,{style:{margin:`0 5px`,display:`flex`,flexGrow:1},children:[(0,N.jsxs)(Pd,{children:[(0,N.jsxs)(Fd,{children:[(0,N.jsx)(Lu,{onSubmit:this.search,inputRef:i,searchStack:a}),(0,N.jsxs)(Id,{children:[(0,N.jsx)(Ld,{type:`button`,$active:o.matchCase,"aria-pressed":o.matchCase,title:`Match Case (⌥⌘C)`,onMouseDown:this.onToggleMouseDown,onClick:()=>this.props.toggleSearchOption(`matchCase`),children:`Aa`}),(0,N.jsx)(Ld,{type:`button`,$active:o.matchWholeWord,"aria-pressed":o.matchWholeWord,title:`Match Whole Word (⌥⌘W)`,onMouseDown:this.onToggleMouseDown,onClick:()=>this.props.toggleSearchOption(`matchWholeWord`),children:(0,N.jsx)(Rd,{children:`ab`})}),(0,N.jsx)(Ld,{type:`button`,$active:o.useRegularExpression,"aria-pressed":o.useRegularExpression,title:`Use Regular Expression (⌥⌘R)`,onMouseDown:this.onToggleMouseDown,onClick:()=>this.props.toggleSearchOption(`useRegularExpression`),children:`.*`})]})]}),(0,N.jsx)(Bd,{children:s||(e>0?`${n+1} of ${e}`:`no results`)})]}),(0,N.jsxs)(zd,{children:[(0,N.jsx)(Md,{onClick:this.onPreviousBlock,title:`previous block same match`,disabled:t<=1,style:{gridColumn:`2`,gridRow:`1`,fontSize:`8px`},children:`👆`}),(0,N.jsx)(Md,{onClick:this.onPrevious,title:`previous match`,disabled:e<=1,style:{gridRow:`1 / span 2`},children:`👈`}),(0,N.jsx)(Md,{onClick:this.onNext,title:`next match`,disabled:e<=1,style:{gridColumn:`3`,gridRow:`1 / span 2`},children:`👉`}),(0,N.jsx)(Md,{onClick:this.onNextBlock,title:`next block same match`,disabled:t<=1,style:{gridColumn:`2`,gridRow:`2`,fontSize:`8px`},children:`👇`})]})]}),(0,N.jsx)(`button`,{onClick:r,children:`Cancel`})]})}},Ud=b(e=>({matches:e.search.matches,blocksForMatch:e.search.blocksForMatch,blockIndex:e.search.blockIndex,matchIndex:e.search.matchIndex,searchStack:e.search.searchStack,options:e.search.options,searchError:e.search.searchError}),e=>({incrementBlock:t=>e(Qt(t)),incrementMatch:t=>e($t(t)),search:t=>e(tr(t,void 0)),toggleSearchOption:t=>e(nr(t))}))(Hd),Wd=A.h1`
  margin: 0 0 12px;
  font-size: 16px;
`,Gd=A.form`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  align-items: end;
  margin-bottom: 16px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    color: #666;
  }

  input[type='text'] {
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  input[type='color'] {
    width: 36px;
    height: 28px;
    padding: 0;
    border: 1px solid #ccc;
    background: #fff;
  }
`,Kd=A.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`,qd=A.form`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  align-items: end;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    color: #666;
  }

  input[type='text'] {
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  input[type='color'] {
    width: 36px;
    height: 28px;
    padding: 0;
    border: 1px solid #ccc;
    background: #fff;
  }
`;function Jd(e,t){return e&&/^#[0-9a-fA-F]{6}$/.test(e)?e:t}var Yd=({category:e,updateCategory:t})=>{let[n,r]=(0,j.useState)(e.name),[i,a]=(0,j.useState)(Jd(e.color_background,M.flames.main)),[o,s]=(0,j.useState)(Jd(e.color_text,`#000000`));return(0,N.jsxs)(qd,{onSubmit:r=>{r.preventDefault(),t(e.id,{name:n,color_background:i,color_text:o})},children:[(0,N.jsx)(`input`,{"aria-label":`Category name`,type:`text`,value:n,onChange:e=>r(e.target.value),style:{backgroundColor:i,color:o}}),(0,N.jsxs)(`label`,{children:[`Background`,(0,N.jsx)(`input`,{type:`color`,value:i,onChange:e=>a(e.target.value)})]}),(0,N.jsxs)(`label`,{children:[`Text`,(0,N.jsx)(`input`,{type:`color`,value:o,onChange:e=>s(e.target.value)})]}),(0,N.jsx)(H,{looksLikeButton:!0,type:`submit`,children:`Save`})]})},Xd=b(e=>({categoryManagerVisible:e.categoryManagerVisible,categories:P(e).categories}),e=>({createCategory:t=>e(un(t)),updateCategory:(t,n)=>e(dn(t,n)),hideCategoryManager:()=>e(Fn())}))(({categoryManagerVisible:e,categories:t,createCategory:n,updateCategory:r,hideCategoryManager:i})=>{let[a,o]=(0,j.useState)(``),[s,c]=(0,j.useState)(M.flames.main),[l,u]=(0,j.useState)(`#000000`);return(0,N.jsxs)(Xs,{isOpen:e,contentLabel:`Categories`,onRequestClose:i,wide:!0,children:[(0,N.jsx)(Wd,{children:`Categories`}),(0,N.jsxs)(Gd,{onSubmit:e=>{e.preventDefault();let t=a.trim();t&&(n({name:t,color_background:s,color_text:l}),o(``))},children:[(0,N.jsxs)(`label`,{children:[`New category`,(0,N.jsx)(`input`,{value:a,onChange:e=>o(e.target.value),placeholder:`Name`,style:{backgroundColor:s,color:l}})]}),(0,N.jsxs)(`label`,{children:[`Background`,(0,N.jsx)(`input`,{type:`color`,value:s,onChange:e=>c(e.target.value)})]}),(0,N.jsxs)(`label`,{children:[`Text`,(0,N.jsx)(`input`,{type:`color`,value:l,onChange:e=>u(e.target.value)})]}),(0,N.jsx)(H,{looksLikeButton:!0,type:`submit`,children:`Add`})]}),(0,N.jsx)(Kd,{children:t.map(e=>(0,N.jsx)(`li`,{children:(0,N.jsx)(Yd,{category:e,updateCategory:r})},`${e.id}-${e.name}-${e.color_background}-${e.color_text}`))})]})}),Zd=A.section`
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
`;function Qd(e){if(!e)return`never`;let t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString()}function $d(){let[e,t]=(0,j.useState)([]),[n,r]=(0,j.useState)(`agent`),[i,a]=(0,j.useState)(null),[o,s]=(0,j.useState)(null),c=(0,j.useCallback)(async()=>{let e=await fetch(`/api/api-tokens`,{credentials:`include`});if(!e.ok){s(`Could not load API tokens.`);return}let n=await e.json();t(n.data)},[]);(0,j.useEffect)(()=>{c()},[c]);let l=async e=>{e.preventDefault(),s(null);let t=await fetch(`/api/api-tokens`,{method:`POST`,credentials:`include`,headers:{"content-type":`application/json`},body:JSON.stringify({api_token:{name:n}})});if(!t.ok){s(`Could not create that token.`);return}let i=await t.json();a(i.data.raw_token),r(`agent`),await c()},u=async e=>{if(s(null),!(await fetch(`/api/api-tokens/${e}`,{method:`DELETE`,credentials:`include`})).ok){s(`Could not revoke that token.`);return}i&&a(null),await c()};return(0,N.jsxs)(Zd,{children:[(0,N.jsx)(`h2`,{children:`API tokens`}),(0,N.jsx)(`p`,{children:`Create a token for the flambe CLI. The secret is shown only once.`}),(0,N.jsxs)(`form`,{onSubmit:l,children:[(0,N.jsx)(`input`,{"aria-label":`Token name`,value:n,onChange:e=>r(e.target.value),maxLength:100,required:!0}),(0,N.jsx)(`button`,{type:`submit`,children:`Create token`})]}),i&&(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`p`,{children:`Copy this token now. It will not be shown again.`}),(0,N.jsx)(`code`,{children:i}),(0,N.jsx)(`button`,{type:`button`,onClick:async()=>{i&&await navigator.clipboard.writeText(i)},children:`Copy token`})]}),o&&(0,N.jsx)(`p`,{children:o}),(0,N.jsx)(`ul`,{children:e.map(e=>(0,N.jsxs)(`li`,{children:[(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`strong`,{children:e.name}),(0,N.jsxs)(`span`,{children:[`created `,Qd(e.inserted_at),`; last used`,` `,Qd(e.last_used_at)]})]}),(0,N.jsx)(`button`,{type:`button`,onClick:()=>void u(e.id),children:`Revoke`})]},e.id))})]})}var ef=260,tf=180,nf=18,rf=224,af=144,of=-1,sf=2,cf=3,lf=A.div`
  margin-top: 6px;
  width: ${ef}px;

  svg {
    display: block;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    touch-action: none;
  }
`,uf=A.div`
  display: flex;
  gap: 5px;
  margin-top: 6px;

  button {
    font-size: 10px;
  }
`,df=(e,t,n)=>Math.max(t,Math.min(n,e)),J=e=>nf+e*rf,Y=e=>nf+(sf-e)/cf*af;function ff(e){return e.slice(1).reduce((t,n,r)=>{let i=e[r];return`${t} C ${J(i.outX)} ${Y(i.outY)}, ${J(n.inX)} ${Y(n.inY)}, ${J(n.x)} ${Y(n.y)}`},`M ${J(e[0].x)} ${Y(e[0].y)}`)}function pf({value:e,onChange:t}){let n=(0,j.useRef)(null),[r,i]=(0,j.useState)(null),[a,o]=(0,j.useState)(1),s=i=>{if(!r||!n.current)return;let a=n.current.getBoundingClientRect(),o=df((i.clientX-a.left-nf)/rf,0,1),s=df(sf-(i.clientY-a.top-nf)/af*cf,of,sf),c=e.map(e=>({...e})),l=c[r.index],u=c[r.index-1],d=c[r.index+1];if(r.part===`anchor`&&r.index>0&&r.index<c.length-1){let e=df(o,(u?.x??0)+.02,(d?.x??1)-.02),t=e-l.x,n=s-l.y;Object.assign(l,{x:e,y:s,inX:l.inX+t,inY:l.inY+n,outX:l.outX+t,outY:l.outY+n})}else r.part===`in`&&u?(l.inX=df(o,u.x,l.x),l.inY=s):r.part===`out`&&d&&(l.outX=df(o,l.x,d.x),l.outY=s);t(c)},c=(e,t)=>{i(t),o(t.index),e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId)};return(0,N.jsxs)(lf,{children:[(0,N.jsxs)(`svg`,{ref:n,viewBox:`0 0 ${ef} ${tf}`,width:ef,height:tf,"aria-label":`Preset zoom piecewise Bézier curve`,onPointerMove:s,onPointerUp:e=>{i(null),e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId)},onPointerCancel:()=>i(null),children:[(0,N.jsx)(`line`,{x1:nf,y1:Y(0),x2:242,y2:Y(0),stroke:`#ccc`}),(0,N.jsx)(`line`,{x1:nf,y1:Y(1),x2:242,y2:Y(1),stroke:`#ccc`}),e.map((t,n)=>(0,N.jsxs)(j.Fragment,{children:[n>0&&(0,N.jsx)(`line`,{x1:J(t.x),y1:Y(t.y),x2:J(t.inX),y2:Y(t.inY),stroke:`#aaa`}),n<e.length-1&&(0,N.jsx)(`line`,{x1:J(t.x),y1:Y(t.y),x2:J(t.outX),y2:Y(t.outY),stroke:`#aaa`})]},`guides-${n}`)),(0,N.jsx)(`path`,{d:ff(e),fill:`none`,stroke:`#2f75dd`,strokeWidth:`3`}),e.map((t,n)=>(0,N.jsxs)(j.Fragment,{children:[n>0&&(0,N.jsx)(`circle`,{cx:J(t.inX),cy:Y(t.inY),r:`5`,fill:`#fff`,stroke:`#2f75dd`,onPointerDown:e=>c(e,{index:n,part:`in`})}),n<e.length-1&&(0,N.jsx)(`circle`,{cx:J(t.outX),cy:Y(t.outY),r:`5`,fill:`#fff`,stroke:`#2f75dd`,onPointerDown:e=>c(e,{index:n,part:`out`})}),(0,N.jsx)(`circle`,{cx:J(t.x),cy:Y(t.y),r:n===a?7:6,fill:n===a?`#174d9c`:`#2f75dd`,stroke:`#fff`,strokeWidth:`2`,style:{cursor:n===0||n===e.length-1?`default`:`move`},onPointerDown:e=>c(e,{index:n,part:`anchor`})})]},`points-${n}`))]}),(0,N.jsxs)(uf,{children:[(0,N.jsx)(`button`,{type:`button`,onClick:()=>{if(e.length>=8)return;let n=0;for(let t=1;t<e.length-1;t+=1)e[t+1].x-e[t].x>e[n+1].x-e[n].x&&(n=t);let r=e[n],i=e[n+1],a=(r.x+i.x)/2,s=(r.y+i.y)/2,c=(i.x-r.x)/6,l={x:a,y:s,inX:a-c,inY:s,outX:a+c,outY:s},u=[...e.slice(0,n+1),l,...e.slice(n+1)];o(n+1),t(u)},disabled:e.length>=8,children:`Add point`}),(0,N.jsx)(`button`,{type:`button`,onClick:()=>{a<=0||a>=e.length-1||e.length<=2||(t(e.filter((e,t)=>t!==a)),o(Math.max(1,a-1)))},disabled:a<=0||a>=e.length-1||e.length<=2,children:`Remove point`}),(0,N.jsxs)(`span`,{children:[e.length-1,` segments`]})]})]})}var mf=`https://github.com/davvidbaker/flambe/commit`;function hf(e){return!e||e===`unknown`?e||`unknown`:e.length>7?e.slice(0,7):e}function gf(e){return!e||e===`unknown`?null:`${mf}/${e}`}function _f(){return`unknown`}var vf=null;function yf(){return vf||=fetch(`/api/health`,{credentials:`include`}).then(async e=>{if(!e.ok)throw Error(`health ${e.status}`);let t=await e.json();return{git_sha:typeof t.git_sha==`string`&&t.git_sha?t.git_sha:`unknown`}}).catch(e=>{throw vf=null,e}),vf}function bf(e){let t=e.git_sha||`unknown`,n=hf(t),r=gf(t),i=_f(),a=r??`(SHA not baked into this build)`;console.info(`%cFlambe%c ${n}`,`background:#111;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600`,`color:#111;font-weight:600`,a),i!==`unknown`&&t!==`unknown`&&i!==t&&console.warn(`Flambe assets were built from ${hf(i)} but /api/health reports ${n}. Hard-refresh if you expected the newer commit.`)}async function xf(){try{bf(await yf())}catch{console.info(`%cFlambe%c deploy SHA unavailable`,`background:#111;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600`,`color:#666`)}}var Sf=[{setting:`attentionFlows`,copy:`Attention Flows`},{setting:`attentionDrivenThreadOrder`,copy:`Attention Driven Thread Order`,description:`Threads are ordered by what was worked on most recently`},{setting:`activityMute`,copy:`Mute Activities`,description:`Dim every activity except the focused one (${wa([`Mod`,`M`])}).`},{setting:`reactiveThreadHeight`,copy:`Reactive Thread Height`,description:`The height of a thread dynamically adjusts its height depending on how many levels are in the visible window.`},{setting:`suspendResumeFlows`,copy:`Suspend/Resume Flows`,subsettings:[{copy:`Only show flows for the focused  activity.`,setting:`suspendResumeFlowsOnlyForFocusedActivity`,description:`This should be more performant than showing all the flows.`}]},{setting:`uniformBlockHeight`,copy:`Uniform Block Height`,description:`In collapsed threads, all blocks are the same height.`},{setting:`darkerAsWeGoDown`,copy:`Darker as we go down`,description:`Shade nested activities darker at each deeper level.`},{setting:`rightAlignTimelineText`,copy:`Right-align Timeline Text`,description:`Draw activity names against the right edge of each block.`},{setting:`absoluteTimeLabels`,copy:`Absolute Time Labels`,description:`Show clock times on the timeline axis instead of time ago. Granularity follows the visible zoom level.`,subsettings:[{setting:`twelveHourClock`,copy:`12-hour clock`,description:`Use AM/PM instead of 24-hour time.`}]}],Cf=[{setting:`showActivityIds`,copy:`Show Activity IDs`,description:`Label flame-chart blocks with activity id instead of name, for matching what you see to database events.`},{setting:`swyzzle`,copy:`Swyzzle`,description:`After the configured idle time, melt the flame chart. Move the pointer to stir it. Space or Escape clears it.`,number:{copy:`Idle seconds`,setting:`swyzzleIdleSeconds`,min:1,max:60},select:{copy:`Shader`,setting:`swyzzleEffect`,options:Yl}}],wf=A.div`
  span {
    display: block;
    color: #999;
    font-size: 0.8em;
  }
  input {
    margin-left: 0;
  }
`,Tf=A.div`
  margin-left: 20px;

  color: ${e=>e.$disabled?`lightgrey`:`inherit`};
`,Ef=A.select`
  display: block;
  margin-top: 4px;
  font-size: 11px;
`,Df=A.input`
  display: block;
  margin-top: 4px;
  font-size: 11px;
  width: 4.5em;
`,Of=A.div`
  margin-bottom: 14px;

  > label {
    display: block;
    font-weight: 600;
  }

  input[type='range'] {
    width: 220px;
    margin: 5px 0 0;
  }

  > p {
    margin: 10px 0 4px;
    font-weight: 600;
  }
`,kf=A.div`
  font-size: 11px;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    margin-bottom: 5px;
  }
`,Af=A.div`
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
`,jf=A.div`
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
`;function Mf({setting:e,copy:t,description:n,number:r,select:i,subsettings:a},o,s,c){return(0,N.jsx)(`li`,{children:(0,N.jsxs)(wf,{children:[(0,N.jsx)(`input`,{checked:!!o[e],onChange:()=>s(e),type:`checkbox`,id:e}),(0,N.jsx)(`label`,{htmlFor:e,children:t}),(0,N.jsx)(`span`,{children:n}),r&&(0,N.jsxs)(Tf,{$disabled:!o[e],children:[(0,N.jsx)(`label`,{htmlFor:r.setting,children:r.copy}),(0,N.jsx)(Df,{id:r.setting,type:`number`,min:r.min,max:r.max,step:1,value:Number(o[r.setting]),disabled:!o[e],onChange:e=>c(r.setting,e.target.valueAsNumber)})]}),i&&(0,N.jsxs)(Tf,{$disabled:!o[e],children:[(0,N.jsx)(`label`,{htmlFor:i.setting,children:i.copy}),(0,N.jsx)(Ef,{id:i.setting,value:String(o[i.setting]),disabled:!o[e],onChange:e=>c(i.setting,e.target.value),children:i.options.map(e=>(0,N.jsx)(`option`,{value:e,children:e},e))})]}),a&&a.map(({copy:t,description:n,setting:r})=>(0,N.jsx)(wf,{children:(0,N.jsxs)(Tf,{$disabled:!o[e],children:[(0,N.jsx)(`input`,{checked:!!o[r],onChange:()=>s(r),type:`checkbox`,id:r,disabled:!o[e]}),(0,N.jsx)(`label`,{htmlFor:r,children:t}),(0,N.jsx)(`span`,{children:n})]})},r))]})},e)}var Nf=b(e=>({settingsVisible:e.settingsVisible,settings:e.settings}),e=>({hideSettings:()=>e(Ln()),setSetting:(t,n)=>e(Qn(t,n)),toggleSetting:t=>e(Zn(t))}))(({settingsVisible:e,hideSettings:t,settings:n,setSetting:r,toggleSetting:i})=>{let[a,o]=(0,j.useState)(null);(0,j.useEffect)(()=>{if(!e)return;let t=!1;return yf().then(e=>{t||o(e)}).catch(()=>{t||o({git_sha:`unknown`})}),()=>{t=!0}},[e]);let s=$i(n.presetPanCurve),c=$i(n.presetZoomCurve);(0,j.useEffect)(()=>{na({durationMs:n.presetZoomDurationMs,curvesLinked:n.presetZoomCurvesLinked,panCurve:s,zoomCurve:c})},[n.presetZoomDurationMs,n.presetZoomCurvesLinked,n.presetPanCurve,n.presetZoomCurve]);let l=e=>{let t=ea(e);r(`presetZoomCurve`,t),n.presetZoomCurvesLinked&&r(`presetPanCurve`,t)},u=e=>{let t=ea(e);r(`presetPanCurve`,t),n.presetZoomCurvesLinked&&r(`presetZoomCurve`,t)},d=e=>{e&&r(`presetZoomCurve`,n.presetPanCurve),r(`presetZoomCurvesLinked`,e)},f=a?.git_sha??`…`,p=a?gf(a.git_sha):null;return(0,N.jsx)(Xs,{isOpen:e,onRequestClose:t,children:(0,N.jsxs)(kf,{children:[(0,N.jsx)(`h1`,{style:{marginTop:0},children:`Settings`}),(0,N.jsx)(`ul`,{children:Sf.map(e=>Mf(e,n,i,r))}),(0,N.jsxs)(Af,{children:[(0,N.jsx)(`h2`,{children:`Developer`}),(0,N.jsxs)(Of,{children:[(0,N.jsxs)(`label`,{htmlFor:`presetZoomDurationMs`,children:[`Preset zoom motion — `,n.presetZoomDurationMs,` ms`]}),(0,N.jsx)(`input`,{id:`presetZoomDurationMs`,type:`range`,min:`100`,max:`1000`,step:`10`,value:n.presetZoomDurationMs,onChange:e=>r(`presetZoomDurationMs`,e.target.valueAsNumber)}),(0,N.jsxs)(`label`,{htmlFor:`presetZoomCurvesLinked`,children:[(0,N.jsx)(`input`,{id:`presetZoomCurvesLinked`,type:`checkbox`,checked:n.presetZoomCurvesLinked,onChange:e=>d(e.target.checked)}),` `,`Link pan and zoom curves`]}),(0,N.jsx)(`p`,{children:`Pan curve`}),(0,N.jsx)(pf,{value:s,onChange:u}),(0,N.jsx)(`p`,{children:`Zoom curve`}),(0,N.jsx)(pf,{value:c,onChange:l})]}),(0,N.jsx)(`ul`,{children:Cf.map(e=>Mf(e,n,i,r))}),(0,N.jsxs)(jf,{children:[(0,N.jsx)(`dt`,{children:`Deployed commit`}),(0,N.jsxs)(`dd`,{children:[p?(0,N.jsx)(`a`,{href:p,rel:`noreferrer`,target:`_blank`,title:f,children:hf(f)}):(0,N.jsx)(`span`,{title:f,children:hf(f)}),a&&a.git_sha!==`unknown`&&(0,N.jsx)(`button`,{type:`button`,onClick:()=>{navigator.clipboard.writeText(a.git_sha)},children:`Copy SHA`})]})]})]}),(0,N.jsx)($d,{})]})})}),Pf=new Set([`E`,`J`,`V`]);function X(e){return String(e)}function Ff(e){if(e)return e.thread_id??e.thread?.id}function If(e){if(!e)return null;let t=Ff(e);return{id:e.id,name:e.name,categories:[...e.categories??[]],description:e.description??null,parent_id:e.parent_id??null,thread_id:t,thread:t===void 0?void 0:{id:t,name:e.thread?.name??``},agent_id:e.agent_id??null,agent_name:e.agent_name??null,flavor:e.flavor,weight:e.weight}}function Lf(e){let t=new Map;for(let n of e){let e=n.activity;if(!e)continue;let r=X(e.id),i=t.get(r),a=Ff(e)??i?.threadId;if(a!==void 0){if(!i){t.set(r,{activity:e,start:n.timestamp,end:Pf.has(n.phase)?n.timestamp:1/0,parentId:e.parent_id??null,threadId:a});continue}i.start=Math.min(i.start,n.timestamp),Pf.has(n.phase)&&(i.end=Number.isFinite(i.end)?Math.max(i.end,n.timestamp):n.timestamp)}}return t}function Rf(e,t,n,r){return e<=r&&t>=n}function zf(e,t){return e.find(e=>e.activity!==null&&X(e.activity.id)===t&&(e.phase===`B`||e.phase===`Q`))?.phase===`Q`?`Q`:`B`}function Bf(e,t,n,r,i){let a=[],o=0,s=()=>`clip-${o+=1}`;for(let o of n){let n=t.get(o);if(!n)continue;let c=If(n.activity),l=e.filter(e=>e.activity!==null&&X(e.activity.id)===o&&e.timestamp>=r&&e.timestamp<=i);Rf(n.start,n.end,r,i)&&n.start<r&&a.push({id:s(),timestamp:r,phase:zf(e,o),activity:c});for(let e of l)a.push({id:e.id,timestamp:e.timestamp,phase:e.phase,message:e.message,activity:If(e.activity)});Rf(n.start,n.end,r,i)&&n.end>i&&!l.some(e=>Pf.has(e.phase))&&a.push({id:s(),timestamp:i,phase:`E`,activity:c})}return a.sort((e,t)=>e.timestamp-t.timestamp||String(e.id).localeCompare(String(t.id)))}function Vf(e,t,n){let r=[],i=new Set,a=t.get(e)?.parentId??null;for(;a!=null&&!i.has(X(a));){let e=X(a);i.add(e);let o=t.get(e);if(!o||!n.has(X(o.threadId)))break;r.push(e),a=o.parentId}return r}function Hf(e,t){let n=t.leftBoundaryTime,r=t.rightBoundaryTime,i=new Set(t.includedThreadIds.map(X)),a=new Set(t.collapsedThreadIds.map(X)),o=Lf(e.events),s=new Set;for(let[e,t]of o)if(i.has(X(t.threadId))&&Rf(t.start,t.end,n,r)){s.add(e);for(let t of Vf(e,o,i))s.add(t)}let c=new Map(e.threads.map(e=>[X(e.id),e])),l=t.includedThreadIds.flatMap((e,t)=>{let n=c.get(X(e));return n?[{...n,rank:t,collapsed:a.has(X(e))}]:[]}),u=Bf(e.events,o,s,n,r),d=new Set;for(let e of u)for(let t of e.activity?.categories??[])d.add(X(t));let f=e.categories.filter(e=>d.has(X(e.id))),p=e.attentionShifts.filter(e=>i.has(X(e.thread_id))&&e.timestamp>=n&&e.timestamp<=r);return{version:1,exportedAt:t.exportedAt??Date.now(),viewport:{leftBoundaryTime:n,rightBoundaryTime:r},timeLabels:{absoluteTimeLabels:!!t.absoluteTimeLabels,twelveHourClock:!!t.twelveHourClock},fixture:{attentionShifts:p,categories:f,events:u,threads:l,traceId:e.traceId,traceName:e.traceName}}}function Uf(e){return`${JSON.stringify(e,null,2)}\n`}function Wf(e,t){let n=e.trim().replace(/[/\\?%*:|"<>]/g,`-`).replace(/\s+/g,`-`).replace(/-+/g,`-`).replace(/^-|-$/g,``).slice(0,80),r=new Date(t).toISOString().slice(0,10);return`${n||`timeline`}-${r}.json`}function Gf(e,t=Kf){t(Wf(e.fixture.traceName,e.exportedAt),Uf(e))}function Kf(e,t){let n=new Blob([t],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,i.rel=`noopener`,document.body.appendChild(i),i.click(),i.remove(),URL.revokeObjectURL(r)}var qf=A.form`
  min-width: min(90vw, 420px);
  h1 {
    margin-top: 0;
    font-size: 1.2em;
  }
  p {
    color: #555;
    line-height: 1.4;
  }
  label {
    display: block;
    margin: 0.6em 0 0.2em;
    font-weight: 600;
  }
  input[type='datetime-local'] {
    width: 100%;
  }
  button {
    margin-right: 0.5em;
  }
`,Jf=A.li`
  display: flex;
  gap: 0.75em;
  align-items: center;
  list-style: none;
  margin: 0.35em 0;
  label {
    display: flex;
    align-items: center;
    gap: 0.35em;
    margin: 0;
    font-weight: 400;
  }
`,Yf=A.div`
  display: flex;
  gap: 0.5em;
  input {
    flex: 1;
  }
`,Xf=[];function Zf(e,t,n){let r=Object.fromEntries(Object.entries(e).map(([e,t])=>[e,{...t}]));return Di(n?Ei(t,r):r).map(([,e])=>e)}function Qf(e,t,n,r){let i=new Set(r.map(String));return Zf(e,t,n).map(e=>({id:e.id,name:e.name,included:!i.has(String(e.id)),collapsed:!!e.collapsed}))}function $f(e){if(e.traceId===null||!e.traceName)return{error:`Open a trace before sharing.`};let t=zi(e.startValue),n=zi(e.endValue);if(t===null||n===null||n<=t)return{error:`Choose a start time before the end time.`};let r=e.draftThreads.filter(e=>e.included);return r.length===0?{error:`Include at least one thread.`}:{snapshot:Hf({traceId:e.traceId,traceName:e.traceName,threads:Object.values(e.threads),events:e.events,categories:e.categories,attentionShifts:e.attentionShifts},{leftBoundaryTime:t,rightBoundaryTime:n,includedThreadIds:r.map(e=>e.id),collapsedThreadIds:r.filter(e=>e.collapsed).map(e=>e.id),absoluteTimeLabels:e.absoluteTimeLabels,twelveHourClock:e.twelveHourClock})}}function ep({absoluteTimeLabels:e,attentionDrivenThreadOrder:t,attentionShifts:n,categories:r,events:i,filterExcludes:a,hideShareTimeline:o,leftBoundaryTime:s,rightBoundaryTime:c,shareTimelineVisible:l,threads:u,twelveHourClock:d,traceId:f,traceName:p}){let[m,h]=(0,j.useState)(``),[g,_]=(0,j.useState)(``),[v,y]=(0,j.useState)([]),[b,x]=(0,j.useState)(!1),[S,C]=(0,j.useState)(null),[w,T]=(0,j.useState)(null);(0,j.useEffect)(()=>{if(!l)return;let e=Ii(),r=Date.now(),i=(Number.isFinite(s)&&s>0?s:e?.leftBoundaryTime)??r-36e5,o=(Number.isFinite(c)&&c>0?c:e?.rightBoundaryTime)??r;h(Ri(i)),_(Ri(o)),y(Qf(u,n,t,a)),x(!1),C(null),T(null)},[l]);let E=()=>$f({absoluteTimeLabels:e,attentionShifts:n,categories:r,draftThreads:v,endValue:g,events:i,startValue:m,threads:u,twelveHourClock:d,traceId:f,traceName:p});return(0,N.jsx)(Xs,{contentLabel:`Share timeline`,isOpen:l,onRequestClose:o,wide:!0,children:(0,N.jsxs)(qf,{onSubmit:async e=>{e.preventDefault();let t=E();if(`error`in t){C(t.error);return}x(!0),C(null);try{let e=await fetch(`/api/timeline-shares`,{method:`POST`,credentials:`include`,headers:{"content-type":`application/json`},body:JSON.stringify({snapshot:t.snapshot})}),n=await e.json().catch(()=>({}));if(!e.ok)throw Error(typeof n.error==`string`?n.error:`Share failed (${e.status})`);if(typeof n.url!=`string`)throw Error(`Share succeeded but no URL was returned.`);T(n.url)}catch(e){C(e instanceof Error?e.message:`Share failed.`)}finally{x(!1)}},children:[(0,N.jsx)(`h1`,{children:`Share timeline`}),(0,N.jsx)(`p`,{children:`Anyone with the link can see this frozen slice — activity names and event messages in range. It will not update as the live trace changes. Export JSON downloads the same snapshot as a file.`}),(0,N.jsx)(`label`,{htmlFor:`share-start`,children:`Start`}),(0,N.jsx)(`input`,{id:`share-start`,type:`datetime-local`,step:`1`,value:m,onChange:e=>h(e.target.value)}),(0,N.jsx)(`label`,{htmlFor:`share-end`,children:`End`}),(0,N.jsx)(`input`,{id:`share-end`,type:`datetime-local`,step:`1`,value:g,onChange:e=>_(e.target.value)}),(0,N.jsx)(`label`,{children:`Threads`}),(0,N.jsx)(`ul`,{children:v.map(e=>(0,N.jsxs)(Jf,{children:[(0,N.jsxs)(`label`,{children:[(0,N.jsx)(`input`,{type:`checkbox`,checked:e.included,onChange:()=>y(t=>t.map(t=>String(t.id)===String(e.id)?{...t,included:!t.included}:t))}),e.name]}),(0,N.jsxs)(`label`,{children:[(0,N.jsx)(`input`,{type:`checkbox`,checked:e.collapsed,disabled:!e.included,onChange:()=>y(t=>t.map(t=>String(t.id)===String(e.id)?{...t,collapsed:!t.collapsed}:t))}),`collapsed`]})]},String(e.id)))}),S?(0,N.jsx)(`p`,{role:`alert`,children:S}):null,w?(0,N.jsxs)(Yf,{children:[(0,N.jsx)(`input`,{readOnly:!0,value:w,"aria-label":`Share URL`}),(0,N.jsx)(`button`,{type:`button`,onClick:()=>{navigator.clipboard.writeText(w)},children:`Copy URL`})]}):(0,N.jsx)(`button`,{type:`submit`,disabled:b,children:b?`Publishing…`:`Publish public URL`}),(0,N.jsx)(`button`,{type:`button`,onClick:()=>{let e=E();if(`error`in e){C(e.error);return}C(null),Gf(e.snapshot)},disabled:b,children:`Export JSON`}),(0,N.jsx)(`button`,{type:`button`,onClick:o,children:`Close`})]})})}var tp=b(e=>{let t=V(e);return{absoluteTimeLabels:e.settings.absoluteTimeLabels,attentionDrivenThreadOrder:e.settings.attentionDrivenThreadOrder,twelveHourClock:e.settings.twelveHourClock,attentionShifts:P(e).attentionShifts,categories:P(e).categories,events:t.events,filterExcludes:t.trace?.filterExcludes??Xf,leftBoundaryTime:t.leftBoundaryTime,rightBoundaryTime:t.rightBoundaryTime,shareTimelineVisible:e.shareTimelineVisible,threads:t.threads,traceId:t.trace?.id??null,traceName:t.trace?.name??null}},e=>({hideShareTimeline:()=>e(zn())}))(ep),np=A.div`
  font-size: 12px;
  min-width: min(90vw, 480px);

  h1 {
    margin: 0 0 12px;
    font-size: 16px;
  }
`,rp=A.section`
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
`,ip=A.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`,ap=A.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`,op=A.span`
  color: #222;
`,sp=A.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
`,cp=A.kbd`
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
`;function lp({keys:e,apple:t}){return(0,N.jsx)(sp,{children:e.map((e,n)=>(0,N.jsx)(cp,{children:Ca(e,t)},`${e}-${n}`))})}var up=b(e=>({keyboardShortcutsVisible:e.keyboardShortcutsVisible}),e=>({hideKeyboardShortcuts:()=>e(Vn())}))(({keyboardShortcutsVisible:e,hideKeyboardShortcuts:t})=>{let n=Sa();return(0,N.jsx)(Xs,{contentLabel:`Keyboard shortcuts`,isOpen:e,onRequestClose:t,wide:!0,children:(0,N.jsxs)(np,{children:[(0,N.jsx)(`h1`,{children:`Keyboard shortcuts`}),Ea.map(e=>(0,N.jsxs)(rp,{children:[(0,N.jsx)(`h2`,{children:e.title}),e.note?(0,N.jsx)(`p`,{children:e.note}):null,(0,N.jsx)(ip,{children:e.shortcuts.map(e=>(0,N.jsxs)(ap,{children:[(0,N.jsx)(op,{children:e.label}),(0,N.jsx)(lp,{keys:e.keys,apple:n})]},e.id))})]},e.title))]})})});function dp(e,t,n){if(!e.thread_id)return!1;let r=t[t.length-1];return r?r.level+1===n[String(e.thread_id)]?.current:!1}zr.default.setAppElement(`#app-root`);var fp=({children:e,isSplit:t,hideSidePanel:n,threads:r})=>t?(0,N.jsxs)(Rr,{split:`vertical`,minSize:100,defaultSize:Number.parseInt(localStorage.getItem(`splitPos`)??``,10)||100,onChange:e=>localStorage.setItem(`splitPos`,String(e)),primary:`second`,children:[(0,N.jsx)(jd,{closePanel:n,children:(0,N.jsx)(rd,{threads:r})}),e]}):(0,N.jsx)(`div`,{style:{height:`100%`},children:e}),pp=class extends j.Component{timelineCursorTime=null;state={searchBarVisible:!1,commanderVisible:!1,additionalCommands:[],field:void 0};searchRef=null;constructor(e){super(e);let t=e.routeParams.trace_id;this.props.fetchUser(e.user.id),e.user&&t&&e.fetchTrace(t)}componentDidCatch(e,t){this.props.createToast(`${e.message}. Top level error. ${t.componentStack??``}`,`error`)}getItems=e=>e(this.props);logout=async()=>{await fetch(`/auth/logout`,{method:`DELETE`,credentials:`include`}),localStorage.removeItem(`state`),window.location.assign(`/login`)};addCommand=e=>{this.setState(t=>({additionalCommands:[e,...t.additionalCommands]}))};submitCommand=e=>{this.hideCommander(),this.props.runCommand(this.props.operand,e)};showCommander=()=>{this.setState({commanderVisible:!0})};showSearchPanel=()=>{this.setState({searchBarVisible:!0}),this.searchRef?.focus(),this.searchRef?.setSelectionRange(0,this.searchRef.value.length)};hideSearchPanel=()=>{this.setState({searchBarVisible:!1})};hideCommander=()=>{this.setState({commanderVisible:!1,field:void 0})};setCommanderCommand=e=>{this.setState({field:{command:e,parameters:{}}},()=>{this.showCommander()})};runShortcutCommand=e=>{e&&((e.parameters?.length??0)===0?this.submitCommand(e):this.setCommanderCommand(e))};renderTimeline=()=>{let{trace_id:e}=this.props.routeParams;return e?(0,N.jsx)(Ou,{trace_id:e,addCommand:this.addCommand,submitCommand:this.submitCommand,onCursorTimeChange:e=>{this.timelineCursorTime=e}},`timeline`):null};getCommands=e=>{let t=[...Wo,...this.state.additionalCommands],n=(this.props.activitySelection??[]).filter(e=>this.props.activities[e]);if(fl()&&n.length>1)return[...Bo(n),...t];if(e)switch(e.type){case`activity`:return[...e.activityStatus===`active`||e.activityStatus===`suspended`||e.activityStatus===`complete`?qo(e.activityStatus):[],...t];default:return t}return t};render(){return(0,N.jsx)(Za,{eventListeners:[[`keydown`,e=>{let t=e;if(t.repeat)return;t.key===`Shift`&&this.props.keyDown(t.key);let n=Da(t);if(n){!this.props.aModalIsOpen&&!La(t)&&(t.preventDefault(),n===`redo`?this.props.redoLastCommand():this.props.undoLastCommand());return}if(t.ctrlKey||t.metaKey){if(Ta(t)){t.preventDefault(),this.props.toggleKeyboardShortcuts();return}switch(t.key){case`f`:this.props.aModalIsOpen||(t.preventDefault(),t.shiftKey?this.props.showAdvancedSearch():this.showSearchPanel());break;case`m`:t.preventDefault(),this.props.toggleActivityMute();break;case`p`:case`P`:t.shiftKey&&(t.preventDefault(),this.showCommander());break;case`,`:t.preventDefault(),this.props.showSettings()}}La(t)||(t.shiftKey&&t.key===`}`?this.props.expandAllThreads():t.shiftKey&&t.key===`{`&&this.props.collapseAllThreads())}],[`keyup`,e=>{let t=e;if(t.key===`Shift`&&this.props.keyUp(t.key),this.props.operand&&!this.props.aModalIsOpen&&!La(t))switch(this.props.operand.type){case`activity`:if(t.code===`Space`)this.props.showActivityDetails();else switch(t.key){case`e`:case`v`:case`j`:{let e=this.props.operand.activity_id,n=e===void 0?void 0:this.props.activities[String(e)];if(t.key===`e`&&n?.status===`unstarted`&&n.scheduled_start!=null){let e=this.timelineCursorTime;e==null||!Number.isFinite(e)?this.props.createToast(`Move the cursor over the timeline to choose an end time.`,`error`):e<n.scheduled_start?this.props.createToast(`The scheduled end must be after the scheduled start.`,`error`):this.props.updateActivity(n.id,{scheduled_end_integer:Math.floor(e)});break}n&&dp(n,this.props.blocks.filter(t=>String(t.activity_id)===String(e)),this.props.threadLevels)&&this.runShortcutCommand(this.getCommands(this.props.operand).find(e=>e.shortcut===t.key.toUpperCase()));break}case`s`:{let e=this.props.operand.activity_id;e!==void 0&&this.props.activities[String(e)]?.status===`active`&&this.setCommanderCommand(Ko.find(({shortcut:e})=>e===`S`));break}}}}]],node:document,children:()=>(0,N.jsx)(N.Fragment,{children:(0,N.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,height:`100%`},children:[(0,N.jsx)(kd,{traces:this.props.user.traces,currentTrace:this.props.trace,selectTrace:this.props.selectTrace,deleteTrace:this.props.deleteTrace,deleteCurrentTrace:this.props.deleteCurrentTrace,currentMantra:this.props.user&&this.props.user.mantras[this.props.user.mantras.length-1]?.name,createMantra:e=>this.props.createMantra(e),onOpenCommander:this.showCommander,logout:this.logout}),(0,N.jsxs)(`main`,{style:{position:`relative`,height:`100%`},children:[(0,N.jsx)(fp,{isSplit:this.props.advancedSearchVisible,hideSidePanel:this.props.hideAdvancedSearch,threads:this.props.threads,children:(0,N.jsx)(`div`,{style:{height:`100%`,width:`100%`},children:this.props.view===`multithread`?this.renderTimeline():this.props.view===`singlethread`&&this.props.location.pathname.endsWith(`/threads/${this.props.viewThread}`)?(0,N.jsx)(Fu,{thread:this.props.viewThread===null?void 0:this.props.threads[String(this.props.viewThread)]}):null})}),(0,N.jsx)(`div`,{style:{bottom:0,width:`100%`,position:`absolute`,zIndex:1,visibility:this.state.searchBarVisible?`visible`:`hidden`},children:(0,N.jsx)(Ud,{hideSearchBar:this.hideSearchPanel,inputRef:e=>{this.searchRef=e}})})]}),this.props.settings.activityMute&&(0,N.jsxs)(`div`,{style:{position:`fixed`,bottom:8,right:8,zIndex:20,background:`#111`,color:`#fff`,padding:`6px 10px`,borderRadius:4,fontSize:12},children:[`Activities muted — `,wa([`Mod`,`M`]),` to unmute`]}),(0,N.jsx)(Xd,{}),(0,N.jsx)(Nf,{}),(0,N.jsx)(tp,{}),(0,N.jsx)(up,{}),(0,N.jsx)(fi,{field:this.state.field,isOpen:this.state.commanderVisible,commands:this.getCommands(this.props.operand),onSubmit:this.submitCommand,hideCommander:this.hideCommander,getItems:this.getItems})]})})})}},mp=b(e=>{let t=V(e),n=t.trace?.id!==null&&t.trace?.name?{id:t.trace.id,name:t.trace.name}:null;return{aModalIsOpen:e.settingsVisible||e.shareTimelineVisible||e.keyboardShortcutsVisible||e.activityDetailModalVisible,activities:t.activities,advancedSearchVisible:e.advancedSearchVisible,blocks:t.blocks,categories:P(e).categories,threadLevels:t.threadLevels,threads:t.threads,operand:e.operand,activitySelection:e.activitySelection,settings:e.settings,trace:n,user:P(e),view:e.view,viewThread:e.viewThread}},e=>({collapseAllThreads:()=>e(cn()),createMantra:t=>e(fn(t)),createToast:(t,n)=>e($n(t,n)),deleteCurrentTrace:()=>e(Yn()),deleteTrace:t=>e(gn(t)),expandAllThreads:()=>e(ln()),fetchTrace:t=>e(Jn(t)),fetchUser:t=>e(mn(t)),hideAdvancedSearch:()=>e(cr()),keyDown:t=>e(Gn(t)),keyUp:t=>e(Kn(t)),runCommand:(t,n)=>e(tn(t,n)),selectTrace:t=>e(qn(t)),showActivityDetails:()=>e(Mn()),showAdvancedSearch:()=>e(sr()),showSettings:()=>e(In()),toggleKeyboardShortcuts:()=>e(Hn()),toggleActivityMute:()=>e(Zn(`activityMute`)),undoLastCommand:()=>e(kn()),redoLastCommand:()=>e(An()),updateActivity:(t,n)=>e(Dn(t,n))}))(pp);function hp(){let e=x(),t=i();return(0,N.jsx)(mp,{routeParams:e,location:t})}var gp=b(e=>{let t=P(e);return{name:t.name,traces:t.traces,username:t.username}})(({name:e,traces:t,username:n=`david`})=>(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`h1`,{children:e}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`h2`,{children:`Traces`}),(0,N.jsx)(`ul`,{children:t.map(e=>(0,N.jsx)(`li`,{children:(0,N.jsx)(r,{to:`/${n}/traces/${e.id}`,children:e.name})},e.id))})]})]})),_p=ae`
  html {
    box-sizing: border-box;
    font-family: sans-serif;
    overflow: hidden;
    width: 100%;
    height: 100%;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  *::before, *::after {
    box-sizing: border-box;
  }

  * {
    box-sizing: inherit;
  }

  body {
    position: relative;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 100%;
    margin: 0;
    overflow: hidden;
    font-size: 12px;
  }

  :root {
    --secondary-panel-background: #F3F3F3;
    --secondary-panel-background-hover: #ddd;
    --secondary-panel-color: #5A5A5A;
  }

  #app-root { 
    transition: transform 0.15s;
    background: ${M.background};
    width: 100%;
    height: 100vh;
    height: 100dvh;
    max-height: 100dvh;
    min-width: 0;
    min-height: 0;
  }

  /* The trace page is a column: header + timeline. Let the timeline consume
     the remaining viewport instead of asking it to be 100% tall in addition
     to the header. min-height: 0 is required for nested measured flex panes. */
  main {
    flex: 1 1 auto !important;
    width: 100%;
    min-width: 0;
    min-height: 0;
    height: auto !important;
    overflow: hidden;
  }

   .Resizer {
        background: #000;
        opacity: .2;
        z-index: 1;
        box-sizing: border-box;
        background-clip: padding-box;
    }

     .Resizer:hover {
        transition: all 2s ease;
    }

     .Resizer.horizontal {
        height: 11px;
        margin: -5px 0;
        border-top: 5px solid rgba(255, 255, 255, 0);
        border-bottom: 5px solid rgba(255, 255, 255, 0);
        cursor: row-resize;
        width: 100%;
    }

    .Resizer.horizontal:hover {
        border-top: 5px solid rgba(0, 0, 0, 0.5);
        border-bottom: 5px solid rgba(0, 0, 0, 0.5);
    }

    .Resizer.vertical {
        width: 11px;
        margin: 0 -5px;
        border-left: 5px solid rgba(255, 255, 255, 0);
        border-right: 5px solid rgba(255, 255, 255, 0);
        cursor: col-resize;
    }

    .Resizer.vertical:hover {
        border-left: 5px solid rgba(0, 0, 0, 0.5);
        border-right: 5px solid rgba(0, 0, 0, 0.5);
    }
    .Resizer.disabled {
      cursor: not-allowed;
    }
    .Resizer.disabled:hover {
      border-color: transparent;
    }

  .ReactModalPortal > div {
    z-index: 1000;
  }

  /* iOS Safari zooms the page when a focused field is under 16px, which
     combined with overflow:hidden clips the SPA. */
  @media (max-width: 640px) {
    input,
    select,
    textarea {
      font-size: 16px;
    }
  }

`,vp=b(e=>({loggedIn:e.loggedIn,username:P(e).username}))(({loggedIn:e,username:t=`david`})=>(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(_p,{}),(0,N.jsxs)(a,{children:[(0,N.jsx)(d,{path:`/`,element:(0,N.jsx)(re,{replace:!0,to:e?`/${t}/traces/1`:`/login`})}),(0,N.jsx)(d,{path:`/login`,element:(0,N.jsx)(Ir,{})}),(0,N.jsx)(d,{path:`/register`,element:(0,N.jsx)(Lr,{})}),(0,N.jsx)(d,{path:`/:username`,element:(0,N.jsx)(gp,{})}),(0,N.jsx)(d,{path:`/:username/traces/:trace_id/*`,element:(0,N.jsx)(hp,{})}),(0,N.jsx)(d,{path:`/traces/:trace_id/*`,element:(0,N.jsx)(hp,{})})]}),(0,N.jsx)(br,{})]})),yp=be(),bp=`TIMELINE_EVENT_RECEIVED`,xp=`TIMELINE_EVENT_DELETED`;function Sp(e,t){let n=String(t.id),r=e.findIndex(e=>String(e.id)===n);if(r===-1)return[...e,t];let i=[...e];return i[r]=t,i}function Cp(e,t){return e.filter(e=>String(e.id)!==String(t))}function wp(e,t){let n=t.activity?.thread;if(!n?.name)return e;let r=String(n.id);return{...e,[r]:{...e[r],...n}}}function Tp(e,t){let n=Co(e,t);if(t.type!==`TIMELINE_EVENT_RECEIVED`&&t.type!==`TIMELINE_EVENT_DELETED`||String(n.trace?.id)!==String(t.trace_id))return n;let r=t.type===`TIMELINE_EVENT_RECEIVED`&&t.event?Sp(n.events,t.event):t.event_id===void 0?n.events:Cp(n.events,t.event_id),i=t.type===`TIMELINE_EVENT_RECEIVED`&&t.event?wp(n.threads,t.event):n.threads,a=co(r,Object.values(i));return{...n,activities:lo(a.activities,n.activities),blocks:a.blocks,events:a.events,lastCategory_id:a.lastCategory_id??null,lastThread_id:a.lastThread_id??null,maxTime:a.max,minTime:a.min-6e5,threadLevels:a.threadLevels,threads:a.threads}}var Ep={shift:!1};function Dp(e=Ep,t){return(t.type===`KEY_DOWN`||t.type===`KEY_UP`)&&t.key?{...e,[t.key.toLowerCase()]:t.type===Ne}:e}function Op(e=null,t){switch(t.type){case Xe:return{type:t.index===null?null:`activity`,activity_id:t.activity_id,activityStatus:t.activityStatus,thread_id:t.thread_id};case Be:return e&&{...e,activityStatus:`complete`};case Ge:return e&&{...e,activityStatus:`suspended`};case We:case Ue:return e&&{...e,activityStatus:`active`};default:return e}}var kp={matches:[],blocksForMatch:[],blockIndex:0,matchIndex:0,searchStack:[],includeStack:[],excludeStack:[],options:{matchCase:!1,matchWholeWord:!1,useRegularExpression:!1},searchError:null,advancedOptions:{limitToVisibleSectionOfTimeline:!1,threadIncludeList:[],threadExcludeList:[],activityStatuses:null,activityFields:`name`}};function Ap(e,t){return t[0]===e?t:[e,...t].slice(0,20)}function jp(e=kp,t){switch(t.type){case ut:return{...e,searchStack:Ap(t.searchTerm??``,e.searchStack),searchError:null};case dt:return{...e,matches:t.matches??[],blocksForMatch:t.blocksForMatch??[],blockIndex:0,matchIndex:0,searchError:t.searchError??null};case mt:return{...e,matchIndex:t.matchIndex??0,blocksForMatch:t.blocksForMatch??[],blockIndex:0};case ht:return{...e,blockIndex:t.blockIndex??0};case gt:{let n=t.option;return n?{...e,options:{...e.options,[n]:!e.options[n]}}:e}case Xt:return{...e,advancedOptions:{...e.advancedOptions,threadIncludeList:t.thread_ids??[]},includeStack:Ap(t.inputValue??``,e.includeStack)};case Zt:return{...e,advancedOptions:{...e.advancedOptions,threadExcludeList:t.thread_ids??[]},excludeStack:Ap(t.inputValue??``,e.excludeStack)};default:return e}}var Mp=[`rightAlignTimelineText`];function Np(e){return Mp.includes(e)}var Pp=ta(),Fp={absoluteTimeLabels:!1,twelveHourClock:!1,attentionDrivenThreadOrder:!0,attentionFlows:!1,presetPanCurve:ea(Pp.panCurve),presetZoomCurve:ea(Pp.zoomCurve),presetZoomCurvesLinked:Pp.curvesLinked,presetZoomDurationMs:Pp.durationMs,darkerAsWeGoDown:!0,rightAlignTimelineText:!1,activityMuteOpacity:.1,activityMute:!1,reactiveThreadHeight:!0,showActivityIds:!1,swyzzle:!1,swyzzleEffect:Xl,swyzzleIdleSeconds:7,suspendResumeFlows:!0,suspendResumeFlowsOnlyForFocusedActivity:!1,uniformBlockHeight:!1};function Ip(e=Fp,t){if(t.type===`USER_FETCH_SUCCEEDED`){let n=t.data?.settings?.rightAlignTimelineText;return typeof n==`boolean`?{...e,rightAlignTimelineText:n}:e}let n=t.setting;if(!n||!(n in e))return e;if(t.type===`SETTING_SET`){if(n===`swyzzleEffect`)return{...e,swyzzleEffect:$l(t.value)};if(n===`swyzzleIdleSeconds`)return{...e,swyzzleIdleSeconds:ka(t.value)};if(n===`presetZoomDurationMs`)return{...e,presetZoomDurationMs:Zi(t.value)};if((n===`presetPanCurve`||n===`presetZoomCurve`)&&typeof t.value==`string`)try{return{...e,[n]:ea(Qi(JSON.parse(t.value)))}}catch{return e}return typeof e[n]==`boolean`?{...e,[n]:!!t.value}:e}return t.type!==`SETTING_TOGGLE`||typeof e[n]!=`boolean`?e:{...e,[n]:!e[n]}}function Lp(e=[],t){switch(t.type){case Lt:return[...e,{type:t.notificationType??``,message:t.message??``}];case Rt:return e.filter((e,n)=>n!==t.index);default:return e}}var Rp=`UNDO_POP`,zp=`REDO_POP`,Bp=(e,t)=>`${e}:${t}`;function Vp(e={},t){if(t.type===`UNDO_CLEAR`)return t.scope?{...e,[t.scope]:[]}:{};if(!t.scope)return e;let n=e[t.scope]??[];return t.type===`UNDO_RECORD`&&t.target?{...e,[t.scope]:[...n,t.target].slice(-100)}:t.type===`REDO_POP`&&t.inverse?{...e,[t.scope]:[...n,t.inverse].slice(-100)}:t.type===`UNDO_POP`?{...e,[t.scope]:n.filter(e=>e!==t.target)}:e}function Hp(e={},t){if(t.type===`UNDO_CLEAR`)return t.scope?{...e,[t.scope]:[]}:{};if(!t.scope)return e;if(t.type===`UNDO_RECORD`)return{...e,[t.scope]:[]};let n=e[t.scope]??[];return t.type===`UNDO_POP`&&t.inverse?{...e,[t.scope]:[...n,t.inverse].slice(-100)}:t.type===`REDO_POP`?{...e,[t.scope]:n.filter(e=>e!==t.target)}:e}var Up=t({activityDetailEditName:()=>Gp,activityDetailModalVisible:()=>Wp,activitySelection:()=>Ro,advancedSearchVisible:()=>Qp,categoryManagerVisible:()=>Kp,keyboardShortcutsVisible:()=>Yp,loggedIn:()=>$p,modifiers:()=>Dp,operand:()=>Op,redo:()=>Hp,search:()=>jp,settings:()=>Ip,settingsVisible:()=>qp,shareTimelineVisible:()=>Jp,timeline:()=>Tp,toaster:()=>Lp,undo:()=>Vp,user:()=>Dr,view:()=>Xp,viewThread:()=>Zp});function Wp(e=!1,t){switch(t.type){case qe:return!0;case Je:return!1;default:return e}}function Gp(e=!1,t){switch(t.type){case qe:return!!t.editName;case Je:return!1;default:return e}}function Kp(e=!1,t){switch(t.type){case et:return!0;case tt:return!1;default:return e}}function qp(e=!1,t){switch(t.type){case xt:return!0;case St:return!1;default:return e}}function Jp(e=!1,t){switch(t.type){case Ct:return!0;case wt:return!1;default:return e}}function Yp(e=!1,t){switch(t.type){case Tt:return!0;case Et:return!1;case Dt:return!e;default:return e}}function Xp(e=`multithread`,t){switch(t.type){case Kt:return t.view??`multithread`;default:return e}}function Zp(e=null,t){switch(t.type){case Kt:return t.view===`multithread`?null:t.thread_id??null;default:return e}}function Qp(e=!1,t){switch(t.type){case _t:return!0;case vt:return!1;default:return e}}function $p(e=!1,t){return!0}var em=_({...Up});function*tm({operand:e,command:t}){let n=yield E(V),r=e??{};if(typeof t.action==`function`)t.action(t);else{let e=t.activity_id||r.activity_id,i=t.thread_id||r.thread_id;switch(t.action){case Fo:case Io:{if(!fl()||!Array.isArray(t.activity_ids))return;let e=t.activity_ids.filter(e=>typeof e==`string`&&!!n.activities[e]);if(e.length<2||t.action===`ACTIVITIES_BULK_MOVE`&&i===void 0||t.action===`ACTIVITIES_BULK_DELETE`&&!window.confirm(`Delete ${e.length} selected activities and their events? Unselected children will remain.`))return;yield h({type:t.action,ids:e,thread_id:i});break}case Fe:if(i===void 0)return;yield h(vn({name:t.name??``,timestamp:Date.now(),description:``,thread_id:i,phase:`B`,category_id:t.category_id??null})),yield h(lr(i,Date.now()));break;case Re:if(i===void 0)return;yield h(yn({name:t.name??``,timestamp:Date.now(),description:``,thread_id:i,phase:`Q`,category_id:t.category_id??null})),yield h(lr(i,Date.now()));break;case Ie:{let e=i??n.lastThread_id??Object.values(n.threads)[0]?.id;if(e===void 0||!(t.name??``).trim())return;yield h(Tn({name:(t.name??``).trim(),thread_id:e,scheduled_start:null,scheduled_end:null}));break}case Ue:if(e===void 0||i===void 0)return;yield h(Sn({id:e,timestamp:Date.now(),message:t.message,thread_id:i})),yield h(lr(i,Date.now()));break;case We:if(e===void 0||i===void 0)return;yield h(Cn({id:e,timestamp:Date.now(),message:t.message,thread_id:i})),yield h(lr(i,Date.now()));break;case Be:case Ve:case He:if(e===void 0||i===void 0)return;let r=t.message?t.message:``,a=t.action.includes(`REJECT`)?`J`:t.action.includes(`RESOLVE`)?`V`:`E`;yield h(bn({id:e,timestamp:Date.now(),message:r,thread_id:i,eventFlavor:a}));break;case ze:if(e===void 0||i===void 0)return;yield h(En(e,i));break;case Ge:if(e===void 0||i===void 0)return;yield h(xn({id:e,timestamp:Date.now(),message:t.message?t.message:``,thread_id:i,weight:t.weight?Number(t.weight):void 0})),n=yield E(V),yield h(en(n.events,Object.values(n.threads)));break;case Ye:if(i===void 0)return;yield h(lr(i,Date.now()));break;case qe:yield h(Mn());break;case et:yield h(Pn());break;case xt:yield h(In());break;case Ct:yield h(Rn());break;case Tt:yield h(Bn());break;case Ot:let o=Object.keys(n.threads).length;yield h(nn(t.name??``,o));break;case Pt:yield h(cn());break;case It:yield h(ln());break;case Kt:yield h(Xn(t.view??`multithread`,i))}}}function*nm(){yield O(nt,tm)}function rm(e){window.history.pushState({},``,e),window.dispatchEvent(new PopStateEvent(`popstate`))}async function im({resource:e,params:t={}}){let n=await fetch(t.method===`POST`?`/api/${e.path}`:`/api/${e.path}/${e.id}`,{headers:{"content-type":`application/json`},credentials:`include`,...t});if(!n.ok)throw n;return n.status===204?{data:null}:n.json()}function*Z(e,{resource:t,params:n},r=!0){let i=yield*Q();try{let{data:a}=yield D(im,{resource:t,params:n});return yield h({type:`${e}_SUCCEEDED`,data:a}),r&&[`ACTIVITY_UPDATE`,`ACTIVITY_DELETE`,`EVENT_UPDATE`,`EVENT_DELETE`,`CATEGORY_CREATE`,`CATEGORY_UPDATE`,`THREAD_CREATE`,`THREAD_UPDATE`,`THREAD_DELETE`,`THREADS_REORDER`].includes(e)&&(yield*$({kind:`unsupported`,label:e.replace(/_/g,` `).toLowerCase()},i)),a}catch(t){if(t instanceof Response&&t.status===401){yield D(rm,`/login`);return}console.error(`network error`,t),yield h($n(`${e.replace(/_/g,` `)} failed. Network error.
      
      See Network panel in DevTools for details.`,`error`))}}function*am({type:e,name:t,timestamp:n,description:r,thread_id:i,category_id:a,phase:o=`B`,editName:s}){let c=yield*Q(),l=yield E(V),u=yield*Z(e,{resource:{path:`activities`},params:{method:`POST`,body:JSON.stringify({trace_id:l.trace?.id,thread_id:i,event:{timestamp_integer:n,phase:o},activity:{name:t,description:r,categories:a?[a]:[]}})}});if(u?.activity?.id!==void 0&&i!==void 0&&(yield*$({kind:`activity`,id:u.activity.id,thread_id:i},c),s)){if((yield E(V)).trace?.id!==l.trace?.id||(yield*dm(),(yield E(V)).trace?.id!==l.trace?.id))return;yield*pm(u.activity.id,i,`active`)}}function*om({type:e,id:t,timestamp:n,message:r,eventFlavor:i=`E`}){let a=yield*Q(),o=yield E(V),s=yield*Z(e,{resource:{path:`events`},params:{method:`POST`,body:JSON.stringify({trace_id:o.trace?.id,activity_id:t,event:{timestamp_integer:n,message:r,phase:i}})}});s?.id!==void 0&&(yield*$({kind:`event`,id:s.id},a))}function*sm({type:e,id:t,timestamp:n,message:r,weight:i}){let a=yield*Q(),o=yield E(V),s=yield*Z(e,{resource:{path:`events`},params:{method:`POST`,body:JSON.stringify({trace_id:o.trace?.id,activity_id:t,event:{timestamp_integer:n,message:r,phase:`S`}})}});if(s?.id===void 0)return;let c={kind:`event`,id:s.id};if(i&&t!==void 0){let e=o.activities[String(t)]?.weight??null;(yield*Z(`ACTIVITY_UPDATE`,{resource:{path:`activities`,id:t},params:{method:`PUT`,body:JSON.stringify({activity:{weight:i}})}},!1))!==void 0&&(c.restoreWeight={activity_id:t,weight:e}),yield*dm()}yield*$(c,a)}function*Q(){let e=yield E(V),t=yield E(P);return e.trace?.id==null||t.id==null?null:Bp(t.id,e.trace.id)}function*$(e,t){t&&(yield h({...jn(e),scope:t}))}function*cm(e,t){try{let n=yield E(V),r=e.kind===`move`||e.kind===`creation`?e.trace_id:t??n.trace?.id;if(r==null)return!1;let i=e.kind===`move`?`undo_move`:`reverse_creation`,a=e.kind===`move`?{undo_token:e.token}:e.kind===`creation`?{token:e.token}:{kind:e.kind,target_id:e.id,...e.kind===`event`&&e.restoreWeight?{restore_weight:e.restoreWeight}:{}};try{let t=yield D(im,{resource:{path:`traces/${r}/${i}`},params:{method:`POST`,body:JSON.stringify(a)}});return t.data?.undo_token?{kind:e.kind===`move`?`move`:`creation`,token:t.data.undo_token,trace_id:r}:{kind:`unsupported`,label:`Redo on this server`}}catch(t){if(t?.status!==404||e.kind===`move`||e.kind===`creation`)throw t;return e.kind===`event`&&e.restoreWeight&&(yield D(im,{resource:{path:`activities`,id:e.restoreWeight.activity_id},params:{method:`PUT`,body:JSON.stringify({activity:{weight:e.restoreWeight.weight}})}})),yield D(im,{resource:{path:e.kind===`activity`?`activities`:`events`,id:e.id},params:{method:`DELETE`}}),{kind:`unsupported`,label:`Redo on this server`}}}catch(e){return e instanceof Response&&e.status===401&&(yield D(rm,`/login`)),yield h($n(`Undo/redo failed. The change may have been modified since; history has been kept.`,`error`)),!1}finally{yield*dm()}}function*lm({type:e,ids:t,thread_id:n}){let r=yield*Q(),i=!1;try{if(e===`ACTIVITIES_BULK_MOVE`){let e=(yield E(V)).trace?.id;if(e==null)return;try{yield*$({kind:`move`,token:(yield D(im,{resource:{path:`traces/${e}/activity_moves`},params:{method:`POST`,body:JSON.stringify({activity_ids:t,thread_id:n})}})).data.undo_token,trace_id:e},r)}catch(e){if(e?.status!==404)throw e;i=!0;for(let[e,i]of t.entries())yield D(im,{resource:{path:`activities`,id:i},params:{method:`PUT`,body:JSON.stringify({activity:{thread_id:n,move_child_ids:[]}})}}),e===0&&(yield*$({kind:`unsupported`,label:`Bulk move on this server`},r))}}else for(let e of t)yield D(im,{resource:{path:`activities`,id:e},params:{method:`DELETE`}}),yield*$({kind:`unsupported`,label:`Bulk delete`},r);yield h(Lo([]))}catch{yield h($n(e===`ACTIVITIES_BULK_MOVE`?i?`Move stopped. Some activities may have moved; review the timeline before retrying.`:`Move failed. No activities were moved.`:`Bulk delete stopped. Some activities may have changed; review the timeline before retrying.`,`error`))}finally{yield*dm()}}function*um({type:e,id:t}){yield*Z(e,{resource:{path:`activities`,id:t},params:{method:`DELETE`,body:JSON.stringify({delete_events:!0})}}),yield*dm()}function*dm(){let e=yield E(V);e.trace?.id!==null&&e.trace?.id!==void 0&&(yield*Am({type:Ht,trace:e.trace.id}))}function*fm({type:e,name:t,thread_id:n,scheduled_start:r,scheduled_end:i}){let a=yield*Q(),o=yield E(V),s=yield*Z(e,{resource:{path:`activities`},params:{method:`POST`,body:JSON.stringify({trace_id:o.trace?.id,thread_id:n,activity:{name:t,scheduled_start_integer:r??null,scheduled_end_integer:i??null,categories:[]}})}});yield*dm();let c=s?.activity?.id;c!==void 0&&n!==void 0&&(yield*$({kind:`activity`,id:c,thread_id:n},a)),c!==void 0&&r!=null&&(yield*pm(c,n,`unstarted`))}function*pm(e,t,n){let r=yield E(V),i=r.activities[String(e)],a=r.blocks.findIndex(t=>String(t.activity_id)===String(e));yield h(Un({index:a>=0?a:null,activity_id:e,activityStatus:i?.status??n,thread_id:t??i?.thread_id??null})),yield h(Mn({editName:!0}))}function*mm({type:e,id:t,timestamp:n}){let r=yield*Q(),i=yield E(V),a=yield*Z(e,{resource:{path:`events`},params:{method:`POST`,body:JSON.stringify({trace_id:i.trace?.id,activity_id:t,event:{timestamp_integer:n??Date.now(),phase:`B`}})}});a?.id!==void 0&&(yield*$({kind:`event`,id:a.id},r)),yield*dm()}function*hm({type:e,id:t,updates:n}){yield*Z(e,{resource:{path:`activities`,id:t},params:{method:`PUT`,body:JSON.stringify({activity:{...n}})}}),(n?.thread_id!==void 0||n?.scheduled_start_integer!==void 0||n?.scheduled_end_integer!==void 0||n?.scheduled_start!==void 0||n?.scheduled_end!==void 0)&&(yield*dm())}function*gm({type:e,id:t,updates:n}){yield*Z(e,{resource:{path:`events`,id:t},params:{method:`PUT`,body:JSON.stringify({event:{...n}})}});let r=(yield E(V)).trace;r&&r.id!==null&&(yield*Am({type:Ht,trace:r.id}))}function*_m({type:e,id:t}){if(t===void 0)return;let n=yield E(V);(yield*Z(e,{resource:{path:`events`,id:t},params:{method:`DELETE`}}))!==void 0&&n.trace?.id!==null&&n.trace?.id!==void 0&&(yield*Am({type:Ht,trace:n.trace.id}))}function*vm({type:e,activity_id:t,name:n,color_background:r,color_text:i}){let a=yield E(P);yield*Z(e,{resource:{path:`categories`},params:{method:`POST`,body:JSON.stringify({user_id:a.id,activity_ids:t==null?[]:[t],category:{name:n,color_background:r,color_text:i??`#000000`}})}})}function*ym({type:e,id:t,updates:n}){yield*Z(e,{resource:{path:`categories`,id:t},params:{method:`PUT`,body:JSON.stringify({category:{...n}})}})}function*bm({type:e,name:t}){let n=yield E(P);yield*Z(e,{resource:{path:`mantras`},params:{method:`POST`,body:JSON.stringify({user_id:n.id,mantra:{name:t,timestamp_integer:Date.now()}})}})}function*xm({type:e,thread_id:t,timestamp:n}){let r=yield E(P);yield*Z(e,{resource:{path:`attentions`},params:{method:`POST`,body:JSON.stringify({user_id:r.id,attention:{thread_id:t,timestamp_integer:n}})}})}function*Sm({type:e,id:t,updates:n}){yield*Z(e,{resource:{path:`threads`,id:t},params:{method:`PUT`,body:JSON.stringify({thread:{...n}})}})}function*Cm(){let e=yield E(V);De(e.trace?.id,e.trace?.filterExcludes??[])}function*wm({type:e,orderedIds:t}){let n=(yield E(V)).trace?.id;!n||!t||(yield*Z(e,{resource:{path:`traces`,id:`${n}/thread_order`},params:{method:`PUT`,body:JSON.stringify({thread_ids:t})}}))}function*Tm({type:e,id:t}){yield*Z(e,{resource:{path:`threads`,id:t},params:{method:`DELETE`}})}function*Em({type:e,name:t}){let n=yield E(P);yield*Z(e,{resource:{path:`traces`},params:{method:`POST`,body:JSON.stringify({user_id:n.id,trace:{name:t}})}})}function*Dm(e){let t=yield E(P);t.id!==void 0&&t.id!==null&&(yield*Z(Gt,{resource:{path:`users`,id:t.id},params:{method:`PUT`,body:JSON.stringify({user:{settings:e}})}}))}function*Om({setting:e}){if(!e||!Np(e))return;let t=yield E(t=>t.settings[e]);yield*Dm({[e]:t})}function*km({type:e,id:t}){let n=yield*Z(e,{resource:{path:`users`,id:t}});!n||typeof n!=`object`||typeof n.settings?.rightAlignTimelineText!=`boolean`&&(yield E(e=>e.settings.rightAlignTimelineText))&&(yield*Dm({rightAlignTimelineText:!0}))}function*Am({trace:e}){if(e===void 0)return;let t=yield*Z(Ht,{resource:{path:`traces`,id:typeof e==`object`?e.id:e}});t&&(yield*Nm({data:t}))}function*jm({type:e,id:t}){yield*Z(e,{resource:{path:`traces`,id:t},params:{method:`DELETE`}})}function Mm(e,t){if(!e)return!1;let n=e[String(t.id)];return n?!!n.collapsed:!1}function*Nm({data:e}){if(!e)return;let t=(yield E(V)).threads,n=Pi(e.id);yield h(en(e.events.map(e=>({...e,timestamp:new Date(e.timestamp).getTime()})),e.threads.map(e=>({...e,collapsed:Mm(t,e)||n[String(e.id)]===!0})),e.unstarted??[])),yield h(or(Ee(e.id)))}function*Pm({type:e,name:t,rank:n}){let r=yield E(V);yield*Z(e,{resource:{path:`threads`},params:{method:`POST`,body:JSON.stringify({trace_id:r.trace?.id,thread:{name:t,rank:n}})}})}function*Fm({type:e,id:t,timestamp:n,message:r}){let i=yield*Q(),a=yield E(V),o=yield*Z(e,{resource:{path:`events`},params:{method:`POST`,body:JSON.stringify({trace_id:a.trace?.id,activity_id:t,event:{timestamp_integer:n,message:r,phase:`R`}})}});o?.id!==void 0&&(yield*$({kind:`event`,id:o.id},i))}function*Im({type:e,id:t,timestamp:n,message:r}){let i=yield*Q(),a=yield E(V),o=yield*Z(e,{resource:{path:`events`},params:{method:`POST`,body:JSON.stringify({trace_id:a.trace?.id,activity_id:t,event:{timestamp_integer:n,message:r,phase:`X`}})}});o?.id!==void 0&&(yield*$({kind:`event`,id:o.id},i))}function*Lm(){yield O(Ie,fm),yield O(Le,mm),yield O(Fe,am),yield O(Re,am),yield O(ze,um),yield ee([Fo,Io],lm),yield O(Be,om),yield O(Ue,Fm),yield O(We,Im),yield O(Ge,sm),yield O(Ke,hm),yield O(Qe,vm),yield O($e,ym),yield O(rt,gm),yield O(it,_m),yield O(lt,bm),yield O(Ye,xm),yield O(zt,Em),yield O(Bt,jm),yield w(Ht,Am),yield w(Vt,Am),yield O(Ot,Pm),yield O(kt,Tm),yield O(kt,Cm),yield O(Mt,Sm),yield O(Nt,Cm),yield O(Ft,wm),yield O(Ut,Cm),yield w(Wt,km),yield w(bt,Om)}function Rm(e,t,n){return t+e<0?n-1:(t+e)%n}var zm=class extends Error{constructor(){super(`Invalid regular expression`),this.name=`InvalidSearchRegexError`}};function Bm(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function Vm(e,t){let n=t.useRegularExpression?e:Bm(e),r=t.matchWholeWord?`\\b(?:${n})\\b`:n,i=t.matchCase?``:`i`;try{return new RegExp(r,i)}catch{throw new zm}}function*Hm({searchTerm:e}){if(e.length<=0)return;let t=yield E(V),{advancedOptions:n,options:r}=yield E(e=>e.search),{threadIncludeList:i,threadExcludeList:a}=n,{activities:o,blocks:s}=t;try{let t=Vm(e,r),n=Object.entries(o).filter(([e,n])=>{let r=n.thread_id;return i.length>0&&!i.includes(r??``)||a.length>0&&a.includes(r??``)?!1:!!(n.name&&t.test(n.name))});if(n.length>0){let e=n[0][0],t=ba(e,s);yield h({type:dt,matches:n,blocksForMatch:t})}else yield h({type:dt,matches:n,blocksForMatch:[]})}catch(e){if(e instanceof zm){yield h({type:dt,matches:[],blocksForMatch:[],searchError:e.message});return}throw e}}function*Um({direction:e}){let t=yield E(e=>e.search),{blocks:n}=yield E(V),r=t.matches.length,i=Rm(e,t.matchIndex,r),a=t.matches[i];if(!a)return;let o=ba(Number(a[0]),n);yield h({type:mt,matchIndex:i,blocksForMatch:o})}function*Wm({direction:e}){let t=yield E(e=>e.search),n=t.blocksForMatch.length,r=Rm(e,t.blockIndex,n);yield h({type:ht,blockIndex:r})}function*Gm(){let{matches:e,matchIndex:t,blockIndex:n,blocksForMatch:r}=yield E(e=>e.search);if(e.length>0){let i=e[t],a=i&&Number(i[0]);if(a===void 0||Number.isNaN(a)||!r[n])return;let o=Number(r[n][0]),s=i[1];yield h(Un({index:o,activity_id:a,activityStatus:s.status,thread_id:s.thread_id}));let{startTime:c,endTime:l}=r[n][1],u=Number.parseFloat(localStorage.getItem(`lbt`)??``),d=Number.parseFloat(localStorage.getItem(`rbt`)??``),f=l??c;(c>d||f<u)&&(yield h(rr(c,f)))}}function*Km(){let{searchStack:e,options:t}=yield E(e=>e.search);yield h(tr(e[0]??``,t))}function*qm(){yield w(ut,Hm),yield w(ft,Um),yield w(pt,Wm),yield w(Xt,Km),yield w(Zt,Km),yield w(gt,Km),yield w(({type:e})=>/SEARCH.*RESULT/.test(e),Gm)}var Jm=2e3;function Ym(e,t){return y(n=>{e.onOpen(()=>{n({type:`SOCKET_OPEN`})}),e.onError(()=>{n({type:`SOCKET_ERROR`})}),e.onClose(()=>{n({type:`SOCKET_CLOSE`})});let r=e.channel(`events:${t}`,{});return r.join().receive(`ok`,()=>{n({type:`EVENTS_CHANNEL_JOINED`})}).receive(`error`,()=>{}).receive(`timeout`,()=>{}),r.onError(()=>{}),r.onClose(()=>{}),r.on(`tabs`,e=>{n({type:`TABS_EVENT`,...e})}),r.on(`search_terms`,e=>{n({type:`SEARCH_TERMS_EVENT`,...e})}),r.on(`categories`,e=>{n({type:`CATEGORIES_EVENT`,data:e.data})}),r.on(`timeline_event`,e=>{let{event:t,trace_id:r}=e;if(!t||r===void 0)return;let i=typeof t.timestamp==`number`?t.timestamp:new Date(t.timestamp).getTime();if(!Number.isFinite(i)){console.error(`received timeline event with invalid timestamp`,e);return}n({type:bp,trace_id:r,event:{...t,timestamp:i}})}),r.on(`timeline_event_deleted`,e=>{e.event_id!==void 0&&e.trace_id!==void 0&&n({type:xp,trace_id:e.trace_id,event_id:e.event_id})}),()=>{r.leave(),e.disconnect()}})}function*Xm(){let e=(yield E(V)).trace?.id;e!=null&&(yield h({type:Ht,trace:e}))}function*Zm(){let e=(yield E(P)).id,t=new fe(`/socket`,{params:{user_id:e},logger:(e,t,n)=>{}}),n=Ym(t,e);t.connect();try{for(;;){let{myAction:e,refresh:t}=yield g({myAction:C(n),refresh:S(Jm)});if(t){yield*Xm();continue}e&&(yield h(e),e.type===`EVENTS_CHANNEL_JOINED`&&(yield*Xm()))}}finally{(yield m())&&n.close()}}function*Qm(){yield w(`USER_FETCH_SUCCEEDED`,Zm)}function*$m(e={}){let t=yield E(),n=t.timeline.trace?.id;if(n==null||t.user.id==null)return;let r=Bp(t.user.id,n),i=e.type===ot,a=t.undo[r],o=(i?t.redo:t.undo)?.[r]?.at(-1);if(!o)return;if(o.kind===`unsupported`){yield h($n(`${o.label} cannot be ${i?`redone`:`undone`} yet. Earlier changes were left alone.`,`error`));return}let s=yield D(cm,o,n);if(s!==!1){let e=yield E(),t=i||e.undo[r]===a?s:void 0;yield h({type:i?zp:Rp,scope:r,target:o,inverse:t})}}function*eh(){yield ee([at,ot],$m)}async function th(e){let t=await fetch(`/api/agents`,{credentials:`include`,cache:`no-store`,signal:e});if(!t.ok)throw t;let{data:n}=await t.json();if(!Array.isArray(n))throw Error(`Invalid agent contact response`);return n}function*nh(){let e=y(e=>{let t=()=>e(document.visibilityState!==`hidden`);return document.addEventListener(`visibilitychange`,t),()=>document.removeEventListener(`visibilitychange`,t)}),t;try{for(;;){if(document.visibilityState!==`hidden`){t=new AbortController;try{let e=yield D(th,t.signal);yield h({type:xr,agents:e})}catch{}}yield g({elapsed:S(Cr),visibility:C(e)})}}finally{t?.abort(),e.close()}}function*rh(){yield w(`${Wt}_SUCCEEDED`,nh)}function*ih(){yield T([Lm,nm,Qm,qm,eh,rh].map(e=>te(e)))}var ah=`flambe.undo-history.v2`;function oh(e){return!e||typeof e!=`object`||Array.isArray(e)?{}:Object.fromEntries(Object.entries(e).filter(([e,t])=>/^\d+:\d+$/.test(e)&&Array.isArray(t)&&t.every(e=>e&&(e.kind===`unsupported`&&typeof e.label==`string`||(e.kind===`move`||e.kind===`creation`)&&typeof e.token==`string`&&e.trace_id!=null||e.kind===`event`&&e.id!=null||e.kind===`activity`&&e.id!=null&&e.thread_id!=null))).map(([e,t])=>[e,t.slice(-100)]))}function sh(){try{let e=localStorage.getItem(ah);if(!e)return{undo:oh(JSON.parse(localStorage.getItem(`flambe.undo-history.v1`)??`{}`)),redo:{}};let t=JSON.parse(e);return{undo:oh(t?.undo),redo:oh(t?.redo)}}catch{return{undo:{},redo:{}}}}var ch=()=>sh().undo,lh=()=>sh().redo;function uh(e,t={}){try{localStorage.setItem(ah,JSON.stringify({undo:e,redo:t}))}catch{}}var dh=window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__,fh=dh?dh({actionsBlacklist:[`BLOCK_HOVER`,`KEY_DOWN`,`KEY_UP`],stateSanitizer:e=>({...e,user:{...e.user,tabs:`<<LOTS OF TABS>>`,searchTerms:`<<LOTS OF SEARCH TERMS>>`,attentionShifts:`<<LOTS OF ATTENTION SHIFTS>>`},timeline:{...e.timeline,events:`<<LOTS OF EVENTS>>`,blocks:`<<LOTS OF BLOCKS>>`}})}):f,ph=p(),mh=bc(),hh=em(void 0,{type:`@@flambe/INIT`}),gh=mh?Object.fromEntries(Object.entries(hh).map(([e,t])=>{let n=mh[e];return n===void 0?[e,t]:t!==null&&n!==null&&typeof t==`object`&&typeof n==`object`&&!Array.isArray(t)&&!Array.isArray(n)?[e,{...t,...n}]:[e,n]})):void 0,_h=ne(em,{...gh??hh,undo:ch(),redo:lh()},fh(v(ph)));ph.run(ih);var vh=()=>{let e=_h.getState();xc({advancedSearchVisible:e.advancedSearchVisible,loggedIn:e.loggedIn,operand:e.operand,search:e.search,settings:e.settings,user:P(e),view:e.view,viewThread:e.viewThread})};_h.subscribe((0,yp.throttle)(1e3,()=>xa(vh)));var yh=_h.getState().undo,bh=_h.getState().redo;_h.subscribe(()=>{let e=_h.getState().undo,t=_h.getState().redo;(e!==yh||t!==bh)&&(yh=e,bh=t,uh(e,t))});function xh(e=typeof navigator<`u`&&navigator.serviceWorker?navigator.serviceWorker.register.bind(navigator.serviceWorker):void 0){typeof e==`function`&&e(`/sw.js`).catch(()=>{})}var Sh=document.getElementById(`app-root`);if(!Sh)throw Error(`Unable to find #app-root`);xf(),xh(),(0,Se.createRoot)(Sh).render((0,N.jsx)(n,{store:_h,children:(0,N.jsx)(u,{children:(0,N.jsx)(vp,{})})}));