const express = require('express');
const cookieParser = require("cookie-parser")
const csurf = require("csurf")
const csrfProtection = csurf({ cookie: { httpOnly: true } })
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
const Token = require('./model/token');
const TokenOwner = require('./model/tokenOwner');


require('dotenv').config();


const JWT_SECRET = process.env.JWT_TOKEN;
mongoose.connect('mongodb://localhost:27017/codeftjs');
const app = express();

// middleware
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static(__dirname + '/static'));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'pug');


// Token checker middleware
function mustBeLoggedIn(req, res, next) {
  jwt.verify(req.cookies.cookieToken, JWT_SECRET, function (err) {
    if (err) {
      res.redirect("/signin")
    } else {
      next()
    }
  })
}

function NotLoggedIn(req, res, next) {
  jwt.verify(req.cookies.cookieToken, JWT_SECRET, function (err) {
    if (err) {
      next();
    } else {
      res.send("sorry, you are alredy loged in");
    }
  })
}

function parseJwt (token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

//routing

//get requests
app.get('/signup', NotLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/signup.html'));
})

app.get('/upload', mustBeLoggedIn, csrfProtection, (req, res) => {
  res.render('uploadfile.pug');
})

app.get('/signin', NotLoggedIn, (req, res) => {
  res.render('signin.pug');
})

app.get('/profile', mustBeLoggedIn, async (req, res) => {
  const user = parseJwt(req.cookies.cookieToken);
  const username = user.username;
  const userMetamask = user.metamask_address;
  const publicProjects = await Token.find({owner_address: userMetamask});
  console.log(user);
  console.log(publicProjects);
  res.render('account.pug', {
    username, userMetamask, publicProjects,
  });
})


app.get('/projectlist', async (req, res) => {
  let is_auth = false;
  if (req.cookies.cookieToken) is_auth = true;
  const data = await Token.find({});
  const name = 'elmir';
  console.log(data);
  res.render('index.pug', {
    data, is_auth,
  });
})


app.get('/', function(req, res){
  res.download('Unknown_file.txt', function(error){
      console.log("Error : ", error)
  });
})


app.get("/logout", (req, res) => {
  res.clearCookie("cookieToken")
  res.send('Everything is working');
})


app.get('/check', mustBeLoggedIn, (req, res) => {
  console.log(req.cookies.cookieToken);
  console.log(parseJwt(req.cookies.cookieToken).username);
  res.send('Everything is working');
})


//post requests
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).lean();

  if(!user){
    return res.json({ status: 'error', error:"Invalid username/password"});
  }

  if (await bcrypt.compare(password, user.password)){
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        username: user.username,
        metamask_address: user.metamask_address
      }, 
      JWT_SECRET
    );
    res.cookie("cookieToken", token, { httpOnly: true , sameSite: 'None', secure: true});
    return res.json(200);
  }
  res.json({ status: 'error', error:"Invalid username/password"});
})


app.post('/signup', async (req, res) => {
  console.log(req.body);
  const { email, username, password:plainTextPassword, metamask_address } = req.body;
  if (!username || typeof username !== 'string'){
    return res.json({ status: 'error', error:'Invalid username' });
  }
  if (!plainTextPassword || typeof plainTextPassword !== 'string'){
    return res.json({ status: 'error', error:'Invalid password' });
  }
  if (plainTextPassword.length < 8){
    return res.json({ status: 'error', error:'Your password is to small' });
  }
  const password = await bcrypt.hash(plainTextPassword, 10);
  try{
    const response = await User.create({
        email,
        username,
        password,
        metamask_address
    });
  } catch (error){
      if (error.code === 11000){
        return res.json({ status: 'error', error: "Username already in use"});
      }
      throw error;
  }
  res.json(200);
})


app.post('/upload', async (req, res) =>{
  let sampleFile;
  let uploadPath;
  const metamask_address = parseJwt(req.cookies.cookieToken).metamask_address;

  const username = parseJwt(req.cookies.cookieToken).username;
  
  const token_address = "1542952341234"; //todo - use ethers js for get the token adress 

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  
  sampleFile = req.files.file;
  const { numberOfTokens, info, projectName, price } = req.body;
  console.log(metamask_address);
  console.log(req.body)
  sampleFile.name = projectName + '.zip';
  uploadPath = __dirname + '/uploads/' + sampleFile.name;
  console.log(uploadPath);

  try{
    const response = await Token.create({
        username: username,
        owner_address: metamask_address,
        token_address: token_address,
        path_to_file: uploadPath,
        total_number: numberOfTokens,
        info: info,
        project_name: projectName,
        price: price,
        
    });
    res.send({status: true, message: 'File is uploaded'});
    sampleFile.mv(uploadPath, async function(err) {
      if (err)
        return res.status(500).send(err);
    });
  } catch (error){
      throw error;
  }
  
});


app.listen(4000, () => {
  console.log('Server up at 4000');
})