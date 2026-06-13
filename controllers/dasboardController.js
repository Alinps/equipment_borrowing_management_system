const Borrower = require('../models/Borrower');
const BorrowRecord = require('../models/BorrowRecord');
const Equipment = require('../models/Equipments');

const getDashboard = async (req, res) => {

    try {

        const [
            totalEquipment,
            totalBorrowers,
            activeBorrowings,
            overdueBorrowings,
            availableQuantityResult,
            recentBorrowings,
            lowStockEquipment
        ] = await Promise.all([

            Equipment.countDocuments(),

            Borrower.countDocuments(),

            BorrowRecord.countDocuments({
                status: "BORROWED"
            }),

            BorrowRecord.countDocuments({
                status: "BORROWED",
                expectedReturnDate: {
                    $lt: new Date()
                }
            }),

            Equipment.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$availableQuantity"
                        }
                    }
                }
            ]),

            BorrowRecord.find({ 
                borrower: { $ne: null },
                equipment: { $ne: null }
                })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate(
                    "borrower",
                    "name"
                )
                .populate(
                    "equipment",
                    "name"
                ),

            Equipment.find({
                availableQuantity: {
                    $lte: 5
                }
            })
                .select(
                    "name availableQuantity"
                )

        ]);

        return res.status(200).json({

            success: true,

            stats: {

                totalEquipment,

                totalBorrowers,

                activeBorrowings,

                overdueBorrowings,

                availableQuantity:
                    availableQuantityResult[0]
                        ?.total || 0

            },

            recentBorrowings,

            lowStockEquipment

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {
    getDashboard
}