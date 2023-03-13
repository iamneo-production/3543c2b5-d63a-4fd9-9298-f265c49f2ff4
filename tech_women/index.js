const express = require('express');
const request = require('request');
const app = express();
app.use(express.json());
const bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const path = require('path');
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();
app.get('/', function(req, res) {
    res.render("login", { msg: ""});
});
app.get('/login', function(req, res) {
    res.render("login", { msg: ""});
});
app.get('/chat', function(req, res) {
    res.render('chat', { 'chats': [] });
});
app.post('/sendchat', urlencodedParser, async function(req, res) {
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    db.collection("chat").get().then((querySnapshot) => {
        var newid = 0;
        querySnapshot.forEach(doc => {
            if (doc.data().id > newid) {
                newid = doc.data().id;
            }
        });
        var c = newid + 1;
        var i = c.toString();
        db.collection('chat').doc(i).set({ 'username': userdata.name, 'msg': req.body.msg, 'time': time, 'id': c });
        db.collection("chat").get().then((querySnapshot) => {
            var x = [];
            querySnapshot.forEach(doc => {
                console.log(doc);
                console.log(doc.data());
                x.push(doc.data());
            });
            res.render('chat', { 'chats': x });
        });
    });
});
app.get('/home', async function(req, res) {
    const candi = await db.collection('candidate').doc(userdata.email).get();
    if(!candi.exists){
        res.render('admin');
    }
    else{
        db.collection("jobposts").get().then((querySnapshot) => {
            var alljobpost = [];
            querySnapshot.forEach(doc => {
                var post = doc.data();
                if ((userdata.perferredCountry != "") && (userdata.perferredCountry.toLowerCase() != post.state.toLowerCase())) {
                    alljobpost.push(post);
                } else if ((userdata.perferredState != "") && (userdata.perferredState.toLowerCase() != post.country.toLowerCase())) {
                    alljobpost.push(post);
                } else if ((userdata.skills != "")) {
                    var x = details.skills.toLowerCase().split(',').sort();
                    var y = userdata.skills.toLowerCase().split(',').sort();
                    if (x[0] == y[0]) {
                        alljobpost.push(post);
                    }
                }
    
    
            });
            res.render("viewjobpost", { 'datas': alljobpost });
        });
    }


});
app.get('/profile', async function(req, res) {
    const candi = await db.collection('candidate').doc(userdata.email).get();
    if(!candi.exists){
        const Ref = db.collection('admin').doc(userdata.email);
        const doc = await Ref.get();
        if (!doc.exists) {
            console.log('No such document!');
        } else {
            res.render('adminprofile',{'userdata' : doc.data()});
        }
    }
    else{
        res.render('candidateprofile');
    }
});
app.get('/viewjobpost', async function(req, res) {
    db.collection("jobposts").get().then((querySnapshot)=>{
        var x=[];
        querySnapshot.forEach(doc=>{
            x.push(doc.data());
        });
        res.render("viewjobpost.ejs",{'datas' : x});
    });
});
app.get('/viewblogpost', async function(req, res) {
    db.collection("blogposts").get().then((querySnapshot) => {
        var allblogpost = [];
        querySnapshot.forEach(doc => {
            allblogpost.push(doc.data());
        });
        res.render("viewblogpost", { 'datas': allblogpost });
    });
});
app.get('/searchjob', async function(req, res) {
    const Ref = db.collection('admin').doc('divya@gmail.com');
    const doc = await Ref.get();
    if (!doc.exists) {
        console.log('No such document!');
    } else {
        var t = doc.data().reward + 5;
    }
    db.collection('admin').doc('divya@gmail.com').update({
        reward: t
    });
    var details = req.query;
    db.collection("jobposts").get().then((querySnapshot) => {
        var alljobpost = [];
        querySnapshot.forEach(doc => {
            var post = doc.data();
            var r = true,
                c = true,
                ci = true,
                co = true,
                d = true,
                s = true;
            if ((details.role != "") && (details.role.toLowerCase() != post.role.toLowerCase())) {
                r = false;
            }
            if ((details.company != "") && (details.company.toLowerCase() != post.company.toLowerCase())) {
                c = false;
            }
            if ((details.state != "") && (details.state.toLowerCase() != post.state.toLowerCase())) {
                ci = false;
            }
            if ((details.country != "") && (details.country.toLowerCase() != post.country.toLowerCase())) {
                co = false;
            }
            if ((details.duration != "") && (details.duration.toLowerCase() != post.duration.toLowerCase())) {
                d = false;
            }
            if ((details.skills != "")) {
                var x = details.skills.toLowerCase().split(',').sort();
                var y = post.skills.toLowerCase().split(',').sort();
                if (x.length != y.length) {
                    s = false;
                } else {
                    var flag = 0;
                    var i = 0
                    while (i < x.length) {
                        if (x[i] != y[i]) {
                            flag = 1;
                            s = false;
                            break;
                        }
                        i += 1;
                    }
                }
            }
            if (r && c && ci && d && s && co) {
                alljobpost.push(post);
            }


        });
        res.render("viewjobpost", { 'datas': alljobpost });
    });
});

app.post('/onaddjobpost',urlencodedParser, async function(req, res) {
    let data = req.body;
    const Ref = db.collection('admin').doc(userdata.email);
    const doc = await Ref.get();
    if (!doc.exists) {
        console.log('No such document!');
    } else {
        var t = parseInt(doc.data().reward) + 10;
    }
    db.collection('admin').doc(userdata.email).update({
        reward: t
    });
    db.collection('jobposts').add(data);
    res.render("admin.ejs");
});
app.post('/onaddblogpost',urlencodedParser, async function(req, res) {
    let data = req.body;
    const Ref = db.collection('admin').doc(userdata.email);
    const doc = await Ref.get();
    if (!doc.exists) {
        console.log('No such document!');
    } else {
        var t = parseInt(doc.data().reward) + 5;
    }
    db.collection('admin').doc(userdata.email).update({
        reward: t
    });
    db.collection('blogposts').add(data);
    res.render("admin");
});
app.get('/oncandidate', function(req, res) {
    res.render("candidatereg");
});
app.get('/onadminreg', function(req, res) {
    res.render("adminreg");
});
app.post('/oncandidatesignup', urlencodedParser, function(req, res) {
    let data = req.body;
    delete data.confirmpassword;
    const id = data.email.toString();
    db.collection('candidate').doc(id).set(data);
    res.render("login", { msg: ""});
});
app.post('/onadminsignup', urlencodedParser, function(req, res) {
    let data = req.body;
    delete data.confirmpassword;
    const id = data.email.toString();
    db.collection('admin').doc(id).set(data);
    res.render("login", { msg: ""});


});
app.post('/onlogin', urlencodedParser, async function(req, res) {
    const candi = await db.collection('candidate').doc(req.body.email).get();
    if (!candi.exists) {
        const admin = await db.collection('admin').doc(req.body.email).get();
        if(!admin.exists){
            res.render("login", { msg: "invalid user"});
        }
        else{
            userdata = admin.data();
            if (userdata.password == req.body.password) {
                res.render("admin.ejs");
            } else {
                res.render("login", { msg: "enter crt password"});
            }    
        }
    } 
    else {
        userdata = candi.data();
        if (userdata.password == req.body.password) {
            var perference = {'state' : userdata.perferredState ,'country' : userdata.perferredCountry , 'skills' : userdata.skills};
            db.collection("jobposts").get().then((querySnapshot)=>{
                var x=[];
                querySnapshot.forEach(doc=>{
                    let temp = doc.data();
                    if((perference.state != '') && (perference.country != '') &&(temp.state.toLowerCase() == perference.state.toLowerCase()) && (temp.country.toLowerCase() == perference.country.toLowerCase())&& (perference.skills != '')){
                        let t = temp.skills.split(',').sort();
                        let p = perference.skills.split(',').sort();
                        let i = 0;
                        let flag = 0;
                        if(p.length == t.length){
                            while (i < p.length) {
                                if(p[i].toLowerCase() != t[i].toLowerCase()){
                                    flag = 1
                                }
                                i++;
                            }
                            if(flag == 0){
                                x.push(temp);
                            }
                        }
                    }
            });
            res.render("sample",{'datas' : x});
        });
        } else {
            res.render("login", { msg: "enter crt password"});
        }
    }
});
app.get('/logout', function(req, res) {
    userdata = {};
    res.render("login", {  msg: "" });
});
app.get('/newuser', function(req, res) {
    userdata = {};
    res.render("newuser");
});

app.listen(8080);