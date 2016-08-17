import "babel-polyfill";
import React from 'react';
import Tooltip from './Tooltip';
import Ruler from './Ruler';
import PrettyTrackSVGFilter from './PrettyTrackSVGFilter';
import Marker from './Marker';
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
      zoomPan: null,
      zoomFactor: 1,
      xMin: 0,  // visible region of svg by internal eate
      xMax: DEFAULT_SVG_INTERNAL_WIDTH,
      fullWidth: DEFAULT_SVG_INTERNAL_WIDTH,
      viewWidth: 500,

      // tooltips
      tooltip: null,
      tooltipEventID: 0,

      // zoomPan
      isZoomPanOccuring: false,
      zoomPanEventId: 0,
      zoomPanCallId: 0,  // avoid too many render by
      // zoomPanEvents: [],

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
      zoomFactor: this.state.zoomFactor,
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
    return (event) => {
      if (this.state.zoomPan){
        // const xMin = this._getXMin();
        // const xMax = this._getXMax();
     //    const xCentre = xMin + (xMax - xMin) / 2;
     //    const previousViewPortWidth = this.state.fullWidth / this.state.zoomFactor;
     //    const offset = previousViewPortWidth * (1 - multiple) / 2;
     // //   this.state.zoomPan.zoomBy(multiple);

        const {xMin, xMax, viewPortCenter, imageCenter, zoomFactor, viewPortWidth} = this._getViewPortStat();

        let newZoomFactor = zoomFactor * rawMultiple;
        newZoomFactor = Math.min(newZoomFactor, this._getMaxZoomFactor());
        newZoomFactor = Math.max(newZoomFactor, this._getMinZoomFactor());
        const multiple = newZoomFactor / zoomFactor;

        const newXMin = viewPortCenter - ((viewPortWidth / multiple) / 2);
        const newPanOffset = newXMin * newZoomFactor * -1;
        this.state.zoomPan.zoom(newZoomFactor);
        this.state.zoomPan.pan({
          x: newPanOffset,
          y: 0
        })

        // const deltaWidth = this.state.fullWidth * (1 - newZoomFactor);
        // const centerOffset = viewPortCenter
        // this.state.zoomPan.zoom(newZoomFactor);
        // this.state.zoomPan.pan({
        //   x: deltaWidth / 2 + centerOffset,
        //   y: 0
        // })
      }
    }

  }

  _getViewPortStat(){
    const xMin = this._getXMin();
    const xMax = this._getXMax();
    const {zoomFactor} = this.state;
    const viewPortWidth = xMax - xMin;
    const viewPortCenter = xMin + viewPortWidth / 2;
    const imageCenter = (this.state.fullWidth / 2);
    const centerOffset = viewPortCenter - imageCenter;
    return {xMin, xMax, viewPortCenter, imageCenter, zoomFactor, viewPortWidth};
  }

  getPanHandler = (deltaRatio) => {
    return () => {
      if (this.state.zoomPan){
        const delta = this.state.fullWidth * deltaRatio;
        this.state.zoomPan.panBy({x: delta, y: 0});
      }
    }
  }

  handleZoomPanReset = () => {
    const zoomPan = this.state.zoomPan;
    if (zoomPan){
      const zoom = 0.95;  // add a padding to default view by zooming out
      const deltaWidth = this.state.fullWidth * (1 - zoom);
      zoomPan.zoom(zoom);
      zoomPan.pan({
        x: deltaWidth/2,  // re-center after zooming
        y: 0
      })
    }
  }

  getViewBox = () => {
    const {fullWidth} = this.state;
    return [0, 0, fullWidth, DEFAULT_SVG_HEIGHT].join(' ');
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
    }, this._setupZoomPan);
  }


  _setupZoomPan = () => {

    const eventsHandler = {
      // haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel',
      //   'mousedown', 'mousemove', 'mouseup'],
      init: (options) => {
        var instance = options.instance
          , initialScale = 1
          , pannedX = 0
          , pannedY = 0;

        // Init Hammer
        this.hammer = new Hammer(options.eventsListenerElement)

        // Handle pan
        this.hammer.on('panstart panmove', (ev) => {
          // On pan start reset panned variables
          if (ev.type === 'panstart') {
            pannedX = 0
          }

          if (this._getEventSVGCoords(ev.srcEvent).y < MARKER_BAR_HEIGHT) {
            // avoid pan event on marker bar, which interfere with placing marker
            return;
          }
          // Pan only the difference
          const factor = (this.state.fullWidth) / this.state.viewWidth;
          instance.panBy({x: (ev.deltaX - pannedX) * factor, y: false});
          pannedX = ev.deltaX;

        })

        // Prevent moving the page on some devices when panning over SVG
        options.svgElement.addEventListener('touchmove', function(e){ e.preventDefault(); });
      },
      destroy: () => {
        this.hammer.destroy()
      }
    };

    const svgElement = svgPanZoom('#svg-browser-svg', {
    //  viewportSelector: '.svg-pan-zoom_viewport'
    panEnabled: false,  // disable default event handling for panning. Panning is handled by custom event handler.
    separateZoomsEnabled: true,
    beforeZoom: (zooms) => {
      if (this.state.zoomLockOn) {
        return false;
      }
      return {x: true, y: false};
    },
    beforePan: () => {
      return {x: true, y: false};
    },
    onZoom: () => {
      this.hideTooltip();
      this._updateZoomPanState();
      this._zoomPanTimeout();
    },
    onPan: () => {
      this.hideTooltip();
      this._updateZoomPanState();
      this._zoomPanTimeout()
    }
    // , controlIconsEnabled: true
    //, zoomEnabled: false
    // , dblClickZoomEnabled: true
    , mouseWheelZoomEnabled: true
    // , preventMouseEventsDefault: true
    , zoomScaleSensitivity: 0.4
    , minZoom: this._getMinZoomFactor()
    , maxZoom: this._getMaxZoomFactor()
    , fit: false
    , contain: false
    , center: false,
    customEventsHandler: eventsHandler,
    // , refreshRate: 'auto'
    // , beforeZoom: function(){}
    // , onZoom: function(){}
    // , beforePan: function(){}
    // , onPan: function(){}
    eventsListenerElement: document.querySelector('#svg-browser')
    });
    $('#svg-browser-svg').css({
     width: '100%',
   // height:'100%'
    })
    //svgElement
    //svgElement.resize()
//svgElement.setAttribute('width', 500)

    this.setState({
      zoomPan: svgElement
    }, () => {
      this.handleZoomPanReset();
    });

    //this.svgElement = svgElement;

  }

  _updateZoomPanState = () => {

    const {x: zoomFactor} = this.state.zoomPan.getZooms();
    const {x: panOffset} = this.state.zoomPan.getPan();
    const xMin = panOffset * -1 / zoomFactor;
    const zoomPanCallId = this.state.zoomPanCallId + 1;
    // const newZoomPanEvents = this.state.zoomPanEvents.concat({
    //   zoomFactor,
    //   panOffset,
    //   zoomPanCallId,
    // });

    this.setState({
      zoomPanCallId
    });

    setTimeout(() => {
      if (this.state.zoomPanCallId === zoomPanCallId) {
        // if no new zoomPan events occur during the timeout
        this.setState((prevState) => {
          return {
            xMin: xMin,
            zoomFactor: zoomFactor
          };
        });
      }
    }, 400);
  }

  _getXMin = () => {
    return this.state.xMin;
  }

  _getXMax = () => {
    return this.state.xMin + this.state.fullWidth / this.state.zoomFactor;
  }

  // convert apparent width to with used by SVG internally
  _toWidth = (apparentWidth) => {
    const apparentFullWidth = this.state.viewWidth * this.state.zoomFactor;
    return apparentWidth * this.state.fullWidth / apparentFullWidth;
  }

  _getEventSVGCoords = (event) => {
    const containerRect = this._viewerContainer.getBoundingClientRect();
    const offsetX = event.clientX - containerRect.left;
    const offsetY = event.clientY - containerRect.top;
    const svgOffsetX = offsetX * this.state.fullWidth / (this.state.zoomFactor * this.state.viewWidth);
    return {
      x: svgOffsetX + this._getXMin(),
      y: offsetY
    }
  }

  // convert svg internal coordinate to length in the domain logic (reference)
  _toReferenceUnit = (width) => {
    return width / this.state.unitLength;
  }

  _getMaxZoomFactor() {
    return this.state.fullWidth / this.state.viewWidth * 2;
  }

  _getMinZoomFactor() {
    return 0.9;
  }

  _zoomPanTimeout = () => {
    let zoomPanEventId;
    this.setState((prevState) => {
      zoomPanEventId = prevState.zoomPanEventId + 1;
      return {
        isZoomPanOccuring: true,
        zoomPanEventId: zoomPanEventId
      };
    });
    setTimeout(()=> {
      this.setState((prevState) => {
        if (prevState.zoomPanEventId === zoomPanEventId){
          // only cancel isZoomPanOccuring if no zoompan request is made
          return {
            isZoomPanOccuring: false
          };
        }else{
          return {};
        }
      });
    }, 200);
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
      })
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
          width: this.state.viewWidth,
          ...this.props.style
        }}>
        <svg id="svg-browser"
          onWheel={this.handlePan}
          viewBox={this.getViewBox()}
          height="100%"
          width={this.state.viewWidth}
          preserveAspectRatio="none"
          style={{
            border:"1px solid #aaaaaa",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          }}>
          <svg id="svg-browser-svg"
            x={0} y={0}
            //preserveAspectRatio="meet xMinYMin"
            >
            <g>
              <defs>
                <PrettyTrackSVGFilter/>
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
                  coordinateMapping={new CoordinateMappingHelper.DefaultCoordinateMapping({
                    sequenceLength: this.state.referenceSequenceLength / 3,
                    svgWidth: this.state.fullWidth})}
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
                    const coordinateMapping = child.props.coordinateMapping || (new CoordinateMappingHelper.DefaultCoordinateMapping({
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
            </g>
          </svg>
        </svg>
        { this.state.tooltip
          ? <Tooltip {...this.state.tooltip}/>
          : null
        }
      </div>
    );
  }

}
