import React from 'react';

export default class PrettyTrackSVGFilter extends React.Component {
  static ID = "pretty-track-svg-filter";

  render() {
    return  (
      <filter id={PrettyTrackSVGFilter.ID}>
        <feGaussianBlur stdDeviation={4 / (this.context.zoomFactor * this.context.zoomFactor || 1)} result="blur2" />
          <feSpecularLighting result="spec2" in="blur2" specularConstant="2" specularExponent="13" lightingColor="#cccccc">
          <feDistantLight azimuth="270" elevation="20" />
        </feSpecularLighting>
        <feComposite in="SourceGraphic" in2="spec2" operator="arithmetic" k1="-1" k2="1" k3="0" k4="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.8"/>
        </feComponentTransfer>
      </filter>)
  }
}
