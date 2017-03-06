var adminuser = 'delpast';
var adminpass = '123456';
var server = 'localhost';
var port = '27017';
var dbName = 'testmongo';



module.exports = {
    'secret' : 'nodejs',
    'database': 'mongodb://'+adminuser+':'+adminpass+'@'+server+':'+port+'/'+dbName
}   