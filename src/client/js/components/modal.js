import React from 'react';
import { sortBy } from 'lodash';

import { Modal } from 'react-bootstrap';

class ModalContainer extends React.Component {
    constructor(props) {
        super(props);
    }

    renderPlayerRow(player, i) {
      const { name, score, tags, pops, grabs, drops, hold, captures,
              prevent, returns, support, powerups, minutes } = player;
      return (
        <tr key={i}>
          <td>{name}</td>
          <td>{score}</td>
          <td>{tags}</td>
          <td>{pops}</td>
          <td>{grabs}</td>
          <td>{drops}</td>
          <td>{hold}</td>
          <td>{captures}</td>
          <td>{prevent}</td>
          <td>{returns}</td>
          <td>{support}</td>
          <td>{powerups}</td>
          <td>{minutes}</td>
        </tr>
      );
    }

    renderStats(game) {
      const { RECENT_STATS } = game;
      const sortedStats = sortBy(RECENT_STATS, (p) => -(+p.score));
      const thereAreStats = sortedStats.length > 0;
      if ( thereAreStats ) {
        return (
          <table>
            <tbody>
              <tr className="stats-header-row">
                <td>Name</td>
                <td>Score</td>
                <td>Tags</td>
                <td>Pops</td>
                <td>Grabs</td>
                <td>Drops</td>
                <td>Hold</td>
                <td>Caps</td>
                <td>Prevent</td>
                <td>Returns</td>
                <td>Support</td>
                <td>Pups</td>
                <td>Minutes</td>
              </tr>
              {sortedStats.map(this.renderPlayerRow)}
            </tbody>
          </table>
        );
      } else {
        return (
          <div className="no-stats">
            <p>There are no stats yet for this game.</p>
          </div>
        );
      }
    }

    renderStream(stream) {
      return <a className="stream-link" href={stream.link}>REC <span className="stream-rec">&bull;</span> {stream.time}</a>;
    }

    renderModalFooter(game) {
      const { STREAM } = game;
      return (
        <div>
          {STREAM ? this.renderStream(STREAM) : <span />}
          <button onClick={this.props.close}>Close</button>
        </div>
      );
    }

    renderStatsModal(game) {
      return (
        <div className="modal-container">
          <Modal
            show={this.props.show}
            onHide={this.props.close}
            container={this}>
            <Modal.Header closeButton>
              <Modal.Title id="contained-modal-title">{game.TEAMS[0]} vs {game.TEAMS[1]}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {this.renderStats(game)}
            </Modal.Body>
            <Modal.Footer>
              {this.renderModalFooter(game)}
            </Modal.Footer>
          </Modal>
        </div>
      );
    }

    renderBlankModal() {
      return (
        <div className="modal-container">
        </div>
      );
    }

    render() {
      const { game } = this.props;
      if ( game ) {
        return this.renderStatsModal(game);
      } else {
        return this.renderBlankModal();
      }
    }
}

export default ModalContainer;
