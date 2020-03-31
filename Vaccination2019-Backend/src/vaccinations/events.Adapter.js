const APIError = require('../utils/apiError');
const Vaccination = require('../models/Vaccinations');

async function getEvent(eventId) {
    const vaccination = await Vaccination.findOne({ 'steps._id': eventId });
    if (!vaccination) throw APIError.objectNotFoundError('event');
    const [event] = vaccination.steps.filter(s => s._id.toString() === eventId.toString());
    if (!event) throw APIError.objectNotFoundError('event');
    return event;
}

function getEventParent(event) {
    return event.__parentArray.$parent();
}

module.exports = { getEvent, getEventParent };
