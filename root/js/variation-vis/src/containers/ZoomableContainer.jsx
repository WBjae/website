import { connect } from 'react-redux'
import Zoomable from '../components/Zoomable';
import { startTransform, endTransform, updateTransform, requestReset } from '../actions';


const mapDispatchToProps = (dispatch) => ({
  onTransformStart: () => {
    dispatch(startTransform());
  },
  onTransformUpdate: (transform) => {
    dispatch(updateTransform(transform))
  },
  onTransformEnd: (transform) => {
    dispatch(endTransform(transform));
  },
  onResetRequest: () => {
    dispatch(requestReset())
  },
});

const mapStateToProps = (state) => {
  return {
    translateX: state.viewer._translateX,
    scaleX: state.viewer._scaleX,
  };
}

const ZoomableContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Zoomable);

export default ZoomableContainer;
