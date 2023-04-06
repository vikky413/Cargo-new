const express = require("express");
const path = require("path");
const app = express();
// const hbs = require("hbs")
const ejs = require("ejs");
require("./db/connect");
const userModel = require("./models/student");
const productModel = require("./models/product");
const categoryModel = require("./models/category");
const locationModel = require("./models/locations");
const priceModel = require("./models/price");
const feedbackModel = require('./models/feedback');
const paymentModel = require("./models/paymentss");
const otpModel = require("./models/otp")
var jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer')

const port = process.env.PORT || 5000;

const static_path = path.join(__dirname, "../public");
const temp_path = path.join(__dirname, "../templates/views");
// const part_path = path.join(__dirname, "../templates/partials");
// const part_path = path.join(__dirname, "../templates/partial");

function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem("userToken");
  try {
    var decoded = jwt.verify(userToken, "loginToken");
  } catch (err) {
    res.redirect("/");
  }
  next();
}

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set("view engine", "ejs");
app.set("views", temp_path);
// ejs.registerPartials(part_path);

app.get("/", (req, res) => {
    res.render('index')
});


app.post('/mail', async (req,res)=> {
 
  const code = req.body.code;

  const checkUser = otpModel.findOne({ code:code });
  checkUser.exec((err, data) => {
   if(data) {
    const gmail= data.email;
    res.render('generate',{title:"Create New Password",msg:'',gmail:gmail,succ:''})
   }
   else {
    res.render('forget',{ title: 'College Dunia', msg: '',succ:'',gmail:'',errors:'OTP NOT MATCHED' })
   }
  })

})

app.get('/forget',  (req,res)=> {
  res.render('forget',{ title: 'College Dunia', msg: '',succ:'',email:'',errors:'' })
})
app.get('/generate',(req,res)=> {
  res.render("generate",{title:"Create New Password",msg:'',gmail:'',succ:''})
})
app.post('/generate',async (req,res)=> {
  const email = req.body.gmail;
  const password = req.body.password;
  const confpassword = req.body.confpassword;
  if(!password || !confpassword) {
    res.render("generate",{title:"Create New Password",msg:'Please fill all details',gmail:'',succ:''})
  }
  else {
    if(password == confpassword){
      
      const checkUser = userModel.findOne({ email:email });
      await checkUser.exec((err,data)=>{
        if(err) throw err
        const id = data._id;
        var passdelete = userModel.findByIdAndUpdate(id, { password:password,
 confirmpassword:confpassword });
        passdelete.exec(function (err) {
          if (err) throw err;
          res.render("generate",{title:"Create New Password",msg:'',gmail:'',succ:'Password Reset Successfully'});
        });
      })
  
 
    }
    else {
      res.render("generate",{title:"Create New Password",msg:'Password and confirm password not matched',gmail:''});
    }
  }
})

app.post('/forget', async (req,res)=> {
  var email = req.body.email;
  var minm = 100000;
  var maxm = 999999;
  var code = Math.floor(Math.random() * (maxm - minm + 1)) + minm;
  var expiryt = new Date().getTime() + 300*1000;
  const checkUser = userModel.findOne({ email:email });
  checkUser.exec((err, data) => {
   if(data){

    var userDetails = new otpModel({
    
      email:email,
      code:code,
      expiryt:expiryt
      
    });
    userDetails.save((err, doc) => {
      if (err) throw err;
      res.render('forget',{title:"college dunia", msg:"",succ:'OTP send in your mail',gmail:email,errors:''});
   
    });


    let transporter = nodemailer.createTransport({
    service:"gmail",
    auth : {
      user:"bhimanpallyd@gmail.com",
      pass:"zedvjyfuldrbxvoh"
    },
    tls:{
      rejectUnauthorized:false
    }
  })
  
  let mailOptions = {
    from: "bhimanpallyd@gmail.com",
    to: email,
    subject:"OTP FOR Cargo",
    text:`Your OTP For Cargo Management System :  ${code}`
  }

  transporter.sendMail(mailOptions,(err,success)=>{
  if(err) {
    throw err;
  }
  else {
    console.log("successfully sent")
  }
  })
  }
  else {
    res.render("forget",{title:"college dunia", msg:"Email not exist",succ:'',errors:''})
  }
  })

})



app.get("/dashboard", checkLoginUser,async (req, res) => {
  var loginUser = localStorage.getItem("loginUser");
  if (loginUser) {
  const us = userModel.findOne({ email: loginUser });
  const pd = productModel.find({ email: loginUser });
  const cat = categoryModel.find({})
  const loc = locationModel.find({})
  const rps = priceModel.find({})
   try {
    let getu = await us.exec()
    let pds = await pd.exec()
    let loct = await loc.exec()
    let cats = await cat.exec()
    let paisa = await rps.exec()
    
    res.render("dashboard",{msg:'',getu:getu,pds:pds,locts:loct,categ:cats,paise:paisa,loginUser:loginUser});
   }
   catch(err) {
    throw Error();
  }

  } else {
    res.render("loginForm",{msg:''});
  }
});

app.get('/invoice', async (req,res)=> {
  var loginUser = localStorage.getItem("loginUser");
  const pd = productModel.find({ email: loginUser });
  const usd = userModel.findOne({email:loginUser})

 try {
  const pds = await pd.exec();
  const uds = await usd.exec()
  res.render('invoice',{pdata:pds,udata:uds})
 }
 catch(err) {
  throw Error();
}
  
})

app.get("/tracking", checkLoginUser, async (req, res) => {
  var loginUser = localStorage.getItem("loginUser");
  console.log(loginUser)
  const getpass = productModel.find({})
  const getu = userModel.findOne({email:loginUser})
  try {
    let getdata = await getpass.exec();
    let gotu = await getu.exec()
    console.log(getdata)
    res.render('tracking',{data:getdata,got:gotu})
  }
  catch(err) {
    throw Error();
  }
});

app.get("/loginForm", (req, res) => {
  res.render("loginForm",{msg:''});
});

app.get("/PayNowForm", (req, res) => {
  res.render("PayNowForm");
});



app.post("/signup", function (req, res, next) {
  var fname = req.body.fname;
  var lname = req.body.lname;
  var email = req.body.email;

  var dob = req.body.dob;
  var pnumber = req.body.pnumber;
  var password = req.body.password;
  

  if(!fname || !lname || !email || !dob || !pnumber || !password ){
    res.render("loginForm",{msg:'Please Fill all details'})
    console.log("Please Fill all details")
  }
  else {
 
    var userDetails = new userModel({
      fname:fname,
      lname:lname,
      dob:dob,
      pnumber:pnumber,
      email: email,
      password: password,
      
    });
    userDetails.save((err, doc) => {
      if (err) throw err;
      res.render("loginForm",{msg:'SuccessFully Store'});
      console.log("SuccessFully Store");
    });
  
}
});

app.post("/productl",async (req, res) => {
  var loginUser = localStorage.getItem("loginUser");
  const rps = priceModel.find({})
  const ps = await rps.exec()
  var PName = req.body.PName;
  var PWeight = req.body.PWeight;
  var lfrom = req.body.lfrom;
  var lto = req.body.lto;
  var price = PWeight * ps[0].pais;
  var email = loginUser;
  if(!loginUser || !PName || !PWeight || !lfrom || !lto || !price || !email){
    res.redirect('/dashboard')
  }
  else {
  if(lfrom === lto){
    res.redirect('/fail')
  }
  else {

 
  var userDetails = new productModel({
    PName: PName,
    PWeight: PWeight,
    lfrom: lfrom,
    lto: lto,
    price: price,
    email:email
  });
  userDetails.save((err, doc) => {
    if (err) throw err;
    res.redirect("/invoice")
    console.log("SuccessFully Store");
  });
}
}
});

app.get('/fail',(req,res)=>{
  res.render('fail')
})

app.post("/add-new-category", (req,res)=> {
  const category = req.body.category;
  if(!category){
    res.render('/admin')
  }
  else {
    var userDetails = new categoryModel({
     category:category
    });
    userDetails.save((err, doc) => {
      if (err) throw err;
      res.redirect("/admin")
      console.log("SuccessFully Store");
    });
  }
})

app.post("/location", (req,res)=> {
  const locate = req.body.locate;
  if(!locate){
    res.render('/admin')
  }
  else {
    var userDetails = new locationModel({
     locate:locate
    });
    userDetails.save((err, doc) => {
      if (err) throw err;
      res.redirect("/admin")
      console.log("SuccessFully Store");
    });
  }
})

app.post("/prices",async (req,res)=> {
  const price = req.body.price;
  if(!price){
    res.render('/admin')
  }
  else {
    const ras = priceModel.find({})
    const pas = await ras.exec()
    const id = pas[0]._id;
    var update_passCat= priceModel.findByIdAndUpdate(id,{pais:price});
    update_passCat.exec(function(err,doc){
       if(err) throw err;
    
   res.redirect('/dashboard');
     });
  }


  // ONLY ONE TIME UNCOMMENT THIS PART
//   else {
//     var userDetails = new priceModel({
//      pais:price
//     });
//     userDetails.save((err, doc) => {
//       if (err) throw err;
//       res.redirect("/admin")
//       console.log("SuccessFully Store");
//   });
//  }
})


app.get("/payment",(req,res)=> {
  res.render("payment")
})

app.get("/cat/delete/:id",(req,res)=> {
  var passcat_id = req.params.id;
  var passdelete = categoryModel.findByIdAndDelete(passcat_id);
  passdelete.exec(function (err) {
    if (err) throw err;
    res.redirect('/admin');
  });
})

app.get("/prod/delete/:id",(req,res)=> {
  var passcat_id = req.params.id;
  var passdelete = userModel.findByIdAndDelete(passcat_id);
  passdelete.exec(function (err) {
    if (err) throw err;
    res.redirect('/admin');
  });
})


app.get("/loc/delete/:id",(req,res)=> {
  var passcat_id = req.params.id;
  var passdelete = locationModel.findByIdAndDelete(passcat_id);
  passdelete.exec(function (err) {
    if (err) throw err;
    res.redirect('/admin');
  });
})

app.get('/cancel',(req,res)=> {
  res.render()
})
app.get('/contact',(req,res)=> {
  res.render('contact',{msg:''})
})

app.get("/ord/delete/:id",(req,res)=> {
  var passcat_id = req.params.id;
  var passdelete = productModel.findByIdAndDelete(passcat_id);
  passdelete.exec(function (err) {
    if (err) throw err;
    res.redirect('/cancel');
  });
})

app.post("/login", (req, res) => {
  var email = req.body.email;
  const password = req.body.password;
  const checkUser = userModel.findOne({ email: email });
  checkUser.exec((err, data) => {
    if (data == null) {
      res.redirect('/fails')
    } else {
      if (err) throw err;
      var getUserID = data._id;
      var getPassword = data.password;
      console.log(getPassword);
      if (password === getPassword) {
        var token = jwt.sign({ userID: getUserID }, "loginToken");
        localStorage.setItem("userToken", token);
        localStorage.setItem("loginUser", email);
        if(email == "real@gmail.com" && password == "123456"){
          res.redirect('admin')
        }else {
          res.redirect("dashboard");
        }
      
      } else {
       res.redirect('/fails')
      }
    }
  });
});

app.get('/admin',async (req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  if(loginUser) {
   const pde = productModel.find({})
   const pu = userModel.find({})
   const cat = categoryModel.find({})
   const loc = locationModel.find({})
   const rps = priceModel.find({})
   const pay = paymentModel.find({})
   try {
    let pdsd =await pde.exec();
    let pus =await pu.exec()
    let cats = await cat.exec()
    let loct = await loc.exec()
    let pasa =await rps.exec()
    let paid = await pay.exec()
    res.render('admin',{pd:pdsd,pus:pus,cate:cats,locts:loct,paises:pasa,paids:paid,loginUser:loginUser})
   }
   catch(err) {
    throw Error();
  }
   
  }
  else {
    res.render('index')
  }

})
app.get('/logout', function (req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  res.redirect('/');
});

app.get('/details',(req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    const getPassCat = productModel.find({})
    getPassCat.exec(function (err, data) {
      if (err) throw err;
      res.render('details', { title: 'Cargo Management System', loginUser: loginUser, records: data });
    })
  }
  else {
    res.redirect('/login')
  }
})
app.get('/users',(req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    const getPassCat = userModel.find({})
    getPassCat.exec(function (err, data) {
      if (err) throw err;
      res.render('users', { title: 'Cargo Management System', loginUser: loginUser, records: data });
    })
  }
  else {
    res.redirect('/login')
  }
})
app.get('/pass',(req,res)=> {
  res.render('pass')
})

app.post('/payments',(req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  const name = loginUser;
  const tid = Math.floor(Math.random() * 100000000);
  var userDetails = new paymentModel({
  name:name,
  tid:tid
  });
  userDetails.save((err, doc) => {
    if (err) throw err;
    res.redirect('/pass')
    console.log("SuccessFully Store");
  });
 
})

app.post('/feedbacks',(req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  const name = req.body.name;
  const email = req.body.email;
  const feedback = req.body.feedback;
  
  var userDetails = new feedbackModel({
  name:name,
  email:email,
  feedback:feedback
  });
  userDetails.save((err, doc) => {
    if (err) throw err;
   res.render('contact',{msg:"Feedback saved SuccessFully"})
  
  });
 
})


app.get('/fails',(req,res)=> {
  res.render('fails')
})

app.post('/paymentp',(req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  const name = loginUser;
  const tid = Math.floor(Math.random() * 100000000);
  var userDetails = new paymentModel({
  name:name,
  tid:tid
  });
  userDetails.save((err, doc) => {
    if (err) throw err;
    res.redirect('/pass')
    console.log("SuccessFully Store");
  });
 
})

app.post('/paymentu',(req,res)=> {
  var loginUser = localStorage.getItem('loginUser');
  const name = loginUser;
  const tid = Math.floor(Math.random() * 100000000);
  var userDetails = new paymentModel({
  name:name,
  tid:tid
  });
  userDetails.save((err, doc) => {
    if (err) throw err;
    res.redirect('/pass')
    console.log("SuccessFully Store");
  });
 
})



app.listen(port, () => {
  console.log(`server is running at port no. ${port}`);
});
