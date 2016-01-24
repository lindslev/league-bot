import React from 'react';
import $ from 'jquery';
import _ from 'lodash';

import Footer from './../components/footer';

import { isMajors, getGameNumber, getHalfNumber } from './../../../server/helpers';

const socket = io();

class APP extends React.Component {
    constructor(props) {
      super(props);
      this.state = { MAJORS: [], MINORS: [], scoreboardUpdates: [], gamesComplete: [] };
      $.ajax({ url: '/api/live', method: 'GET' })
        .done(function(week) {
          this.setState({ MAJORS: week.MAJORS, MINORS: week.MINORS });
        }.bind(this));
      socket.on('live', updateState.bind(this));
    }

    render() {
      return (
          <div className="app">
              {React.Children.map(this.props.children, function(child) {
                return React.cloneElement(child, this.state);
              }.bind(this))}
            <Footer />
          </div>
      );
    }
}

function updateState(PAYLOAD) {
  const leagueType = PAYLOAD.majors ? 'MAJORS' : 'MINORS';
  let scoreboardUpdates = this.state.scoreboardUpdates, gamesComplete = this.state.gamesComplete;
  let thisUpdate = {};
  let newState = this.state[leagueType].map(game => {
    let gameToUpdate = game.TEAMS.indexOf(PAYLOAD.teams[0]) > -1;
    if ( gameToUpdate ) {
      game.RECENT_STATS = PAYLOAD.stats;
      game.LAST_UPDATE = PAYLOAD.LAST_UPDATE;
      game.individualHalfStats = PAYLOAD.individualHalfStats;
      game[getGameNumber(PAYLOAD.game)][getHalfNumber(PAYLOAD.half)] = PAYLOAD.score;
      thisUpdate = game;
      scoreboardUpdates.push(_.assign({}, game, {
        gameNum: PAYLOAD.game,
        halfNum: PAYLOAD.half,
        state: PAYLOAD.state
      }));
      if ( PAYLOAD.GAME_OVER ) gamesComplete.push(game.TEAMS[0]);
    }
    return game;
  });
  newState = _.assign({}, newState, { scoreboardUpdates, gamesComplete });
  this.setState(newState);
  resetState.apply(this, [thisUpdate]);
}

function resetState(update) {
  setTimeout(() => {
    const resetUpdates = removeUpdate.apply(this, [update]);
    this.setState({ scoreboardUpdates: resetUpdates });
  }, 5000);
}

function removeUpdate(update) {
  let updates = this.state.scoreboardUpdates;
  _.remove(updates, (upd8) => {
    return upd8.TEAMS.indexOf(update.TEAMS[0]) > -1;
  });
  return updates;
}

export default APP;
