import styled from 'styled-components';
import tinycolor from 'tinycolor2';

import { colors } from '../styles';

const Dropdown = styled.ul`
  position: absolute;
  z-index: 2;
  list-style: none;
  padding: 5px 10px;
  background: ${colors.background};
  border: 1px solid ${tinycolor(colors.background).darken(15).toString()};
  width: 17rem;
  margin: 0;

  li {
    margin-bottom: 5px;
  }
`;

export default Dropdown;
