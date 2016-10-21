import React, { Component } from "react";
import ReactDOM from 'react-dom';
import BasicTrack from '../Tracks';
import { CoordinateMappingHelper } from '../Utils'

export default class MiniMap extends React.Component {

  static contextTypes = {
//    toWidth: React.PropTypes.func,
    // getXMin: React.PropTypes.func,
    // getXMax: React.PropTypes.func,
    getEventSVGCoords: React.PropTypes.func,
  };

  static propTypes = {
    fullWidth: React.PropTypes.number,
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
  }

  _handleClick = (event) => {
    if (this.props.onUpdate) {
      const containerBox = ReactDOM.findDOMNode(this).getBoundingClientRect();
      const newCenter = (event.clientX - containerBox.left) / containerBox.width *
        this.props.fullWidth;
      this.props.onUpdate(newCenter);
    }
  }



  _formatPercentage(x) {
    return `${x * 100}%`;
  }

  render() {
    const {xMin, xMax, fullWidth} = this.props;

    const minimapStyle = {
      position: 'relative',
      cursor: 'pointer',
      backgroundColor: '#eee',
      borderRadius: 5,
      overflow: 'hidden',  // if the visible extends beyond the sequence, ignore the extra region in minimap
      width: '100%',
      height: 10,
    }

    const markerStyle = {
      position: 'absolute',
      backgroundColor: '#8ca8c3',
      borderRadius: 5,
      height: '100%',
      width: this._formatPercentage(Math.max(0.005, (xMax - xMin) / fullWidth)),
      left: this._formatPercentage(xMin / fullWidth),
    }

    return (
      <div style={minimapStyle}
        onClick={this._handleClick}>
        <div style={markerStyle}>
        </div>
      </div>
    )
  }
}
