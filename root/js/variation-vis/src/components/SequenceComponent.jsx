import React from 'react';
//import { ScaleIndependentComponent } from './ScaleIndependentComponent.jsx';

const SEQUENCE_CHAR_WIDTH = 12;  // hide sequence if not enough space per char

class SequenceComponent extends React.Component {

  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    width: React.PropTypes.number,
    apparentWidth: React.PropTypes.number,
    height: React.PropTypes.number,
    sequence: React.PropTypes.string,
    colorScheme: React.PropTypes.object,
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
    const charWidth = this.props.apparentWidth / this.props.sequence.length;
    return charWidth;
  }

  shouldShow = () => {
    return this.props.sequence && this._getCharWidth() > SEQUENCE_CHAR_WIDTH;
  }

  renderColor = () => {
    const {colorScheme, sequence, x: start, y, width} = this.props;
    const unitWidth = width / sequence.length;
    const characters = sequence.split('');

    return characters.map((char, index) => {
      const color = colorScheme.getColorFor(char, index);
      const x = start + unitWidth * index;
      return <rect
        key={index}
        fill={color}
        x={x}
        y={this.props.y}
        width={unitWidth}
        height={20}/>
    });

  }

  render() {
    const {width, apparentWidth, sequence} = this.props;
    const charSVGWidth = SEQUENCE_CHAR_WIDTH * width / apparentWidth;
    const charSVGOffset = (width / sequence.length - charSVGWidth) / 2;
    const coords = this.getCoord();

    return this.shouldShow() ? <g>
        {
          this.props.colorScheme ? this.renderColor() : null
        }
        {
          this.props.sequence.split('').map((char, index) => {
            const x = coords.x + charSVGOffset + width / sequence.length * index;
            return (<text is="svg-text"
              class="sequence-text"
              {...coords}
              x={x}
              text-anchor="start"
              font-size="12"
              font-family='Menlo, Monaco, Consolas, "Courier New", monospace'
              textLength={charSVGWidth}
              lengthAdjust="spacingAndGlyphs"
              fill="#333333">
              {char}
            </text>)
          })
        }
      </g> : null;
  }
}

export default SequenceComponent;
