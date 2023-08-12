const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const Jimp = require('jimp');

const User = require('../models/users');

const {HttpError} = require('../helpers')

const dotenv = require('dotenv');
dotenv.config();

const {SECRET_KEY} = process.env;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;


const registerSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required(),
    password: Joi.string().min(3).required(),
    subscription: Joi.string(),
})

const loginSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required(),
    password: Joi.string().min(3).required(),
})

const  subscribeSchema = Joi.object({
    subscription: Joi.string().valid('starter', 'pro', 'business').required(),
})


const register = async(req, res, next) => {
    try {
        const {error} = registerSchema.validate(req.body);
        if (error) {
            throw HttpError(400, error.message);
        }
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (user) {
            throw HttpError(409, "Email in use");
        }   
        const hashPassword = await bcrypt.hash(password,10);
        const avatarUrl = gravatar.url(email);

        
        const newUser = await User.create({...req.body, password: hashPassword, avatarUrl});

        res.status(201).json({user: {email: newUser.email, subscription: 'starter'}});
        
    } catch (error) {
        next(error);
    }
}

const login = async(req,res,next) => {
    try {
        const {error} = loginSchema.validate(req.body);
        if (error) {
;            throw HttpError(400, error.message)
        }
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            throw HttpError(401, "Email or password is wrong")
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            throw HttpError(401, "Email or password is wrong")
        }
        const payload = {
            id: user._id,
        }
        const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "24h"})
        await User.findByIdAndUpdate(user._id, {token})
        res.json({
            token,
            user: {
                email,
                subscription: user.subscription,
            }
        })

    } catch (error) {
        next(error);
    }
}


const current = (req,res,next) => {
    const {email, subscription} = req.user;
    console.log(req.user);
    res.json({
            email,
            subscription,
    })
}


const logout = async(req,res,next) => {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ""})
    res.status(204).json();
}


const updateSubscribe = async(req,res,next) => {
    try {
        const {error} = subscribeSchema.validate(req.body);
        if (error) {
        throw HttpError(400)
         }
         const {_id} = req.user;
        const result = await User.findByIdAndUpdate(_id, req.body, {new: true})
        if (!result)  {
        throw HttpError(404)
        }
        res.json(result)
    } catch (error) {
        next(error);
    }
    
}

const avatarsDir = path.join(__dirname, '../', 'public', 'avatars');

const updateAvatar = async (req,res,next) => {
    try {
        const {_id} = req.user;
        const {path: tempUpload, originalname} = req.file;
        const fileName = `${_id}_${originalname}`;
        const resultUpload = path.join(avatarsDir, fileName);
        await fs.rename(tempUpload, resultUpload);
        
        // ! Читаємо картинку. Міняємо розмір 250, висота авто. Перезаписуємо
        const avatarImage = await Jimp.read(resultUpload);
        await avatarImage.resize(250, Jimp.AUTO);
        await avatarImage.writeAsync(resultUpload);

        const avatarUrl = path.join('avatars', fileName);
        await User.findByIdAndUpdate(_id, {avatarUrl});
        res.json({
            avatarUrl,
        })

    } catch (error) {
        next(error);
    }
}







module.exports = {
    register,
    login,
    current,
    logout,
    updateSubscribe,
    updateAvatar,
}