import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { zoom, zoomTransform, zoomIdentity } from 'd3-zoom';
import { drag } from 'd3-drag';
import { select, event } from 'd3-selection';

export default class Zoomable extends Component {
  static propTypes = {
    onTransform: React.PropTypes.func,
    extentX: React.PropTypes.arrayOf(React.PropTypes.number)
  }

  constructor(props) {
    super(props);
    this.transform = {
      translateX: 0,
      scaleX: 1
    };
  }


  scaleBy(kMultiple, center=0) {
    const kCurrent = this.transform.scaleX;
    const k = kMultiple * kCurrent;
    // transform point x such that it occupies centerPosition
    // k * x + t = centerPosition
    const t = this._getCenterPosition() - (k * center);
    const node = ReactDOM.findDOMNode(this);
    select(node).call(this._zoom.transform, zoomIdentity.translate(t, 0).scale(k));
    this.transform = {
      translateX: t,
      scaleX: k
    };
  }

  _getCenterPosition() {
    const [startX, endX] = this.props.extentX;
    return (startX + endX) / 2;
  }

  translateBy(t) {
    const node = ReactDOM.findDOMNode(this);
    this._zoom.translateBy(select(node), t);
    console.log(zoomTransform(node).apply([1,0]));
  }

  componentDidMount() {
    // setup event listeners
    const node = ReactDOM.findDOMNode(this);
    this._zoom = zoom()
//      .scaleExtent([1 / 2, 4])
      .on("zoom", (zoomed) => {
        console.log(zoomed)
        const v = select(this._zoomArea);
        v.attr("transform", event.transform);
        const transform = event.transform;
        v.attr("transform",  `translate(${transform.x}, 0) scale(${transform.k}, 1)`);
        this.transform = {
          translateX: transform.x,
          scaleX: transform.k
        };

        // decide whether to set state
        // which should happen infrequently
        // two approaches
        //  1) wait until transform event has not trigger for certain amount of time
        //  2) wait fixed amount of time, and compare with props to decide if set state is needed


        // console.log(ReactDOM.findDOMNode(this._zoomedComponent))
        // console.log(v.property('__zoom'));
        // (function(){console.log(zoomTransform(v.node()))})()
      });

    select(node).call(this._zoom);

    // option 2) wait fixed amount of time, and compare with props to decide if set state is needed
    this._timerId = setInterval(() => {
      if (this.transform) {
        const shouldTransfrom = this.transform.translateX !== this.props.translateX
          || this.transform.scaleX !== this.props.scaleX;
        if (shouldTransfrom) {
          this.props.onTransform(this.transform);
        }
      }
    }, 300);

  }

  componentWillReceiveProps() {
    // transform svg image based on props
    // const transform = this._parseTransform(this._calculateTransformFromProps());
    // console.log(transform);
    // select(this._zoomArea).attr("transform",  `translate(${transform.x}, 0) scale(${transform.kx}, 1)`);
  }

  componentWillUnmount() {
    // clean up event listeners
    select(node).on(".zoom", null);  // listener uses name ".zoom", note the "."
    // clean up intervals
    clearInterval(this._timerId);
    this._timerId = null;
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
      <svg
        x={0}
        y={0}>
        <g ref={(c) => {this._zoomArea = c}}>
        {
          this.props.children
        }
        </g>
      </svg>)
  }

}
