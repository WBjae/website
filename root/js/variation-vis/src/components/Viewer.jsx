import "babel-polyfill";
import React from 'react';
import ReactDOM from 'react-dom';
import Zoomable from './Zoomable';
import Tooltip from './Tooltip';
import Ruler from './Ruler';
import PrettyTrackSVGFilter from './PrettyTrackSVGFilter';
import Marker from './Marker';
import MiniMap from './MiniMap';
import { CoordinateMappingHelper } from '../Utils';
import svgPanZoom from 'svg-pan-zoom';
import Hammer from 'hammerjs';

const DEFAULT_SVG_INTERNAL_WIDTH = 100;
const DEFAULT_SVG_HEIGHT = 600;  // use the same vertical coordinate system for internal vs apparent
const MARKER_BAR_HEIGHT = 12;

export default class Viewer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      //lastMoveTime: Number.NEGATIVE_INFINITY,

      // zoomPan scale and position
      scale: 1,
      translate: 0,
      isZoomPanOccuring: false,
      fullWidth: DEFAULT_SVG_INTERNAL_WIDTH,
      viewWidth: 500,

      // tooltips
      tooltip: null,
      tooltipEventID: 0,

      //marker bar
      activeMarker: null,
      markers: [],

     };
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
      zoomFactor: this.state.scale,
      viewWidth: this.state.viewWidth,
      getXMin: this._getXMin,
      getXMax: this._getXMax,
      toWidth: this._toWidth,
      getEventSVGCoords: this._getEventSVGCoords,
      toReferenceUnit: this._toReferenceUnit,
      isZoomPanOccuring: this.state.isZoomPanOccuring
    }
  }

  getZoomHandler = (rawMultiple) => {
    return () => {
      const center = (this._getXMin() + this._getXMax()) / 2;
      this._zoomable.scaleBy(rawMultiple, center);
    }
  }

  getPanHandler = (deltaRatio) => {
    return () => {
      const delta = (this._getXMax() - this._getXMin()) * deltaRatio;
      this._zoomable.translateBy(delta);
    }
  }

  handleZoomPanReset = () => {
    this._zoomable.reset();
  }

  _handleTransform = (transform) => {
    const {translateX, scaleX} = transform;
    this.setState({
      translate: translateX,
      scale: scaleX
    });
  }


  _updateDimensions = () => {
    const viewWidth = ReactDOM.findDOMNode(this).offsetWidth;
    console.log(viewWidth);
    this.setState({
      viewWidth: viewWidth,
    });
  }

  componentDidMount() {
    this._updateDimensions();
    window.addEventListener("resize", this._updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  getViewBox = () => {
    const {fullWidth} = this.state;
    return [0, 0, fullWidth, DEFAULT_SVG_HEIGHT].join(' ');
  }

  _getDefaultCoordinateMap = () => {
    if (!this._defaultCoordinateMapping) {
      this._defaultCoordinateMapping =  new CoordinateMappingHelper.LinearCoordinateMapping({
        sequenceLength: this.state.referenceSequenceLength / 3,
        svgWidth: this.state.fullWidth
      });
    }
    return this._defaultCoordinateMapping;
  }


  showTooltip = ({title, content, event}) => {

    // // Get point in global SVG space
    // function cursorPoint(evt){
    //   // Create an SVGPoint for future math
    //   const svg = evt.target.ownerSVGElement;
    //   const pt = svg.createSVGPoint();
    //   pt.x = evt.clientX;
    //   pt.y = evt.clientY;
    //   // return pt.matrixTransform(svg.getScreenCTM().inverse());
    //   return {
    //     x: 0,
    //     y: 0
    //   }
    // }

    // const {x, y} = cursorPoint(event);

    const containerBox = this._viewerContainer.getBoundingClientRect();
    const targetBox = event.target.getBoundingClientRect();

    // console.log('called');
    // const x = targetBox.left - containerBox.left;
    // const y = targetBox.top - containerBox.top;

    // function getRectCoords(rect) {
    //   const {left, top, height, width} = rect;
    //   return {
    //     left,
    //     top,
    //     height,
    //     width
    //   };
    // }

    // const target = getRectCoords(targetBox);
    // const container = getRectCoords(containerBox);

    //event.stopPropagation();

    this.setState((prevState, currProps) => {
      return {
        tooltip: {
          title: title,
          content: content,
          target: targetBox,
          container: containerBox
        },
        tooltipEventID: prevState.tooltipEventID + 1,
      };
    });

  }



  hideTooltip = (event) => {
    const tooltipEventID = this.state.tooltipEventID;

    if (event && (event.relatedTarget.getAttribute('class') === 'sequence-text'
      || event.relatedTarget.getAttribute('is') === 'svg-text')) {
      return;
    }

    setTimeout(() => {
      this.setState((prevState, currProps) => {
        return prevState.tooltipEventID === tooltipEventID ? {
          tooltip: null
        } : {}
      });
    }, 200);
  }


  shouldComponentUpdate(nextProps, nextState) {
    // triggers state change Only if the zoomPanCallId has stablized,
    // as zoomPanCallId changes when zoom pan is ongoing,
    // which would result in a lot unnecessary calls.
    // console.log(`${nextState.zoomPanCallId} ${this.state.zoomPanCallId}`);
    return nextState.zoomPanCallId === this.state.zoomPanCallId;
  }


  setup(configs) {
    let {referenceSequenceLength, unitLength} = configs;
    unitLength = unitLength || 10;
    this.setState({
      unitLength: unitLength,
      fullWidth: referenceSequenceLength * unitLength,
      referenceSequenceLength
    });
  }

  _getXMin = () => {
    const {translate, scale, fullWidth} = this.state;
    return translate * -1 / scale;
  }

  _getXMax = () => {
    const {translate, scale, fullWidth} = this.state;
    return (translate * -1 / scale) + (fullWidth / scale);
  }

  // convert apparent width to with used by SVG internally
  _toWidth = (apparentWidth) => {
    const apparentFullWidth = this.state.viewWidth * this.state.scale;
    return apparentWidth * this.state.fullWidth / apparentFullWidth;
  }

  _getEventSVGCoords = (event) => {
    const containerRect = this._viewerContainer.getBoundingClientRect();
    const offsetX = event.clientX - containerRect.left;
    const offsetY = event.clientY - containerRect.top;
    const svgOffsetX = offsetX * this.state.fullWidth / (this.state.scale * this.state.viewWidth);
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
          position: 'relative',
          width: 'auto',
          ...this.props.style
        }}>
        {
          this.state.referenceSequenceLength ? <MiniMap
            xMin={this._getDefaultCoordinateMap().toSequenceCoordinate(this._getXMin())}
            xMax={this._getDefaultCoordinateMap().toSequenceCoordinate(this._getXMax())}
            width="100%"
            height={10}
            sequenceLength={this.state.referenceSequenceLength / 3}/> : null
        }
        <svg id="svg-browser"
          onWheel={this.handlePan}
          viewBox={this.getViewBox()}
          height="100%"
          width="100%"
          preserveAspectRatio="none"
          style={{
            border:"1px solid #aaaaaa",
            marginTop: 5,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          }}>
            <Zoomable
              onTransform={this._handleTransform}
              extentX={[0, this.state.fullWidth]}
              ref={(c) => this._zoomable = c}>
              <defs>
                {
                  <PrettyTrackSVGFilter/>
                }
              </defs>
              {
                /* visibile region background */
                <rect
                  x={this._getXMin()}
                  y={0}
                  width={this._getXMax() - this._getXMin()}
                  height={DEFAULT_SVG_HEIGHT}
                  fill={'#ffffff'}/>
              }
              {
                this.state.referenceSequenceLength ? <Marker
                  coordinateMapping={this._getDefaultCoordinateMap()}
                  activeMarkerPosition={this.state.activeMarker}
                  markerPositions={this.state.markers}
                  onMarkerChange={this._handleMarkerChange}
                  height={MARKER_BAR_HEIGHT}
                  viewHeight={DEFAULT_SVG_HEIGHT}>
                  <Ruler
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
                      svgWidth: this.state.fullWidth
                    }));
                    const xMin = coordinateMapping.toSequenceCoordinate(this._getXMin());
                    const xMax = coordinateMapping.toSequenceCoordinate(this._getXMax());
                    const newChild = React.cloneElement(child, {
                      xMin: Math.floor(xMin),
                      xMax: Math.ceil(xMax),
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
              {
                /* loading region foreground */
                <rect
                  x={this._getXMin() - this.state.fullWidth}
                  y={0}
                  width={this.state.fullWidth}
                  height={DEFAULT_SVG_HEIGHT}
                  opacity={0.7}
                  fill={'#cccccc'}/>
              }
              {
                /* loading region foreground */
                <rect
                  x={this._getXMax()}
                  y={0}
                  width={this.state.fullWidth}
                  height={DEFAULT_SVG_HEIGHT}
                  opacity={0.7}
                  fill={'#cccccc'}/>
              }
            </Zoomable>
        </svg>
        { this.state.tooltip
          ? <Tooltip {...this.state.tooltip}/>
          : null
        }
      </div>
    );
  }

}
