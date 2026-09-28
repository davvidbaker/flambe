import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-emszFagi.js";import{n,t as r}from"./styled-components.browser.esm-BHt5eeED.js";import{n as i,t as a}from"./tinycolor-8-749W-X.js";import{n as o,t as s}from"./styles-D6Mg8Yoa.js";import{n as c,o as l}from"./rolldown-runtime-C0FnF6B9.js";function u(e){return e===`error`?s.red:`green`}var d,f,p,m,h;function g(){return(g=c((()=>{d=l(e()),n(),a(),o(),f=t(),p=r.div`
  background: ${e=>u(e.$type)};
  font-size: 0.8em;
  border: 1px solid
    ${e=>i(u(e.$type)).darken(25).toString()};
  border-radius: 2px;
  color: white;
  opacity: 0.9;
  margin: 0.5em;

  div:first-child {
    padding: 0.5em;
  }
`,m=r.div`
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
`,h=class extends d.Component{state={playing:!0};componentDidMount(){}onMouseEnter=()=>{this.setState({playing:!1})};onMouseLeave=()=>{this.setState({playing:!0})};pop=()=>{this.props.popToast(this.props.ind)};render(){return(0,f.jsxs)(p,{$type:this.props.type,onMouseEnter:this.onMouseEnter,onMouseLeave:this.onMouseLeave,onClick:this.pop,children:[(0,f.jsx)(`div`,{children:this.props.message}),(0,f.jsx)(m,{$playing:this.state.playing,onAnimationEnd:this.pop})]})}},h.__docgenInfo={description:``,methods:[{name:`onMouseEnter`,docblock:null,modifiers:[],params:[],returns:null},{name:`onMouseLeave`,docblock:null,modifiers:[],params:[],returns:null},{name:`pop`,docblock:null,modifiers:[],params:[],returns:null}],displayName:`Toast`,props:{ind:{required:!0,tsType:{name:`number`},description:``},message:{required:!0,tsType:{name:`string`},description:``},popToast:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(index: number) => unknown`,signature:{arguments:[{type:{name:`number`},name:`index`}],return:{name:`unknown`}}},description:``},type:{required:!0,tsType:{name:`string`},description:``}}}})))()}var _,v,y,b;function x(){return(x=c((()=>{g(),_={title:`App/Toast`,component:h,parameters:{layout:`padded`,controls:{disable:!0}},args:{ind:0,popToast:()=>void 0}},v={args:{message:`Activity started`,type:`success`}},y={args:{message:`Could not delete that trace`,type:`error`}},b=[`Success`,`Error`]})))()}x();export{y as Error,v as Success,b as __namedExportsOrder,_ as default};