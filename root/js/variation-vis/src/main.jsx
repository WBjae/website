import "babel-polyfill";
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Button, ButtonGroup, ButtonToolbar, Glyphicon,
  FormGroup,
  ControlLabel,
  FormControl } from 'react-bootstrap';
import Viewer from './components/Viewer';
import TrackLegendModal from './components/TrackLegendModal';
import TrackLabel from './components/TrackLabel';
import BasicTrack, { VariationTrack, AlignmentTrack, ProteinConservationTrack } from './Tracks';
import ColorScheme, { COLORS } from './Utils/ColorHelper';
import HomologyModel from './Models/HomologyModel';
require('./main.less');

const DEFAULT_SVG_INTERNAL_WIDTH = 100;
const DEFAULT_SVG_HEIGHT = 600;  // use the same vertical coordinate system for internal vs apparent

class App extends React.Component {

  static propTypes = {
    geneID: React.PropTypes.string.isRequired,
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
    this._getData(this.props.geneID);
    // setTimeout(() =>
    //   this._setupZoomPan()
    //   , 5000);
  }

  _getData(geneID) {
    const model = new HomologyModel(geneID);


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

      this._setTrackState({
        id: 'conservation',
        sequenceLength: sourceSequence.length,
        sequenceList: [sourceSequence, targetSequence],
        trackComponent: ProteinConservationTrack,
        name: 'Protein Conservation',
      });
    });

    // load variation tracks
    model.sourceGeneModel.then((sourceGeneModel) => {
      const variationsPromise = sourceGeneModel.getAlignedVariations('wormbase');
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
      const variationsPromise = targetGeneModel.getAlignedVariations('ensembl');
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

    const tracks = [...this.state.tracks].sort((trackDataA, trackDataB) => {
      return _getTrackIndex(trackDataA.id) < _getTrackIndex(trackDataB.id);
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
      });
    }
  }

  getTrackDescriptionCancelHandler = (trackId) => {
    return () => {
      this.setState({
        activeTrackModal: null
      });
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
      margin: 10,
      width: 'auto',
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
        <div id="svg-browser-container" style={containerStyle}>
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
          {
            this.renderTrackModal()
          }

          <Viewer ref={(component) => this._viewerComponent = component}
            style={{
              //left: trackLabelColumnWidth,
              overflow: 'hidden',
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
    );
  }

}


function displayView(geneID, elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    unmountComponentAtNode(element);
    render(<App geneID={geneID}/>, element);
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
