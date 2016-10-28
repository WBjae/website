import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { updateViewWidth} from '../actions';
import Zoomable from '../containers/ZoomableContainer';
import MiniMap from '../containers/MiniMapContainer';
import Tooltip from '../components/Tooltip';
import LoadingVeil from '../components/LoadingVeil';
import Ruler from '../components/Ruler';
import PrettyTrackSVGFilter from '../components/PrettyTrackSVGFilter';
import Marker from '../components/Marker';
import { CoordinateMappingHelper, DEFAULT_TRACK_HEIGHT } from '../Utils';
import { getFullWidth } from '../selectors';

const DEFAULT_SVG_INTERNAL_WIDTH = 100;
const DEFAULT_SVG_HEIGHT = 600;  // use the same vertical coordinate system for internal vs apparent
const MARKER_BAR_HEIGHT = 12;

class Viewer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      //lastMoveTime: Number.NEGATIVE_INFINITY,

      // zoomPan scale and position

      // tooltips
      tooltips: [],

      //marker bar
      activeMarker: null,
      markers: [],

     };
  }

  static propTypes = {
    scale: React.PropTypes.number,
    translate: React.PropTypes.number,
    referenceSequenceLength: React.PropTypes.number,
    fullWidth: React.PropTypes.number,
    viewWidth: React.PropTypes.number,
    onDimensionUpdate: React.PropTypes.func,
    isZoomPanOccuring: React.PropTypes.bool,
  }

  static childContextTypes = {
    zoomFactor: React.PropTypes.number,
    viewWidth: React.PropTypes.number,
    getXMin: React.PropTypes.func,
    getXMax: React.PropTypes.func,
    //toApparentWidth: React.PropTypes.func,
    toWidth: React.PropTypes.func,
    getEventSVGCoords: React.PropTypes.func,
    toReferenceUnit: React.PropTypes.func,
    isZoomPanOccuring: React.PropTypes.bool,
  }

  getChildContext() {
    return {
      zoomFactor: this.props.scale,
      viewWidth: this.props.viewWidth,
      getXMin: this._getXMin,
      getXMax: this._getXMax,
      toWidth: this._toWidth,
      getEventSVGCoords: this._getEventSVGCoords,
      toReferenceUnit: this._toReferenceUnit,
      isZoomPanOccuring: this.props.isZoomPanOccuring
    }
  }

  updateDimensions = () => {
    const viewWidth = ReactDOM.findDOMNode(this).offsetWidth;
    this.props.onDimensionUpdate(viewWidth);
  }

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  getViewBox = () => {
    const {fullWidth} = this.props;
    return [0, 0, fullWidth, DEFAULT_SVG_HEIGHT];
  }

  _getDefaultCoordinateMap = () => {
    if (!this._defaultCoordinateMapping) {
      this._defaultCoordinateMapping =  new CoordinateMappingHelper.LinearCoordinateMapping({
        sequenceLength: this.props.referenceSequenceLength / 3,
        svgWidth: this.props.fullWidth
      });
    }
    return this._defaultCoordinateMapping;
  }


  showTooltip = ({title, content, trackId, segmentId, event, segmentRegion}) => {
    const newTooltip = {
      segmentId: segmentId,
      segmentRegion: segmentRegion,
      trackId: trackId,
      title: title,
      content: content,
      position: event ? this._getEventSVGCoords(event).x : null,
    };

    if (this.state.activeMarker !== null) {
      this.setState((prevState) => {
        const filteredTooltips = prevState.tooltips.filter((t) => t.segmentId !== newTooltip.segmentId);
        return {
          tooltips: filteredTooltips.concat(newTooltip),
        };
      })
    } else {
      this.setState({
        tooltips: [newTooltip]
      });
    }

  }



  hideTooltip = ({segmentId}) => {
    setTimeout(() => {
      this.setState((prevState, currProps) => {
        const filteredTooltips = prevState.tooltips.filter((t) => t.segmentId !== segmentId);
        return {
          tooltips: filteredTooltips
        };
      });
    }, 300);
  }


  _getXMin = () => {
    const {translate, scale, fullWidth} = this.props;
    return translate * -1 / scale;
  }

  _getXMax = () => {
    const {translate, scale, fullWidth} = this.props;
    return (translate * -1 / scale) + (fullWidth / scale);
  }

  // convert apparent width to with used by SVG internally
  _toWidth = (apparentWidth) => {
    const apparentFullWidth = this.props.viewWidth * this.props.scale;
    return apparentWidth * this.props.fullWidth / apparentFullWidth;
  }

  _getEventSVGCoords = (event) => {
    const containerRect = this._viewerContainer.getBoundingClientRect();
    const offsetX = event.clientX - containerRect.left;
    const offsetY = event.clientY - containerRect.top;
    const svgOffsetX = offsetX * this.props.fullWidth / (this.props.scale * this.props.viewWidth);
    return {
      x: svgOffsetX + this._getXMin(),
      y: offsetY
    }
  }

  _getViewCoords = (svgCoords) => {
    const viewCoordX = (svgCoordX) => {
      if (svgCoordX || svgCoordX === 0) {
        return this.props.viewWidth * (svgCoordX - this._getXMin()) / (this._getXMax() - this._getXMin());
      } else {
        null;
      }
    };
    const left = viewCoordX(svgCoords.x);
    const width = viewCoordX(svgCoords.x + svgCoords.width) - left;
    return {
      left: left,
      width: width,
      top: svgCoords.y,
      height: svgCoords.height,
    }
  }



  // convert svg internal coordinate to length in the domain logic (reference)
  _toReferenceUnit = (width) => {
    return width / this.state.unitLength;
  }

  _handleMarkerChange = (markerChangeAction) => {
    const {type, position, index} = markerChangeAction;
    const {markers, activeMarker} = this.state;
    if (type === 'ACTIVE_MARKER_DELETE') {
      this.setState({
        activeMarker: null
      })
    } else if (type === 'ACTIVE_MARKER_UPDATE') {
      this.setState({
        activeMarker: position
      })
    } else if (type === 'MARKER_ADD') {
      const newMarkers = markers.concat(position);
      this.setState({
        markers: newMarkers
      });
    } else if (type === 'MARKER_DELETE') {
      const newMarkers = markers.slice(0, index)
        .concat(markers.slice(index + 1));
      this.setState({
        markers: newMarkers
      })
    }

  }


  render (){
    return (
      <div ref={(component) => this._viewerContainer = component}
        style={{
          width: 'auto',
          position: 'relative',
          ...this.props.style
        }}>
          {this.props.referenceSequenceLength ?
            <MiniMap coordinateMapping={this._getDefaultCoordinateMap()}/> : null}
          {this.props.referenceSequenceLength ?
            <Zoomable
              viewBox={this.getViewBox()}
              coordinateMapping={this._getDefaultCoordinateMap()}
              ref={(c) => this._zoomable = c}>
              <defs>
                {
                  <PrettyTrackSVGFilter/>
                }
              </defs>
              <LoadingVeil
                xMin={this._getXMin()}
                xMax={this._getXMax()}
                height={DEFAULT_SVG_HEIGHT}
                fullWidth={this.props.fullWidth}>
              {
                this.props.referenceSequenceLength ? <Marker
                  ref={(c) => this._markerComponent = c}
                  coordinateMapping={this._getDefaultCoordinateMap()}
                  markerPositions={this.state.markers}
                  onMarkerChange={this._handleMarkerChange}
                  height={MARKER_BAR_HEIGHT}
                  viewHeight={DEFAULT_SVG_HEIGHT}>
                  <Ruler
                    coordinateMapping={this._getDefaultCoordinateMap()}
                    xMin={this._getXMin()}
                    xMax={this._getXMax()}
                    height={DEFAULT_SVG_HEIGHT}/>
                </Marker> : null
              }
              <g>
              {
                // render tracks
                React.Children.map(this.props.children, (child) => {
                  if (child) {
                    const coordinateMapping = child.props.coordinateMapping || (new CoordinateMappingHelper.LinearCoordinateMapping({
                      sequenceLength: child.props.sequence ? child.props.sequence.length : child.props.sequenceLength,
                      svgWidth: this.props.fullWidth
                    }));
                    const xMin = coordinateMapping.toSequenceCoordinate(this._getXMin());
                    const xMax = coordinateMapping.toSequenceCoordinate(this._getXMax());
                    const activeMarker = this.state.activeMarker !== null ?
                      coordinateMapping.toSequenceCoordinate(this.state.activeMarker) : null;
                    const newChild = React.cloneElement(child, {
                      xMin: Math.floor(xMin),
                      xMax: Math.ceil(xMax),
                      activeMarker: activeMarker,
                      coordinateMapping: coordinateMapping,
                      onTooltipShow: this.showTooltip,
                      onTooltipHide: this.hideTooltip,
                    });
                    return newChild;
                  } else {
                    return null;
                  }
                })
              }
              </g>
              </LoadingVeil>
              }
            </Zoomable> : null}
        {
          this.props.isZoomPanOccuring ?
            null : this.state.tooltips.map((tooltip) => {

              const segment = tooltip.segmentRegion;
              const x = (tooltip.position || tooltip.position === 0) ?
                tooltip.position : this.state.activeMarker;

              if (x || x === 0) {
                const targetRegion = {
                  x: x,
                  width: 1,
                  y: segment.y + 10,
                  height: segment.height
                };
                const targetBox = this._getViewCoords(targetRegion);

                return (
                  <Tooltip
                    targetBox={targetBox}
                    {...tooltip}/>
                )
              } else {
                return null;
              }
            })
          }
      </div>
    );
  }

}

const mapStateToProps = (state, ownProps) => {
  return {
    translate: state.viewer.translate,
    scale: state.viewer.scale,
    isZoomPanOccuring: state.viewer.isZoomPanOccuring,
    referenceSequenceLength: state.viewer.referenceSequenceLength,
    fullWidth: getFullWidth(state, ownProps),
    viewWidth: state.viewer.viewWidth,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onDimensionUpdate: (width) => dispatch(updateViewWidth(width))
  }
}

const ViewerContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer);
export default ViewerContainer;
