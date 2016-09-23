import React, { Component } from "react";
import DataSegment from '../components/DataSegment';

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
    height: React.PropTypes.number,
    viewHeight: React.PropTypes.number,
  }

  getActiveMarkerClientRect() {
    if (this._activeMarkerComponent) {
      const node = ReactDOM.findDOMNode(this._activeMarkerComponent);
      return node.getBoundingClientRect();
    } else {
      return null;
    }
  }

  _getPaddedMarkerRegion = (position) => {
    const sequenceCood = this._cursorSequenceCoordinate(position);
    const paddedSequenceCoord = this._padSequneceCoordinates(sequenceCood);
    const {coordinateMapping} = this.props;

    const start = coordinateMapping.toSVGCoordinate(paddedSequenceCoord.start);
    const end = coordinateMapping.toSVGCoordinate(paddedSequenceCoord.end);

    return {
      x: start,
      y: 0,
      width: end - start,
      height: this.props.viewHeight || 600
    };
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
        height={this.props.height}/>
    )
  }

  _renderTick = (props) => {
    const {position} = props;
    const width = this.context.toWidth(16);
    const y = 0;
    const points = [
      {
        x: position - width / 2,
        y: 0
      },
      {
        x: position - width / 2,
        y: 10
      },
      {
        x: position,
        y: 15
      },
      {
        x: position + width / 2,
        y: 10
      },
      {
        x: position + width / 2,
        y: 0
      }
    ];
    const pointsString = points.map(({x, y}) => {
      return `${x},${y}`;
    }).join(' ');

    return (
      <g>
        <polygon
          {...props}
          points={pointsString}
          fill="#a64ca6"/>
      </g>
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
    const svgPosition =this.context.getEventSVGCoords(event).x;
    const hasMarker = this.props.markerPositions.find((dat) => {
      return this._cursorSequenceCoordinate(dat) ===
        this._cursorSequenceCoordinate(svgPosition);
    });
    if (!hasMarker) {
      this.props.onMarkerChange({
        type: 'MARKER_ADD',
        position: svgPosition
      })
    }
  }

  _handleMarkerClick = (event) => {
    this.props.onMarkerChange({
      type: 'MARKER_ACTIVATE'
    })
  }

  _handleMarkerDelete = (event, index) => {
    this.props.onMarkerChange({
      type: 'MARKER_DELETE',
      index: index
    })
  }

  render() {

    return (<g>
      {
        this.props.markerPositions.map((position) => {
          <DataSegment
            {...this._getPaddedMarkerRegion(position)}
            key={`marker-${position}`}
            fill={'#d8b2d8'}/>
        })
      }
      {
        <DataSegment
          {...this._getPaddedMarkerRegion(this.props.activeMarkerPosition)}
          ref={(c) => this._activeMarkerComponent = c}
          fill={'#fd0'}/>
      }
      {
        // marker bar background
        this._renderBar({
          fillOpacity: 0.5,
          fill: '#406f9c',
          filter: 'url(#pretty-track-svg-filter)'
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
          onClick: this._handleMarkerBarMouseClick
        })
      }
      {
        this.props.markerPositions.map((position, index) => {
          const {start, end} = this._padSequneceCoordinates(this._cursorSequenceCoordinate(position));
          // correct position to place on the center of a residue
          const correctedPosition = this.props.coordinateMapping.toSVGCoordinate((end + start) / 2);
          return this._renderTick({
            onClick: (event) => this._handleMarkerDelete(event, index),
            position: correctedPosition
          });
        })
      }
      </g>)
  }
}
