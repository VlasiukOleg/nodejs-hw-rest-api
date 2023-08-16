const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const path = require('path');
const {nanoid} = require('nanoid');
const fs = require('fs/promises');
const Jimp = require('jimp');

const User = require('../models/users');

const {HttpError, sendEmail} = require('../helpers')

const dotenv = require('dotenv');
dotenv.config();

const {SECRET_KEY, BASE_URL} = process.env;

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

const emailSchema = Joi.object({
    email: Joi.string().pattern(emailRegex).required(),
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
        const verificationToken = nanoid();
        
        const newUser = await User.create({...req.body, password: hashPassword, avatarUrl, verificationToken });

        const verifyEmail = {
            to: email,
            html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Verify your email<a/>`
        }

        await sendEmail(verifyEmail);

        res.status(201).json({user: {id: newUser._id, email: newUser.email, subscription: 'starter'}});
        
    } catch (error) {
        next(error);
    }
}

const verifyEmail = async (req,res,next) => {
    try {
        const {verificationToken} = req.params;
        const user = await User.findOne({verificationToken});
        if (!user) {
            throw HttpError(404, 'User not found')
        }
        await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: null})
        res.status(200).json({
            message: 'Verification successful'
        })

    } catch (error) {
        next(error);
    }
}

const resendEmail = async (req,res,next) => {
    try {
        const {error} = emailSchema.validate(req.body);
        if (error) {
            throw HttpError(400);
        }
        const {email} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            throw HttpError(400, "Email not found");
        }
        if (user.verify) {
            throw HttpError(400, "Verification has already been passed")
        }
        const verifyEmail = {
            to: email,
            html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Verify your email<a/>`
        }
        await sendEmail(verifyEmail);
        res.status(200).json({
            message: 'Verification email sent'
        })



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
        if (!user.verify) {
            throw HttpError(401, "Email not verified")
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


const remove = async (req, res, next) => {
    try {
      const {userId} = req.params
      const contact = await User.findOneAndDelete({_id:userId});
      if (!contact) {
        throw HttpError(404)
      }
      res.json(contact)
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
    remove,
    verifyEmail,
    resendEmail,
}