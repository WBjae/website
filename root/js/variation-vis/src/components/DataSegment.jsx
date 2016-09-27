import React, { Component } from "react";
import ReactDOM from "react-dom";

const CharApparentWidth = 8;

export default class Button extends React.Component {

  static propTypes = {
    title: React.PropTypes.string,
    content: React.PropTypes.object,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    link: React.PropTypes.string,
    className: React.PropTypes.string,
    tooltipOn: React.PropTypes.bool,
    onTooltipShow: React.PropTypes.func,
    onTooltipHide: React.PropTypes.func,
  }

  _handleTooltipShow = (target) => {
    this.props.onTooltipShow ? this.props.onTooltipShow({
      title: this.props.title,
      content: this.props.content,
      target: target
    }) : null;
  }

  _handleTooltipHide = (target) => {
    this.props.onTooltipHide ? this.props.onTooltipHide({
      target: target,
      event: event
    }) : null;
  }

  // componentDidMount() {
  //   this._flushTooltip(false, this.props.tooltipOn);
  // }

  componentWillReceiveProps(nextProps) {
    this._flushTooltip(this.props.tooltipOn, nextProps.tooltipOn);
  }

  _flushTooltip(tooltipOnCurrent,tooltipOnNext) {
    if (tooltipOnNext !== tooltipOnCurrent) {
      const node = ReactDOM.findDOMNode(this);
      if (tooltipOnNext) {
        this._handleTooltipShow(node);
      } else {
        this._handleTooltipHide(node);
      }
    }

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

  _isTooltipChangeEvent(event) {
    return (event.relatedTarget.getAttribute('class') !== 'sequence-text'
      && event.relatedTarget.getAttribute('is') !== 'svg-text')
  }

  render() {

    return (
      <rect style={{...this._getCursorStyle()}}
        onClick={this.handleClick}
        onMouseEnter={(event) => this._isTooltipChangeEvent(event) && this._handleTooltipShow(event.target)}
        onMouseLeave={(event) => this._isTooltipChangeEvent(event) && this._handleTooltipHide(event.target)}
        className={this.props.className}
        {...this._getDimension()}/>
    );
  }
};
