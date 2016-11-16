import "babel-polyfill";
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import jquery from 'jquery';
import { Button, ButtonGroup, ButtonToolbar, Glyphicon,
  FormGroup,
  ControlLabel,
  FormControl } from 'react-bootstrap';
import Viewer from './components/Viewer';
import TrackLegendModal from './components/TrackLegendModal';
import Sidebar from './components/Sidebar';
import TrackLabel from './components/TrackLabel';
import TrackLegend from './components/TrackLegend';
import BasicTrack, { VariationTrack, AlignmentTrack, ProteinConservationTrack } from './Tracks';
import ColorScheme, { COLORS } from './Utils/ColorHelper';
import HomologyModel from './Models/HomologyModel';
require('./main.less');

const DEFAULT_SVG_INTERNAL_WIDTH = 100;
const DEFAULT_SVG_HEIGHT = 600;  // use the same vertical coordinate system for internal vs apparent

class App extends React.Component {

  static propTypes = {
    geneID: React.PropTypes.string.isRequired,
    targetSpecies: React.PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      viewWidth: 500,
      // track data
      tracks: [],
      activeTrackModal: null,
      layout: 'mirror'

     };
  }

  componentDidMount() {
    this._getData(this.props.geneID, this.props.targetSpecies);
    // setTimeout(() =>
    //   this._setupZoomPan()
    //   , 5000);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.geneID !== nextProps.geneID ||
      this.props.targetSpecies !== nextProps.targetSpecies) {
      this._getData(nextProps.geneID, nextProps.targetSpecies);
    }
  }

  _getData(geneID, species) {
    const model = new HomologyModel(geneID, species);

    this.setState({
      tracks: []
    });

    const referencePromise = model.getAlignedDNA().then((data) => {
      const referenceSequence = data.source.align_seq;
      this._viewerComponent.setup({
        referenceSequenceLength: referenceSequence.length  // set the width of svg proportional to length of reference sequence
      });

      this._setTrackState({
        id: 'sourceDNA',
        name: `Transcript: ${data.source.protein_id}`,
        sequence: referenceSequence
      });

      // show homolog sequence
      this._setTrackState({
        id: 'targetDNA',
        name: `Transcript: ${data.target.protein_id}`,
        sequence: data.target.align_seq
      });
    });

    // load CDS on DNA tracks
    const cdsColorScheme = new ColorScheme((dat, index) => index % 2, {
      0: {
        colorId: COLORS.TEAL,
        description: 'CDS'
      },
      1: {
        colorId: COLORS.PURPLE,
        description: 'CDS'
      }
    });
    model.sourceGeneModel.then((sourceGeneModel) => {
      return Promise.all([sourceGeneModel.getSummary(), sourceGeneModel.getAlignedCDSs()]);
    }).then(([summary, cdss]) => {
      this._setTrackState({
        id: 'sourceDNA',
        data: cdss.map((cds, i) => {
          return {...cds, tip: 'CDS' + i};
        }),
        ignoreShortSegments: true,
        colorScheme: cdsColorScheme,
        labelPrefix: 'Transcript',
        ...summary
      });
    });
    model.targetGeneModel.then((targetGeneModel) => {
      return Promise.all([targetGeneModel.getSummary(), targetGeneModel.getAlignedCDSs()]);
    }).then(([summary, cdss]) => {
      this._setTrackState({
        id: 'targetDNA',
        data: cdss.map((cds, i) => {
          return {...cds, tip: 'CDS' + i};
        }),
        ignoreShortSegments: true,
        colorScheme: cdsColorScheme,
        labelPrefix: 'Transcript',
        ...summary
      });
    });

    // load protein sequence track
    model.getAlignedSourceProtein().then((data) => {
      this._setTrackState({
        id: 'sourceProtein',
        name: `Protein: ${data.protein_id}`,
        sequence: data.align_seq,
        trackComponent: AlignmentTrack
      });
    });
    model.getAlignedTargetProtein().then((data) => {
      this._setTrackState({
        id: 'targetProtein',
        name: `Protein: ${data.protein_id}`,
        sequence: data.align_seq,
        trackComponent: AlignmentTrack
      });
    });

    // load protein domain tracks
    const domainColorScheme = AlignmentTrack.enhanceColorScheme(new ColorScheme((dat, index) => {
      return {
        key: dat.id,
        description: dat.description
      };
    }));
    model.sourceGeneModel.then((sourceGeneModel) => {
      return Promise.all([sourceGeneModel.getSummary(), sourceGeneModel.getAlignedDomains()]);
    }).then(([summary, domains]) => {
      this._setTrackState({
        id: 'sourceProtein',
        data: domains.map((d) => {
          return {
            ...d,
            tip: d.description || ''
          };
        }),
        colorScheme: domainColorScheme,
        labelPrefix: 'Protein',
        ...summary
      });
    });
    model.targetGeneModel.then((targetGeneModel) => {
      return Promise.all([targetGeneModel.getSummary(), targetGeneModel.getAlignedDomains()]);
    }).then(([summary, domains]) => {
      this._setTrackState({
        id: 'targetProtein',
        data: domains.map((d) => {
          return {
            ...d,
            tip: d.description || ''
          };
        }),
        colorScheme: domainColorScheme,
        labelPrefix: 'Protein',
        ...summary
      });
    });

    // load concervation track
    Promise.all([model.getAlignedSourceProtein(), model.getAlignedTargetProtein()]).then(([sourceData, targetData]) => {
      const sourceSequence = sourceData.align_seq;
      const targetSequence = targetData.align_seq;

      // placeholder
      this._setTrackState({
        id: 'conservation',
        name: 'Protein Conservation',
      });

      setTimeout(() => {
        this._setTrackState({
          id: 'conservation',
          sequenceLength: sourceSequence.length,
          sequenceList: [sourceSequence, targetSequence],
          trackComponent: ProteinConservationTrack,
          name: 'Protein Conservation',
        });
      }, 3000);

    });

    // load variation tracks
    model.sourceGeneModel.then((sourceGeneModel) => {
      const variationDatabase = this.props.geneID.match(/^WB.*/) ?
        'wormbase' : 'ensembl';
      const variationsPromise = sourceGeneModel.getAlignedVariations(variationDatabase);
      const proteinLengthPromise = sourceGeneModel.getAlignedProteinLength();
      const speciesPromise = sourceGeneModel.getSummary();
      return Promise.all([speciesPromise, variationsPromise, proteinLengthPromise]);
    }).then(([summary, variations, proteinLength]) => {
      const trackData = {
        id: 'sourceVariation',
        sequenceLength: proteinLength,
        data: variations,
        trackComponent: VariationTrack,
        labelPrefix: 'Variations',
        ...summary
      };
      this._setTrackState(trackData);
      const phenotypesPromises = variations.map((dat) => dat.phenotypesPromise);
      return Promise.all([trackData, ...phenotypesPromises]);
    }).then(([trackData, ...variationPhenotype]) => {
      const variations = trackData.data;
      const newVariations = variations.map((dat, index) => {
        const {phenotypes, phenotypes_not_observed} = variationPhenotype[index];
        return {
          ...dat,
          phenotypes: phenotypes,
          phenotypes_not_observed: phenotypes_not_observed
        }
      });
      this._setTrackState({
        ...trackData,
        data: newVariations,
      });
    });

    /* human variations */
    model.targetGeneModel.then((targetGeneModel) => {
      const variationDatabase = this.props.targetSpecies === 'homo_sapiens' ?
        'ensembl' : 'wormbase';
      const variationsPromise = targetGeneModel.getAlignedVariations(variationDatabase);
      const proteinLengthPromise = targetGeneModel.getAlignedProteinLength();
      const speciesPromise = targetGeneModel.getSummary();
      return Promise.all([speciesPromise, variationsPromise, proteinLengthPromise]);
    }).then(([summary, variations, proteinLength]) => {
      const trackData = {
        id: 'targetVariation',
        sequenceLength: proteinLength,
        data: variations,
        trackComponent: VariationTrack,
        labelPrefix: 'Variations',
        ...summary
      };
      this._setTrackState(trackData);
    })
  }

  _setTrackState(data, callback) {

    // this returns a new set of track data, without modifying the original
    this.setState((prevState) => {
      const foundIndex = prevState.tracks.findIndex((trackData) => {
        return trackData.id === data.id;
      });
      const index = foundIndex > -1 ? foundIndex : prevState.tracks.length;

      const newTrackData = {
        ...prevState.tracks[index],
        ...data
      };

      const newTracks = prevState.tracks.slice(0);
      newTracks[index] = newTrackData;

      return {
        tracks: newTracks
      }
    }, callback);

  }

  _getOrderedTracks() {
    const _getTrackIndex = (trackName) => {
      const tracks = this.state.layout === 'mirror' ?
        ['sourceDNA', 'sourceVariation', 'sourceProtein', 'conservation',
          'targetProtein', 'targetVariation', 'targetDNA'] :
        ['sourceDNA', 'targetDNA', 'sourceVariation', 'targetVariation', 'sourceProtein', 'conservation',
          'targetProtein'];
      return tracks.findIndex((knowTrackName) => knowTrackName === trackName);
    }

    const tracks = this.state.tracks.filter((trackData) => {
      const index = _getTrackIndex(trackData.id);
      return index > -1;
    }).sort((trackDataA, trackDataB) => {
      return _getTrackIndex(trackDataA.id) - _getTrackIndex(trackDataB.id);
    });

    return tracks;
  }

  _getTrackYPosition(trackIndex, trackYOffset=50) {
    const tracksAbove = this._getOrderedTracks().slice(0, trackIndex);
    const yPosition =  tracksAbove.reduce((accumulator, trackData) => {
      return accumulator + (trackData.outerHeight || 60);
    }, trackYOffset);

    return yPosition;
  }

  _getTrackColorScheme(trackData) {
    if (trackData.colorScheme){
      return trackData.colorScheme;
    } else {
      const TrackComponent = trackData.trackComponent || BasicTrack;
      return typeof TrackComponent.getDefaultColorScheme === 'function' ?
        TrackComponent.getDefaultColorScheme() : null;
    }
  }

  getTrackHeightChangeHandler = (trackId) => {
    return (newHeight) => {
      this._setTrackState({
        id: trackId,
        outerHeight: newHeight
      });
    };
  }

  getTrackDescriptionRequestHandler = (trackId) => {
    return () => {
      this.setState({
        activeTrackModal: trackId
      }, () => this._viewerComponent.updateDimensions());
    }
  }

  getTrackDescriptionCancelHandler = (trackId) => {
    return () => {
      this.setState({
        activeTrackModal: null
      }, () => this._viewerComponent.updateDimensions());
    }
  }

  renderToolbar = () => {
    return (<div style={{margin: "20px auto 20px 250px", height: 30}}>

      <form className="form-inline">
        <div style={{display: 'inline-block'}}>
          <ButtonToolbar>
            <ButtonGroup bsSize="large">
              <Button onClick={() => this._viewerComponent.getZoomHandler(2)()}><Glyphicon glyph="zoom-in" /></Button>
              <Button onClick={() => this._viewerComponent.getZoomHandler(0.5)()}><Glyphicon glyph="zoom-out" /></Button>
              <Button onClick={() => this._viewerComponent.getPanHandler(0.5)()}><Glyphicon glyph="chevron-left" /></Button>
              <Button onClick={() => this._viewerComponent.getPanHandler(-0.5)()}><Glyphicon glyph="chevron-right" /></Button>
           </ButtonGroup>
            <ButtonGroup>
              <Button onClick={() => this._viewerComponent.handleZoomPanReset()} bsSize="large" style={{fontSize:14}}>Reset</Button>
            </ButtonGroup>
          </ButtonToolbar>
        </div>
        <FormGroup bsClass="aaa form-group" controlId="formControlsSelect">
          <ControlLabel srOnly={true}>Select</ControlLabel>
          <FormControl
            onChange={(event) => this.handleLayoutChange(event)}
            componentClass="select" placeholder="select"
            style={{fontSize:14, height: 40}}>
            <option value="mirror">Mirror layout</option>
            <option value="pairwise">Pairwise layout</option>
          </FormControl>
        </FormGroup>
      </form>
    </div>);
  }

  renderTrackLabels() {
    return this._getOrderedTracks().map((trackData, index ) => {
      return <TrackLabel
        key={`track-label-${index}`}
        index={index}
        y={this._getTrackYPosition(index, 40)}
        {...trackData}
        active={this.state.activeTrackModal === trackData.id}
        onTrackDescriptionRequest={this.getTrackDescriptionRequestHandler(trackData.id)}/>
    });
  }

  renderTrackModal() {
    const trackIndex = this.state.tracks.findIndex((trackData) => {
      return trackData.id === this.state.activeTrackModal;
    });

    if (trackIndex > -1) {
      const trackData = this.state.tracks[trackIndex];
      const {name} = trackData;
      const colorScheme = this._getTrackColorScheme(trackData);
      return (<div className="track-label-sidebar">
        <Sidebar onCancel={this.getTrackDescriptionCancelHandler(trackData.id)}>
          <TrackLegend
            colorScheme={colorScheme}/>
        </Sidebar>
      </div>);
      return <TrackLegendModal
          name={name}
          colorScheme={colorScheme}
          onTrackDescriptionCancel={this.getTrackDescriptionCancelHandler(trackData.id)}/>;
    } else {
      return null
    }
  }

  handleLayoutChange = (event) => {
    const layoutName = event.target.value;
    this.setState({
      layout: layoutName
    });
  }


  // componentWillUpdate() {
  //   // this.svgElement.destroy();
  // }

  render() {
    const data1 = [
      {
        start: 100,
        end: 250,
        tip: 'Domain 1'
      },
      {
        start: 400,
        end: 450,
        tip: 'Domain 2'
      }
    ];

    const variations1 = [
      {
        start: 120,
        end: 140,
        tip: 'v1'
      },
      {
        start: 160,
        end: 170,
        tip: 'v2'
      },
      {
        start: 150,
        end: 151,
        tip: 'v3'
      },
      {
        start: 153,
        end: 154,
        tip: 'v4'
      }
    ]
    const sequence1 = 'MSVNDLQELIERRIPDNRAQLETSHANLQQVAAYCEDNYIQSNNKSAALEESKKFAIQALASVAYQINKMVTDLHDMLAL'
      + 'QTDKVNSLTNQVQYVSQVVDVHKEKLARREIGSLTTNKTLFKQPKIIAPAIPDEKQRYQRTPIDFSVLDGIGHGVRTSDP'
      + 'PRAAPISRATSSISGSSPSQFHNESPAYGVYAGERTATLGRTMRPYAPSIAPSDYRLPQVTPQSESRIGRQMSHGSEFGD'
      + 'HMSGGGGSGSQHGSSDYNSIYQPDRYGTIRAGGRTTVDGSFSIPRLSSAQSSAGGPESPTFPLPPPAMNYTGYVAPGSVV'
      + 'QQQQQQQMQQQNYGTIRKSTVNRHDLPPPPNSLLTGMSSRMPTQDDMDDLPPPPESVGGSSAYGVFAGRTESYSSSQPPS'
      + 'LFDTSAGWMPNEYLEKVRVLYDYDAAKEDELTLRENAIVYVLKKNDDDWYEGVLDGVTGLFPGNYVVPV*';

    const trackLabelColumnWidth = 200;

    const containerStyle = {
      // overflowX: 'scroll',
      // //padding: '0 5',
      // width: 400
      //width: this.state.viewWidth + trackLabelColumnWidth,
      height: DEFAULT_SVG_HEIGHT,
      // border:"1px solid black",
      position: "relative"
    }

//    console.log(this.state.tracks)

    const tracks = this._getOrderedTracks();

    return (
      <div className="bootstrap-style">
        {
          this.renderToolbar()
        }
        <div className="svg-browser-container" style={containerStyle}>
          {
            this.renderTrackModal()
          }
          <div className="track-label-column"
            style={{
              width: trackLabelColumnWidth,
              minHeight: 1,
              float: 'left',
              position: 'relative'
            }}>
            {
              this.renderTrackLabels()
            }
          </div>
          <div className="track-main-column">
          <Viewer ref={(component) => this._viewerComponent = component}
            style={{
              //left: trackLabelColumnWidth,
              //overflow: 'hidden',
              width: 'auto',
            }}>
            {
              tracks.map((trackData, index) => {
                const showTrack = trackData && (trackData.sequence || trackData.sequenceLength);
                const TrackComponent = trackData.trackComponent || BasicTrack;
//                const {index} = trackData; // note use the index contained in the data
                return showTrack ? <TrackComponent
                  {...trackData}
                  id={trackData.id}
                  index={index}
                  key={trackData.id}
                  tip={trackData.tip}
                  sequence={trackData.sequence}
                  sequenceLength={trackData.sequenceLength}
                  data={trackData.data}
                  ignoreShortSegments={trackData.ignoreShortSegments}
                  colorScheme={this._getTrackColorScheme(trackData)}
                  outerHeight={trackData.outerHeight}
                  onHeightChange={this.getTrackHeightChangeHandler(trackData.id)}
                  y={this._getTrackYPosition(index)}/> : null;
              })
            }
          </Viewer>
          </div>
        </div>
      </div>
    );
  }

}

class GeneSearch extends React.Component {
  static propTypes = {
    defaultGeneID: React.PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      partial: props.defaultGeneID,
      geneID: props.defaultGeneID,
      autocomplete: [],
      focus: true
    }
  }

  _handleButtonClick = () => {
    if (this.state.geneID !== this.state.partial) {
      this.setState((prevState) => {
        console.log(`gene id ${prevState.partial} is requested`);
        return {
          geneID: prevState.partial,
          focus: false
        };
      });
    }
  }

  _handleQueryChange = (event) => {
    const partial = event.target.value
    this.setState({
      partial: partial
    });
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
    }

    if (partial.length > 1) {
      this.timeoutID = setTimeout(() => {
        const autocompleteUrl = `/search/autocomplete/gene?term=${partial}`
        jquery.ajax(autocompleteUrl, {
          success: (result) => {
            const filteredResults = result.filter((r) => {
              return ['Homo', 'Caenorhabditis'].find((genus) => genus === r.taxonomy.genus)
            });
            console.log(filteredResults);
            this.setState({
              autocomplete: filteredResults
            })
          },
          error: ([,,error]) => {
            console.log(`Error: ${error}`);
          },
        });
      }, 500);
    }
  }

  _handleKeyPress = (event) => {
    console.log(`key pressed ${event.keyCode} ${event.which}`);
    if (event.keyCode === 13 || event.which === 13){
      // Enter pressed
      this._handleButtonClick()
    }
  }

  _handleUseSuggestion = (event, suggestion) => {
    console.log(suggestion);
    this.setState({
      partial: suggestion.id,
      focus: false
//      autocomplete: []
    })
  }

  _handleInputFocus = (event) => {
    this.setState({
      focus: true
    });
  }

  _handleInputBlur = (event) => {
    console.log(event.relatedTarget);
    this.setState({
      focus: false
    });
  }

  render() {
    console.log(`render with ${this.state.geneID}`);
    return (<div>
      <div
        className="gene-search"
        tabIndex="1"
        onFocus={this._handleInputFocus}
        onBlur={this._handleInputBlur}
        onSubmit={() => false}>
        <FormControl
          value={this.state.partial}
          onChange={this._handleQueryChange}
          onKeyPress={this._handleKeyPress}/>
        <Button onClick={this._handleButtonClick}>Change gene</Button>
        {
          this.state.autocomplete.length ? <ul
            style={{
            visibility: this.state.focus ? 'visible' : 'hidden'
          }}>
          {
            this.state.autocomplete.map((item) => <li onClick={(event) => this._handleUseSuggestion(event, item)}>
              {item.label}
              <span className="fade">{`${item.taxonomy.genus[0]}. ${item.taxonomy.species}`}</span>
            </li>)
          }
          </ul> : null
        }
      </div>
      <App geneID={this.state.geneID}
        targetSpecies={this.state.geneID.match(/^WB.*/) ? 'homo_sapiens' : 'caenorhabditis_elegans_prjna13758'}/>
    </div>)
  }

}


function displayView(geneID, elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    unmountComponentAtNode(element);
    render(<GeneSearch defaultGeneID={geneID}/>, element);
  }
};

//    'WBGene00225050';
//    'WBGene00015146';  // abi-1
//    'WBGene00006759';  //unc-22
//    'WBGene00000904';  //daf-8

// Example usage:
// displayView('WBGene00000904', 'variation-vis-container');

export {
  displayView
}
