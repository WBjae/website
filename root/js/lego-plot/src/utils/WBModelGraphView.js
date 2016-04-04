import vis from 'vis';
import WBModelGraph from './WBModelGraph';
import getNodeFace, { getNodeModal } from './NodeFace';

export default class WBModelGraphView {
  constructor(graphJSON, container) {
    this._wbModelGraph = new WBModelGraph(graphJSON);
    this.visual = this._createVisual(container);

    this.update('simple');
  }

  update(mode) {
    //this._wbModelGraph.setMode(mode);
    const nodes = this.decorateNodes(this._wbModelGraph.getNodes(), mode);
    const edges = this.decorateEdges(this._wbModelGraph.getEdges(), mode);

    this.visual.nodes.update(nodes);
    this.visual.edges.update(edges);
  }

  decorateNodes(nodes, mode){
    return nodes.map((v) => {
      const label = this.prettyLabel(v.label);
      const title = v.label;
      const sharedConfig = {
        ...v,
        label,
        title,
        // scaling: {
        //   min: 1,
        //   max: 1
        //   //label: false,
        // },
        font: {
        //  size: 30,
        },
        //mass:10
      }

      const associations = this.decorateEdges(this._wbModelGraph.getEdgeOfNode(v), mode);

      if (this._wbModelGraph.isMajorNode(v)){
        return {
          ...sharedConfig,
       //   shape: 'circle',
          shadow: true,
          image: getNodeFace(v, associations),
          shape: 'image',
          shapeProperties: {
            useImageSize: true,
            useBorderWithImage: true
          }
        };
      } else {
        return {
          ...sharedConfig,
          hidden: mode === 'simple',
          //physics: false
          physics: mode !== 'simple',
        }
      }
    })
  }

  decorateEdges(edges, mode){
    const shared = {
      font: {
        align: 'bottom'
      },
      arrows:'to'
    };

    return edges.map((e) => {
      if (this._wbModelGraph.isMajorEdge(e)){
        return {
          ...e,
          ...shared,
          shape: 'circle',
          color: this.getEdgeColor(e),
          shadow: true,
          width: 5
        };
      } else {
        return {
          ...e,
          ...shared,
          color: mode === 'simple' ? this.getEdgeColor(e) : null,
          //physics: false,
          physics: mode !== 'simple',
          hidden: mode === 'simple'
        }
      }
    });
  }

  _createVisual(container) {

    var nodes = new vis.DataSet(this._wbModelGraph.getNodes());
    var edges = new vis.DataSet(this._wbModelGraph.getEdges());

    var options = {
      physics: {
        enabled: true,
        stabilization: false,
        hierarchicalRepulsion: {
          // centralGravity: 0.0,
          // springLength: 100,
          // springConstant: 0.02,
          nodeDistance: 200,
          damping: 0.49
        },
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled:true,
          levelSeparation: 250,
          // nodeSpacing: 200,
          // treeSpacing: 200,
          // blockShifting: true,
          // edgeMinimization: true,
          // parentCentralization: true,
          direction: 'UD',        // UD, DU, LR, RL
          sortMethod: 'directed'   // hubsize, directed
        }
      },
      interaction:{
        navigationButtons: true,
        tooltipDelay: 100,
      },
      nodes : {
        shape: 'dot',
        //size: 10
      }
    };

    const network = new vis.Network(container, {nodes, edges}, options);

    network.once('stabilized', function(){
      network.setOptions({
        // physics: {
        //   ...options.physics,
        //   stabilization: {
        //     onlyDynamicEdges: true
        //   }
        // }
      });
    });

    network.on('selectNode', (params) => {
      console.log(params);
      const node = params.nodes[0];
      const target = params.event.target;
      const modalContainer = $(target).closest('.lego-graph-wrapper').find('.lego-modal-container');
      modalContainer.html(getNodeModal(node, null, '.lego-modal-container'));

      const modal = modalContainer.find('.node-modal').first();
      modal.modal();
      // unselect nodes on model hide, so node can be selected again
      modal.on('hide.bs.modal', () => network.unselectAll());

    });

    function toggleVisibility(items, hidden) {
      var newItems = items.map(function(e){
       // e.hidden = !e.hidden;
   //     return e;
        return Object.assign({
          hidden: hidden,
        }, e);
      })

      return newItems;
    }

//    var hidden = true;
//     setInterval(function(){
//       console.log('updating');
//       nodesData.update(toggleVisibility(nodes, hidden));
//       edgesData.update(toggleVisibility(edges, hidden));
//       hidden = !hidden;
//     }, 3000);

    return {
      nodes: nodes,
      edges: edges,
      network: network
    };
  }

  /*
   convert a long label text into mulitple lines
  */
  prettyLabel(label){
    var max_line_length = 20;
    var words = label.split(/\s+/);
    var lines = [];
    var partial_line = '';
    words.forEach(function(w){
      if (w.length + partial_line.length > max_line_length) {
        lines.push(partial_line);
        partial_line = w;
      }else{
        partial_line += ' ';
        partial_line += w;
      }
    });
    if (partial_line){
      lines.push(partial_line);
    }
    return lines.join('\n');
  }

  getEdgeColor(edge){
    if (!this._edgeToColor){
      this._edgeToColor = {
        'RO:0002213': '#d95f02',
        'BFO:0000050': '#7570b3',
        'BFO:0000066': '#33a02c',
        'RO:0002333': '#1f78b4'
      }
    }
    return this._edgeToColor[edge.predicate_id] || '#777';
  }
}
