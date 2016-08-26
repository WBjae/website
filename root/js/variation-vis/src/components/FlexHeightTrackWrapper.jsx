import React from 'react';

export default class FlexHeightTrackWrapper extends React.Component {
  static propTypes = {
    currentHeight: React.PropTypes.number,
    nextHeightFunction: React.PropTypes.func,
    onHeightChange: React.PropTypes.func,
  };

  componentWillMount() {
    this._updateTrackHeight();
  }

  componentWillReceiveProps() {
    this._updateTrackHeight();
  }

  _updateTrackHeight = () => {
    const {nextHeightFunction, onHeightChange, currentHeight} = this.props;
    const newTrackHeight = nextHeightFunction();
    if (newTrackHeight !== currentHeight) {
      console.log(`new Height: ${newTrackHeight}, currentHeight ${currentHeight}`)
      onHeightChange(newTrackHeight);
    }

  }
  render() {
    return (
      <g>
      {
        this.props.children
      }
      </g>
    )
  }
}
