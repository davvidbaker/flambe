import{t as e}from"./react-C21x__mS.js";import{n as t}from"./iframe-emszFagi.js";import{n,t as r}from"./styled-components.browser.esm-BHt5eeED.js";import{n as i}from"./rolldown-runtime-C0FnF6B9.js";var a,o,s,c;function l(){return(l=i((()=>{e(),n(),a=t(),o=r.div`
  position: relative;
  width: max-content;
  z-index: 1;
`,s=r.h1`
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
`,c=({size:e,isAnimated:t})=>(0,a.jsx)(o,{children:(0,a.jsx)(s,{$isAnimated:t,$size:e||40,children:`flambé`})}),c.__docgenInfo={description:``,methods:[],displayName:`Logo`,props:{size:{required:!1,tsType:{name:`number`},description:``},isAnimated:{required:!1,tsType:{name:`boolean`},description:``}}}})))()}export{l as n,c as t};