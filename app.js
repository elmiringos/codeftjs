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

// Token checker middleware
function mustBeLoggedIn(req, res, next) {
  jwt.verify(req.cookies.cookieToken, JWT_SECRET, function (err) {
    if (err) {
      res.redirect("/login")
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


//routing

//get requests
app.get('/signup', NotLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/signup.html'));
})

app.get('/upload', mustBeLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/upload_file.html'));
})

app.get('/signin', NotLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/signin.html'));
})

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/index.html'));
})

app.get('/', function(req, res){
  res.download('Unknown_file.txt', function(error){
      console.log("Error : ", error)
  });
})

app.get('/check', mustBeLoggedIn, (req, res) => {
  res.send('hello_authorizted_man');
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


app.post('/upload', (req, res) =>{
  let sampleFile;
  let uploadPath;

  const token_address = "2131"; //todo - use ethers js for get the token adress 

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  
  sampleFile = req.files.file;
  const { metamask_address, numberOfTokens, info, projectName } = req.body;
  console.log(metamask_address);
  sampleFile.name = projectName + '.zip';
  uploadPath = __dirname + '/uploads/' + sampleFile.name;
  console.log(uploadPath);

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, async function(err) {
    if (err)
      return res.status(500).send(err);
    try{
      const response = await Token.create({
          metamask_address: metamask_address,
          token_address: token_address,
          path_to_file: uploadPath,
          total_number: numberOfTokens,
          info: info,
          project_name: projectName,
          
      });
      res.send({status: true, message: 'File is uploaded'});
    } catch (error){
        throw error;
    }
  });
});




app.listen(4000, () => {
  console.log('Server up at 8000');
})