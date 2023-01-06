const express=require('express');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const bcrypt=require('bcrypt');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const { stringify } = require('querystring');
const mongoSession=require('connect-mongodb-session')(session);
mongoose.set('strictQuery', true);


const storage=multer.diskStorage({
    destination:function(req,file,cb){
     cb(null,path.join('./public/uploads/'))
    },
    filename:function(req,file,cb){ 
        cb(null, new Date().toISOString().replace(/:/g, '-')+file.originalname)  
    }
})


const upload =multer({storage:storage});


const app=express();

app.use(cookieParser());

session.isAuthenticated=false;


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(express.static('uploads'));

app.use(express.static('public'));

app.use(bodyParser.json());


mongoose.connect('mongodb://127.0.0.1:27017/findit',  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },);


const store=new mongoSession({
    uri:"mongodb://127.0.0.1:27017/findit",
    collection:'session',
})   


app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:false,
    cookie: { maxAge: 1000*60*60 },
    resave: false ,
    store:store,
}));

const counter={
    _id:Number,
	sequence_value: String
}

const userSchema={
    email:String,
    password:String,
}

const homeSchema={
    regio1: String,
    serviceCharge: String,
    telekomTvOffer: Number,
    newlyConst: String,
    balcony: String,
    totalRent: String,
    yearConstructed: String,
    scoutId: Number,
    noParkSpaces: String,
    hasKitchen: String,
    cellar: String,
    houseNumber: String,
    livingSpace: String,
    condition: String,
    petsAllowed: String,
    street: String,
    lift: String,
    typeOfFlat: String,
    noRooms: String,
    floor: String,
    numberOfFloors: String,
    garden: String,
    regio2: String,
    regio3: String,
    description: String,
    facilities: String,
    lastRefurbish: String,
    Rating:Number
  }



const User=mongoose.model('User',userSchema)


const Home=mongoose.model('Home',homeSchema)

app.get('/login',(req,res)=>{
    res.render('signup');
})

app.get('/signup',(req,res)=>{
    res.render('login',{message:'success'});
})

app.get('/sale/addhome',(req,res)=>{
    if(req.session.isAuthenticated){
        res.render('addhome')
    }
   else{res.redirect('/login')}
})



app.get('/home',(req,res)=>{
    let rand=Math.floor(Math.random()*50000)
    if(req.session.isAuthenticated){
        Home.find().where('scoutId').gt(rand).lt(rand+4).then(f=>{
            res.render("home",{home:f})
        })
    }else{
      res.redirect('/login');
    }
})


app.get('/rent',(req,res)=>{
    let i=0;
    let arr=[];
    let rand=Math.floor(Math.random()*50000)
    if(req.session.isAuthenticated){
        Home.find().where('scoutId').gt(rand).lt(rand+53).then((found)=>{
            let sorted=[];
            found.sort((a,b)=>{
                if(a.Rating>=b.Rating) return 1;
                if(a.Rating<b.Rating) return -1;
                else return 0;
            }).reverse();
            res.render('rent',{home:found})
        });
    }else{
      res.redirect('/login');
    }
});

app.get('/homedetails/:id',(req,res)=>{
    if(req.session.isAuthenticated){
        const id=req.params.id;
    Home.findOne({_id: id.substring(1)},function(err,found){
        let m=found;
        let foundCity=found.regio1;
        let rate=found.Rating;
        let rent=found.totalRent
        Home.find({regio1:foundCity}).where('totalRent').lt(rent).ne('0').where('Rating').gte(rate).then(f2=>{
            let s2=f2;
            s2.sort((a,b)=>{
                if(a.totalRent>=b.totalRent){
                    return 1
                }
                else if(a.totalRent<b.totalRent){
                    return -1
                }
                else if(a.totalRent==='NA' || b.totalRent=='NA'){
                    return -1
                }
                else{
                    return 0
                }
            }).reverse();
            let c=s2.slice(0,20)
            res.render('product',{home:m,ext:c});
    })
        })
    }else{
        res.redirect('/login')
    }
})

app.get('/logout',(req,res)=>{
       req.session.destroy();
       res.redirect('/signup');
})

app.post("/signup", async function (req, res) {
    if (req.body.pass === req.body.cpass) {
        const hashedPass = await bcrypt.hash(req.body.cpass, 12)
        const data = new User({
            email: req.body.mail,
            password: hashedPass,
        })
        data.save();
        res.redirect('/login');
    }
    else {
        res.render("signup", { message: 'fail' });
    }
})

app.post('/login',async function(req,res){
    try {
        const user = await User.findOne({ email: req.body.mail });
        if (user) {
            const cmp = await bcrypt.compare(req.body.pass, user.password);
            if (cmp) {
                req.session.isAuthenticated=true;
                res.redirect('/home');
            }
            else {
                res.send("wrong pass");
            }
        }
        else {
            res.send("wrong username or pass");
        }
    } catch (error) {
        console.log(error);
    }
})

app.post('/rent',(req,res)=>{
    
})

app.post('/sale/addhome',upload.array('pictures',3),(req,res)=>{
    const home1=new Home({
        prname:req.body.pname,
        prtype:req.body.ptype,
        prstatus:req.body.pstatus,
        prbhk:req.body.pbhk,
        prcity:req.body.pcity,
        prprice:req.body.pprice,
        praddress:req.body.paddress,
        mail:req.body.mailid,
        prnumber:req.body.pnumber,
        image:req.files
    })
    home1.save();
    res.redirect('/home')
})
















   app.listen(3000,()=>{
       console.log('server started')
   })