import React, { Component } from 'react';

export default class LoadingVeil extends Component {
  static propTypes = {
    xMin: React.PropTypes.number,
    xMax: React.PropTypes.number,
    height: React.PropTypes.number,
    fullWidth: React.PropTypes.number,
  }

  render() {
    const {xMin, xMax, height, fullWidth} = this.props;
    return (
      <g>
        {/* visibile region background */}
        <rect
          x={xMin}
          y={0}
          width={xMax - xMin}
          height={height}
          fill={'#ffffff'}/>
          {this.props.children}
        {/* loading region foreground */}
        <rect
          x={xMin - fullWidth}
          y={0}
          width={fullWidth}
          height={height}
          opacity={0.7}
          fill={'#cccccc'}/>
        {/* loading region foreground */}
        <rect
          x={xMax}
          y={0}
          width={fullWidth}
          height={height}
          opacity={0.7}
          fill={'#cccccc'}/>
      </g>)
  }
}
