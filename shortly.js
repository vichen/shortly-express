var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));

// TODO:
// instantiate and use express session middleware
// https://github.com/expressjs/session#reqsession
app.use(session({ secret: 'chewy the min pin', cookie: { maxAge: 60000 }}));


app.use(express.static(__dirname + '/public'));

var isAuthenticated = function(req, res, next) {
  if (req.session.user) {
    console.log('authenticated user: ', req.session.user);
    return next();
  } else {
    console.log('you are not authorized to view this page');
    res.redirect('/login');
  }
};

app.get('/', isAuthenticated, function(req, res) {
  res.render('index');
});

app.get('/create', isAuthenticated, function(req, res) {
  res.render('index');
});

app.get('/links', isAuthenticated, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});


app.post('/links', isAuthenticated, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});


/************************************************************/
// Write your authentication routes here
/************************************************************/


app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/login', function (req, res) {
  var username = request.body.username;
  var password = request.body.password;

  if (username && password) {
    User.where({username: username}).fetch()
      .then(function(user) {
        // IF user is null, meaning username doesn't exist in DB -> send status 401 Unauthorized
        console.log('fetched user ', user);
        if (user === null) {
          sendStatus(401);
          return;
        }

        // Compare "password" with user.get('password') // aka hashed password stored in DB
        // IF false, meaning passwords don't match -> send status 401 Unauthorized
        bcrypt.compare(password, user.get('password'), function(err, res) {
          if (err) {
            sendStatus(401);
            return;
          } else {
            req.session;
            res.redirect('/index');
            res.end('welcome to the session demo. refresh!');
          }
        });
        

        // ELSE password matches,
        //   1) create express sessions, 
        //  https://github.com/expressjs/session#reqsession
        //   2) redirect to "index"
      })
      .catch(function(error) {
        // Error trying to fetch user, could be either server or DB losing connection
        console.log('failed to fetch user ', error);
        res.sendStatus(500);
        return;
      });
  } else {
    res.sendStatus(400);
    return;
    console.log('error logging in');
  }
});

app.post('/signup', function(req, res) {
  req.username = username;
  req.password = password;

  if (!username || !password) {
    res.send('username or password is undefined');
  } else {

    // Create a new User, 
    // http://bookshelfjs.org/#Collection-instance-create
    User.create(username, function(error) {
      if (error) {
        sendStatus(500);
      } else {
        req.session;
        res.redirect('/index');
      }
    });

    // IF there's an error, send back appropriate error status code

    // IF user is created successfully
    // similar to login,
    //  1) create express session
    //  2) redirect to index
  }
});

app.post('/logout', function (req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
