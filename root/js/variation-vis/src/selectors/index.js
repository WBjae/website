import { computeSVGxMin, computeSVGxMax, computeSVGxCenter,
  getFullWidth as _getFullWidth
} from '../reducers/viewer';

export const getFullWidth = (state) => {
  return _getFullWidth(state.viewer);
};

export const getSVGxMin = (state) => {
  const {translate, scale} = state.viewer;
  return computeSVGxMin(translate, scale);
}

export const getSVGxMax = (state) => {
  const {translate, scale} = state.viewer;
  const fullWidth = getFullWidth(state);
  return computeSVGxMin(translate, scale, fullWidth);
}

export const getInternalSVGxMin = (state) => {
  const {_translateX, _scaleX} = state.viewer;
  return computeSVGxMin(_translateX, _scaleX);
}

export const getInternalSVGxMax = (state) => {
  const {_translateX, _scaleX} = state.viewer;
  const fullWidth = getFullWidth(state);
  return computeSVGxMax(_translateX, _scaleX, fullWidth);
}

export const getInternalSVGxCenter = (state) => {
  const {_translateX, _scaleX} = state.viewer;
  const fullWidth = getFullWidth(state);
  return computeSVGxCenter(_translateX, _scaleX, fullWidth);
}
