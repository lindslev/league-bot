import _ from 'lodash';
import { MLTP_TEAMS } from './../../server/constants';

function getEastWestGames(games, confs) {
  let eastGames = [], westGames = [];
  games.forEach((g) => {
    confs.forEach((t) => {
      if ( t.name === g.TEAMS[0] && t.conference === 'East' ) {
        eastGames.push(g);
      } else if ( t.name === g.TEAMS[0] && t.conference === 'West' ) {
        westGames.push(g);
      }
    });
  });
  return { eastGames, westGames };
}

function whichConference(div) {
  let conference = 'West';
  if ( div === 'Atlantic' || div === 'Northeast' ) {
    conference = 'East';
  }
  return conference;
}

export function getTeamConferences(leagueType) {
  var nameToGet = leagueType === 'majors' ? 'name' : 'minorsName';
  return MLTP_TEAMS.map((t) => {
    return { name: t[nameToGet], division: t.division, conference: whichConference(t.division) };
  });
}

export function orderGamesAlphabetically(games) {
  return _.sortBy(games, (g) => g.TEAMS[0]);
}

export function orderGamesEastLeft(games, confs) {
  let sortedGames = [];
  let { eastGames, westGames } = getEastWestGames(games, confs);
  const length = eastGames.length + westGames.length;
  for ( let i = 0; i < length; i++ ) {
    i % 2 === 0 ? sortedGames.push(eastGames.shift()) : sortedGames.push(westGames.shift());
  }
  return sortedGames;
}

export function orderGamesWestLeft(games, confs) {
  let sortedGames = [];
  let { eastGames, westGames } = getEastWestGames(games, confs);
  const length = eastGames.length + westGames.length;
  for ( let i = 0; i < length; i++ ) {
    i % 2 === 0 ? sortedGames.push(westGames.shift()) : sortedGames.push(eastGames.shift());
  }
  return sortedGames;
}

export function orderGamesEastOverWest(games, confs) {
  let sortedGames = [];
  let { eastGames, westGames } = getEastWestGames(games, confs);
  const length = eastGames.length + westGames.length;
  for ( let i = 0; i < length; i++ ) {
    i < length/2 ? sortedGames.push(eastGames.shift()) : sortedGames.push(westGames.shift());
  }
  return sortedGames;
}

export function orderGamesWestOverEast(games, confs) {
  let sortedGames = [];
  let { eastGames, westGames } = getEastWestGames(games, confs);
  const length = eastGames.length + westGames.length;
  for ( let i = 0; i < length; i++ ) {
    i < length/2 ? sortedGames.push(westGames.shift()) : sortedGames.push(eastGames.shift());
  }
  return sortedGames;
}

export const sortOptions = [
      { order: 'alphabetical',
        fxn: orderGamesAlphabetically },
      { order: 'east | west',
        fxn: orderGamesEastLeft },
      { order: 'west | east',
        fxn: orderGamesWestLeft },
      { order: 'east / west',
        fxn: orderGamesEastOverWest },
      { order: 'west / east',
        fxn: orderGamesWestOverEast
      }
    ];
