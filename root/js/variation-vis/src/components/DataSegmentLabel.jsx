import React, { Component } from "react";
import ReactDOM from "react-dom";

const CharApparentWidth = 8;

export default class Button extends React.Component {

  static propTypes = {
    tip: React.PropTypes.string,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number
  }

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     labelWidthInitial: null
  //   };
  // }

  static contextTypes = {
    toWidth: React.PropTypes.func,
  }

  _isLabelVisible(labelText) {
    return this._getLabelScaledWidth(labelText) < this.props.width * 0.8;
  }

  _getLabelScaledWidth(labelText) {
    const apparentLabelWidth = labelText.length * CharApparentWidth;
    const width = this.context.toWidth(apparentLabelWidth);
    return width;
  }

  _getLabelCoords(labelText) {
    const x = this.props.x + this.props.width / 2;
    const y = this.props.y + 40;

    return {
      x,
      y,
      textLength: this._getLabelScaledWidth(labelText)
    }
  }

  render() {
    const labelText =  this.props.tip;

    return (
      labelText && this._isLabelVisible(labelText) ?
        <text ref="label"
            is="svg-text"
            text-anchor='middle'
            font-size="12"
            lengthAdjust="spacingAndGlyphs"
            {...this._getLabelCoords(labelText)}>
        {
          labelText
        }
        </text> : null);
  }
};
