
const Borrower = require('../models/Borrower');
const BorrowRecord = require('../models/BorrowRecord');
const Equipment = require('../models/Equipments');
const mongoose = require('mongoose');

const borrowEquipment = async (req, res) => {

    try {

        const {
            borrowerId,
            equipmentId,
            quantity,
            expectedReturnDate,
            remarks
        } = req.body;

        const borrower = await Borrower.findById(borrowerId); // finds the borrower by id 

        if(!borrower) {

            return res.status(404).json({

                success: false,
                message: "Borrower not found"
            });
        }

        const expectedDate = new Date(expectedReturnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expectedDate.setHours(0, 0, 0, 0);
        if (expectedDate < today) {

            return res.status(400).json({
                success: false,
                message:'Expected return date cannot be in the past'
        });
    }

        const equipment = await Equipment.findOneAndUpdate(
            
        {
            _id: equipmentId,
            status: 'Available',
            availableQuantity: {
                $gte: quantity   // only return if the available quantity is less than or equal to the requested quantity.
            }

        },
        {
            $inc: {
                availableQuantity: -quantity // reduce the available quantity with requested quantity
            }
        },
        {
            returnDocument: 'after'
        }
    );

    if (!equipment) {

        return res.status(400).json({
            success: false,
            message: "Insufficient quantity available"
        });
    }

    const record = await BorrowRecord.create({
        borrower: borrowerId,
        equipment: equipmentId,
        quantity,
        expectedReturnDate,
        remarks
    });

    return res.status(201).json({
        success: true,
        message: 'Equipment borrowed successfully',
        data: record
    });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}



const returnEquipment = async (req, res) => {

    try {

        const {id} = req.params;
        const record = await BorrowRecord.findById(id);


        if (!record.equipment) {

            return res.status(400).json({
                success: false,
                message: "Equipment reference missing"
            });

        }       

        if (!record) {
            
            return res.status(404).json({
                success: false,
                message: 'Borrow record  not found'
            });
        }

        if (record.status == 'RETURNED') {

            return res.status(400).json({
                success: false,
                message: 'Equipment already returned'
            });
        }

        

        await Equipment.findByIdAndUpdate(
            record.equipment,
            {
                $inc:{
                    availableQuantity: record.quantity
                }
            }
        );

        record.status = 'RETURNED';
        record.actualReturnDate = new Date();

        await record.save();


        return res.status(200).json({
            success: true,
            message: 'Equipment returned successfully',
            data:record
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}




const getActiveBorrowings = async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const totalRecords = await BorrowRecord.countDocuments();

    
        const records = await BorrowRecord.find({status: 'BORROWED'})
            .populate('borrower')
            .populate('equipment')
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(totalRecords/limit),
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

        

      
        return res.status(200).json({

                success: true,

                currentPage: page,

                totalPages: Math.ceil(totalRecords / limit),

                totalRecords,

                data: records

            });


    } catch(error) {

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

        const records =
            await BorrowRecord.aggregate(
                pipeline
            );
            console.log(records)

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