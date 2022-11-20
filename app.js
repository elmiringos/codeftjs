const express = require('express');
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

//routing

//get requests
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/register.html'));
})

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/upload_file.html'));
})

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/login.html'));
})

app.get('/sign_up', (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/signup.html'));
})

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname + '/templates/index.html'));
})

app.get('/', function(req, res){
  res.download('Unknown_file.txt', function(error){
      console.log("Error : ", error)
  });
})


//post requests
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();

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
    return res.json({ status: 'ok', data: token});
  }
  
  res.json({ status: 'error', error:"Invalid username/password"});
})


app.post('/test', async (req, res) => {
  console.log(req.body)
	const { token } = req.body

	try {
		const user = jwt.verify(token, JWT_SECRET);

    console.log(user);


	} catch (error) {
		console.log(error);
		res.json({ status: 'error', error: ';))' });
	}
})


app.post('/register', async (req, res) => {
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
  res.json({satatus: 'ok'});
})


app.post('/upload', function(req, res) {
  let sampleFile;
  let uploadPath;
  let token_address;

  console.log(req.body);

  // const { token } = req.body;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/uploads/' + sampleFile.name;

  console.log(uploadPath);
  // const user = jwt.verify(token, JWT_SECRET);
  // console.log(user);
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});





app.listen(8000, () => {
  console.log('Server up at 8000');
})