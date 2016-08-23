import React, { Component } from "react";
import BasicTrack from '../Tracks';

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

  getViewBox = () => {
    const {sequenceLength, height, xMin, xMax} = this.props;
    const viewBoxX = Math.min(xMin, 0);
    const viewBoxWidth = Math.max(xMax - xMin, sequenceLength);
    return [viewBoxX, 0, viewBoxWidth, height].join(' ');
  }

  render() {
    const {xMin, xMax, width, height} = this.props;
    return (
      <svg
        width={this.props.width}
        height={this.props.height}
        viewBox={this.getViewBox()}>
        <BasicTrack
          opacity={0.8}
          data={[{
            start: 0,
            end: this.props.sequenceLength
          }]}
          y={0}
          height={this.props.height || 600}/>
        <rect
          x={xMin}
          y={0}
          width={xMax - xMin}
          height={height}
          fill="transparent"
          strokeWidth={2}
          stroke="#406f9c"/>
      </svg>
    )
  }
}
