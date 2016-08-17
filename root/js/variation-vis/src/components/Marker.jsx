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
    markerPositions: React.PropTypes.arrayOf(React.PropTypes.number),
    activeMarkerPosition: React.PropTypes.number,
    onMarkerChange: React.PropTypes.func,
    // sequenceLength: React.PropTypes.number,
    coordinateMapping: React.PropTypes.shape({
      toSVGCoordinate: React.PropTypes.func,
      toSequenceCoordinate: React.PropTypes.func
    }).isRequired,
    height: React.PropTypes.number
  }

  _cursorSequenceCoordinate(position) {
    const {coordinateMapping} = this.props;
    return Math.floor(coordinateMapping.toSequenceCoordinate(position));
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
      type: 'ACTIVE_MARKER_UPDATE',
      position: this.context.getEventSVGCoords(event).x
    })
  }

  _handleMarkerBarMouseOut = (event) => {
    this.props.onMarkerChange({
      type: 'ACTIVE_MARKER_DELETE'
    });
  }

  _handleMarkerBarMouseClick = (event) => {
    this.props.onMarkerChange({
      type: 'MARKER_ADD',
      position: this.context.getEventSVGCoords(event).x
    })
  }

  _handleMarkerClick = (event) => {
    this.props.onMarkerChange({
      type: 'MARKER_ACTIVATE'
    })
  }

  _handleMarkerDelete = (event) => {}

  render() {
    const allMarkers = this.props.markerPositions.concat(this.props.activeMarkerPosition);
    const markerData = allMarkers.map((position) => {
      const coords = this._padSequneceCoordinates(this._cursorSequenceCoordinate(position));
      const color = '#fd0';
      return {
        ...coords,
        color,
      };
    });

    return (<g>
      {
        this.props.cursorSVGCoordinate === null ? null : <BasicTrack
          opacity={0.8}
          data={markerData}
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
          onMouseOut: this._handleMarkerBarMouseOut,
          onClick: this._handleMarkerBarMouseClick,
        })
      }
      </g>)
  }
}
