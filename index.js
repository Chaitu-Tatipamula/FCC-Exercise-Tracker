const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = require('mongoose')

mongoose.connect(process.env.MONGO_URI,{ 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})

const userSchema = new mongoose.Schema({
  username : {type:String , required : true},
})

const exerciseSchema = new mongoose.Schema({
  userId : {type :String , required :true},
  description :{type : String , required :true},
  duration: {type : Number , required : true},
  date : Date
})

const userModel = mongoose.model('Users' , userSchema)
const exerciseModel = mongoose.model('Exercises' , exerciseSchema)


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users',(req,res)=>{
  const username = req.body.username;
  
  userModel.findOne({username:username}).then((foundObj)=>{
    if(foundObj){
      res.json(foundObj)
  }
  else{
  const users = new userModel({username : username})
  users.save()
  res.json(users)
  }
  
})
})
app.get('/api/users' , (req,res)=>{
  userModel.find().then((foundObjs)=>{
    if(foundObjs){
      res.json(foundObjs)
    }
    else{
      res.json({error : 'None Found'})
    }
  })
})

app.post('/api/users/:_id/exercises' , (req,res)=>{
  const id = req.params._id
  const desc = req.body.description
  const duration = req.body.duration
  const date = req.body.date

  let newDate = new Date();
  // console.log(req.body);
  // console.log(desc,duration,date);

  if(date){
    newDate = new Date(date).toDateString()
  }
  else{
    newDate = new Date().toDateString()
  }
  resObj = {
    userId:id,
    description:req.body.description,
    duration : req.body.duration,
    date : newDate
  }

  let newExercise = new exerciseModel(resObj)

  userModel.findById(id).then((foundObj)=>{
   
    if(foundObj){
      newExercise.save()
    console.log(foundObj._id);
    res.json({
      _id : foundObj._id,
      username : foundObj.username,
      description : newExercise.description,
      duration : newExercise.duration,
      date : new Date(newExercise.date).toDateString()
    })
    }
      
  }) 


})

app.get('/api/users/:_id/logs',(req,res)=>{
  let userId = req.params._id

  let resObj={}
  let limitParam = req.query.limit
  let fromParam = req.query.from
  let toParam = req.query.to

  limitParam = limitParam? parseInt(limitParam):limitParam

  userModel.findById(userId).then((userFound)=>{
    if(userFound){
      let userId = userFound._id;
      let username = userFound.username

      resObj ={
        _id : userId,
        username : username
      }

      let queryObj ={
        userId : userId
      }

      if(fromParam||toParam){
        queryObj.date = {}
        if(fromParam){
          queryObj.date['$gte'] =fromParam
        }
        if(toParam){
          queryObj.date['$lte']= toParam
        }
      }
      
      exerciseModel.find(queryObj).limit(limitParam).then((foundObjs)=>{
        foundObjs = foundObjs.map((x)=>{
         return {
          description : x.description,
          duration : x.duration,
          date : x.date.toDateString()
         }
          
        })
        if(foundObjs){
          resObj.log=foundObjs
          resObj.count = foundObjs.length
          res.json(resObj)
        }
      })

    }
  })
  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
