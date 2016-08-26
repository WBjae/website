import React from 'react';
import BasicTrack from './BasicTrack';
import { getVariationColorScheme } from './VariationTrack';
import SequenceComponent from '../components/SequenceComponent';
import { DataLoader } from '../Utils';
import ColorScheme, { COLORS } from '../Utils/ColorHelper';

const DEFAULT_MAX_BIN_COUNT = 100;  // default maximum number of bins to show in the visible region
const SUBTRACK_HEIGHT = 30;

export default class VariationTrack extends React.Component {
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

  _renderTooltip(variationDat) {
  }

  _getColorScheme() {
    return getVariationColorScheme();
  }

  render() {
    const data = this._getDataWithIdentifier();
    const binnedData = this._bin(data);

    return <g>
      </g>;
  }
}
