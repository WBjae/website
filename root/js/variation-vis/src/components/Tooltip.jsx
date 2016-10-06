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
      justifyContent: 'center',
      width: 200,
      backgroundColor: 'red'
    };
    const tooltipStyle = {
      flex: 'none',
    };

    return this.props.targetBox.left || this.props.targetBox.left === 0 ? (
      <div style={targetBoxStyle}>
        <div
          style={tooltipStyle}>
          <Popover
            ref={(component) => this._tooltipDOMNode = ReactDOM.findDOMNode(component)}
            title={this.props.title}
            placement="right">
          <div style={{
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
    ) : null;
  }

}
