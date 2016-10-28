import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { zoom, zoomTransform, zoomIdentity } from 'd3-zoom';
import { drag } from 'd3-drag';
import { select, event } from 'd3-selection';
import MiniMap from '../components/MiniMap';

export default class Zoomable extends Component {
  static propTypes = {
    translateX: React.PropTypes.number,
    scaleX: React.PropTypes.number,
    onTransformEnd: React.PropTypes.func,
    onTransformStart: React.PropTypes.func,
    onTransformUpdate: React.PropTypes.func,
    onResetRequest: React.PropTypes.func,
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
      .on("start", () => {
        this.props.onTransformStart()
      })
      .on("zoom", () => {
        const translateX = event.transform.x;
        const scaleX = event.transform.k;
        // update the DOM with tranform
        const v = select(this._zoomArea);
        v.attr("transform",  `translate(${this.props.translateX}, 0) scale(${this.props.scaleX}, 1)`);

        if (translateX !== this.props.translateX || scaleX !== this.props.scaleX) {
          // conditional to avoid dispatch action when sync up event.transform value
          this.props.onTransformUpdate({
            translateX: translateX,
            scaleX: scaleX
          });
        }
      })
      .on('end', () => {
        this.props.onTransformEnd()
      })

    select(node).call(this._zoom);

    this.props.onResetRequest();

  }

  _teardown() {
    // clean up event listeners
    select(node).on(".zoom", null);  // listener uses name ".zoom", note the "."
    select(node).on(".start", null);
    select(node).on(".end", null);
  }

  componentDidMount() {
    this._setup();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.translateX !== this.props.translateX ||
      prevProps.scaleX !== this.props.scaleX) {
      // sync up event.transform value
      const node = ReactDOM.findDOMNode(this._zoomContainer);
      select(node).call(this._zoom.transform, zoomIdentity.translate(this.props.translateX, 0).scale(this.props.scaleX));
    }
  }

  componentWillUnmount() {
    this._teardown();
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
