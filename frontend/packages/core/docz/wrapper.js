import { Provider } from 'react-redux';
import React from 'react';

import store from '../src/store';

const Wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;

export default Wrapper;
