import React from 'react';

const VariationSummary = (props) => {
  const {changeType, changeDetail, phenotypes, phenotypeCount} = props;
  return (
    <div>
      {
        changeType
      }
      {
        changeDetail ? `(${changeDetail})` : null
      }
      <h6>Phenotypes:</h6>
      <ul>
      {
        phenotypes.map((p,index) => <li key={index}>{p}</li>)
      }
      </ul>
      {
        phenotypeCount > 0 && !phenotypes ? <p>Loading phenotypes...</p> : null
      }
    </div>
  )
}

export default VariationSummary;
