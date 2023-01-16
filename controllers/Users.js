import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
    try {
        const users = await Users.find({}).select('_id name email');
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

export const Register = async (req, res) => {
    const { name, email, password, confPassword } = req.body;
    if (password !== confPassword) return res.status(400).json({ msg: "Password dan confirm password tidak cocok" });
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword
        });
        res.json({ msg: "Resgister Berhasil" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error", error: error });
    }
}


export const Login = async (req, res) => {
    try {
        const user = await Users.find({
            email: req.body.email
        });
        if (!user) return res.status(404).json({ msg: "Email tidak ditemukan" });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if (!match) return res.status(400).json({ msg: "Password Salah" });
        const userId = user[0]._id;
        const name = user[0].name;
        const email = user[0].email;
        const accessToken = jwt.sign({
            userId,
            name,
            email
        },
            process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '10s'
        });
        const refreshToken = jwt.sign({
            userId,
            name,
            email
        },
            process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '1d'
        });
        await Users.updateOne({ _id: userId }, {
            $set: {
                refresh_token: refreshToken
            }
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ accessToken });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal Server Error", error: error });
    }
}

export const Logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(204);
    const user = await Users.find({
        refresh_token: refreshToken
    });
    if (!user[0]) return res.sendStatus(204);
    const userId = user[0]._id;
    await Users.updateOne({ _id: userId }, {
        $set: {
            refresh_token: null
        }
    });
    res.clearCookie('resfreshToken');
    return res.sendStatus(200);
}