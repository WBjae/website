import React, { Component } from "react";
import ReactDOM from "react-dom";

const CharApparentWidth = 8;

export default class Button extends React.Component {

  static propTypes = {
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    link: React.PropTypes.string,
    className: React.PropTypes.string,    
  }

  _getDimension() {
    let {width} = this.props;
    width = width < 1 ? 1 : width;

    return {
      ...this.props,
      width
    }
  }

  handleClick = () => {
    if (this.props.link) {
      window.open(this.props.link, '_blank');
    }
  }

  _getCursorStyle = () => {
    return this.props.link ? {
      cursor: 'pointer'
    } : {
      cursor: 'default'
    }
  }

  render() {

    return (
      <rect style={{...this._getCursorStyle()}}
        onClick={this.handleClick}
        className={this.props.className}
        {...this._getDimension()}/>
    );
  }
};
