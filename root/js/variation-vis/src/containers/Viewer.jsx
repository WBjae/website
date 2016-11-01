import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { updateViewWidth, addTooltip, removeTooltip } from '../actions';
import Zoomable from '../containers/ZoomableContainer';
import MiniMap from '../containers/MiniMapContainer';
import TooltipCollection from '../containers/TooltipCollectionContainer';
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
          {this.props.referenceSequenceLength ? <MiniMap coordinateMapping={this._getDefaultCoordinateMap()}/> : null}
          {this.props.referenceSequenceLength ? <div style={{
              position: 'relative',
            }}>
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
              {this.props.children}
              </g>
              </LoadingVeil>
              }
            </Zoomable>
            {
              this.props.isZoomPanOccuring ? null : <TooltipCollection
                activeMarker={this.state.activeMarker}/>
            }
          </div> : null}
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
