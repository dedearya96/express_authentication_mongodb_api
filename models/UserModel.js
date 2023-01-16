import mongoose from "mongoose";

const UsersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String
    }
});


const Users = mongoose.model('users', UsersSchema);

export default Users;