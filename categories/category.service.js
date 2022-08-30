import Category from './category.model.js';
import { categorySchema } from './category.validation.js';
import user from '../user/user.model.js';
import Note from '../notes/notes.model.js';
import globalService from '../utils/globalService.js';
const GlobalService = new globalService();
class Service {
    constructor() {}

    async deleteCategory(params, header) {
        // const categoryID = params.categoryId;
        //get logged in user
        // const authHeader = req.headers['authorization'];
        const id = GlobalService.getUser(header);
        //check if category exists
        const category = await Category.find({
            creatorID: id,
            _id: params.categoryId,
        });
        //return message if it doesnt
        if (!category) throw new Error('notfound..');

        //find all notes that have used the category that is about to be deleted
        const notes = await Note.find({
            creatorID: id,
            category: params.categoryId,
        });

        //if the user has used this category at least once
        if (notes.length > 0) {
            //delete all notes that have used it
            await Note.deleteMany({
                creatorID: id,
                category: params.categoryId,
            });
            //then delete the category
            return await Category.deleteOne({
                creatorID: id,
                _id: params.categoryId,
            });

            // return res.status(200).json({
            //     success: true,
            //     message: `All notes with ${category.categoryName} category have been deleted.`,
            // });
        } else {
            //if the category was never used, delete category directly
            return await Category.deleteOne({
                creatorID: id,
                _id: params.categoryId,
            });

            // return res.status(200).json({
            //     success: true,
            //     message: 'Category deleted.',
            // });
        }
    }
    async addCategory(header, body) {
        // const authHeader = req.headers['authorization'];
        const id = GlobalService.getUser(header);
        //validate input
        const { categoryName } = await categorySchema.validateAsync(body);
        const category = await Category.findOne({
            categoryName: categoryName,
        });

        // const UserInfo = await user.findOne({ _id: id });
        //category already exists in db
        if (category) throw new Error('confict');
        const UserInfo = await user.findOne({ _id: id });
        //create new category document
        const categ = new Category({
            categoryName: categoryName,
            creatorID: id,
            creatorName: UserInfo.name,
            creatorEmail: UserInfo.email,
        });
        //save in collection
        return await categ.save();
    }
    async getCategories(header) {
        const id = GlobalService.getUser(header);
        return await Category.find({ creatorID: id }).sort({
            updatedDate: -1,
        });
    }
    async editCategory(params, body) {
        //validate updated user input
        const newCategory = await categorySchema.validateAsync(body);
        return await Category.updateOne(params.categoryId, newCategory, {
            new: true,
            runValidators: true,
        });
    }
}

export default Service;
