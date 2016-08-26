import React from 'react';
import { findDOMNode } from 'react-dom';
import SequenceComponent from '../components/SequenceComponent';
import SequenceTrack from './SequenceTrack';
import DataSegment from '../components/DataSegment';
import DataSegmentLabel from '../components/DataSegmentLabel';
import PrettyTrackSVGFilter from '../components/PrettyTrackSVGFilter';
import $ from 'jquery';
import { TRACK_HEIGHT, DataLoader, CoordinateMappingHelper } from '../Utils'
const DEFAULT_MAX_BIN_COUNT = 100;  // default maximum number of bins to show in the visible region

export default class BasicTrack extends React.Component {

  static propTypes = {
//    index: React.PropTypes.number, //.isRequired,
    id: React.PropTypes.string.isRequired,    // stable identifier of track
    data: React.PropTypes.arrayOf(React.PropTypes.shape({
      start: React.PropTypes.number,
      end: React.PropTypes.number,
      tip: React.PropTypes.string,
      label: React.PropTypes.string
    })),
    ignoreShortSegments: React.PropTypes.bool,
    sequenceLength: React.PropTypes.number,   // used when sequence isn't provided to map sequence coordinates to track graphic coordinates
    sequence: React.PropTypes.string,
    coordinateMapping: React.PropTypes.shape({
      toSVGCoordinate: React.PropTypes.func,
      toSequenceCoordinate: React.PropTypes.func
    }),
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
//    viewWidth: React.PropTypes.number,
    onTooltipShow: React.PropTypes.func,
    onTooltipHide: React.PropTypes.func,
    colorScheme: React.PropTypes.object,
    showDefaultBackground: React.PropTypes.bool,
    pretty: React.PropTypes.bool,
    y: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number
  }

  static contextTypes = {
    isZoomPanOccuring: React.PropTypes.bool,
    viewWidth: React.PropTypes.number,
  }

  static defaultProps = {
    height: 25,
    data: [],
    pretty: true,
  }

  getVerticalPosition = () => {
    return this.props.y;
  }

  getHorizontalPosition = (dat) => {
    return {
      start: this.props.coordinateMapping.toSVGCoordinate(dat.start),
      end: this.props.coordinateMapping.toSVGCoordinate(dat.end)
    }
  }

  /* data series within a track */
  renderSegments(){
    let data = this.props.data || [];
    data = this.props.colorScheme ? this.props.colorScheme.decorate(data) : data;
    if (this.props.showDefaultBackground) {
       data = [this._getBackGroundSegment()].concat(data);
    }
    data = this._selectVisibleSegments(data);
    data = this.props.ignoreShortSegments ? this._keepLongSegments(data) : data;

    const getSegmentCoords = (segment) => {
      const graphicPosition = this.getHorizontalPosition(segment);
      return {
        x: graphicPosition.start,
        y: this.getVerticalPosition(),
        width: graphicPosition.end - graphicPosition.start,
        height: this.props.height
      };
    }

    return (
      <g>
        <g filter={this.props.pretty ? `url(#${PrettyTrackSVGFilter.ID})` : null}>
        {
          data.map((dat, index) => {
            return (
              <DataSegment
                {...getSegmentCoords(dat)}
                key={`data-rect-${index}`}
                onMouseEnter={(event) => this.props.onTooltipShow ? this.props.onTooltipShow({title: dat.name, content: dat.tip, event: event}) : null}
                onMouseLeave={this.props.onTooltipHide}
                link={dat.link}
                fill={dat.color || 'grey'}
                fillOpacity={(dat.fillOpacity || dat.fillOpacity === 0) ? dat.fillOpacity : 1}/>
            )
          })
        }
        </g>
      {
        data.map((dat, index) => {
          return (
            <DataSegmentLabel
              key={`segment-label-${index}`}
              {...getSegmentCoords(dat)}
              tip={dat.tip}/>
          )
        })
      }
      </g>
    )
  }

  _selectVisibleSegments(segments=[]) {
    const {xMin, xMax} = this.props;

    return segments.filter((dat) => {
      return (typeof xMax === 'undefined' || dat.start < xMax) &&
        (typeof xMin === 'undefined' || dat.end > xMin);
    });
  }

  _keepLongSegments(segments=[]) {
    const {xMin, xMax} = this.props;
    const lengthThreshold = DataLoader.BinHelper.getBinWidth(
      xMin, xMax, DEFAULT_MAX_BIN_COUNT);

    return segments.filter(({start, end}) =>{
      return end - start > lengthThreshold;
    });
  }

  _getBackGroundSegment() {
    const sequenceLength = this.props.sequenceLength || this.props.sequence.length;
    const backgroundSegment = {
      start: Math.max(0, this.props.xMin),
      end: Math.min(sequenceLength, this.props.xMax)
    };
    return this.props.colorScheme ?
      this.props.colorScheme.decorateWithGroup(backgroundSegment, 'ColorScheme.default.background') :
      backgroundSegment;
  }

  render() {
    return (
      <g className="track">
        {
          this.renderSegments()
        }
        <g>
        {
          this.props.sequence ? <SequenceTrack
            {...this.props}
            y={this.getVerticalPosition()}
            colorScheme={null}/> : null
        }
        </g>
      </g>
    );
  }

}
