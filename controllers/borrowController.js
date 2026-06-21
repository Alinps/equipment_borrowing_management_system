
const Borrower = require('../models/Borrower');
const BorrowRecord = require('../models/BorrowRecord');
const Equipment = require('../models/Equipments');
const mongoose = require('mongoose');
const logger = require('../utils/logger');



const borrowEquipment = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        const {
            borrowerId,
            equipmentId,
            quantity,
            expectedReturnDate,
            remarks
        } = req.body;

        const borrower =
            await Borrower.findById(
                borrowerId
            ).session(session);

        if (!borrower) {

            logger.warn(
                'Borrow Equipment Failed',
                {
                    borrowerId,
                    equipmentId,
                    quantity,
                    requestedBy:
                        req.user?.userId,
                    reason:
                        'Borrower not found'
                }
            );

            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: 'Borrower not found'
            });

        }

        const expectedDate =
            new Date(expectedReturnDate);

        const today =
            new Date();

        today.setHours(
            0, 0, 0, 0
        );

        expectedDate.setHours(
            0, 0, 0, 0
        );

        if (
            expectedDate < today
        ) {

            logger.warn(
                'Borrow Equipment Failed',
                {
                    borrowerId,
                    equipmentId,
                    quantity,
                    expectedReturnDate,
                    requestedBy:
                        req.user?.userId,
                    reason:
                        'Expected return date is in the past'
                }
            );

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    'Expected return date cannot be in the past'

            });

        }

        const equipment =
            await Equipment.findOneAndUpdate(

                {
                    _id: equipmentId,

                    status: 'Available',

                    availableQuantity: {
                        $gte: quantity
                    }
                },

                {
                    $inc: {
                        availableQuantity:
                            -quantity
                    }
                },

                {
                    returnDocument:
                        'after',

                    session
                }

            );

        if (!equipment) {

            logger.warn(
                'Borrow Equipment Failed',
                {
                    borrowerId,
                    equipmentId,
                    quantity,
                    requestedBy:
                        req.user?.userId,
                    reason:
                        'Equipment unavailable or insufficient quantity'
                }
            );

            await session.abortTransaction();

            return res.status(400).json({

                success: false,

                message:
                    'Insufficient quantity available'

            });

        }

        const records =
            await BorrowRecord.create(

                [

                    {

                        borrower:
                            borrowerId,

                        equipment:
                            equipmentId,

                        quantity,

                        expectedReturnDate,

                        remarks

                    }

                ],

                {

                    session

                }

            );

        const record =
            records[0];

        await session.commitTransaction();

        logger.info(
            'Equipment Borrowed',
            {

                borrowRecordId:
                    record._id,

                borrowerId:
                    borrower._id,

                borrowerName:
                    borrower.name,

                equipmentId:
                    equipment._id,

                equipmentName:
                    equipment.equipmentName,

                quantity,

                remainingQuantity:
                    equipment.availableQuantity,

                expectedReturnDate,

                requestedBy:
                    req.user?.userId

            }
        );

        return res.status(201).json({

            success: true,

            message:
                'Equipment borrowed successfully',

            data: record

        });

    } catch (error) {

        await session.abortTransaction();

        logger.error(
            'Borrow Equipment Error',
            {

                borrowerId:
                    req.body?.borrowerId,

                equipmentId:
                    req.body?.equipmentId,

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

    } finally {

        session.endSession();

    }

};



const returnEquipment = async (req, res) => {

    try {

        const { id } = req.params;

        const record =
            await BorrowRecord.findById(id);

        if (!record) {

            logger.warn(
                'Return Equipment Failed',
                {
                    borrowRecordId: id,
                    requestedBy: req.user?.userId,
                    reason: 'Borrow record not found'
                }
            );

            return res.status(404).json({

                success: false,

                message:
                    'Borrow record not found'

            });

        }

        if (!record.equipment) {

            logger.warn(
                'Return Equipment Failed',
                {
                    borrowRecordId: id,
                    requestedBy: req.user?.userId,
                    reason:
                        'Equipment reference missing'
                }
            );

            return res.status(400).json({

                success: false,

                message:
                    'Equipment reference missing'

            });

        }

        if (
            record.status ===
            'RETURNED'
        ) {

            logger.warn(
                'Return Equipment Failed',
                {
                    borrowRecordId: id,
                    requestedBy: req.user?.userId,
                    reason:
                        'Equipment already returned'
                }
            );

            return res.status(400).json({

                success: false,

                message:
                    'Equipment already returned'

            });

        }

        const equipment =
            await Equipment.findByIdAndUpdate(

                record.equipment,

                {

                    $inc: {

                        availableQuantity:
                            record.quantity

                    }

                },

                {

                    returnDocument:
                        'after'

                }

            );

        record.status =
            'RETURNED';

        record.actualReturnDate =
            new Date();

        await record.save();

        logger.info(
            'Equipment Returned',
            {

                borrowRecordId:
                    record._id,

                borrowerId:
                    record.borrower,

                equipmentId:
                    record.equipment,

                quantity:
                    record.quantity,

                returnedAt:
                    record.actualReturnDate,

                availableQuantity:
                    equipment?.availableQuantity,

                requestedBy:
                    req.user?.userId

            }
        );

        return res.status(200).json({

            success: true,

            message:
                'Equipment returned successfully',

            data: record

        });

    } catch (error) {

        logger.error(
            'Return Equipment Error',
            {

                borrowRecordId:
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


const getActiveBorrowings = async (req, res) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 10;

        const skip =
            (page - 1) * limit;

        const totalRecords =
            await BorrowRecord.countDocuments({

                status: 'BORROWED'

            });

        const records =
            await BorrowRecord.find({

                status: 'BORROWED'

            })

            .populate('borrower')

            .populate('equipment')

            .skip(skip)

            .limit(limit);

        logger.info(
            'Active Borrowings Retrieved',
            {

                requestedBy:
                    req.user?.userId,

                page,

                limit,

                returnedRecords:
                    records.length,

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

            totalRecords,

            data: records

        });

    } catch (error) {

        logger.error(
            'Get Active Borrowings Error',
            {

                requestedBy:
                    req.user?.userId,

                page:
                    req.query?.page,

                limit:
                    req.query?.limit,

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


const getBorrowHistory = async (req, res) => {

    try {


        const search = req.query.search || '';

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const pipeline = [
    
            {
                $lookup: {   // finding the borrower details from Borrower document
                    from: 'borrowers',
                    localField: 'borrower',
                    foreignField: '_id',
                    as: 'borrower'
                }
            },

            {
                $unwind: '$borrower' // to convert the collected data from array to object
            },

            {
                $lookup: {
                    from: 'equipment',
                    localField: 'equipment',
                    foreignField: '_id',
                    as: 'equipment'
                }
            },

            {
                $unwind: '$equipment'
            }

        ];



        if (search) {

                pipeline.push({

                    $match: {

                        $or: [

                            {
                                'borrower.name': {
                                    $regex: search,
                                    $options: 'i'
                                }
                            },

                            {
                                'equipment.equipmentName': {
                                    $regex: search,
                                    $options: 'i'
                                }
                            },

                            {
                                'borrower.email': {
                                    $regex: search,
                                    $options: 'i'
                                }
                            }

                        ]

                    }

                });

            }

            const totalResult =
                await BorrowRecord.aggregate([
                    ...pipeline,
                    {
                        $count: 'total'
                    }
                ]);


    const totalRecords =  totalResult[0]?.total || 0;



            pipeline.push(

            {
                $sort: {
                    actualReturnDate: -1
                }
            },

            {
                $skip: skip
            },

            {
                $limit: limit
            }

        );



        const records = await BorrowRecord.aggregate(pipeline);

        logger.info(
        'Borrow History Retrieved',
        {

            requestedBy:
                req.user?.userId,

            search,

            page,

            limit,

            returnedRecords:
                records.length,

            totalRecords

        }
    );

        

      
        return res.status(200).json({

                success: true,

                currentPage: page,

                totalPages: Math.ceil(totalRecords / limit),

                totalRecords,

                data: records

            });


    } catch(error) {


        logger.error(
    'Borrow History Error',
    {

        requestedBy:
            req.user?.userId,

        search:
            req.query?.search,

        page:
            req.query?.page,

        limit:
            req.query?.limit,

        error:
            error.message,

        stack:
            error.stack

    }
);

        return res.status(500).json({
            success: false,
            message: error.message
        })
    }

};




const getBorrowerHistory = async (req, res) => {

    try {

        const { id } = req.params;

        const search = req.query.search || '';

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const pipeline = [

            {
                $match: {
                    borrower: new mongoose.Types.ObjectId(id)
                }
            },

              {
                $lookup: {
                    from: 'borrowers',
                    localField: 'borrower',
                    foreignField: '_id',
                    as: 'borrower'
                }
            },

            {
                $unwind: '$borrower'
            },


            {
                $lookup: {
                    from: 'equipment',
                    localField: 'equipment',
                    foreignField: '_id',
                    as: 'equipment'
                }
            },

            {
                $unwind: '$equipment'
            }

        ];

        if (search) {

            pipeline.push({

                $match: {

                    $or: [

                        {
                            'equipment.name': {
                                $regex: search,
                                $options: 'i'
                            }
                        },

                        {
                            'equipment.category': {
                                $regex: search,
                                $options: 'i'
                            }
                        },

                        {
                            status: {
                                $regex: search,
                                $options: 'i'
                            }
                        }

                    ]

                }

            });

        }

        const totalResult =
            await BorrowRecord.aggregate([
                ...pipeline,
                {
                    $count: 'total'
                }
            ]);

        const totalRecords =
            totalResult[0]?.total || 0;

        pipeline.push(

            {
                $sort: {
                    borrowedAt: -1
                }
            },

            {
                $skip: skip
            },

            {
                $limit: limit
            }

        );

        const records = await BorrowRecord.aggregate(pipeline);

        logger.info('Borrower History Retrieved',{

        borrowerId: id,

        requestedBy:
            req.user?.userId,

        search,

        page,

        limit,

        returnedRecords:
            records.length,

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

            totalRecords,

            data: records

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



const getAllBorrowerNameAndId = async (req, res) => {

    try{

        const borrowers = await Borrower.find().select('_id name').sort({ name: 1 });   
         
        if (!borrowers) {

            return res.status(400).json({
                success: false,
                message: "No Borrowers found, Something went wrong"
            });
        }

        return res.status(200).json({

            success: true,
            data: borrowers
        });
    } catch(error) {

        return res.status(500).json({

            success: false,
            message: error.message
        })
    }
}

module.exports = {
    borrowEquipment,
    returnEquipment,
    getActiveBorrowings,
    getBorrowHistory,
    getBorrowerHistory,
    getAllBorrowerNameAndId
}