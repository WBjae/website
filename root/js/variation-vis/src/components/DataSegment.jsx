import React, { Component } from "react";
import ReactDOM from "react-dom";

const CharApparentWidth = 8;

export default class DataSegment extends React.Component {

  static propTypes = {
    title: React.PropTypes.string,
    content: React.PropTypes.object,
    trackId: React.PropTypes.number,
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

  constructor(props) {
    super(props);
    this.state = {
      isHighlighted: false
    }
  }

  _handleTooltipShow = (settings={}) => {
    const {clientX} = settings;
    this.props.onTooltipShow ? this.props.onTooltipShow({
      trackId: this.props.trackId,
      title: this.props.title,
      content: this.props.content,
      clientX: clientX,
    }) : null;
    this.setState({
      isHighlighted: true
    })
  }

  _handleTooltipHide = () => {
    this.props.onTooltipHide ? this.props.onTooltipHide({
      trackId: this.props.trackId,
    }) : null;
    this.setState({
      isHighlighted: false
    })
  }

  // componentDidMount() {
  //   this._flushTooltip(false, this.props.tooltipOn);
  // }

  componentWillReceiveProps(nextProps) {
    this._flushTooltip(this.props.tooltipOn, nextProps.tooltipOn);
  }

  _flushTooltip(tooltipOnCurrent,tooltipOnNext) {
    if (tooltipOnNext !== tooltipOnCurrent) {
      if (tooltipOnNext) {
        this._handleTooltipShow();
      } else {
        this._handleTooltipHide();
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
    return !event.relatedTarget.getAttribute ||
      (event.relatedTarget.getAttribute('class') !== 'sequence-text' &&
        event.relatedTarget.getAttribute('is') !== 'svg-text')
  }

  render() {

    return (
      <rect style={{...this._getCursorStyle()}}
        {...this._getDimension()}
        onClick={this.handleClick}
        onMouseEnter={(event) => this._isTooltipChangeEvent(event) && this._handleTooltipShow(event)}
        onMouseLeave={(event) => this._isTooltipChangeEvent(event) && this._handleTooltipHide(event)}
        className={this.props.className}
        stroke="#aaa"
        strokeWidth={this.state.isHighlighted && this.props.content ? 4 : 0}/>
    );
  }
};
