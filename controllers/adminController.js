const { JsonWebTokenError } = require('jsonwebtoken');
const User = require('../models/User');
const Borrower = require('../models/Borrower');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const logger = require('../utils/logger');


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

            logger.warn('Admin Registration Failed', {
                email,
                reason: 'Invalid email format'
            });

            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }



        if (adminSecret !== process.env.ADMIN_SECRET) {


            logger.warn('Admin Registration Failed', {
                email,
                reason: 'Invalid admin secret'
            });

            return res.status(403).json({
                success: false,
                message: 'Invalid admin secret'
            });

        }


        const existingUser = await User.findOne({
            email
        });


        if (existingUser) {

            logger.warn('Admin Registration Failed', {
                email,
                reason: 'Email already exists'
            });


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


        logger.info('Admin Registered', {

            adminId: admin._id,

            username: admin.username,

            email: admin.email,

            role: admin.role

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

        const {email, password} = req.body

        


        if (!validator.isEmail(email)) {

            logger.warn('Admin Login Failed', {

                email,

                reason: 'Invalid email format'

            });

            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }

        const admin = await User.findOne({email});

        if (!admin){


            logger.warn('Admin Login Failed', {

                email,

                reason: 'User not found'

            });


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


            logger.warn('Admin Login Failed', {

                email,

                userId: admin._id,

                reason: 'Incorrect password'

            });
            
            return res.status(401).json({
                success:false,
                message: "Invalid creadentials"
            });
        }

        if (admin.role !== 'ADMIN') {


            logger.warn('Admin Login Failed', {

                email,

                userId: admin._id,

                role: admin.role,

                reason: 'Access denied'

            });


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

        logger.info('Admin Login Success', {

            userId: admin._id,

            username: admin.username,

            email: admin.email,

            role: admin.role

        });


        res.status(200).json({
            success: true,
            token,
            user:admin.username
        });

    } catch (error){

        logger.error('Admin Login Error', {

            email: req.body?.email,

            error: error.message,

            stack: error.stack

        });


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

        }).sort({ createdAt: -1 }); //  find all the users from the db and sorted in descending order by created time

         logger.info('User List Retrieved', {

            requestedBy: req.user?.userId,

            totalUsers: users.length

        });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {

        logger.error('List Users Failed', {

            requestedBy: req.user?.userId,

            error: error.message,

            stack: error.stack

        });
        
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



const createBorrower = async (req, res) => {

    try {

        const {
            name,
            email,
            department,
            phoneNumber,
        } = req.body;


         if (!validator.isEmail(email)) {


            logger.warn('Borrower Creation Failed', {

                email,

                reason: 'Invalid email format',

                requestedBy: req.user?.userId

            });


            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });

        }

        const existingBorrower = await Borrower.findOne({
            email
        });

        if (existingBorrower) {
            
            logger.warn('Borrower Creation Failed', {

                email,

                reason: 'Email already exists',

                requestedBy: req.user?.userId

            });

            return res.status(400).json({
                success: false,
                message: "Email already exists"
            })
        }

        const borrower = await Borrower.create({
            name,
            email,
            phoneNumber,
            department
        });


        logger.info('Borrower Created', {

            borrowerId: borrower._id,

            name: borrower.name,

            email: borrower.email,

            department: borrower.department,

            requestedBy: req.user?.userId

        });

        return res.status(201).json({
            success: true,
            message: "Borrower created successfully",
            data : borrower
        })

    } catch (error) {


        logger.error('Borrower Creation Error', {

            email: req.body?.email,

            requestedBy: req.user?.userId,

            error: error.message,

            stack: error.stack

        });

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


const editBorrower = async (req, res) => {

    try {

        const {id} = req.params;
        console.log(id);

        const allowedField = ["name","email","department","phoneNumber"];

        const updatedData = {};

        for (const field of allowedField) {

            if (req.body[field] !== undefined) {
                updatedData[field] = req.body[field];
            }
        }

        const borrower = await Borrower.findByIdAndUpdate(
            id,
            {
                 $set: updatedData
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!borrower) {

            
            logger.warn(
                'Borrower Update Failed',
                {

                    borrowerId: id,

                    requestedBy:
                        req.user?.userId,

                    reason:
                        'Borrower not found'

                }
            );


            return res.status(404).json({
                success: false,
                message: "Borrower not found"
            });
        }

        logger.info(
            'Borrower Updated',
            {

                borrowerId:
                    borrower._id,

                updatedFields:
                    Object.keys(
                        updatedData
                    ),

                requestedBy:
                    req.user?.userId

            }
        );
        
        
        return res.status(200).json({
            success: true,
            data: borrower
        })
     } catch(error) {

        return res.status(500).json({
            
            success: false,
            message: error.message
        });
     }
}


const listBorrower = async (req, res) => {

    try {

        const search = req.query.search || '';

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const query = {};

        if (search) {

            query.$or = [

                {
                    name: {
                        $regex: search,
                        $options: 'i'
                    }
                },

                {
                    department: {
                        $regex: search,
                        $options: 'i'
                    }
                }

            ];

        }

        const totalRecords = await Borrower.countDocuments(query);

        const borrowers = await Borrower.find(query)
                                        .sort({
                                            createdAt: -1
                                        })
                                        .skip(skip)
                                        .limit(limit);

        logger.info(
            'Borrower List Retrieved',
            {

                requestedBy:
                    req.user?.userId,

                search,

                page,

                limit,

                returnedRecords:
                    borrowers.length,

                totalRecords

            }
        );

        return res.status(200).json({

            success: true,

            currentPage: page,

            totalPages:
                Math.ceil(
                    totalRecords / limit
                ),

            count:
                borrowers.length,

            totalRecords,

            data: borrowers

        });

    } catch (error) {

        logger.error(
            'Borrower List Error',
            {

                requestedBy:
                    req.user?.userId,

                search:
                    req.query?.search,

                page:
                    req.query?.page,

                error:
                    error.message,

                stack:
                    error.stack

            }
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

const deleteBorrower = async (req, res) => {

    try {

        const { id } = req.params;

        const borrower = await Borrower.findByIdAndDelete(id);

        if (!borrower) {

            logger.warn(
                'Borrower Deletion Failed',
                {

                    borrowerId: id,

                    requestedBy:
                        req.user?.userId,

                    reason:
                        'Borrower not found'

                }
            );

            return res.status(404).json({

                success: false,

                message: 'Borrower not found'

            });

        }

        logger.info(
            'Borrower Deleted',
            {

                borrowerId:
                    borrower._id,

                borrowerName:
                    borrower.name,

                borrowerEmail:
                    borrower.email,

                department:
                    borrower.department,

                requestedBy:
                    req.user?.userId

            }
        );

        return res.status(200).json({

            success: true,

            message:
                'Borrower deleted successfully'

        });

    } catch (error) {

        logger.error(
            'Borrower Deletion Error',
            {

                borrowerId:
                    req.params?.id,

                requestedBy:
                    req.user?.userId,

                error:
                    error.message,

                stack:
                    error.stack

            }
        );

        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

};

const borrowerById = async (req, res) => {

    try {

        const {id} = req.params;
        const borrower = await Borrower.findById(id);
        if (!borrower) {
            return res.status(404).json({
                success: false,
                message: "borrower not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: borrower
        });
    } catch(error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}


module.exports = {
    registerAdmin,
    adminLogin,
    listUsers,
    blockUser,
    createBorrower,
    editBorrower,
    listBorrower,
    deleteBorrower,
    borrowerById
};