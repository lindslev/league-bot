import React from 'react';
import ReactDOM from 'react-dom';
import App from './views/home';
import LeagueChooser from './views/league-chooser';
import LeagueView from './views/league-view';
import BallOfFame from './views/ball-of-fame';

import { Router, Route, IndexRoute } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

const APP = (
	<Router history={createBrowserHistory()}>
		<Route path='/' component={App}>
			<IndexRoute component={LeagueChooser} />
			<Route path='fame' component={BallOfFame} />
			<Route path='majors' component={LeagueView} />
			<Route path='minors' component={LeagueView} />
		</Route>
  </Router>
);

ReactDOM.render(APP, document.getElementById('main'));
