import User from "../model/model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
//Jwt
const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"30d"})
}

//register user
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({message:"All fields are required"});
        }
        //existed user
        const existtingUser =await User.findOne({email});
        if(existtingUser){
            return res.status(400).json({message:"User already exists"});
        }
        const passwordHash =await bcrypt.hash(password, await bcrypt.genSalt(10));

        //create user
        const newUser =await User.create({
            name,email,password:passwordHash
        })
        const token=generateToken(newUser._id)
        res.status(201).json({success:true,token,newUser})
    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
}

//login 

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if ( !email || !password) {
            return res.status(400).json({message:"All fields are required"});
        }
        //find user
        const findUser =await User.findOne({email});
        if(!findUser){
            return res.status(400).json({message:"Invalid Crediantials"});
        }
        //check pass 
        const match=await bcrypt.compare(password,findUser.password)

        if(!match){
             return res.status(400).json({message:"Wrong pass"});
        }

        const passwordHash =await bcrypt.hash(password, await bcrypt.genSalt(10));

       
        const token=generateToken(findUser._id)
        res.status(201).json({success:true,token,findUser})
    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
}

//get current user

export const getUser = async (req, res) => {
    try {
        
        const user=await User.findById(req.userId).select("-password");
        if(!user){
             return res.status(400).json({message:"Wrong pass"});
        }
        res.json({success:true,user})

    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
}
