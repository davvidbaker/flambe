import React, { Component } from 'react';
import { ChromePicker } from 'react-color';

// ⚠️ maybe one day let user choose which picker they use
const ColorPicker = props => (
    <ChromePicker {...props} />
);

export default ColorPicker;
