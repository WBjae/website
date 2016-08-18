export class AbstractCoordinateMapping {

  REQUIRED_METHODS = [
    'toSVGCoordinate',
    'toSequenceCoordinate'
  ];

  constructor() {
    this.REQUIRED_METHODS.forEach((method_name) => {
      if (this[method_name] === undefined) {
        throw new TypeError(`Must override method: ${method_name}`);
      }
    });
  }

}

export class LinearCoordinateMapping extends AbstractCoordinateMapping {
  constructor({sequenceLength, svgWidth}) {
    super();
    this.unitWidth = svgWidth / sequenceLength;
  }

  toSVGCoordinate(sequenceCoord) {
    return sequenceCoord * this.unitWidth;
  }

  toSequenceCoordinate(svgCoord) {
    return svgCoord / this.unitWidth;
  }
}

export class ExactCoordinateMapping extends AbstractCoordinateMapping {
  constructor() {
    super();
  }

  toSVGCoordinate(sequenceCoord) {
    return sequenceCoord;
  }

  toSequenceCoordinate(svgCoord) {
    return svgCoord;
  }
}


export default {
  AbstractCoordinateMapping,
  LinearCoordinateMapping,
  ExactCoordinateMapping,
}
