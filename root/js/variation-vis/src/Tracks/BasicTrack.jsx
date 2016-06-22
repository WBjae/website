import React from 'react';
import { findDOMNode } from 'react-dom';
import SequenceComponent from '../components/SequenceComponent';
import DataSegment from '../components/DataSegment';
import DataSegmentLabel from '../components/DataSegmentLabel';
import $ from 'jquery';
import { TRACK_HEIGHT, DataLoader } from '../Utils'
const DEFAULT_MAX_BIN_COUNT = 100;  // default maximum number of bins to show in the visible region

export default class BasicTrack extends React.Component {

  static propTypes = {
    index: React.PropTypes.number, //.isRequired,
    data: React.PropTypes.arrayOf(React.PropTypes.shape({
      start: React.PropTypes.number,
      end: React.PropTypes.number,
      tip: React.PropTypes.string,
      label: React.PropTypes.string
    })),
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
    opacity: React.PropTypes.number,
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
    data: []
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
    let data = this.props.data;
    data = this.props.colorScheme ? this.props.colorScheme.decorate(data) : data;
    data = this._selectVisibleSegments(data);
    data = this._keepLongSegments(data);

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
        <g filter="url(#demo2)"
          style={{
            opacity: typeof this.props.opacity === 'undefined' ? 0.7 : this.props.opacity
          }}>
        {
          data.map((dat, index) => {
            return (
              <DataSegment
                {...getSegmentCoords(dat)}
                key={`data-rect-${index}`}
                onMouseEnter={(event) => this.props.onTooltipShow ? this.props.onTooltipShow({content: dat.tip, event: event}) : null}
                onMouseLeave={this.props.onTooltipHide}
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
      return dat.start < xMax && dat.end > xMin;
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

  /* render sequence or label depending how zoomed in */
  renderSequence = () => {
    let {xMin, xMax, sequence} = this.props;
    const rawSegmentLength = xMax - xMin;
    xMin = Math.max(0, xMin);
    xMax = Math.min(xMax, sequence.length);
    const sequenceSegment = sequence.slice(xMin, xMax);

    const {start, end} = this.getHorizontalPosition({
      start: xMin,
      end: xMax
    });

    return this.context.isZoomPanOccuring ? null :
      <SequenceComponent {...this.props}
        width={end - start}
        sequence={sequenceSegment}
        apparentWidth={this.context.viewWidth / rawSegmentLength * sequenceSegment.length}
        x={start}
        y={this.getVerticalPosition()}/>
  }


  render() {
    return (
      <g className="track">
        {
          this.renderSegments()
        }
        <g>
        {
          this.props.sequence ? this.renderSequence() : null
        }
        </g>
      </g>
    );
  }

}