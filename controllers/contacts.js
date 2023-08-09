const Joi = require('joi');

const Contact = require('../models/contact')

const {HttpError} = require('../helpers')

const addSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    favorite: Joi.boolean(),
 })

 const addSchemaFavorite = Joi.object({
    favorite: Joi.boolean().required(),
})


 const getAll =  async (req, res, next) => {
        try {
        const {_id: owner} = req.user;
        const {page = 1, limit = 20, favorite} = req.query;
        const skip = (page-1) * limit; 
        
        const query = {owner};
        if (favorite !== undefined) {
          query.favorite = favorite;
        }
        console.log(query);

        const allContacts =  await Contact.find(query, '-createdAt -updatedAt', {skip,limit,}).populate('owner', 'email');
        res.json(allContacts);
        } catch (error) {
          next(error);
        }
 }

 const getById = async (req, res, next) => {
    try {
      const {contactId} = req.params;
      const contactByID = await Contact.findById(contactId);
      if (!contactByID) {
        throw HttpError(404, 'Not Found');
      }
      res.json(contactByID)
    } catch (error) {
      next(error);
     
    } 
  }

  const add = async (req, res, next) => {
    try {
      const {error} = addSchema.validate(req.body);
      if (error) {
        throw HttpError(400, error.message);
      }
      const {_id: owner} = req.user;
      const newContact = await Contact.create({...req.body, owner});
      res.status(201).json(newContact)
    } catch (error) {
      next(error);
    }
  }

  const update =  async (req, res, next) => {
    try {
      const {error} = addSchema.validate(req.body);
      if (error) {
        throw HttpError(400, error.message);
      }
      const {contactId} = req.params;
      const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
      if (!result) {
        throw HttpError(404, 'Not Found');
      }
      res.json(result)
    } catch (error) {
      next(error);
    }
  }


  const updateStatusContact = async (req,res,next) => {
    try {
      const {error} = addSchemaFavorite.validate(req.body);
      if (error) {
        throw HttpError(400, 'missing field favorite');
      }
      const {contactId} = req.params;
      const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
      if (!result) {
        throw HttpError(404, 'Not Found');
      }
      res.json(result)
    } catch (error) {
      next(error);
    }
  }

  const remove = async (req, res, next) => {
    try {
      const {contactId} = req.params;
      const result= await Contact.findByIdAndDelete(contactId);
      if (!result) {
        throw HttpError(404, 'Not Found')
      }
      res.json(result)
    } catch (error) {
      next(error);
    }
  }


 module.exports= {
    getAll,
    getById,
    add,
    update,
    remove,
    updateStatusContact
    
 }