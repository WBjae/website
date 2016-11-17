import WBDataModel from './WBDataModel';
import { toWormBaseURL } from '../Utils';

/*
  handles data fetchin and coordinates conversion for CDS and protein domains,
  which are specific to a gene
*/
export default class GeneModel extends WBDataModel {

  constructor(geneId, alignedDNAPromise, alignedProteinPromise) {
    super();
    this.geneId = geneId;
    this.alignedDNAPromise = alignedDNAPromise;
    this.alignedProteinPromise = alignedProteinPromise;
  }

  getSummary() {
    return Promise.all([this.getSpecies(), this.getName()]).then(([species, name]) => {
      return {
        name: name,
        species: species
      }
    });
  }

  /* species */
  getSpecies() {
    return this.alignedDNAPromise.then((data) => {
      return data.species;
    });
  }

  /* name */
  getName() {
    const url = this._urlFor(`gene/${this.geneId}/overview`, {
      'content-type': 'application/json'
    }, {
      pathPrefix: '/rest/widget/'
    });

    return this._getOrFetch('_gene_overview', url).then((data) => {
      return (data.fields.name.data || {}).label;
    });
  }


  /*  CDS related */

  getAlignedCDSs(){
    return this.getCDSs().then((cdss) => {
      const coordsPromises = cdss.map((e) => this.toAlignedCDSCoords(e));
      return Promise.all(coordsPromises);
    });
  }

  getCDSs() {
    const url = this._urlFor('overlap/id/' + this.geneId, {
      feature: 'cds'
    });

    return Promise.all([this._getOrFetch('_cds', url), this.alignedDNAPromise])
      .then(([data, alignedDNA]) => {
        return data.filter((cds) => cds.protein_id === alignedDNA.protein_id);
      })
      .then((data) => this._parseCoords(data));
  }

  // get coordinate relative to the coding sequence
  getCDSCoords(coords) {
    return this.getCDSs().then((data) => {

      if (!this._splicedCoordConverter){
        this._splicedCoordConverter =  this._createSplicedCoordConverter(data);
      }

      const start = this._splicedCoordConverter.convert(coords.start);
      const end = this._splicedCoordConverter.convert(coords.end - 1);  // end coord here is considered outside side of CDS, would have getting undefined
      return coords.strand > 0 ? {
        ...coords,
        start: start,
        end: end + 1,  // 1-based end
      } : {
        ...coords,
        start: end,
        end: start + 1  // 1-based end
      };
    });
  }

  toAlignedCDSCoords(coords) {

    return this.alignedDNAPromise.then((data) => {
      if (!this._alignedCDSCoordConverter){
        const fakeStopCodon = ' '.repeat(3); // to correct the cDNA sequence to match the model
        this._alignedCDSCoordConverter = this._createAlignedCoordConverter(data.align_seq + fakeStopCodon);
      }
    })
    .then(() => {
      return this.getCDSCoords(coords);
    })
    .then((relativeCoords) => {
      return {
        ...coords,
        start: this._alignedCDSCoordConverter.convert(relativeCoords.start),
        end: this._alignedCDSCoordConverter.convert(relativeCoords.end)
      };
    });

  }


  /* Protein related */

  getAlignedDomains() {
    return this.getDomains().then((domains) => {
      const coordsPromises = domains.map((d) => this.toAlignedProteinCoords(d));
      return Promise.all(coordsPromises);
    })
  }

  getDomains() {
    return this.alignedProteinPromise.then((data) => {
      const url = this._urlFor('overlap/translation/' + data.protein_id, {
        type: 'pfam'
      });

      return this._getOrFetch('_domains', url)
        .then((data) => this._parseCoords(data).map((d) => this._formatDomain(d)));
    });
  }

  _formatDomain(domainData) {
    const {id, type} = domainData;
    return {
      ...domainData,
      link: type === 'Pfam' ? `http://pfam.xfam.org/family/${id}` : null,
    };
  }

  toAlignedProteinCoords(coords) {
    return this.alignedProteinPromise.then((data) => {
      if (!this._alignedProteinCoordConverter){
        const fakeStopCodon = ' ';
        this._alignedProteinCoordConverter = this._createAlignedCoordConverter(data.align_seq + fakeStopCodon);
      }
    })
    .then(() => {
      return {
        ...coords,
        start: this._alignedProteinCoordConverter.convert(coords.start),
        end: this._alignedProteinCoordConverter.convert(coords.end)
      };
    });

  }

  getAlignedProteinLength() {
    return this.alignedProteinPromise.then((data) => data.align_seq.length);
  }

  /* Variation related */
  getAlignedVariations(source) {
    return this.getVariations(source).then((variations) => {
      const coordsPromises = variations.map((v) => this.toAlignedProteinCoords(v));
      return Promise.all(coordsPromises);
    });
  }

  getVariations(source) {
    if (source === 'wormbase') {
      return this._getVariationsWB();
    } else if (source === 'ensembl') {
      return this._getVariationsEnsembl();
    }
  }

  _getVariationsWB() {
    return this.alignedProteinPromise.then((data) => {
      // const url = this._urlFor(`gene/${data.id}/alleles_other`, {
      //   'content-type': 'application/json'
      // }, {
      //   pathPrefix: '/rest/field'
      // });
      const url = this._urlFor(`gene/${data.id}/genetics`, {
        'content-type': 'application/json'
      }, {
        pathPrefix: '/rest/widget/'
      });

      return this._getOrFetch('_variations_wb', url)
        .then((data) => {
          const variationData = data.fields.alleles.data;
          return this._formatVariationWB(variationData);
        });
    });
  }

  _getVariationsEnsembl() {
    return this.alignedProteinPromise.then((data) => {
      console.log('aligned protein promise')
      const proteinId = data.protein_id;
      const url = this._urlFor(`overlap/translation/${proteinId}`, {
        feature: 'transcript_variation',
        type: 'missense_variant',
//        'content-type': 'application/json'
      }, {
        pathPrefix: '/rest/ensembl/'
      });

      return this._getOrFetch('_variations_ensembl', url)
        .then((data) => {
          return this._formatVariationEnsembl(data);
        });
    });
  }

  _formatVariationWB(variationData) {
    const parsedData = (variationData || []).filter((dat) => {
      return dat.aa_position || dat.aa_position === 0;
    }).map((dat) => {
      const aa_position = parseInt(dat.aa_position);
      const substitution = dat.composite_change[0].match(/(\w+?)\d+(\w+)/);
      const [,before, after] = substitution;
      return {
        ...dat,
        label: dat.variation.label,
        substitution: {
          before,
          after,
          aa_position: dat.aa_position
        },
        types: [].concat(dat.molecular_change, dat.effects),
        phenotypesPromise: this._getVariationPhenotypes(dat.variation.id, dat),
        link: toWormBaseURL(dat.variation),
        start: aa_position - 1,  // 0 based start coord
        end: aa_position // 1 based end coord
      }
    });
    return parsedData;
  }

  _formatVariationEnsembl(variationData) {
    const parsedData = (variationData || []).map((dat) => {
      const {start, end, id} = dat;
      const dbSnpId = id.match(/rs(\d+)$/)[1];
      const [before, after] = dat.residues.split('/');
      return {
//        ...dat,
        label: id,
        substitution: {
          before: before,
          after: after,
          aa_position: start // one based
        },
        types: ['Missense'],
        link: `http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=${dbSnpId}`,
        start: start - 1,  // 0 based start coord
        end: end // 1 based end coord
      }
    });
    return parsedData;
  }

  _getVariationPhenotypes(variationId, {phen_count}) {
    if (phen_count !== 0 ) {
      const url = this._urlFor(`variation/${variationId}/phenotypes`, {
        'content-type': 'application/json'
      }, {
        pathPrefix: '/rest/widget/'
      });

      return this._remoteFetch(url)
        .then((data) => {
          return {
            phenotypes: data.fields.phenotypes.data,
            phenotypes_not_observed: data.fields.phenotypes_not_observed.data,
          };
        });

    } else {
      return new Promise({
        phenotypes: [],
        phenotypes_not_observed: []
      })
    }
  }

  /* helpers used for coordinates converstion, etc */

  // use 0 based start and 1 based end for easier use with Array and for computing length
  _parseCoords(data=[]) {
    return data.map((coords) => {
      const {start, end} = coords;
      return {
        ...coords,
        start: start - 1,  // 0 based start
        end: end   // 1 based end
      }
    });
  }


  // used to convert to coordinates relative to gapped sequence generated during alignment
  _createAlignedCoordConverter(alignedSeq) {
    const _coordsMap = [];
    for (let i=0; i<alignedSeq.length; i++){
      if (alignedSeq[i] !== '-'){
        _coordsMap.push(i);
      }
    }
    _coordsMap.push(alignedSeq.length);  // for end coordinate

    return {
      convert: (coord) => _coordsMap[coord]
    };
  }

  // used to convert to coordinates relative to spliced transcript
  _createSplicedCoordConverter(cdss) {

    const _prefixLengths = [0];
    cdss.reduce((prev, segment, index) => {
      const segmentLength = segment.end - segment.start;
      const prefixLength = prev + segmentLength;
      _prefixLengths.push(prefixLength);

      return prefixLength;
    }, _prefixLengths[0]);

    const strand = cdss[0].strand;

    const _getSplicedCoord = (coord) => {
      const index = cdss.findIndex((segment) => coord >= segment.start && coord < segment.end);
      if (index || index === 0) {
        // coord occurs on one of the CDSs
        // offset to the start of the CDS (start in the biological sense)
        const offset = strand > 0 ? coord - cdss[index].start : cdss[index].end - coord - 1;
        return _prefixLengths[index] + offset;
      }
    }

    return {
      convert: _getSplicedCoord
    };
  }
}
