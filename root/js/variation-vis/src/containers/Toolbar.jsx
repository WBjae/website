import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, ButtonGroup, ButtonToolbar, Glyphicon,
  FormGroup,
  ControlLabel,
  FormControl } from 'react-bootstrap';
import { requestZoom, requestPan, requestReset } from '../actions';

class Toolbar extends Component {
  static propTypes = {
    onZoomRequest: React.PropTypes.func,
    onPanRequest: React.PropTypes.func,
    onResetRequest: React.PropTypes.func,
  };

  render() {
    return (
      <div style={{display: 'inline-block'}}>
        <ButtonToolbar>
          <ButtonGroup bsSize="large">
            <Button onClick={() => this.props.onZoomRequest(2)}><Glyphicon glyph="zoom-in" /></Button>
            <Button onClick={() => this.props.onZoomRequest(0.5)}><Glyphicon glyph="zoom-out" /></Button>
            <Button onClick={() => this.props.onPanRequest(-0.5)}><Glyphicon glyph="chevron-left" /></Button>
            <Button onClick={() => this.props.onPanRequest(0.5)}><Glyphicon glyph="chevron-right" /></Button>
         </ButtonGroup>
          <ButtonGroup>
            <Button onClick={() => this.props.onResetRequest()} bsSize="large" style={{fontSize:14}}>Reset</Button>
          </ButtonGroup>
        </ButtonToolbar>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    translateX: state.viewer._translateX,
    scaleX: state.viewer._scaleX,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onZoomRequest: (zoomBy) => dispatch(requestZoom(zoomBy)),
  onPanRequest: (panBy) => dispatch(requestPan(panBy)),
  onResetRequest: () => dispatch(requestReset()),
});

const ToolbarContainer = connect(mapStateToProps, mapDispatchToProps)(Toolbar);
export default ToolbarContainer;
