
const Borrower = require('../models/Borrower');
const BorrowRecord = require('../models/BorrowRecord');
const Equipment = require('../models/Equipments');

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

        record.status == 'RETURNED';
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

        const records = await BorrowRecord.find({
                status: 'BORROWED'
            })
            .populate('borrower')
            .populate('equipment');

        return res.status(200).json({
            success: true,
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

    const records = await BorrowRecord.find()
        .populate('borrower')
        .populate('equipment');

    res.json(records);

};


const getBorrowerHistory = async (req, res) => {

    try {
        const {id} = req.params;
        console.log(id);
        const records = await BorrowRecord.find({
                borrower: id
            })
            .populate('borrower')
            .populate('equipment');

        return res.status(200).json({
            success: true,
            data: records
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


module.exports = {
    borrowEquipment,
    returnEquipment,
    getActiveBorrowings,
    getBorrowHistory,
    getBorrowerHistory
}