import { Provider } from 'react-redux';
import React from 'react';

import store from '../src/store';
import '../src/styles/reach-overrides.css';

const Wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;

export default Wrapper;
