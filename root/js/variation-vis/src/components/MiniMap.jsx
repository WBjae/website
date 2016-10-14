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
    sequenceLength: React.PropTypes.number,
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
  }

  _getViewBox = () => {
    const {sequenceLength, height, xMin, xMax} = this.props;
    return [0, 0, sequenceLength, height].join(' ');
  }

  render() {
    const {xMin, xMax, width, height, sequenceLength} = this.props;

    // if the visible extends beyond the sequence, ignore the extra region in minimap
    const correctedXMin = Math.max(xMin, 0);
    const correctedXMax = Math.min(xMax, sequenceLength);

    return (
      <svg
        width={width}
        height={height}
          preserveAspectRatio="none"
        viewBox={this._getViewBox()}>
        <rect
          x={0}
          y={0}
          width={sequenceLength}
          height={height}
          rx={5}
          ry={3}
          fill={"#eee"}/>
        <rect
          x={correctedXMin}
          y={0}
          width={Math.max(5, correctedXMax - correctedXMin)}
          height={height}
          rx={5}
          ry={3}
          fill="#8ca8c3"/>
      </svg>
    )
  }
}
