import React, { Component } from "react";
import ReactDOM from "react-dom";

const CharApparentWidth = 8;

export default class DataSegment extends React.Component {

  static propTypes = {
    title: React.PropTypes.string,
    content: React.PropTypes.object,
    trackId: React.PropTypes.number.isRequired,
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

  _handleTooltipShow = (event) => {
    this.props.onTooltipShow && this.props.content ? this.props.onTooltipShow({
      trackId: this.props.trackId,
      segmentId: this._getSegmentId(),
      title: this.props.title,
      content: this.props.content,
      event: event,
    }) : null;
    this.setState({
      isHighlighted: true
    })
  }

  _handleTooltipHide = () => {
    this.props.onTooltipHide ? this.props.onTooltipHide({
      trackId: this.props.trackId,
      segmentId: this._getSegmentId(),
    }) : null;
    this.setState({
      isHighlighted: false
    })
  }

  _getSegmentId = () => {
    const {trackId, x, width} = this.props;
    return `${trackId}--${x}-${x + width}`;
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

  _isMouseLeave(event) {
    return !event.relatedTarget.getAttribute ||
      (event.relatedTarget.getAttribute('class') !== 'sequence-text' &&
        event.relatedTarget.getAttribute('is') !== 'svg-text' &&
        event.relatedTarget.getAttribute('class') !== 'popover-wrapper' &&
        event.relatedTarget.getAttribute('class') !== 'arrow' &&
        event.relatedTarget.getAttribute('class') !== 'popover-content')
  }

  render() {

    return (
      <rect style={{...this._getCursorStyle()}}
        {...this._getDimension()}
        onClick={this.handleClick}
        onMouseMove={(event) => this._handleTooltipShow(event)}
        onMouseLeave={(event) => this._isMouseLeave(event) && this._handleTooltipHide(event)}
        className={this.props.className}
        stroke="#aaa"
        strokeWidth={this.state.isHighlighted && this.props.content ? 4 : 0}/>
    );
  }
};
