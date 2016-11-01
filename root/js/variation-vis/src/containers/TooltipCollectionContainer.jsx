import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { addTooltip, removeTooltip } from '../actions';
import { getSVGxMin, getSVGxMax } from '../selectors';
import Tooltip from '../components/Tooltip';


class TooltipCollection extends Component {
  static propTypes = {
    tooltips: React.PropTypes.shape({
      content: React.PropTypes.string,
      position: React.PropTypes.number,
      segmentRegion: React.PropTypes.shape({
        x: React.PropTypes.number,
        y: React.PropTypes.number,
        width: React.PropTypes.number,
        height: React.PropTypes.number,
      })
    }),
    activeMarker: React.PropTypes.number,
    SVGtoViewX: React.PropTypes.func,
  }

  constructor(props) {
    super(props);
    this.state = {
      left: 0,
//      top: 0
    }
  }

  componentDidMount() {
    this._updateComponentPosition();
  }

  componentWillReceiveProps() {
    //this._updateComponentPosition();
  }

  _updateComponentPosition() {
    const {left, top} = ReactDOM.findDOMNode(this).getBoundingClientRect();
    this.setState(() => {
      const shouldPositionUpdate = left !== this.state.left;
      return shouldPositionUpdate ? {
        left,
//        top
      } : null;
    });
  }

  _getCursorPosition = (tooltip) => {
    const tooltipPosition = (tooltip.position || {}).clientX;
    return (tooltipPosition || tooltipPosition === 0) ?
      tooltipPosition - this.state.left : this.props.SVGtoViewX(this.props.activeMarker);
  }

  _getViewCoords = (cursorPosition, segmentRegion) => {
    return {
      left: cursorPosition,
      width: 1,
      top: segmentRegion.y,
      height: segmentRegion.height,
    }
  }

  render() {
    return (<div>
    {
      this.props.tooltips.map((tooltip) => {
        const cursorPosition = this._getCursorPosition(tooltip);
        if (cursorPosition || cursorPosition === 0) {
          const targetBox = this._getViewCoords(cursorPosition, tooltip.segmentRegion);
          return (
            <Tooltip
              key={tooltip.id}
              targetBox={targetBox}
              {...tooltip}/>
          )
        } else {
          return null;
        }
      })
    }
    </div>)
  }
}

// _getEventSVGCoords = (event) => {
//   const containerRect = this._viewerContainer.getBoundingClientRect();
//   const offsetX = event.clientX - containerRect.left;
//   const offsetY = event.clientY - containerRect.top;
//   const svgOffsetX = offsetX * this.props.fullWidth / (this.props.scale * this.props.viewWidth);
//   return {
//     x: svgOffsetX + this._getXMin(),
//     y: offsetY
//   }
// }

const mapStateToProps = (state) => {
  const xMin = getSVGxMin(state);
  const xMax = getSVGxMax(state);
  const viewWidth = state.viewer.viewWidth;
  const SVGtoViewX = (svgCoordX) => {
    if (svgCoordX || svgCoordX === 0) {
      return viewWidth * (svgCoordX - xMin) / (xMax - xMin);
    } else {
      null;
    }
  };
  const tooltips = Object.keys(state.tooltips).map((id) => state.tooltips[id]);
  return {
    tooltips: tooltips,
    SVGtoViewX: SVGtoViewX
  }
};

const TooltipCollectionContainer = connect(mapStateToProps)(TooltipCollection);
export default TooltipCollectionContainer;
