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

export function capitalize(text){
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatSpeciesName(speciesName) {
  const [genus, species, bioproject] = speciesName.split(/\s|_/);
  if (bioproject) {
    const genusString = capitalize(genus.charAt(0));
    return `${genusString}. ${species} (${bioproject})`;
  } else {
    const genusString = capitalize(genus);
    return `${genusString} ${species}`;
  }
}
