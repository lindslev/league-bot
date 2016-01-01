import React from 'react';

class Footer extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
          <footer>
            <a href="http://reddit.com/r/tagpro" target="_blank">
              <i className="fa fa-reddit"></i>
            </a>
            <a href="http://tagproleague.com" target="_blank">
              <i className="fa fa-newspaper-o"></i>
            </a>
            <p> &copy; Gem </p>
            <a href="http://tagpro.gg" target="_blank">
              <i className="fa fa-flag"></i>
            </a>
            <a href="https://docs.google.com/spreadsheets/d/1SbPu42g4uSU6ljXC8I6Hkdq5bOeWIywrhrdDtJB1zTI/edit" target="_blank">
              <i className="fa fa-bar-chart"></i>
            </a>
          </footer>
        );
    }
}

export default Footer;
