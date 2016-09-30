import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Popover, Overlay } from 'react-bootstrap';

export default class Tooltip extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      left: NaN,
      top: NaN
    };
  }

  static propTypes = {
    target: React.PropTypes.object,
    container: React.PropTypes.object,
    title: React.PropTypes.string,
    content: React.PropTypes.string
  }

  componentDidMount() {
    this.setState({
      ...this._getOrigin()
    });
  }

  componentWillReceiveProps(nextProps) {
//  componentDidUpdate() {
    this.setState({
      ...this._getOrigin()
    })
  }

// point on target
  _getPointer = () => {
    // take the intersecting rectangle of target and container
    const containerBox = this.props.container.getBoundingClientRect();
    const targetBox = this.props.target.getBoundingClientRect();
    const newBox = this._getIntersectRect(targetBox, containerBox);
    const {left, top, width} = newBox;

    return {
      left: left + width/2,
      top: top
    }
  }

  _getIntersectRect = (rect1, rect2) => {
    const left = Math.max(rect1.left, rect2.left);
    const top = Math.max(rect1.top, rect2.top);

    const _getRight = (rect) => {
      return rect.left + rect.width;
    }
    const _getBottom = (rect) => {
      return rect.top + rect.height;
    }

    const right = Math.min(_getRight(rect1), _getRight(rect2));
    const bottom = Math.min(_getBottom(rect1), _getBottom(rect2));

    const intersect = {
      left,
      top,
      width: right - left,
      height: bottom - top
    };
    return intersect;
  }

  // tooltip origin (relative to container element)
  _getOrigin = () => {
    if (!this._tooltipDOMNode) return;

    const {left, top} = this._getClientOrigin();
    const containerBox = this.props.container.getBoundingClientRect();
    const targetBox = this.props.target.getBoundingClientRect();
    const containerLeft = containerBox.left;
    const containerTop = containerBox.top;
    return {
      left: left - containerLeft,
      top: top - containerTop + targetBox.bottom - targetBox.top
    };
  }

  // get tooltip origin relative to the viewport
  _getClientOrigin = () => {
    if (!this._tooltipDOMNode) return;

    const tooltipNode = this._tooltipDOMNode;
    //this.refs.tooltipContainer.getDOMNode();
    const width = tooltipNode.clientWidth;
    const height = tooltipNode.clientHeight;

    const pointer = this._getPointer();
    return {
      left: pointer.left - width/2,
      top: pointer.top
    }
  }

  render() {
    const {left, top} = this.state;

    return this.props.content && this.props.target ?
        <div
          style={{
            left: left,
            top: top,
            visibile: isNaN(left) || isNaN(top) ? 'hidden' : 'visible',  // use visibility:hidden instead of display:none to allow dimension of children nodes to be measured
            position: 'absolute',
            backgroundColor: 'red',
          }}>
          <Popover
            ref={(component) => this._tooltipDOMNode = ReactDOM.findDOMNode(component)}
            title={this.props.title}
            placement="bottom">
          <div style={{
            width: 180,
            maxHeight: 120,
            overflow: 'hidden'}}
            //dangerouslySetInnerHTML={{__html: this.props.content}}
            >
            {
              this.props.content
            }
          </div>
          </Popover>
        </div>
        : null;
  }

}
