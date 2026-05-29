import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{type:String, required:true,trim:true},
    email:{type:String, required:true,trim:true,unique:true},
    password:{type:String, required:true},
    plan:{type:String, required:true,enum:['free','pro'], default:'free'},
    analyseCount:{type:Number, default:0},
    lastDare:{type:Date, default:null},
  
},{timestamps:true});

const User=mongoose.model('User',userSchema);

export default User;