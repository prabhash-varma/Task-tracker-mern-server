const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const UserSchema = new Schema({
   
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        index:true,
        required: true
    },
    country:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
    
});



UserSchema.pre('save', async function(next) {
    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password,salt);
        this.password = hashedPassword;
        next();

    }
    catch(err){
        console.log(err);
    }
});



const ModelClass = mongoose.model('users', UserSchema);

module.exports = ModelClass;