const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ItemSchema = new Schema({
   
   title:{
         type: String,
         required: true  
   },
   description:{
         type: String,
   },   
    email: {
        type: String,
        index:true,
        required: true
    },
    status: {
            type: String,
            default: 'incomplete'
      } 
});







const ModelClass = mongoose.model('items', ItemSchema);

module.exports = ModelClass;