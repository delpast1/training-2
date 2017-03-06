var express = require('express');
var app  = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./db/user');
var Ticket = require('./db/ticket');
var Event = require('./db/event');

const port = process.env.PORT || 8081;
mongoose.connect(config.database);

app.set('secretKey', config.secret);

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', (req,res) => {
    res.send('Hello! The API is at http://localhost:'+ port +'/api');
});

//đăng ký user
app.post('/registry', (req,res) => {
    let id = req.body.id;
    let password = req.body.password;
    let admin = (req.body.admin === "true");

    var user1 = new User ({
        id: id,
        password: password,
        admin: admin
    });

    user1.save((err) => {
        if (err)
            console.log(err);
        else {
            res.json({message: "successfully"});
        }
    }) 
});


//Authenticate
var router = express.Router();
app.use('/api', router);
router.post('/', (req,res) => {
    User.findOne({
        id: req.body.id
    }, (err,user) => {
        if (err) console.log(err);
        if (!user) {
            res.json({message: 'User khong ton tai'});
        } else if (user) {
            if (user.password != req.body.password){
                res.json({message: 'Sai mat khau!'});
            } else {
                var token = jwt.sign(user, app.get('secretKey'),{
                    expiresIn: 60*60
                });

                res.json({
                    message: 'Dang nhap thanh cong!',
                    token: token
                });
            }
        }
    });
});


//Verify token
router.use((req, res, next) => {
    let token = req.body.token || req.query.token || req.headers['token'];

    if (token) {
        jwt.verify(token,app.get('secretKey'), (err,decoded) => {
            if (err) {
                return res.json({message: 'Failed to authenticate token.'});
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({
            message: 'There is no token'
        });
    }
});


router.post('/test', (req,res) => {
    if (req.decoded._doc.admin) {
        res.json({message: 'welcome admin!'})
    } else res.json({message: 'Not admin'}) 

});

//show users
router.post('/users', (req,res) => {
    if (req.decoded._doc.admin) {
        User.find({}, (err, users) => {
            res.json(users);
        });
    } else res.json({message: 'You are not admin'});
});

//them su kien
router.post('/addEvent', (req,res) => {
    if (req.decoded._doc.admin){
        let event = new Event({
            name: req.body.name,
            desc: req.body.desc,
         date: Date.parse(req.body.date)
        });

        let nA = req.body.nA;
        let nB = req.body.nB;

        for(let i=0;i<nA;i++){
            event.tickets.push({
                kind: 'A',
                buyer: ''
            });
        }
        for(let i=0;i<nB;i++){
        event.tickets.push({
                kind: 'B',
                buyer: ''
            });
        }

        event.save((err) => {
            if (err){
                console.log(err);
            } else {
                console.log('successfully');
                res.json({ message: 'Event added.'});
            }   
        });
    } else res.json({message: 'You are not admin'});
});

//delete event
router.post('/deleteEvent', (req,res) => {
    if (req.decoded._doc.admin){
        Event.remove({_id: req.body.id}, (err) => {
            if (!err) {
                res.json({message: 'Delete successfully!'});
            } else {
                console.log(err);
                res.json({message: 'Error!'});
            }
        });
    } else res.json({message: 'You are not admin'});
});



//buy ticket
router.post('/buyTicket', (req,res) => {
    if (req.decoded._doc.admin) {
        res.json({message: 'Admin khong the mua ve'});
    } else {
        Event.findOne({_id: req.body.EventID}, (err,ev) => {
            ev.tickets.map((ticket) => {
                if (ticket.buyer == '' && ticket.kind == req.body.kindOfTicket){
                    ticket.buyer = req.decoded._doc.id;
                    ev.save((err) => {
                        console.log('checked');
                        if (err){
                            console.log(err);
                            res.json({ message: 'Buy failed.'});
                        } else {
                            res.json({ message: 'Buy successfully'});
                        }   
                    });
                }
            });
        });
        
    }
});

//Show ticket da mua
router.get('/buyHistory', (req,res) => {
    if (req.decoded._doc.admin) {
        res.json({message: 'Admin khong the mua ve'});
    } else {
        Event.find({}, (err,events) => {
            if (err) console(err)
            else {
                let listTickets = [];
                let listEvents = events.map((ev) => {
                    let tickets = ev.tickets;
                    let ticketA = 0;
                    let ticketB = 0;
                    let check = false;
                    tickets.map((ticket) => {
                        if (ticket.buyer == req.decoded._doc.id){
                            check = true;
                            if (ticket.kind == 'A'){
                                ticketA++;
                            } else ticketB++;
                        };
                    });
                    if (check)
                        listTickets.push({
                            EventID: ev._id,
                            name: ev.name,
                            desc: ev.desc,
                            date: ev.date,
                            TicketA: ticketA,
                            TicketB: ticketB
                        });
                    });
                res.end(JSON.stringify(listTickets));
            }
        });
    }
});

//show events
app.get('/events', (req,res) => {
    Event.find({}, (err, events) => {
        if (err) console.log(err);
        else {
            /*let listEvents = events.map((ev) => {
                let tickets = ev.tickets;
                let ticketA = 0;
                let ticketB = 0;
                tickets.map((ticket) => {
                    if (ticket.buyer == null){
                        if (ticket.kind == 'A'){
                            ticketA++;
                        } else ticketB++;
                    };
                })
                return {
                    EventID: ev._id,
                    name: ev.name,
                    desc: ev.desc,
                    date: ev.date,
                    TicketA: ticketA,
                    TicketB: ticketB
                };
            });
            res.end(JSON.stringify(listEvents));*/
            res.end(JSON.stringify(events));
        }
    })
});
app.listen(port);
console.log('connected at port '+port);
