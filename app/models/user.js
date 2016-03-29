var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  initialize: function() {
    this.on('creating', function(model) {
      bcrypt.hash(model.get('password'), null, null, function(error, hashedPwd) {
        if (error) { 
          console.log(error); 
          return;
        }
        model.set('password', hashedPwd);
      });
    });
  }
});
module.exports = User;