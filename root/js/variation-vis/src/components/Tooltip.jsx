import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Popover, Overlay } from 'react-bootstrap';

export default class Tooltip extends React.Component {

  constructor(props) {
    super(props);
  }

  static propTypes = {
    targetBox: React.PropTypes.shape({
      top: React.PropTypes.number,
      left: React.PropTypes.number,
      width: React.PropTypes.number,
      height: React.PropTypes.number,
    }).isRequired,
    getViewCoords: React.PropTypes.func.isRequired,
    title: React.PropTypes.string,
    content: React.PropTypes.string
  }

  render() {
    const targetBoxStyle = {
      ...this.props.targetBox,
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
    };
    const tooltipStyle = {
      flex: 'none',
    };
    return (
      <div style={targetBoxStyle}>
        <div
          style={tooltipStyle}>
          <Popover
            ref={(component) => this._tooltipDOMNode = ReactDOM.findDOMNode(component)}
            title={this.props.title}
            placement="right">
          <div style={{
              width: 180,
              maxHeight: 120,
              overflow: 'hidden'
            }}
            //dangerouslySetInnerHTML={{__html: this.props.content}}
            >
            {
              this.props.content
            }
          </div>
          </Popover>
        </div>
      </div>
      )
  }

}
