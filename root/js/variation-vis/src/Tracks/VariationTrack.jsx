import React from 'react';
import BasicTrack from './BasicTrack';
import VariationDetailTrack from './VariationDetailTrack';
import variationBarChartTrack from './variationBarChartTrack';
import SequenceComponent from '../components/SequenceComponent';
import { DataLoader } from '../Utils';
import ColorScheme, { COLORS } from '../Utils/ColorHelper';

const DEFAULT_MAX_BIN_COUNT = 100;  // default maximum number of bins to show in the visible region
const SUBTRACK_HEIGHT = 30;

export function getVariationColorScheme() {
  const knownChangeType = new Set(['Nonsense', 'Missense', 'Insertion', 'Deletion'])
  return new ColorScheme((dat, index) => {
    const types = dat.types.filter((value) => knownChangeType.has(value));
    return types.length > 0 ? types[0] : 'Other';
  }, {
    Nonsense: {
      colorId: COLORS.RED,
    },
    Missense: {
      colorId: COLORS.BLUE,
    },
    Insertion: {
      colorId: COLORS.GREEN,
    },
    Deletion: {
      colorId: COLORS.MAGENTA,
    },
    Other: {
      colorId: COLORS.YELLOW,
    }
  });
}


export default class VariationTrack extends React.Component {
  static propTypes = {
    ...BasicTrack.propTypes,
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
    onHeightChange: React.PropTypes.func,
    outerHeight: React.PropTypes.number,
  };

  static contextTypes = {
//    isZoomPanOccuring: React.PropTypes.bool,
    viewWidth: React.PropTypes.number,
  }

  static getDefaultColorScheme() {
    return getVariationColorScheme();
  }

  _getColorScheme() {
    return VariationTrack.getDefaultColorScheme();
  }

  _getUnitWidth() {
    return this.context.viewWidth / (this.props.xMax - this.props.xMin);
  }

  render() {
    return this._getUnitWidth() < 10 ?
      <variationBarChartTrack {...this.props}/>
      : <VariationDetailTrack {...this.props}/>;
  }
}
