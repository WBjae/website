import { connect } from 'react-redux';
import MiniMap from '../components/MiniMap';
import { requestPanTo } from '../actions';
import { getFullWidth, getInternalSVGxMin, getInternalSVGxMax } from '../selectors';

const mapStateToProps = (state) => ({
  xMin: getInternalSVGxMin(state),
  xMax: getInternalSVGxMax(state),
  fullWidth: getFullWidth(state)
});

const mapDispatchToProps = (dispatch) => ({
  onUpdate: (center) => dispatch(requestPanTo(center))
});

export default connect(mapStateToProps, mapDispatchToProps)(MiniMap)
