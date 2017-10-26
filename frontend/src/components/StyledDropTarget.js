/**
 * This acts as an overlay on its parent, which must have relative positioning.
 */

import React from 'react';
import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import { colors } from 'styles';

const StyledDropTarget = styled.div`
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: ${colors.dropTarget};
border: 10px dashed ${tinycolor(colors.dropTarget).darken(50).toString()};
display: flex;
align-items: center;
justify-content: center;

opacity: ${props => (props.isOver ? 0.8 : 0.5)}
`;

export default StyledDropTarget;
