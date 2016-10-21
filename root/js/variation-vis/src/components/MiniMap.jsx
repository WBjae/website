import React, { Component } from "react";
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

  _formatPercentage(x) {
    return `${x * 100}%`;
  }

  render() {
    const {xMin, xMax, width, height, fullWidth} = this.props;

    const minimapStyle = {
      position: 'relative',
      backgroundColor: '#eee',
      borderRadius: 5,
      overflow: 'hidden',  // if the visible extends beyond the sequence, ignore the extra region in minimap
      width: '100%',
      height: height,
    }

    const markerStyle = {
      position: 'absolute',
      backgroundColor: '#8ca8c3',
      borderRadius: 5,
      height: height,
      width: this._formatPercentage(Math.max(0.005, (xMax - xMin) / fullWidth)),
      left: this._formatPercentage(xMin / fullWidth),
    }

    return (
      <div style={minimapStyle}>
        <div style={markerStyle}>
        </div>
      </div>
    )
  }
}
