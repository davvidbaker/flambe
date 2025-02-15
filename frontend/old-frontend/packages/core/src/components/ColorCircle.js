import styled from 'styled-components';

import { colors } from '../styles';

const ColorCircle = styled.div`
  border-radius: 50%;
  width: 15px;
  height: 15px;
  background: ${props => props.background || colors.flames.main}
`;

export default ColorCircle;
