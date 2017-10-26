import styled from 'styled-components';

const gridColumns = columns => {
  switch (typeof columns) {
    case 'number':
      let str = '';
      for (let i = 0; i < columns; i++) {
        str += '1fr ';
      }
      return str;

    case 'string':
      return columns;

    default:
      return '1fr';
  }
};

const Grid = styled.div`
  display: grid;

  grid-template-columns: ${props => gridColumns(props.columns)};
`;

export default Grid;
