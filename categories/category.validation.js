import Joi from '@hapi/joi';

//CATEGORY VALIDATION
export const categorySchema = Joi.object({
    categoryName: Joi.string().required(),
});
