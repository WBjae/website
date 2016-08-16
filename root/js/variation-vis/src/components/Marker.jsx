import React, { Component } from "react";
import BasicTrack from '../Tracks';

export default class Marker extends React.Component {

  static contextTypes = {
    toWidth: React.PropTypes.func,
    getXMin: React.PropTypes.func,
    getXMax: React.PropTypes.func,
    getEventSVGCoords: React.PropTypes.func,
  };

  static propTypes = {
    cursorSVGCoordinate: React.PropTypes.number.isRequired,
    onMarkerChange: React.PropTypes.func,
    // sequenceLength: React.PropTypes.number,
    coordinateMapping: React.PropTypes.shape({
      toSVGCoordinate: React.PropTypes.func,
      toSequenceCoordinate: React.PropTypes.func
    }).isRequired,
    height: React.PropTypes.number
  }

  _cursorSequenceCoordinate() {
    const {cursorSVGCoordinate, coordinateMapping} = this.props;
    return Math.floor(coordinateMapping.toSequenceCoordinate(cursorSVGCoordinate));
  }

  _padSequneceCoordinates = (startSequenceCoord, endSequenceCoord) => {
    if (typeof endSequenceCoord === 'undefined') {
      endSequenceCoord = startSequenceCoord + 1;
    }

    const coordinateMapping = this.props.coordinateMapping;

    const svgWidth = coordinateMapping.toSVGCoordinate(endSequenceCoord - startSequenceCoord);

    // make the bar at least 1px width
    const minApparentWidth = 1;
    const minSvgWidth = this.context.toWidth(minApparentWidth);
    if (svgWidth < minSvgWidth) {
      const paddedSequenceLength = coordinateMapping.toSequenceCoordinate(minSvgWidth);
      return {
        start: startSequenceCoord,
        end: startSequenceCoord + Math.ceil(paddedSequenceLength)
      }
    } else {
      return {
        start: startSequenceCoord,
        end: endSequenceCoord
      }
    }
  }

  _renderBar = (props) => {
    return (
      <rect
        {...props}
        x={this.context.getXMin()}
        y={0}
        width={this.context.getXMax() - this.context.getXMin()}
        height={12}/>
    )
  }

  _handleMarkerBarMouseMove = (event) => {
    this.props.onMarkerChange({
      type: 'MARKER_UPDATE',
      cursorSVGCoordinate: this.context.getEventSVGCoords(event).x
    })
  }

  _handleMarkerBarMouseOut = (event) => {
    this.props.onMarkerChange({
      type: 'MARKER_DELETE'
    });
  }

  render() {
    const barCoordinates = this._padSequneceCoordinates(this._cursorSequenceCoordinate())
    return (<g>
      {
        this.props.cursorSVGCoordinate === null ? null : <BasicTrack
          opacity={0.8}
          data={[{
            ...barCoordinates,
            color: '#fd0'
          }]}
          coordinateMapping={this.props.coordinateMapping}
          y={0}
          height={this.props.height || 600}/>
      }
      {
        // marker bar background
        this._renderBar({
          opacity: 0.1,
          fill: '#000'
        })
      }
      {
        this.props.children
      }
      {
        // marker bar overlay
        this._renderBar({
          fill: 'transparent',
          onMouseMove: this._handleMarkerBarMouseMove,
          onMouseOut: this._handleMarkerBarMouseOut
        })
      }
      </g>)
  }
}
