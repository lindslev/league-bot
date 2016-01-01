import React from 'react';
import Spinner from 'react-spinkit';

class LeagueChooser extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="league-chooser">
        <img className="home-logo" src="http://i.imgur.com/8aAHD9L.png" />
        <Spinner spinnerName="chasing-dots" noFadeIn={true} />
        <div className="league-link-container">
          <a href="/majors" className="league-link">MAJORS</a>
          <a href="/minors" className="league-link">MINORS</a>
        </div>
      </div>
    );
    }
}

export default LeagueChooser;
