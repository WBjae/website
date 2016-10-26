import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { zoom, zoomTransform, zoomIdentity } from 'd3-zoom';
import { drag } from 'd3-drag';
import { select, event } from 'd3-selection';
import MiniMap from '../components/MiniMap';

export default class Zoomable extends Component {
  static propTypes = {
    onTransformEnd: React.PropTypes.func,
    onTransformStart: React.PropTypes.func,
    viewBox: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    coordinateMapping: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      transform: {
        translateX: 0,
        scaleX: 1
      }
    };
  }


  scaleBy(kMultiple, center) {
    const kCurrent = this.state.transform.scaleX;
    this.scaleTo(kMultiple * kCurrent, center);
  }

  scaleTo(k, center) {
    // transform point x such that it occupies centerPosition
    // k * x + t = centerPosition
    const t = this._getCenterPosition() - (k * center);
    const node = ReactDOM.findDOMNode(this._zoomContainer);
    select(node).call(this._zoom.transform, zoomIdentity.translate(t, 0).scale(k));
  }

  reset() {
    this.scaleTo(0.9, this._getCenterPosition());
  }

  translateBy(t) {
    const node = ReactDOM.findDOMNode(this._zoomContainer);
    this._zoom.translateBy(select(node), t);
  }

  _getXMin = () => {
    return this._getX(0);
  }

  _getXMax = () => {
    return this._getX(this._getSVGWidth());
  }

  _getX = (apparentX) => {
    const {translateX, scaleX} = this.state.transform;
    return (apparentX - translateX) / scaleX;
  }

  _getSVGWidth = () => {
    const [, , width] = this.props.viewBox;
    return width;
  }

  _getCenterPosition() {
    const [x, y, width, height] = this.props.viewBox;
    const startX = x;
    const endX = x + width;
    return (startX + endX) / 2;
  }

  _handleMiniMapUpdate = (center) => {
    this.scaleBy(1, center);
  }

  _setup() {
    // setup event listeners
    const node = ReactDOM.findDOMNode(this._zoomContainer);
    this._zoom = zoom()
      .scaleExtent([1 / 2, Infinity])
      .on("zoom", () => {
        const v = select(this._zoomArea);
        const translateX = event.transform.x;
        const scaleX = event.transform.k;

        v.attr("transform",  `translate(${translateX}, 0) scale(${scaleX}, 1)`);
        this.props.onTransformStart();
        this.setState({
          transform: {
            translateX: translateX,
            scaleX: scaleX
          }
        });

        // decide whether to set state
        // which should happen infrequently
        // two approaches
        //  1) wait until transform event has not trigger for certain amount of time
        setTimeout(() => {
          if (this.state.transform) {
            const shouldTransfrom = this.state.transform.translateX === translateX
              || this.state.transform.scaleX === scaleX;
            // shouldTransfrom if the tranform has been stable since timeout starts
            if (shouldTransfrom) {
              this.props.onTransformEnd(this.state.transform);
            }
          }
        }, 300);
        //  2) wait fixed amount of time, and compare with props to decide if set state is needed


        // console.log(ReactDOM.findDOMNode(this._zoomedComponent))
        // console.log(v.property('__zoom'));
        // (function(){console.log(zoomTransform(v.node()))})()
      });

    select(node).call(this._zoom);

    // option 2) wait fixed amount of time, and compare with props to decide if set state is needed
    // this._timerId = setInterval(() => {
    //   if (this.state.transform) {
    //     const shouldTransfrom = this.state.transform.translateX !== this.props.translateX
    //       || this.state.transform.scaleX !== this.props.scaleX;
    //     if (shouldTransfrom) {
    //       this.props.onTransformEnd(this.state.transform);
    //     }
    //   }
    // }, 300);

    this.reset();

  }

  _teardown() {
    // clean up event listeners
    select(node).on(".zoom", null);  // listener uses name ".zoom", note the "."
    // clean up intervals
    clearInterval(this._timerId);
    this._timerId = null;
  }

  componentDidMount() {
    this._setup();
  }

  componentWillReceiveProps() {
    // transform svg image based on props
    // const transform = this._parseTransform(this._calculateTransformFromProps());
    // console.log(transform);
    // select(this._zoomArea).attr("transform",  `translate(${transform.x}, 0) scale(${transform.kx}, 1)`);
  }

  componentWillUnmount() {
    this._teardown();
  }

  _parseTransform(transformString='') {
    const matchTranslate = transformString.match(/translate\((.+?)\)/);
    const [x, y] = matchTranslate
      ? matchTranslate[1].split(',')
      : [0, 0];

    const matchScale = transformString.match(/scale\((.+?)\)/);
    const [kx, ky] = matchScale ? matchScale[1].split(',') : [1, 1];

    return {
      x: x,
      y: y || x,
      kx: kx,
      ky: ky || kx,
    }
  }

  _calculateTransformFromProps() {
    const {translateX, scaleX} = this.props;
    return `translate(${translateX}, 0) scale(${scaleX}, 1)`;
  }

  render() {
    return (
      <div>
        <MiniMap
          xMin={this._getXMin()}
          xMax={this._getXMax()}
          onUpdate={this._handleMiniMapUpdate}
          fullWidth={this._getSVGWidth()}
          coordinateMapping={this.props.coordinateMapping}/>
        <svg id="svg-browser"
          viewBox={this.props.viewBox.join(' ')}
          height="100%"
          width="100%"
          preserveAspectRatio="none"
          style={{
            border:"1px solid #aaaaaa",
            marginTop: 5,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            background: 'white url(/img/ajax-loader.gif) center no-repeat',
          }}>
          <svg
            ref={(c) => {this._zoomContainer = c}}
            x={0}
            y={0}>
            <g ref={(c) => {this._zoomArea = c}}>
            {
              this.props.children
            }
            </g>
          </svg>
        </svg>
      </div>)
  }

}
