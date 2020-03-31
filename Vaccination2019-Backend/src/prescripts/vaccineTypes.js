const VaccineType = require('../models/VaccineType');
const logger = require('../utils/logger');

const addVaccineTypes = async (types) => {
    const promises = [];
    const oldTypes = await VaccineType.find();
    types.forEach((t) => {
        const type = new VaccineType(t);
        const oldType = oldTypes.filter(ot => ot.producer === type.producer
        && ot.drug === type.drug
        && ot.dosage === type.dosage
        && ot.comment === type.comment)[0];
        if (!oldType) promises.push(type.save());
    });
    const result = await Promise.all(promises);
    logger.info(`ADDING VACCINE TYPES TO DB: ${JSON.stringify(result)}`);
};

module.exports = { addVaccineTypes };
