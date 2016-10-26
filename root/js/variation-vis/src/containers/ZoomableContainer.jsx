import { connect } from 'react-redux'
import Zoomable from '../components/Zoomable';
import {startTransform, endTransform} from '../actions';


const mapDispatchToProps = (dispatch) => ({
  onTransformStart: () => {
    dispatch(startTransform());
  },
  onTransformEnd: (transform) => {
    dispatch(endTransform(transform));
  }
});

const mapStateToProps = (state) => {
  return {};
}

const ZoomableContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Zoomable);

export default ZoomableContainer;
