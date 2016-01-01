var request = require('request');

var cookiesHash = {
  origin: 'tagpro=s%3AZULO6VqUoWbUeY0zIfKnhN3R.as4SvRDDW3%2BK5%2F%2FJ7z7T0gkNEvVQ71sn32FlXV5CYJA',
  radius: 'tagpro=s%3AD7EiXNwLlTj83q8Xkrs06QAu.stp69Bcpgye0LoAeKxGine5awAGBzxVpKFa4kI7kZ58',
  sphere: 'tagpro=s%3AuCGdoe7Gb9pXZSeSyzAdagNx.S%2FPZA3hRwSR6y%2BxhZiPlCn40oOnYp6uo3p3%2FyTiDcHw',
  segment: 'tagpro=s%3ANy20Pk99iWShSDx2cLSBbzDL.FKeQMolzcuDHATGoCDMEcE%2Bq3hIHHrj9MZEkojmcr30',
  pi: 'tagpro=s%3AWXgfxW1ECMa16jt7G0pRS0ik.ejEuqhUf45%2BsLG9a%2FCPnArbmZ2%2Bezh3T5WrV%2BgO2vqc',
  arc: 'tagpro=s%3AaaviXP6X898AEnnyrU8DaiXh.TsxF0senCpA5a51GSLr2HGHdjuQTDZCLvcD4i7jMcUo',
  centra: 'tagpro=s%3AuYWz7VVoxDmEB58rsXOptqXR.5RcYHGRYL4q96x33a98vSlTs2JygoNXH2EzFEMFQ4hI',
  chord: 'tagpro=s%3AFZfL0608E3SXZfA23NtwIp5g.ZI594qkQ65RZAWHLb5JV0BL3MEfeZw34t6hu8SrWq18',
  orbit: 'tagpro=s%3AiWrzwCxmuw99mFDvjp13mAMW.HXSXSo7UKr7X5M%2Frd1Pel9LX5RFJlQ4Wg7WuqRf6KMM',
  diameter: 'tagpro=s%3AsoiGybyucdrRaTZK472tMigq.oWYMjRzp9sii5n24JXCGcHUc4%2BRbgpDjxdY8etm%2FOGE',
  maptest2: 'tagpro=s%3AmwxCdeGDwxwrWG1vfDbSSfGk.p7CV3Bj7LuF38kYsCPkpNgeXlF0R0yyV6N7xyFm%2FZGM',
  tangent: 'tagpro=s%3A0qWPVVhfILU96rogHooAQWoC.pRSEKUp3FaRG5AuAi58dWbKrIDc5%2BrUpy%2BxvfhYQ5J8',
  maptest3: 'tagpro=s%3AM00OOcRELnX9I8nuCwyL4iV0.3bEL8fXp8Odl42akHmDKE0Kph1OYjQwbY9VgWjIiuG4',
  maptest1: 'tagpro=s%3ATlWXY7W3wl1vtHSpBBA1Erxb.KQ9pDnTfrVrI0SeTAZhK8t5Fwta8%2BpUVaNeXtIPximw'
}


exports.index = function(req, res) {
  var url = 'http://tagpro-' + req.params.server + '.koalabeast.com/groups/create/';
  if ( req.params.server == 'maptest2' ) url = 'http://maptest2.newcompte.fr/groups/create/';
  if ( req.params.server == 'tangent' ) url = 'http://tangent.jukejuice.com/groups/create/';
  if ( req.params.server == 'maptest3' ) url = 'http://maptest3.newcompte.fr/groups/create/';
  if ( req.params.server == 'maptest1' ) url = 'http://maptest.newcompte.fr/groups/create/';
  request.post({url: url, headers:{ Cookie: cookiesHash[req.params.server] }, form: { }}, function(err, resp, body) {
    var link = resp.body.split('/groups/')[1];
    res.send(link);
  })
}
