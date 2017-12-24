import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import Hidden from 'material-ui/Hidden';

const drawerWidth = 240;

const styles = theme => ({
  root: {
    width: '100%',
    /* marginTop: theme.spacing.unit * 3,*/
    zIndex: 1,
    overflow: 'hidden',
  },
  appFrame: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  appBar: {
    position: 'absolute',
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  'appBar-left': {
    marginLeft: drawerWidth,
  },
  'appBar-right': {
    [theme.breakpoints.up('md')]: {
      marginRight: drawerWidth,
    },
  },
  navIconHide: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  drawerHeader: theme.mixins.toolbar,
  drawerPaper: {
    width: 250,
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.up('md')]: {
      width: drawerWidth,
      position: 'relative',
      height: '100%',
    },
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
    display: 'flex',
    /* padding: theme.spacing.unit * 3,*/
    /* marginTop: 56,*/
    /* height: 'calc(100% - 56px)',
     * [theme.breakpoints.up('sm')]: {
     *   height: 'calc(100% - 64px)',
     *   marginTop: 64,
     * },*/
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
});

class ResponsiveDrawer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileOpen: false,
    };
  }

  handleDrawerToggle = () => {
    this.setState({ mobileOpen: !this.state.mobileOpen });
  };

  render() {
    const { classes, anchor, drawerContent, mainContent, mainHeader } = this.props;

    const drawer = (
      <div
        className={classes.drawerPaper}
      >
        {drawerContent}
      </div>
    );

    const permanentDrawer = (
      <Hidden mdDown implementation="css">
        {drawer}
      </Hidden>
    );

    return (
      <div className={classes.root}>
        <div className={classes.appFrame}>
          <Hidden mdUp>
            <Drawer
              type="temporary"
              anchor={anchor}
              open={this.state.mobileOpen}
              classes={{
                paper: classes.drawerPaper,
              }}
              onRequestClose={this.handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
            >
              {drawer}
            </Drawer>
          </Hidden>
          {anchor === 'left' ? permanentDrawer : null}
          <main className={classes.content}>
            {mainContent}
          </main>
          {anchor === 'right' ? permanentDrawer : null}
          <div className={classNames(classes.appBar, classes[`appBar-${anchor}`])}>
            {mainHeader}
          </div>
        </div>
      </div>
    );
  }
}

ResponsiveDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  anchor: PropTypes.string,
  drawerContent: PropTypes.element,
  mainContent: PropTypes.element,
};

export default withStyles(styles, { withTheme: true })(ResponsiveDrawer);

export {
  styles,
  ResponsiveDrawer
}
