const { JsonWebTokenError } = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');


const registerAdmin = async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            department,
            adminSecret,
        } = req.body;




        if (!validator.isEmail(email)) {

            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }



        if (adminSecret !== process.env.ADMIN_SECRET) {

            return res.status(403).json({
                success: false,
                message: 'Invalid admin secret'
            });

        }


        const existingUser = await User.findOne({
            email
        });


        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const admin = await User.create({
            username,
            email,
            department,
            password: hashedPassword,    
            role: 'ADMIN'
        });

        res.status(201).json({
            success:true,
            message: 'Admin registered successfully',
        });
        
    } catch (error) {

        res.status(500).json({
            success:false,
            message: error.message
        });
    }
};


const adminLogin = async (req, res) => {

    try {

        const {email, password } = req.body

        


        if (!validator.isEmail(email)) {

            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }

        const admin = await User.findOne({email});

        if (!admin){

            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(

            password,
            admin.password

        )

        if (!isPasswordCorrect) {
            
            return res.status(401).json({
                success:false,
                message: "Invalid creadentials"
            });
        }

        if (admin.role !== 'ADMIN') {

            return res.status(401).json({
                success: false,
                message: 'Access denied'
            });
        }

        const token = jwt.sign(
            {
                userId: admin._id,
                role: admin.role
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

    } catch (error){
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}




const listUsers = async (req, res) => {

    try{

        const users = await User.find({

            role: {
                $nin: ['ADMIN', 'MANAGER']
            }

        }).sort({ createdAt: -1 });; //  find all the users from the db and sorted in descending order by created time

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        
        return res.status(500).json({
            success:false,
            message: error.message
        });
    }
};





const blockUser = async (req, res) => {

    try {

        const {id} = req.params
        console.log(id);

        const user = await User.findById(id)

        if (!user) {
             
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.isActive = !user.isActive;  // toggles the boolean value

        await user.save(); // updates the active status

        return res.status(200).json({
            success: true,
            message: user.isActive ? "user account is Active" : "user account is not Active",
            data: user
        });

    } catch(error) {

        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}







module.exports = {
    registerAdmin,
    adminLogin,
    listUsers,
    blockUser
};