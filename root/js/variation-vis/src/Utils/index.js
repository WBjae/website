import BinnedLoader from './BinnedLoader';
import BinHelper from './BinHelper';
import SubstitutionHelper from './SubstitutionHelper';
import CoordinateMappingHelper  from './CoordinateMappingHelper';


export const DataLoader = {
  BinnedLoader,
  BinHelper
}

export {
  SubstitutionHelper
}

export {
  CoordinateMappingHelper
}

export const TRACK_HEIGHT = 20;

export function toWormBaseURL({taxonomy, class: wormbaseClass, id}) {
  const speciesScopedClasses = new Set(['variation', 'gene']);
  if (speciesScopedClasses.has(wormbaseClass)) {
    return `/species/${taxonomy}/${wormbaseClass}/${id}`;
  }
}