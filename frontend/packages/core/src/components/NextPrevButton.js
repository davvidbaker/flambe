import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import { colors } from '../styles';

const NextPrevButton = styled.button`
background: none;
outline: none;
border: 1px solid transparent;
border-radius: 4px;
text-align: center;
font-size: 1.5em;
padding: 0;

${props =>
  props.disabled
    ? `
    filter: grayscale(100%);
    `
    : `&:hover {
  background: ${tinycolor(colors.hover)
    .darken(0.1)
    .toString()};
}`} &:focus {
  border: 1px solid ${colors.flames.main};
}
`;

export default NextPrevButton;