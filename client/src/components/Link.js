import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

const resourcePages = new Set([
  'analysis',
  'author',
  'gene_class',
  'laboratory',
  'molecule',
  'motif',
  'paper',
  'person',
  'reagents',
  'disease',
  'transposon_family',
  'wbprocess',
]);

function buildUrl(tag) {
  const {id} = tag;
  if (resourcePages.has(tag.class)) {
    return `/search/${tag.class}/${id}`;
  } else {
    return `/species/all/${tag.class}/${id}`;
  }
}

class Link extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    "class": PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
  };

  render() {
    return (
      <a href={buildUrl(this.props)}>
        <span className={this.props.classes.linkLabel}>{this.props.label}</span>
      </a>
    );
  }
}

const styles = {
  linkLabel: {},
};

export default withStyles(styles)(Link);

export {
  buildUrl,
};
