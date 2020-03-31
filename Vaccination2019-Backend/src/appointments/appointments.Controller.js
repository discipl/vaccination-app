/* eslint-disable max-len,no-case-declarations */
const randomstring = require('randomstring');
const APIError = require('../utils/apiError');
const Appointment = require('../models/Appointment');
const blockchainLogger = require('../utils/blockchainLogsHelper');
const Vaccine = require('../models/Vaccine');
const User = require('../models/User');
const { ACTIONS, STATUSES } = require('./appointments.Constants');
const { ROLES, EVENT_TYPES } = require('../config');
const bigAdapter = require('../users/big/big.Resolver');
const eventsAdapter = require('../vaccinations/events.Adapter');

async function getAppointments(req, res) {
    const { user } = req;
    const appointments = await Appointment.getAppointments(user);
    res.status(200).send(appointments);
}

async function getAppointment(req, res) {
    const { user } = req;
    const { appointmentId } = req.params;
    const appointment = await Appointment.getAppointment(user, appointmentId);
    if (!appointment) {
        res.status(404).send(APIError.objectNotFoundError('appointment'));
    } else {
        res.status(200).send(appointment);
    }
}

async function addAppointment(req, res) {
    const { event, chosenDate } = req.body;
    const existingEvent = await eventsAdapter.getEvent(event);
    const vaccinationWithEvent = eventsAdapter.getEventParent(existingEvent);
    const allowedDates = existingEvent.allowedDates.map(d => (d.setHours(0, 0, 0, 0)));
    const chosenDatePrepared = new Date(chosenDate).setHours(0, 0, 0, 0);
    if (!allowedDates.includes(chosenDatePrepared)) throw APIError.invalidArgumentsError('chosenDate');
    let result = await Appointment.findOne({ event, duoId: req.user.duoId });
    if (!result) {
        if (existingEvent.availableCount < 1) throw APIError.noVaccines();
        result = new Appointment({ event, duoId: req.user.duoId, chosenDate });
        await result.save();
        existingEvent.availableCount -= 1;
        await vaccinationWithEvent.save();
    }
    res.status(201).send(result._doc);
}

const actions = [];

actions[ACTIONS.SHARE_TOKEN] = async function shareToken(req) {
    const { user } = req;
    const token = randomstring.generate();
    if (ROLES.STUDENT === user.role) {
        await User.update({ _id: user._id }, { qrToken: token });
    } else if (ROLES.HEALTHCARE_PROVIDER === user.role) {
        throw APIError.forbidden();
    }
    return { token };
};
actions[ACTIONS.CONFIRM_OPPONENT] = async function confirmOpponent(req, appointment) {
    const { user } = req;
    const { token } = req.body;
    const update = {};
    if (ROLES.STUDENT === user.role) {
        const hcProvider = await User.findOne({ qrToken: token });
        if (!hcProvider) {
            throw APIError.hcProviderDoesntHasRightsForVaccination();
        }
        const providerExists = await bigAdapter.find(hcProvider.bigId);
        if (!providerExists) {
            throw APIError.hcProviderDoesntHasRightsForVaccination(hcProvider);
        }
        const app = await Appointment.findOne({ _id: appointment._id });
        const event = await eventsAdapter.getEvent(app.event);
        if (!event.bigIds.includes(hcProvider.bigId)) throw APIError.hcProviderDoesntHasRightsForVaccination(hcProvider);
        update.bigId = hcProvider.bigId;
        update.status = STATUSES.CONFIRMED_BY_STUDENT;
    } else if (ROLES.HEALTHCARE_PROVIDER === user.role) {
        const checkedStudent = await User.findOne({ _id: appointment.student._id, qrToken: token });
        if (!checkedStudent) {
            throw APIError.incorrectToken();
        }
        await User.update({ _id: appointment.student._id }, { qrToken: null });
        update.status = STATUSES.CONFIRMED;
    }
    await Appointment.update({ _id: appointment._id }, { ...update });
    return await Appointment.getAppointment(user, appointment._id);
};
actions[ACTIONS.FINISH] = async function finish(req, appointment) {
    const { user } = req;
    if (ROLES.HEALTHCARE_PROVIDER === user.role && appointment.eventType === EVENT_TYPES.VACCINATION) {
        appointment.vaccines.forEach(async (vac) => {
            const vaccine = await Vaccine.findOne({ _id: vac._id });
            await Vaccine.updateOne({ batchCode: vaccine.batchCode }, { finishedAmount: vaccine.finishedAmount + 1 });
            const event = await eventsAdapter.getEvent(appointment.eventId);
            event.finishedCount += 1;
            const vaccination = eventsAdapter.getEventParent(event);
            vaccination.save();
        });
    }
    const status = STATUSES.CONFIRMED === appointment.status
        ? STATUSES[`FINISHED_BY_${user.role}`]
        : STATUSES.FINISHED;
    await Appointment.update({ _id: appointment._id }, { status });
    await blockchainLogger.logFinishAppointment(appointment, appointment.vaccines);
    return await Appointment.getAppointment(user, appointment._id);
};

async function makeAction(req, res) {
    const { user } = req;
    const { appointmentId } = req.params;
    const appointment = await Appointment.getAppointment(user, appointmentId);
    if (!appointment) return res.status(404).send(APIError.objectNotFoundError('appointment'));

    const { action } = req.body;
    if (!appointment.availableActions.includes(action)) {
        return res.status(400).send(APIError.actionIsNotAvailable());
    }

    const result = await actions[action](req, appointment);
    return res.status(200).send(result);
}

module.exports = {
    getAppointments,
    getAppointment,
    addAppointment,
    makeAction,
};
