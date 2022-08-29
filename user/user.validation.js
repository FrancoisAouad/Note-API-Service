import Joi from '@hapi/joi';

//LOGIN VALIDATION
export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(2).required(),
});
//REGISTER VALIDATION
export const signupSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).max(32).required(),
    confirmPassword: Joi.any().valid(Joi.ref('password')).required(),
});
//NEW PASSWORD VALIDATION
export const resetPassSchema = Joi.object({
    password: Joi.string().min(6).max(32).required(),
    confirmPassword: Joi.any().valid(Joi.ref('password')).required(),
});
