var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

////////////////////////////////////////////////////////
// Advanced version of the User model
////////////////////////////////////////////////////////
// Keeping logic that pertains to the user model in
// the express route handler forces us to use the
// controller to instantiate User models. By moving
// key model logic (such as comparing and encrypting
// passwords) into the model, we cleanly seperate
// those two concerns.
////////////////////////////////////////////////////////

var User = db.Model.extend({
  tableName: 'users',
  hasTimeStampes: true,
  initialize: function() {
    this.on('creating', this.hashPassword);
  },
  comparePassword: function(attemptedPassword, callback) {
    bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
      callback(isMatch);
    });
  },
  hashPassword: function() {
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.get('password'), null, null).bind(this)
      .then(function(hash) {
        this.set('password', hash);
      });
  }
});
