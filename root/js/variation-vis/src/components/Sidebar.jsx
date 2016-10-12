import React, { Component } from "react";
import { Button } from 'react-bootstrap';

export default class Sidebar extends React.Component {
  static propTypes = {
    onCancel: React.PropTypes.func,
  }

  _handleClose = () => {
    this.props.onCancel();
  }

  render() {

    return (
      <div>
        <Button onClick={this._handleClose}>Close</Button>
        {this.props.children}
      </div>);
  }
};
