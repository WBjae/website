import React, { Component } from "react";
import ReactDOM from 'react-dom';
import BasicTrack from '../Tracks';
import { CoordinateMappingHelper } from '../Utils'

export default class MiniMap extends React.Component {

  static contextTypes = {
//    toWidth: React.PropTypes.func,
    // getXMin: React.PropTypes.func,
    // getXMax: React.PropTypes.func,
    // getEventSVGCoords: React.PropTypes.func,
  };

  static propTypes = {
    onUpdate: React.PropTypes.func,
    fullWidth: React.PropTypes.number,
    coordinateMapping: React.PropTypes.shape({
      toSVGCoordinate: React.PropTypes.func,
      toSequenceCoordinate: React.PropTypes.func
    }).isRequired,
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
  }

  constructor(props) {
    super(props);
    this.state = {
      mouseOffsetPercent: null
    }
  }

  _handleMouseDown = (event) => {
    event.preventDefault();
    const markerBox = ReactDOM.findDOMNode(this._markerComponent).getBoundingClientRect();
    const isMouseOnMarker = markerBox.left <= event.clientX &&
      markerBox.left + markerBox.width > event.clientX;
    if (isMouseOnMarker) {
      this.offsetX = event.clientX - (markerBox.left + (markerBox.width / 2));
    } else {
      this.offsetX = 0;
    }

    document.addEventListener('mousemove', this._handleDragMouseMove);
    document.addEventListener('mouseup', this._handleMouseEnd);
    this._onDragUpdate(event);
  }

  _handleDragMouseMove = (event) => {
    this._onDragUpdate(event);
  }

  _handleMouseEnd = (event) => {
    this.offsetX = 0;
    document.removeEventListener('mousemove', this._handleDragMouseMove);
    document.removeEventListener('mouseup', this._handleMouseEnd);
  }

  _onDragUpdate = (event) => {
    if (this.props.onUpdate) {
      const containerBox = ReactDOM.findDOMNode(this).getBoundingClientRect();
      const newCenter = (event.clientX - this.offsetX - containerBox.left) / containerBox.width *
        this.props.fullWidth;
      this.props.onUpdate(newCenter);
    }
  }

  _handleTooltipUpdate = (event) => {
    const containerBox = ReactDOM.findDOMNode(this).getBoundingClientRect();
    const mouseOffsetPercent = (event.clientX - containerBox.left) / containerBox.width;
    this.setState({
      mouseOffsetPercent: mouseOffsetPercent
    });
  }

  _handleTooltipRemove = (event) => {
    setTimeout(() => {
      this.setState({
        mouseOffsetPercent: null
      });
    }, 300);
  }

  _formatPercentage(x) {
    return `${x * 100}%`;
  }

  _formatTooltip(x) {
    return Math.round(this.props.coordinateMapping.toSequenceCoordinate(x));
  }

  render() {
    const {xMin, xMax, fullWidth} = this.props;

    const minimapStyle = {
      position: 'relative',
      cursor: 'pointer',
      backgroundColor: '#eee',
      borderRadius: 5,
      overflowX: 'hidden',  // if the visible extends beyond the sequence, ignore the extra region in minimap
      width: '100%',
      height: 10,
    }

    return (
      <div style={{position: 'relative'}}>
        <div style={minimapStyle}
          onMouseDown={this._handleMouseDown}
          onMouseEnter={this._handleTooltipUpdate}
          onMouseMove={this._handleTooltipUpdate}
          onMouseLeave={this._handleTooltipRemove}>
          <MiniMapMarker
            ref={(c) => this._markerComponent = c}
            width={this._formatPercentage(Math.max(0.005, (xMax - xMin) / fullWidth))}
            left={this._formatPercentage(xMin / fullWidth)}/>
        </div>
        {
          this.state.mouseOffsetPercent !== null || false ? <div style={{
            position: 'absolute',
            backgroundColor: 'rgba(100,100,100, 0.5)',
            padding: "2px 5px",
            top: -20,
            fontSize: '0.8em',
            zIndex: 100,
            left: this._formatPercentage(this.state.mouseOffsetPercent)
          }}>{this._formatTooltip(this.state.mouseOffsetPercent * this.props.fullWidth)}</div> : null
        }
      </div>
    )
  }
}

class MiniMapMarker extends React.Component {

  static propTypes = {
    left: React.PropTypes.string,
    width: React.PropTypes.number,
  }

  render() {
    const {width, left} = this.props;
    const markerStyle = {
      position: 'absolute',
      backgroundColor: '#8ca8c3',
      borderRadius: 5,
      height: '100%',
      width,
      left,
    };
    return (
      <div style={markerStyle}></div>)
  }
}
