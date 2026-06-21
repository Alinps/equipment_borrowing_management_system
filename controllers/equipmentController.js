const Equipments = require('../models/Equipments');
const Equipment = require('../models/Equipments');
const logger = require('../utils/logger');

const createEquipment = async (req, res) => {
    
    try {
        const {
            name, 
            catogory, 
            serialNumber, 
            availableQuantity,
            totalQuantity,
            status 
        } = req.body;


        const existingEquipment = await Equipment.findOne({serialNumber});


        if (existingEquipment) {
            logger.warn('Equipment Creation Failed',
        {

            serialNumber,

            requestedBy:req.user?.userId,

            reason:'Serial number already exists'

        }
    );

    return res.status(400).json({

        success: false,

        message:'Serial number already exists'

    });

}



        const equipment = await Equipment.create({  // create a new document in the db using the given data
            name,
            catogory,
            serialNumber,
            availableQuantity,
            totalQuantity,
            status
        });


        logger.info('Equipment Created',
            {

                equipmentId:equipment._id,

                name:equipment.name,

                category:equipment.catogory,

                serialNumber:equipment.serialNumber,

                availableQuantity:equipment.availableQuantity,

                totalQuantity:equipment.totalQuantity,

                status:equipment.status,

                requestedBy:req.user?.userId

            }
        );

        res.status(201).json({
            success: true,
            message: "Equipement created successfull"
        });

    } catch(error){

         logger.error('Create Equipment Error',
            {

                requestedBy:req.user?.userId,

                equipmentName:req.body?.name,

                serialNumber:req.body?.serialNumber,

                error:error.message,

                stack:error.stack

            }
        );



        return res.status(500).json({
            success:false,
            message: error.message
        });

    }

};





const updateEquipment = async (req, res) => {

    try {

        const { id } = req.params;

        const updatedEquipment = {};

        if (req.body.name !== undefined) {
            updatedEquipment.name = req.body.name;
        }

        if (req.body.catogory !== undefined) {
            updatedEquipment.catogory = req.body.catogory;
        }

        if (req.body.serialNumber !== undefined) {
            updatedEquipment.serialNumber = req.body.serialNumber;
        }

        if (req.body.availableQuantity !== undefined) {
            updatedEquipment.availableQuantity = req.body.availableQuantity;
        }

        if (req.body.status !== undefined) {
            updatedEquipment.status = req.body.status;
        }

        const equipment = await Equipment.findByIdAndUpdate(

                id,

                updatedEquipment,

                {
                    returnDocument: 'after',
                    runValidators: true
                }

            );

        if (!equipment) {

            logger.warn(
                'Equipment Update Failed',
                {

                    equipmentId: id,

                    requestedBy:req.user?.userId,

                    reason:'Equipment not found'

                }
            );

            return res.status(404).json({

                success: false,

                message:'Equipment not found'

            });

        }

        logger.info(
            'Equipment Updated',
            {

                equipmentId:equipment._id,

                equipmentName:equipment.name,

                updatedFields:Object.keys(
                        updatedEquipment
                    ),

                requestedBy:req.user?.userId

            }
        );

        return res.status(200).json({

            success: true,

            message:'Equipment successfully updated',

            data: equipment

        });

    } catch (error) {

        logger.error('Equipment Update Error',
            {

                equipmentId:req.params?.id,

                requestedBy:req.user?.userId,

                error:error.message,

                stack:error.stack

            }
        );

        return res.status(500).json({

            success: false,

            message:error.message

        });

    }

};

const deleteEquipment = async (req, res) => {

    try {

        const { id } = req.params;

        const equipment = await Equipment.findByIdAndDelete(id);

        if (!equipment) {

            logger.warn('Equipment Deletion Failed',
                {

                    equipmentId: id,

                    requestedBy:req.user?.userId,

                    reason:'Equipment not found'

                }
            );

            return res.status(404).json({

                success: false,

                message:'Equipment not found'

            });

        }

        logger.info('Equipment Deleted',
            {

                equipmentId:equipment._id,

                equipmentName:equipment.name,

                category:equipment.catogory,

                serialNumber:equipment.serialNumber,

                availableQuantity:equipment.availableQuantity,

                totalQuantity:equipment.totalQuantity,

                status:equipment.status,

                requestedBy:req.user?.userId

            }
        );

        return res.status(200).json({

            success: true,

            message:'Equipment deleted successfully'

        });

    } catch (error) {

        logger.error('Equipment Deletion Error',
            {

                equipmentId:req.params?.id,

                requestedBy:req.user?.userId,

                error:error.message,

                stack:error.stack

            }
        );

        return res.status(500).json({

            success: false,

            message:error.message

        });

    }

};

const listEquipment = async (req, res) => {

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
                    catogory: {
                        $regex: search,
                        $options: 'i'
                    }
                },

                {
                    serialNumber: {
                        $regex: search,
                        $options: 'i'
                    }
                }

            ];

        }

        const totalRecords = await Equipment.countDocuments(
                query
            );

        const equipments = await Equipment.find(query)

                .sort({
                    availableQuantity: -1
                })

                .skip(skip)

                .limit(limit);

        logger.info('Equipment List Retrieved',
            {

                requestedBy:req.user?.userId,

                search,

                page,

                limit,

                returnedRecords:equipments.length,

                totalRecords

            }
        );

        return res.status(200).json({

            success: true,

            currentPage: page,

            totalPages:Math.ceil(totalRecords / limit),

            count:equipments.length,

            totalRecords,

            data: equipments

        });

    } catch (error) {

        logger.error('Equipment List Error',
            {

                requestedBy:req.user?.userId,

                search:req.query?.search,

                page:req.query?.page,

                limit:req.query?.limit,

                error:error.message,

                stack:error.stack

            }
        );

        return res.status(500).json({

            success: false,

            message:error.message

        });

    }

};


const getEquipmentById = async (req, res) => {

    try {

        const { id } = req.params;

        const equipment = await Equipment.findById(id);

        if (!equipment) {

            logger.warn('Equipment Retrieval Failed',
                {

                    equipmentId: id,

                    requestedBy:req.user?.userId,

                    reason:'Equipment not found'

                }
            );

            return res.status(404).json({

                success: false,

                message:'Requested Equipment not found'

            });

        }

        logger.info(
            'Equipment Retrieved',
            {

                equipmentId: equipment._id,

                equipmentName: equipment.name,

                requestedBy: req.user?.userId

            }
        );

        return res.status(200).json({

            success: true,

            data: equipment

        });

    } catch (error) {

        logger.error(
            'Get Equipment By Id Error',
            {

                equipmentId:req.params?.id,

                requestedBy:req.user?.userId,

                error: error.message,

                stack:error.stack

            }
        );

        return res.status(500).json({

            success: false,

            message:error.message

        });

    }

};


const getAllEquipmentNameAndId = async (req,res) => {

    try {

        const equipments = await Equipment.find().select('_id name catogory').sort({ name: 1 });  
        return res.status(200).json({

            success: true,
            data: equipments
        })
    } catch (error) {
        return res.status(500).json({

            success: false,
            message: error.message
        });
    }
}
module.exports = {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    listEquipment,
    getEquipmentById,
    getAllEquipmentNameAndId
}