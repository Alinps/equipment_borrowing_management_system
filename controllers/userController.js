const { JsonWebTokenError } = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');


const userRegister = async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            department,
        } = req.body;






        if (!validator.isEmail(email)) {

            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }


        const existingUser = await User.findOne({  // finds and return the first matching document from the db.
            email 
        })

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10); // hashes the plian password

        const user = await User.create({
            username,
            email,
            password:hashedPassword,
            department,
            role: 'BORROWER'
        })

        res.status(201).json({
            success: true,
            message: "User registered Successfully"
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};



const userLogin = async (req, res) => {
    
    try {

        const {email, password} = req.body;



        if (!validator.isEmail(email)) {

            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }

        const user = await User.findOne({email});
        console.log(user);

        if(!user){
            return res.status(404).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        )

        if (!isPasswordCorrect) {
            
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        res.status(200).json({
            success: true,
            token
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    userRegister,
    userLogin
}