import React from 'react';
import BasicTrack from './BasicTrack';
import { getVariationColorScheme } from './VariationTrack';
import SequenceComponent from '../components/SequenceComponent';
import VariationSummary from '../components/VariationSummary';
import FlexHeightTrackWrapper from '../components/FlexHeightTrackWrapper';
import { DataLoader } from '../Utils';
import ColorScheme, { COLORS } from '../Utils/ColorHelper';

const DEFAULT_MAX_BIN_COUNT = 100;  // default maximum number of bins to show in the visible region
const SUBTRACK_HEIGHT = 30;

export default class VariationDetailTrack extends React.Component {
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

  _getDerivedHeight = () => {
    const {data} = this.props;
    if (data){
      const binLengths = this._bin(data).map((bin) => bin.data.length);
      const numOfSubtracks = Math.max(...binLengths, 1);
      return 20 + numOfSubtracks * SUBTRACK_HEIGHT;
    }
  }

  _bin(variations) {
    // make bin width 1
    const binCount = this.props.xMax - this.props.xMin;
    const binnedVariations = new DataLoader.BinnedLoader(variations,
      this.props.xMin, this.props.xMax, Math.max(binCount, 1));
    // const binnedData = binnedVariations.map((bin) => {
    //   return {
    //     ...bin,
    //     tip: bin.data.map((v) => v.composite_change || '').join('<br/>')
    //   };
    // });
    return binnedVariations;
  }

  _getDataWithIdentifier(){
    // attach identifier to data to be able to identify corresponding entries across bins,
    // because a single entry could end up in multiple bins.
    return this.props.data.map((dat, index) => {
      return {
        ...dat,
        _id: index,
      }
    })
  }

  // split a track into subtracks such that no overlapping features occur in the same track.
  // use as few subtracks as possible
  _decompose(binnedData) {
    const binLengths = binnedData.map((bin) => bin.data.length);
    const numOfSubtracks = Math.max(...binLengths);
    const subtrackData = [];
    const datToSubtrack = {};

    binnedData.forEach((bin) => {

      let availbleSubtracks = [];

      // initialize available tracks
      for (let trackIndex = 0; trackIndex < numOfSubtracks; trackIndex++){
        availbleSubtracks.push(trackIndex);
      }

      // assign data to available tracks
      bin.data.forEach((dat) => {
        const datId = dat._id;
        let trackId;
        if (datToSubtrack[datId]) {
          trackId = datToSubtrack[datId];
        } else {
          trackId = availbleSubtracks[0];
          datToSubtrack[datId] = trackId;
        }

        subtrackData[trackId] = subtrackData[trackId] || [];
        subtrackData[trackId].push({
          ...bin,
          name: dat.label,
          substitution: dat.substitution,
          types: dat.types,
          data: dat,
          link: dat.link,
          tip: this._renderTooltip(dat)
        });

        // used tracks are not available any more
        availbleSubtracks = availbleSubtracks.filter((availableTrackId) => availableTrackId !== trackId);
      });

    })
    return subtrackData;
  }

  _renderTooltip(variationDat) {
    const {substitution, phenotypes} = variationDat;
    const changeDetail = substitution.before + substitution.aa_position + substitution.after;

    return (<VariationSummary
      changeType={variationDat.molecular_change}
      changeDetail={changeDetail}
      phenotypes={phenotypes ? phenotypes.map((phenotype) => phenotype.phenotype.label) : []}
      phenotypeCount={variationDat.phen_count}/>);
  }

  _getColorScheme() {
    return getVariationColorScheme();
  }

  renderSubstitution = (variationDat, subtrackIndex) => {
    const substitution = variationDat.substitution.after;

    const start = this.props.coordinateMapping.toSVGCoordinate(variationDat.start);
    const end = this.props.coordinateMapping.toSVGCoordinate(variationDat.end);

    const {minBin, maxBin} = new DataLoader.BinHelper.getBinDescriptor(
      this.props.xMin, this.props.xMax, DEFAULT_MAX_BIN_COUNT);
    const actualBinCount = maxBin - minBin;

    return <SequenceComponent {...this.props}
//        key={variationDat.name}
        width={end - start}
        sequence={substitution}
        apparentWidth={this.context.viewWidth / actualBinCount}
        x={start}
        y={this.props.y + 2 + SUBTRACK_HEIGHT * subtrackIndex}
        colorScheme={null}/>
  }


  render() {
    const data = this._getDataWithIdentifier();
    const binnedData = this._bin(data);
    const subtrackData = this._decompose(binnedData);

    return (
      <FlexHeightTrackWrapper
        currentHeight={this.props.outerHeight}
        nextHeightFunction={this._getDerivedHeight}
        onHeightChange={this.props.onHeightChange}>
        {
          subtrackData.map((subtrackData, index) => {
            return <BasicTrack
              key={`variation-subtrack-${index}`}
              {...this.props}
              y={this.props.y + SUBTRACK_HEIGHT * index}
              colorScheme={this._getColorScheme()}
              data={subtrackData}/>
          })
        }
        {
          subtrackData.map((subtrackData, subtrackIndex) => {
            return subtrackData.map((variationDat) => {
              return this.renderSubstitution(variationDat, subtrackIndex);
            })
          })
        }
      </FlexHeightTrackWrapper>)
  }
}
