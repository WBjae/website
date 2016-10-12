import React from 'react';
import { Button, ButtonGroup, ButtonToolbar, Glyphicon, Label } from 'react-bootstrap';
import { capitalize, formatSpeciesName } from '../Utils';

export default class TrackLabel extends React.Component {

  static propTypes = {
    index: React.PropTypes.number, //.isRequired,
    name: React.PropTypes.string,
    labelPrefix: React.PropTypes.string,
    species: React.PropTypes.string,
    y: React.PropTypes.number,
    onTrackDescriptionRequest: React.PropTypes.func,
    active: React.PropTypes.bool,
  }

  handleClick = () => {
    this.props.onTrackDescriptionRequest(this.props.index);
  }

  _renderSpeciesLabel(species) {
    if (species) {
      const speciesName = formatSpeciesName(species);
      return <Label style={{backgroundColor: this._getSpeciesColor(species)}}>
          {speciesName}
        </Label>;
    } else {
      return null;
    }
  }

  _getSpeciesColor = (species) => {
    if (species === 'homo_sapiens') {
      return "#5bc0de";
    } else if (species === 'caenorhabditis_elegans') {
      return '#756bb1';
    } else {
      return '#777'
    }
  }

  render() {
    const style = {
      position: 'absolute',
      top: this.props.y,
      left: 0,
      padding: '5px 10px',
      backgroundColor: this.props.active ? "#f7f7f9" : "transparent"
    };

    const buttonWrapperStyle = {
      minWidth: 40,
      display: 'table-cell',
      verticalAlign: 'middle'
    };

    const labelWrapperStyle = {
      width: '80%',
      paddingRight: 10,
      textAlign: 'right',
      display: 'table-cell',
      verticalAlign: 'middle'
    };

    return <div style={style}>
      <div style={labelWrapperStyle}>
        {this._renderSpeciesLabel(this.props.species)}
        <h6>
        {this.props.labelPrefix ? `${this.props.labelPrefix}: ` : null}
        {this.props.name}
        </h6>
      </div>
      <div style={buttonWrapperStyle}>
      {
        this.props.onTrackDescriptionRequest ? <Button bsStyle="default"
          onClick={this.handleClick}>
          <Glyphicon glyph="question-sign"/>
        </Button> : null
      }
      </div>
    </div>
  }

}
