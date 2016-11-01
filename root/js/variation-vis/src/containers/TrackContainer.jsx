import { connect } from 'react-redux';
import { addTooltip, removeTooltip, replaceTooltip } from '../actions';
import { getSVGxMin, getSVGxMax, getFullWidth } from '../selectors';
import { CoordinateMappingHelper } from '../Utils';
import BasicTrack from '../Tracks/BasicTrack';

const mapStateToProps = (state, ownProps) => {
  const coordinateMapping = _getCoordinateMapping(state, ownProps);
  const xMin = coordinateMapping.toSequenceCoordinate(getSVGxMin(state));
  const xMax = coordinateMapping.toSequenceCoordinate(getSVGxMax(state));
  const activeMarker = state.activeMarker !== null ?
    coordinateMapping.toSequenceCoordinate(state.activeMarker) : null;
  return {
    xMin: Math.floor(xMin),
    xMax: Math.ceil(xMax),
    activeMarker: activeMarker,
    coordinateMapping: coordinateMapping,
  };
};

const _getCoordinateMapping = (state, ownProps) => {
  const sequenceLength = ownProps.sequence ? ownProps.sequence.length : ownProps.sequenceLength;
  const coordinateMapping = ownProps.coordinateMapping || (new CoordinateMappingHelper.LinearCoordinateMapping({
    sequenceLength: sequenceLength,
    svgWidth: getFullWidth(state)
  }));
  return coordinateMapping;
};

const mapDispatchToProps = (dispatch) => ({
  onTooltipShow: ({title, content, trackId, segmentId, event, segmentRegion}) => {
    dispatch(replaceTooltip(segmentId, content, segmentRegion, {
      clientX: event.clientX
    }));
  },
  onTooltipHide: ({segmentId}) => setTimeout(() => {
    dispatch(removeTooltip(segmentId));
  }, 300)
});

export const wrapTrack = (component) => {
  return connect(mapStateToProps, mapDispatchToProps)(component);
}
