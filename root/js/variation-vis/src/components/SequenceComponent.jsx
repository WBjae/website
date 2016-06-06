import React from 'react';
//import { ScaleIndependentComponent } from './ScaleIndependentComponent.jsx';

const MIN_SEQUENCE_CHAR_WIDTH = 12;  // hide sequence if not enough space per char

class SequenceComponent extends React.Component {

  static propTypes = {
    y: React.PropTypes.number.isRequired,
    width: React.PropTypes.number,
    apparentWidth: React.PropTypes.number,
    height: React.PropTypes.number,
    sequence: React.PropTypes.string
  }

  // static defaultProps = {
  //   width: 30,
  //   height: 20
  // }

  static contextTypes = {
    zoomFactor: React.PropTypes.number,
    viewWidth: React.PropTypes.number,
  }

  getCoord = () => {
    const {x,y, width, height} = this.props;
    const yOffset = 15;

    return {
      x: x,
      y: y + yOffset,
      width,
      height
    }
  }

  _getCharWidth = () => {
    console.log(this.props.apparentWidth)
    const charWidth = this.props.apparentWidth / this.props.sequence.length;
    return charWidth;
  }

  render() {

    const coords = this.getCoord();

    //console.log(coords);
    const charWidth =  this._getCharWidth();

    return this.props.sequence && charWidth > MIN_SEQUENCE_CHAR_WIDTH ?
        <text is="svg-text"
              class="sequence-text"
              {...coords}
              text-anchor="start"
              font-size="12"
              font-family='Menlo, Monaco, Consolas, "Courier New", monospace'
              textLength={coords.width}
              lengthAdjust="spacing"
              fill="#333333">
          {this.props.sequence}
        </text> : null;
  }
}

export default SequenceComponent;