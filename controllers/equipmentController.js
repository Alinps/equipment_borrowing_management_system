const Equipments = require('../models/Equipments');
const Equipment = require('../models/Equipments');

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


        const equipment = await Equipment.create({  // create a new document in the db using the given data
            name,
            catogory,
            serialNumber,
            availableQuantity,
            totalQuantity,
            status
        });

        res.status(201).json({
            success: true,
            message: "Equipement created successfull"
        });

    } catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message: error.message
        });

    }

};





const updateEquipment = async (req, res) => {

    try {
        
        const {id} =req.params;

        const updatedEquipment = {};  

        if (req.body.name !== undefined ) {
            updatedEquipment.name = req.body.name;
        }

        if (req.body.catogory !== undefined ) {
            updatedEquipment.catogory = req.body.catogory;
        }

        if (req.body.serialNumber !== undefined ) {
            updatedEquipment.serialNumber = req.body.serialNumber;
        }

        if (req.body.availableQuantity !== undefined ) {
            updatedEquipment.availableQuantity = req.body.availableQuantity;
        }

        if (req.body.status !== undefined ) {
            updatedEquipment.status = req.body.status;
        }

        const equipment = await Equipment.findByIdAndUpdate(
            id,updatedEquipment,{new:true, runValidators: true}  // find and update the existing product using the given id and data and return the updated document
        )

        return res.status(200).json({
            success: true,
            message: "Equipment successfully updated",
            data: equipment
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
} 


const deleteEquipment = async (req, res) => {

    try {

        const {id} = req.params

        const equipment = await Equipment.findByIdAndDelete(id);  // find and delete the document using the given id and return the document

        if (!equipment) {
            
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Equipment deleted successfully"
        });

    } catch (error){

        return res.status(500).json({
            success:false,
            message: error.message
        });
    }
}


const listEquipment = async (req, res ) => {

    try {

        const equipments = await Equipment.find().sort({availableQuantity: -1});

        return res.status(200).json({
            success: true,
            count: equipments.length,
            data: equipments
        })

    } catch(error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}


const getEquipmentById = async (req,res) => {

    try {

        const {id} = req.params;
        const equipment = await Equipment.findById(id);
        if(!equipment) {

            return res.status(500).json({
                success: false,
                message: " Requested Equipment not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: equipment
        })
    } catch (error) {

        return res.status(500).json({

            success: false,
            message: error.message
        })
    }
}

module.exports = {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    listEquipment,
    getEquipmentById
}