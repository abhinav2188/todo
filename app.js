const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

mongoose.connect('mongodb://localhost:27017/todo',{ useUnifiedTopology: true , useNewUrlParser: true });

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static('public/'));

app.set('view engine', 'ejs');

app.listen(3000,function(){
  console.log("server started at port 3000");
});

//schemas and models
const itemSchema = new mongoose.Schema({
  name : {
    type: String,
    required: [true,'required'],
  }
});
const Item = mongoose.model('item',itemSchema);
const listSchema = new mongoose.Schema({
  name:String,
  items : [itemSchema]
});
const List = mongoose.model('list',listSchema);
let defaultItems = [
  {
    name:'default item'
  }
];

var date = new Date().toLocaleString('en-US' , {
  weekday : 'long',
  month: 'long',
  day: '2-digit',
});

// default route - get
app.get('/',function(req,res){
  Item.find({},function(err,founditems){
    res.render("list",{
      items : founditems,
      listTitle : date
    });
  });
});

// adding item in a list
app.post('/add-item',(req,res) => {
  let newItem = req.body.newItem;
  let listTitle = _.lowerCase(req.body.list);
  let item = new Item({
    name : req.body.newItem
  });
  if(listTitle === date){
    item.save();
    res.redirect('/');
  }else{
    List.findOne({name:listTitle},function(err,foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect('/'+listTitle);
      }
    });
  }
});

// deleting item from list
app.post('/delete-item/:id' , (req,res) => {
  let id = req.params.id;
  let listTitle = _.lowerCase(req.body.list);
  if(listTitle === date){
    Item.deleteOne({_id : id} ,function(err){
      if (err)
      console.log("error in deleting item");
    });
    res.redirect('/');
  }else{
    List.updateOne({name:listTitle},{$pull:{items:{_id:id}}}, function(err){
      if(err)
      console.log("error in deleting item");
    });
    res.redirect('/'+listTitle);
  }
});


// custom list route
app.get('/:customListTitle',(req,res)=>{

  let customListTitle = _.lowerCase(req.params.customListTitle);

  List.findOne({name:customListTitle} , (err,foundList)=>{
    if(!err){
      if(!foundList){
        let list = new List({
          name: customListTitle,
          items : defaultItems
        });
        list.save();
        res.redirect('/'+customListTitle);
      }
      else{
        res.render('list',{
          listTitle : _.startCase(foundList.name),
          items : foundList.items
        });
      }
    }
  });

});
