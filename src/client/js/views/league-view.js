import React from 'react';
import _ from 'lodash';
import { MAPS } from './../../../server/constants';
import { getWeekNumber } from './../../../server/helpers';
import { getTeamConferences, sortOptions } from './../ordering';

import ModalContainer from './../components/modal';

class LeagueView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showModal: false, modalGame: null, order: 'alphabetical' };
    this.teamConferences = getTeamConferences(props.route.path);
    this.leagueType = props.route.path.toUpperCase();
    this.otherLeague = props.route.path === 'majors' ? 'minors' : 'majors';
    this.renderGameScoreboard = this.renderGameScoreboard.bind(this);
    this.renderSortingOptions = this.renderSortingOptions.bind(this);
    this.renderOptionLink = this.renderOptionLink.bind(this);
    this.setSortingOrder = this.setSortingOrder.bind(this);
    this.getOrderingFxn = this.getOrderingFxn.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  openModal(game, half) {
    this.setState({ showModal: true, modalGame: game, individualHalf: half });
  }

  closeModal() {
    this.setState({ showModal : false, modalGame: null, individualHalf: null });
  }

  getTableClass(i) {
    return [0,3,4,7,8].indexOf(i) > -1 ? 'board-navy' : 'board-maroon';
  }

  getHeaderClass(game) {
    const GAME_OVER = game.GAME_OVER || this.props.gamesComplete.indexOf(game.TEAMS[0]) > -1;
    return `${GAME_OVER ? 'game-over' : ''} ${this.getFlashClass(game)}`;
  }

  getFlashClass(game) {
    const gameToFlash = this.shouldFlash(game);
    const shouldFlash = !!gameToFlash;
    if ( shouldFlash ) {
      const endOfGame = +gameToFlash.state === 2;
      return endOfGame ? 'header-flash-gray' : 'header-flash-green';
    } else {
      return '';
    }
  }

  getHighlightClass(game, gameNumber, halfNumber) {
    const gameToFlash = this.shouldFlash(game);
    const shouldFlash = !!gameToFlash;
    if ( !shouldFlash ) {
      return '';
    } else {
      const { gameNum, halfNum } = gameToFlash;
      const shouldHighlight = +gameNum === +gameNumber && +halfNum === +halfNumber;
      return shouldHighlight ? 'td-highlight' : '';
    }
  }

  shouldFlash(game) {
    return _.find(this.props.scoreboardUpdates, (upd8) => {
      return upd8.TEAMS.indexOf(game.TEAMS[0]) > -1;
    });
  }

  getOrderingFxn() {
    return _.find(sortOptions, (o) => {
      return o.order === this.state.order;
    }).fxn;
  }

  setSortingOrder(order) {
    this.setState({ order });
  }

  renderGameScoreboard(game, idx) {
    const teamOne = game.TEAMS[0];
    const teamTwo = game.TEAMS[1];
    return (
      <div key={idx} className="game-board col-md-6 col-sm-12">
        <h2 className={this.getHeaderClass(game)} onClick={this.openModal.bind(this, game)}>
          {teamOne} vs {teamTwo}
        </h2>
        <table className={this.getTableClass(idx)}>
          <tbody>
            <tr>
              <td className="left-aligned">Team</td>
              <td className={`${this.getHighlightClass(game, 1,1)} halfTitle`} onClick={this.openModal.bind(this, game, 'G1H1')}>G1H1</td>
              <td className={`${this.getHighlightClass(game, 1,2)} halfTitle`} onClick={this.openModal.bind(this, game, 'G1H2')}>G1H2</td>
              <td>Game 1</td>
              <td className={`${this.getHighlightClass(game, 2,1)} halfTitle`} onClick={this.openModal.bind(this, game, 'G2H1')}>G2H1</td>
              <td className={`${this.getHighlightClass(game, 2,2)} halfTitle`} onClick={this.openModal.bind(this, game, 'G2H2')}>G2H2</td>
              <td>Game 2</td>
            </tr>
            <tr className="padded-bottom">
              <td className="left-aligned team-name">{teamOne}</td>
              <td>{+game.GAME_ONE.HALF_ONE[teamOne]}</td>
              <td>{+game.GAME_ONE.HALF_TWO[teamOne]}</td>
              <td>{+game.GAME_ONE.HALF_ONE[teamOne] + +game.GAME_ONE.HALF_TWO[teamOne]}</td>
              <td>{+game.GAME_TWO.HALF_ONE[teamOne]}</td>
              <td>{+game.GAME_TWO.HALF_TWO[teamOne]}</td>
              <td>{+game.GAME_TWO.HALF_ONE[teamOne] + +game.GAME_TWO.HALF_TWO[teamOne]}</td>
            </tr>
            <tr className="padded-bottom">
              <td className="left-aligned team-name">{teamTwo}</td>
              <td>{+game.GAME_ONE.HALF_ONE[teamTwo]}</td>
              <td>{+game.GAME_ONE.HALF_TWO[teamTwo]}</td>
              <td>{+game.GAME_ONE.HALF_ONE[teamTwo] + +game.GAME_ONE.HALF_TWO[teamTwo]}</td>
              <td>{+game.GAME_TWO.HALF_ONE[teamTwo]}</td>
              <td>{+game.GAME_TWO.HALF_TWO[teamTwo]}</td>
              <td>{+game.GAME_TWO.HALF_ONE[teamTwo] + +game.GAME_TWO.HALF_TWO[teamTwo]}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  renderGames() {
    const orderingFxn = this.getOrderingFxn();
    const games = orderingFxn(this.props[this.leagueType], this.teamConferences);
    return (
      <div className="row">
        {games.map(this.renderGameScoreboard)}
      </div>
    )
  }

  renderSortingOptions() {
    const options = sortOptions.map(this.renderOptionLink);
    return (
      <div className="sorting-options">
        {options}
      </div>
    );
  }

  renderOptionLink(option, i) {
    let className = `sorting-option ${option.order === this.state.order ? 'selected-option' : ''}`;
    return <a key={i} className={className} onClick={this.setSortingOrder.bind(this, option.order)}>{option.order}</a>;
  }

  render() {
    const weekNumber = getWeekNumber();
    const mapOne = MAPS[weekNumber - 1];
    const mapTwo = MAPS[weekNumber];
    return (
      <div className="league-view container">
        <h1 className="page-title"><a href={`${this.leagueType.toLowerCase()}`}>{this.leagueType}</a></h1>
        <p className="page-subtitle"><a href="/">home</a> | <a href={`/${this.otherLeague}`}>{this.otherLeague}</a></p>
        <h4 className="week-banner">Week {weekNumber} - {mapOne} / {mapTwo}</h4>
        {this.renderSortingOptions()}
        <ModalContainer
          show={this.state.showModal}
          close={this.closeModal}
          half={this.state.individualHalf}
          game={this.state.modalGame} />
        {this.renderGames()}
      </div>
    );
  }
}

export default LeagueView;
