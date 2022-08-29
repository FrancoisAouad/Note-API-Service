import Notes from '../../models/notes.js';
import categories from '../../models/category.js';
import tagModel from '../../models/tags.js';

export class Service {
    constructor() {}

    //GET NOTES BY CATEGORY
    async getNotesByCategory() {
        let pipeline = [
            {
                //join the category collection to the category field inside notes
                //alows us to get the category name and other fields
                $lookup: {
                    from: 'categories',
                    localField: 'categoryID',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $group: {
                    //we group by the category id
                    _id: '$categoryID',
                    //category info from embedded document and initial note document
                    categoryName: { $first: '$category.categoryName' },
                    creatorName: { $first: '$creatorName' },
                    creatorID: { $first: '$creatorID' },
                    //add 1 when each documment matches
                    totalNotes: { $sum: 1 },
                    //push relevant note info into notes field that all have the same category id
                    notes: {
                        $push: {
                            noteID: '$_id',
                            title: '$title',
                            content: '$content',
                            images: '$imageLocation',
                            attachements: '$attachementLocation',
                            created: '$createdDate',
                            updated: '$updatedDate',
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    categoryName: {
                        $arrayElemAt: ['$categoryName', 0],
                    },
                    creatorName: 1,
                    creatorID: 1,
                    totalNotes: 1,
                    notes: 1,
                },
            },
        ];

        return await Notes.aggregate(pipeline);
    }
    //LIST OF USERS
    async getListOfUsers(body) {
        //check if category name exists
        const exists = await categories.find({ categoryName: body.name });
        if (!exists) throw new Error('NotFound');

        let pipeline = [
            {
                //join the categories collection to the notes to get additional data
                $lookup: {
                    from: 'categories',
                    localField: 'categoryID',
                    foreignField: '_id',
                    as: 'categoryID',
                },
            },
            //stage 2 checks all documents that match the input category name
            { $match: { 'categoryID.categoryName': body.name } },
            {
                //we group by the specific category name
                $group: {
                    _id: '$categoryID._id',
                    //save the category name
                    name: { $first: '$categoryID.categoryName' },
                    //push all the notes that fit the grouping inside the notes array
                    notes: {
                        $push: {
                            noteID: '$_id',
                            title: '$title',
                            content: '$content',
                        },
                    },
                    //add creatorid
                    creatorID: { $first: '$creatorID' },
                    //push user IIDs into the users array for unique elements and dont allow duplicates
                    users: { $addToSet: '$creatorID' },
                    //save category id
                    categoryID: { $first: '$categoryID._id' },
                },
            },
            {
                $project: {
                    //save name that is the only element in the array
                    name: { $arrayElemAt: ['$name', 0] },
                    //the total users wll be == to the number of ID elements inside the array
                    totalUsers: { $size: '$users' },
                    users: 1,
                    //the number of notes will be equal to the number of elemnts inside the notes array
                    totalNotes: { $size: '$notes' },
                    notes: 1,
                    _id: 0,
                },
            },
        ];

        return await Notes.aggregate(pipeline);
    }
    //LIST USERS HOW MANY NOTES THEY CREATED
    async getNotesCreated() {
        let pipeline = [
            {
                //group by creator id
                $group: {
                    _id: '$creatorID',
                    //push all notes for the same user inside this array
                    notes: {
                        $push: {
                            noteID: '$_id',
                            title: '$title',
                            content: '$content',
                        },
                    },
                },
            },
            {
                //jin user collection
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            {
                $project: {
                    userID: { $arrayElemAt: ['$userInfo._id', 0] },
                    name: { $arrayElemAt: ['$userInfo.name', 0] },
                    email: { $arrayElemAt: ['$userInfo.email', 0] },
                    notesCreated: { $size: '$notes' },
                    _id: 0,
                },
            },
        ];
        return await Notes.aggregate(pipeline);
    }
    //GET NOTES BY TAGS
    async getNotesByTags(query) {
        // const tagsArray = req.query.tags;
        const x = query.tags.split(',');

        let tagIDs = [];
        //loop to get the tags ID from document

        for (const name of x) {
            const tagexists = await tagModel.findOne({
                tagName: name,
            });
            // push the id of the current tag inside the tags embedded document array
            if (tagexists) tagIDs.push(tagexists._id);
        }
        let pipeline = [
            //first stage checks the tag swith only the input tags
            { $match: { tags: { $in: tagIDs } } },
            {
                //join the tags info from the collection
                $lookup: {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags',
                },
            },
            //third stage sorts by updatedDate
            {
                $sort: { updatedDate: -1 },
            },
            //final stage project the following fields
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    tags: '$tags.tagName',
                    username: '$creatorName',
                    images: '$imageLocation',
                    attachements: '$attachementLocation',
                    created: '$createdDate',
                    updated: '$updatedDate',
                },
            },
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    tag: { $first: '$tags' },
                    username: { $first: '$username' },
                    totalTimes: { $sum: 1 },
                    notes: {
                        $push: {
                            noteID: '$_id',
                            title: '$title',
                            content: '$content',
                            images: '$images',
                            attachements: '$attachements',
                            created: '$created',
                            updated: '$updated',
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    notes: 1,
                    username: 1,
                    tag: 1,
                    totalTimes: 1,
                },
            },
        ];
        return await Notes.aggregate(pipeline);
    }
}
