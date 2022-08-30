import Notes from '../notes/notes.model.js';
import path from 'path';
import createError from 'http-errors';
// import Notes from '../models/notes.js';
import tagModel from '../notes/tags.model.js';
import jwt from 'jsonwebtoken';

class Service {
    constructor() {}

    async addTags(tags, newNote, UserInfo) {
        if (!tags) return; //return if no tags added
        //get length of array of tags
        const tagsLength = parseInt(tags.length);
        //loop all the array elements
        for (var i = 0; i < tagsLength; i++) {
            //assign tag string body to name variable
            const name = tags[i];
            //check if tag exists
            const exists = await tagModel.findOne({ tagName: name });

            if (exists) {
                //push tagID to the notes tag array if it already exists
                await Notes.updateOne(
                    {
                        creatorID: UserInfo._id,
                        _id: newNote._id,
                    },
                    { $push: { tags: exists._id } }
                );
                //push userID to creatorsID field inside tag
                await tagModel.updateOne(
                    { _id: exists._id },
                    { $addToSet: { creatorsID: UserInfo._id } }
                );
            } else if (!exists) {
                //create new tag for the tag
                const newTags = new tagModel({
                    tagName: name,
                });
                //save tag
                let savedtag = await newTags.save();
                //push the newly created tagID to the note tags field
                await Notes.updateOne(
                    {
                        creatorID: UserInfo._id,
                        _id: newNote._id,
                    },
                    { $push: { tags: savedtag._id } }
                );
                //add the userid to the names of the users that used this tag
                await tagModel.updateOne(
                    { _id: savedtag._id },
                    { $addToSet: { creatorsID: UserInfo._id } }
                );
            }
        }
    }
    getUser(authHeader) {
        //split auth header to get bearer token
        const token = authHeader.split(' ')[1];
        //verify the token and decoded it using
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        //get the id field from the decoded token
        const id = decoded.aud;
        //return the id value
        return id;
    }
    async uploadImage(image, __dirname, newNote) {
        // checkImage(image);
        const imageExtension = path.extname(image.name);
        const allowedExtensionImage = ['.png', '.jpg', '.jpeg'];
        //throw error if image is not of the following type
        if (!allowedExtensionImage.includes(imageExtension)) {
            throw createError.UnprocessableEntity('Invalid Image');
        }
        const imageName =
            new Date().getTime().toString() + path.extname(image.name);
        //set image location
        const imagelocation = path
            .join(__dirname, 'uploads', 'img', 'notes', imageName)
            .toString();
        //initialize the location where the files and will be saved
        // const imagelocation = getImageLocation(image, __dirname);
        //add image to note model
        newNote.imageLocation.push(imagelocation);
        await newNote.save();
        //save innside uploads folder
        await image.mv(imagelocation);
    }
    async uploadFile(file, __dirname, newNote) {
        //allowed file types
        const fileExtension = path.extname(file.name);
        const allowedExtensionFile = ['.pdf', '.txt', '.docx'];
        //throw error if file is not of the following type
        if (!allowedExtensionFile.includes(fileExtension)) {
            throw createError.UnprocessableEntity('Invalid File');
        }
        //set file location in server
        const fileName =
            new Date().getTime().toString() + path.extname(file.name);
        //set file location in server
        const filelocation = path
            .join(__dirname, 'uploads', 'files', 'notes', fileName)
            .toString();
        //find this specific note and update this field
        newNote.attachementLocation.push(filelocation);
        await newNote.save();
        //move file to location
        await file.mv(filelocation);
    }
    async deleteImage() {}
    async deleteFile() {}
}
export default Service;
// export const editNote = async (req, res, next) => {
//     try {
//         const authHeader = req.headers['authorization'];
//         const id = getUser(authHeader);
//         const noteId = req.params.noteId;
//         //check is note exists with creator id and noteid
//         const exists = await Notes.find({
//             creatorID: id,
//             _id: req.params.noteId,
//         });
//         if (!exists) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Not Found',
//                 message: 'Note not found..',
//             });
//         }
//         //set dirname variable
//         const __dirname = path.resolve();
//         //validate user input
//         const { title, content, tags, category } =
//             await noteSchema.validateAsync(req.body);
//         //update note with new input
//         await Notes.updateOne(
//             {
//                 _id: req.params.noteId,
//             },
//             {
//                 $set: {
//                     title: title,
//                     content: content,
//                     tags: tags,
//                     category: category,
//                     updatedDate: Date.now(),
//                 },
//             }
//         );

//         //set file and image variable by using chainning
//         const image = req?.files?.image;
//         const file = req?.files?.file;
//         //-------------No Image AND File------------------//
//         if (image == (undefined || null) && file != (undefined || null)) {
//             updateFile(file, __dirname, noteId);
//             return res.status(200).json({
//                 success: true,
//                 message: 'Note Updated!',
//             });
//         }
//         //-------------Image AND No File------------------//
//         if (image != (undefined || null) && file == (undefined || null)) {
//             updateImage(image, __dirname, noteId);
//             return res.status(200).json({
//                 success: true,
//                 message: 'Note Updated!',
//             });
//         }
//         //-------------Image AND File exists------------------//
//         if (image != (undefined || null) && file != (undefined || null)) {
//             updateImageFile(image, file, __dirname, noteId);

//             return res.status(200).json({
//                 success: true,
//                 message: 'Note updated!',
//             });
//         }
//         //-------------No Image AND No File------------------//
//         if (!(req.files && req.files.image) && !(req.files && req.files.file)) {
//             return res.status(200).json({
//                 success: true,
//                 message: 'Note Updated!',
//             });
//         }
//     } catch (e) {
//         next(e);
//     }
// };
