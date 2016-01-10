import React from 'react';
import $ from 'jquery';

class Streams extends React.Component {
    constructor(props) {
        super(props);
        this.state = { streamCode: '', authed: false, teamName: '', gameTime: '', streamLink: '', leagueType: '' };
        this.checkCode = this.checkCode.bind(this);
        this.setChange = this.setChange.bind(this);
        this.addStream = this.addStream.bind(this);
        this.authKeyDown = this.authKeyDown.bind(this);
        this.formKeyDown = this.formKeyDown.bind(this);
        this.renderAuthSection = this.renderAuthSection.bind(this);
    }

    setChange(stateId, e) {
      this.setState({ [stateId]: e.target.value });
    }

    authKeyDown(e) {
      if ( e.keyCode === 13 ) this.checkCode();
    }

    formKeyDown(e) {
      if ( e.keyCode === 13 ) this.addStream();
    }

    checkCode() {
      const code = this.state.streamCode;
      $.ajax({ url: '/api/streams/auth', method: 'POST', data: { code } })
        .done(function(res) {
          if ( res === 200 ) this.setState({ authed: true });
          if ( res === 400 ) this.setState({ authed: false, attempted: true });
        }.bind(this)).fail(function(err) {
          this.setState({ authed: false, attempted: true })
        }.bind(this));
    }

    addStream() {
      const stream = {
        team: this.state.teamName,
        link: this.state.streamLink,
        league: this.state.leagueType,
        time: this.state.gameTime
      };
      $.ajax({ url: '/api/streams', method: 'POST', data: stream })
        .done(function(res) {
          if ( res === 200 ) this.setState({ teamName: '', streamLink: '', leagueType: '', gameTime: '' });
        }.bind(this)).fail(function(err) {
          // do nothing
        }.bind(this));
    }

    renderAuthSection() {
      return (
        <div>
          <p>If you have access to add streams, enter the code here:</p>
          <input type="text" onKeyDown={this.authKeyDown} onChange={this.setChange.bind(this, 'streamCode')} value={this.state.streamCode} />
          <button onClick={this.checkCode}>Check</button>
        </div>
      );
    }

    renderForm() {
      return (
        <div className="streams-form">
          <p>Team name (should be MAJORS or MINORS specific)</p>
          <input type="text" onKeyDown={this.formKeyDown} onChange={this.setChange.bind(this, 'teamName')} value={this.state.teamName} />
          <p>Game time</p>
          <input type="text" onKeyDown={this.formKeyDown} onChange={this.setChange.bind(this, 'gameTime')} value={this.state.gameTime} />
          <p>Stream link (must lead with http://)</p>
          <input type="text" onKeyDown={this.formKeyDown} onChange={this.setChange.bind(this, 'streamLink')} value={this.state.streamLink} />
          <p>League type (either MAJORS or MINORS)</p>
          <input type="text" onKeyDown={this.formKeyDown} onChange={this.setChange.bind(this, 'leagueType')} value={this.state.leagueType} />
          <button onClick={this.addStream}>Add Stream</button>
        </div>
      )
    }

    render() {
      return (
        <div className="streams-container">
          <h1 className="page-title"><a href="/">STREAMS</a></h1>
          { this.state.authed ? this.renderForm() : this.renderAuthSection() }
        </div>
      );
    }
}

export default Streams;
