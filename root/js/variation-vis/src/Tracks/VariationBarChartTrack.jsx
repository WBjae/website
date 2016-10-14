import React from 'react';
import BasicTrack from './BasicTrack';
import { getVariationColorScheme } from './VariationTrack';
import SequenceComponent from '../components/SequenceComponent';
import DataSegment from '../components/DataSegment';
import { DataLoader } from '../Utils';
import ColorScheme, { COLORS } from '../Utils/ColorHelper';

const DEFAULT_MAX_BIN_COUNT = 100;  // default maximum number of bins to show in the visible region
const SUBTRACK_HEIGHT = 30;
const MAX_BIN_SIZE = 5;  // if more than 10 items are assigned to bin, treat as 10
const UNIT_HEIGHT = 4;

export default class VariationBarChartTrack extends React.Component {
  static propTypes = {
    ...BasicTrack.propTypes,
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
  };

  static contextTypes = {
//    isZoomPanOccuring: React.PropTypes.bool,
    viewWidth: React.PropTypes.number,
  }

  static getDefaultColorScheme() {
    return getVariationColorScheme();
  }

  _bin(variations) {
    const binnedVariations = new DataLoader.BinnedLoader(variations,
      this.props.xMin, this.props.xMax, DEFAULT_MAX_BIN_COUNT);
    // const binnedData = binnedVariations.map((bin) => {
    //   return {
    //     ...bin,
    //     tip: bin.data.map((v) => v.composite_change || '').join('<br/>')
    //   };
    // });
    return binnedVariations;
  }

  _renderTooltip(binDat) {
    const {start, end, data} = binDat;
    return (
      <div>
        <h6>
        {
          `${data.length} variation(s) found in ${start}-${end}`
        }
        </h6>
        <ul>
        {
          data.map((variationDat) => {
            const {substitution, phenotypes} = variationDat;
            const changeDetail = substitution.before + substitution.aa_position + substitution.after;
            const phenotypeCountText = variationDat.phen_count ? `(${variationDat.phen_count} phenotypes)` : '';
            return (
              <li>
                {
                  (variationDat.molecular_change || '') + ' ' + changeDetail
                }
                <br/>
                <strong>
                {
                  phenotypeCountText
                }
                </strong>
              </li>)
          })
        }
        </ul>
      </div>);
  }

  _getColorScheme() {
    return getVariationColorScheme();
  }

  render() {
    const binnedData = this._bin(this.props.data).map((binDat) => {
      return {
        ...binDat,
        tip: this._renderTooltip(binDat)
      }
    });

    return (<g>
      {
        binnedData.map((bin) => {
          const start = this.props.coordinateMapping.toSVGCoordinate(bin.start);
          const end = this.props.coordinateMapping.toSVGCoordinate(bin.end);
          const count = Math.min(bin.data.length, MAX_BIN_SIZE);
          const isMarkerHover = this.props.activeMarker !== null &&
            bin.start <= this.props.activeMarker &&
            bin.end > this.props.activeMarker;
          return (<Bar
            start={start}
            end={end}
            key={`bar-${start}-${end}`}
            height={count * UNIT_HEIGHT}
            baseline={this.props.y + MAX_BIN_SIZE * UNIT_HEIGHT}
            onTooltipShow={this.props.onTooltipShow}
            onTooltipHide={this.props.onTooltipHide}
            tooltipOn={isMarkerHover}
            content={bin.tip}/>)
        })
      }
      </g>)
      ;
  }
}

const Bar = (props) => {
  const {baseline, start, end, height} = props;

  return (<DataSegment
    {...props}
    x={start}
    y={baseline - height}
    width={end - start}
    height={height}
    fill="#dd1c77"
    />);
}
