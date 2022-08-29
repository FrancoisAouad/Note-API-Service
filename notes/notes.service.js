import Notes from '../../models/notes.js';
import path from 'path';
import user from '../../models/user.js';
import categories from '../../models/category.js';
import tagModel from '../../models/tags.js';
import { getUser } from '../../utils/getUser.js';
import { noteSchema } from '../../middleware/validation/notesValidation.js';
import mongoose from 'mongoose';
import globalServices from '../utils/globalService.js';

const GlobalServices = new globalServices();

export class Service {
    constructor() {}

    async createNote(body, files, header) {
        // const authHeader = req.headers['authorization'];
        const id = getUser(header);
        //check is note exists with creator id and noteid
        const UserInfo = await user.findOne({ _id: id });
        const __dirname = path.resolve();
        //validate input
        const { title, content, tags, category } =
            await noteSchema.validateAsync(body);
        const cat = await categories.findOne({
            categoryName: category,
            creatorID: id,
        });
        if (!cat) throw new Error('notfound..');
        const newNote = await Notes.create({
            creatorID: id,
            title: title,
            content: content,
            categoryID: cat._id,
            creatorEmail: UserInfo.email,
            creatorName: UserInfo.name,
        });

        //call helper function to add tags and create documents
        await GlobalServices.addTags(tags, newNote, UserInfo);
        //initialize image and file chaining operators

        if (files?.image) {
            const image = files?.image;
            await GlobalServices.uploadImage(image, __dirname, newNote);
            return newNote;
        }
        if (files?.file) {
            const file = files?.image;
            await GlobalServices.uploadFile(file, __dirname, newNote);
            return newNote;
        }
        return newNote;
    }
    async getNoteById(params, header) {
        const id = getUser(header);
        const note = await Notes.find({
            creatorID: id,
            _id: params.noteId,
        });
        if (!note) throw new Error('notfound');
        return note;
    }
    async deleteNote(params) {
        const note = await Notes.deleteOne(params.noteId);
        if (!note) throw new Error('notfound...');
        return note;
    }
    async getNotes(header, body, query) {
        // const authHeader = req.headers['authorization'];
        const id = getUser(header);
        // let sort = query.Sort;
        //get objectId of user
        // const loguser = await user.findOne({ _id: id });
        let sortOrder = -1;
        if (query.Sort == 'ASC') {
            sortOrder = 1;
        }
        //pagination config
        const limit = query.limit || 10;
        const page = query.page || 1;
        //defaulr param object if no filtering and searching input sent
        let params = [{ $match: { creatorID: mongoose.Types.ObjectId(id) } }];
        //general aggregation stages for all cases
        let skipObj = {
            $skip: (page - 1) * limit,
        };
        let limitObj = {
            $limit: limit,
        };
        let sortObj = {
            $sort: { updatedDate: -1 },
        };
        //user inputs tags
        if (body.tags) {
            //save body inside tags array
            let tags = body.tags;
            //set empty tags array that will store tags objectID
            let tagsArray = [];
            for (let i = 0; i < tags.length; i++) {
                const name = tags[i];
                const tagexists = await tagModel.findOne({
                    tagName: name,
                    creatorsID: { $in: id },
                });

                if (tagexists) {
                    //push id if tags exist
                    tagsArray.push(tagexists._id);
                } else if (!tagexists) {
                    return res.json({
                        message: `${name} doesnt exist on any note..`,
                    });
                }
            }
            //stage that matches all user notes with these categories
            let tagsObjMatch = {
                $match: { tags: { $in: tagsArray } },
            };
            //stage that will join tags collection to notes
            let tagsObjLookup = {
                $lookup: {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags',
                },
            };
            //final stage that will project info needed for client side
            let tagsProjectObj = {
                $project: {
                    _id: 0,
                    noteID: '$_id',
                    title: 1,
                    content: 1,
                    tags: '$tags.tagName',
                    imaage: '$imageLocation',
                    attachement: '$attachementLocation',
                    created: '$createdDate',
                    updated: '$updatedDate',
                },
            };
            //push all object into the params array as aggregation stages
            params.push(
                tagsObjMatch,
                tagsObjLookup,
                skipObj,
                limitObj,
                sortObj,
                tagsProjectObj
            );
        }
        //user inputs category
        if (query.category) {
            //save category id inside variable for query
            // const category = query.category;
            //find this specific document
            const categ = await categories.findOne({
                creatorID: id,
                _id: query.category,
            });

            if (!categ) throw new Error('notfound');
            //stage that checks all documents with this categoryid
            let ObjCategory = { $match: { categoryID: categ._id } };
            //joins tags to notes
            let categoryObjLookupTags = {
                $lookup: {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags',
                },
            };
            //joins category to notes
            let categoryLookup = {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryID',
                    foreignField: '_id',
                    as: 'categoryID',
                },
            };
            //project needed info to frontend
            let projectCategories = {
                $project: {
                    _id: 0,
                    noteID: '$_id',
                    title: 1,
                    content: 1,
                    category: { $arrayElemAt: ['$categoryID.categoryName', 0] },
                    tags: '$tags.tagName',
                    images: '$imageLocation',
                    attachement: '$attachementLocation',
                    created: '$createdDate',
                    updated: '$updatedDate',
                },
            };
            //push aggregation stages to params
            params.push(
                ObjCategory,
                categoryObjLookupTags,
                categoryLookup,
                skipObj,
                limitObj,
                sortObj,
                projectCategories
            );
        }
        //get total number of notes
        const totalNotes = await Notes.find({ creatorID: id }).count();
        //aggregation
        const notes = await Notes.aggregate(params);
        //data response
        const Total = totalNotes / page;
        return {
            success: true,
            TotalRecords: totalNotes,
            Limit: limit,
            TotalPages: Total,
            Note: notes,
            Page: page,
        };
    }
    async editNote(header, body, params) {
        // const authHeader = req.headers['authorization'];
        const id = getUser(header);
        // const noteId = req.params.noteId;
        //check is note exists with creator id and noteid
        const exists = await Notes.find({
            creatorID: id,
            _id: params.noteId,
        });
        if (!exists) throw new Error('notfound');

        //validate user input
        const { title, content, tags, category } =
            await noteSchema.validateAsync(body);
        //update note with new input
        return await Notes.updateOne(
            {
                _id: params.noteId,
            },
            {
                $set: {
                    title: title,
                    content: content,
                    tags: tags,
                    category: category,
                    updatedDate: Date.now(),
                },
            }
        );
    }
}
