/* eslint-disable max-len,no-param-reassign */
const { ObjectID } = require('mongodb');

const Vaccination = require('../models/Vaccinations');
const Vaccine = require('../models/Vaccine');
const VaccineType = require('../models/VaccineType');
const Appointment = require('../models/Appointment');
const APIError = require('../utils/apiError');
const DUOadapter = require('../users/duo/duo.real.Adapter');
const BIGadapter = require('../users/big/big.real.Adapter');
const eventsAdapter = require('./events.Adapter');
const fitter = require('../utils/fitter');
const { EVENT_TYPES, ROLES } = require('../config');

function checkDatesArray(dates1, dates2, period) {
    const d1 = dates1.map(d => d.getTime());
    const d2 = dates2.map(d => d.getTime());

    const d1max = Math.max(...d1);
    const d2min = Math.min(...d2);

    return d2min - d1max > (period * 24 * 60 * 60 * 1000);
}

async function getVaccinationsFromDB(vaccinationId) {
    const $lookupVaccines = {
        from: 'vaccines',
        localField: 'vaccines',
        foreignField: '_id',
        as: 'vaccinesEntity',
    };
    const $unwindVaccines = { $unwind: '$vaccinesEntity' };
    const $lookupVaccineTypes = {
        from: 'vaccinetypes',
        localField: 'vaccinesEntity.type',
        foreignField: '_id',
        as: 'vaccinesEntity.type',
    };
    const $groupVaccines = {
        $group:
            {
                _id: '$_id',
                vaccines: { $push: '$vaccinesEntity' },
                steps: { $first: '$steps' },
            },
    };
    const $unwindSteps = { $unwind: '$steps' };
    const $lookupHCPs = {
        from: 'users',
        localField: 'steps.bigIds',
        foreignField: 'bigId',
        as: 'steps.hcps',
    };
    const $groupSteps = {
        $group:
            {
                _id: '$_id',
                vaccines: { $first: '$vaccines' },
                steps: { $push: '$steps' },
            },
    };


    const aggregation = [
        { $lookup: $lookupVaccines },
        $unwindVaccines,
        { $lookup: $lookupVaccineTypes },
        $groupVaccines,
        $unwindSteps,
        { $lookup: $lookupHCPs },
        $groupSteps,
    ];
    if (vaccinationId) {
        aggregation.unshift({ $match: { _id: new ObjectID(vaccinationId) } });
    }

    const vaccinations = await Vaccination.aggregate(aggregation);

    vaccinations.forEach((v) => {
        v.vaccines.forEach((vac) => {
            vac.type = vac.type[0];
        });
    });
    return vaccinations;
}

async function addVaccination(req, res) {
    const vaccinationParams = req.body;
    const vaccines = await Vaccine.find({ _id: vaccinationParams.vaccines });
    const vaccineType = await VaccineType.findOne({ _id: vaccines[0].type });
    const uniqueVaccineIds = vaccinationParams.vaccines.filter((val, vacIndex, self) => self.indexOf(val) === vacIndex);
    if (uniqueVaccineIds.length !== vaccines.length) throw APIError.invalidArgumentsError('vaccines');

    if (vaccinationParams.steps.length !== vaccineType.stepsNumber) throw APIError.invalidArgumentsError('steps.length', 'steps');

    const vaccinesCounts = vaccines.map(v => v.availableAmount);
    const minimalCount = Math.min(...vaccinesCounts);
    if (vaccinationParams.initialCount > minimalCount) throw APIError.invalidArgumentsError('body["initialCount"]', 'initialCount');
    if (vaccinationParams.initialCount % vaccineType.stepsNumber !== 0) throw APIError.invalidArgumentsError('body["initialCount"]', 'initialCount');
    const stepMaxCount = Math.floor(vaccinationParams.initialCount / vaccineType.stepsNumber);

    for (let i = 0; i < vaccinationParams.steps.length; i++) {
        const step = vaccinationParams.steps[i];
        step.type = EVENT_TYPES.VACCINATION;
        if (new Date(step.date) <= new Date()) {
            throw APIError.invalidArgumentsError(`body['steps']['${i}']['date']`, 'date');
        }
        if (new Date(step.alternativeDate) <= new Date()) {
            throw APIError.invalidArgumentsError(`body['steps']['${i}']['alternativeDate']`, 'alternativeDate');
        }
        step.allowedDates = [step.date, step.alternativeDate];
        delete step.date;
        delete step.alternativeDate;
        step.initialCount = stepMaxCount;
        step.availableCount = stepMaxCount;
    }

    const vaccination = new Vaccination(vaccinationParams);

    if (!(checkDatesArray(vaccination.steps[0].allowedDates, vaccination.steps[1].allowedDates, vaccineType.periods[0]))) {
        throw APIError.invalidArgumentsError('body["steps"]["1"]["date"]', 'date');
    }
    if (!(checkDatesArray(vaccination.steps[1].allowedDates, vaccination.steps[2].allowedDates, vaccineType.periods[1]))) {
        throw APIError.invalidArgumentsError('body["steps"]["2"]["date"]', 'date');
    }

    await vaccination.save();

    const promises = [];
    vaccines.forEach((v) => {
        v.availableAmount -= vaccinationParams.initialCount;
        promises.push(v.save());
    });
    await Promise.all(promises);

    res.status(201)
        .send(vaccination._doc);
}

async function addBloodtest(req, res) {
    const eventParams = req.body;
    const { vaccinationId } = req.params;

    const vaccination = await Vaccination.findOne({ _id: vaccinationId });
    if (!vaccination) throw APIError.objectNotFoundError('vaccination');

    const vaccine = await Vaccine.findOne({ _id: vaccination.vaccines[0] });
    const vaccineType = await VaccineType.findOne({ _id: vaccine.type });

    if (vaccination.steps.length > vaccineType.stepsNumber) throw APIError.objectAlreadyExists('bloodtest');
    if (eventParams.date <= new Date()) {
        throw APIError.invalidArgumentsError('date');
    } else {
        eventParams.allowedDates = [new Date(eventParams.date)];
        delete eventParams.date;
    }
    if (eventParams.alternativeDate <= new Date()) {
        throw APIError.invalidArgumentsError('alternativeDate');
    } else {
        eventParams.allowedDates.push(new Date(eventParams.alternativeDate));
        delete eventParams.alternativeDate;
    }
    eventParams.vaccines = vaccination.vaccines;

    if (!(checkDatesArray(vaccination.steps[2].allowedDates, eventParams.allowedDates, vaccineType.periods[2]))) {
        throw APIError.invalidArgumentsError('date');
    }
    eventParams.type = EVENT_TYPES.BLOOD_TEST;
    eventParams.initialCount = vaccination.steps[0].initialCount;
    eventParams.availableCount = vaccination.steps[0].initialCount;
    vaccination.steps.push(eventParams);

    await vaccination.save();
    res.status(201).send(vaccination.steps[3]);
}

async function getVaccinations(req, res) {
    const pageIndex = Number(req.query.pageIndex);
    const pageSize = Number(req.query.pageSize);
    const pagination = {};
    const { vaccine, placeName } = req.query;

    let vaccinations = await getVaccinationsFromDB();
    const filtratorVaccine = (vaccination) => {
        for (let i = 0; i < vaccination.vaccines.length; i++) {
            if (vaccination.vaccines[i].batchCode === vaccine) return true;
        }
        return false;
    };

    const filtratorPlace = (vaccination) => {
        for (let i = 0; i < vaccination.steps.length; i++) {
            if (vaccination.steps[i].place.name.includes(placeName)) return true;
        }
        return false;
    };

    if (vaccine) vaccinations = vaccinations.filter(filtratorVaccine);
    if (placeName) vaccinations = vaccinations.filter(filtratorPlace);
    pagination.count = vaccinations.length;
    if ((pageSize > 0) && (pageIndex > -1)) {
        vaccinations = vaccinations.slice(pageSize * pageIndex, pageSize * pageIndex + pageSize);
        pagination.pageIndex = pageIndex;
        pagination.pageSize = pageSize;
    }

    const result = vaccinations.map(v => fitter.fitVaccination(v, req.user.role));
    res.status(200).send({ items: result, pagination });
}

async function getVaccination(req, res) {
    const { vaccinationId } = req.params;
    const vaccination = (await getVaccinationsFromDB(vaccinationId))[0];
    res.status(200).send(fitter.fitVaccination(vaccination, req.user.role));
}

async function getEvents(req, res) {
    const { user } = req;
    const {
        eventType, vaccine, placeName, bigId,
    } = req.query;
    const pageIndex = Number(req.query.pageIndex);
    const pageSize = Number(req.query.pageSize);
    const pagination = {};

    const vaccinations = await getVaccinationsFromDB();
    let events = [];
    vaccinations.forEach((vac) => {
        vac.steps.forEach((s) => {
            s.vaccines = vac.vaccines;
            s.vaccinationId = vac._id;
        });
        events.push(...vac.steps);
    });
    if (eventType) events = events.filter(e => e.type === eventType);
    if (placeName) events = events.filter(e => e.place.name.includes(placeName));
    if (bigId) events = events.filter(e => e.bigIds.includes(bigId));
    if (vaccine) {
        const filtrator = (event) => {
            const vaccinesBatches = event.vaccines.map(v => v.batchCode);
            for (let i = 0; i < vaccinesBatches.length; i++) {
                if (vaccinesBatches[i].includes(vaccine)) return true;
            }
            return false;
        };
        events = events.filter(filtrator);
    }
    const filtratorPassedDates = (event) => {
        let today = new Date();
        today = today.setHours(0, 0, 0);
        if ((event.allowedDates[0] < today) || (event.allowedDates[1] < today)) return false;
        return true;
    };
    events = events.filter(filtratorPassedDates);
    events.sort((a, b) => a.id - b.id);

    if (user.role === ROLES.STUDENT) {
        const appointments = await Appointment.find({ duoId: user.duoId });
        const appointmentEventIds = appointments.map(a => a.event.toString());
        events = events.filter((event) => {
            if (appointmentEventIds.includes(event._id.toString())) return false;
            if (event.availableCount < 1) return false;
            return true;
        });
    }

    if (user.role === ROLES.HEALTHCARE_PROVIDER) {
        events = events.filter(e => e.bigIds.includes(user.bigId));
    }

    pagination.count = events.length;
    if ((pageSize > 0) && (pageIndex > -1)) {
        events = events.slice(pageSize * pageIndex, pageSize * pageIndex + pageSize);
        pagination.pageIndex = pageIndex;
        pagination.pageSize = pageSize;
    }
    res.status(200).send({ items: events, pagination });
}

async function getEventDetails(req, res) {
    const { eventId } = req.params;
    const event = await eventsAdapter.getEvent(eventId);
    const vaccination = eventsAdapter.getEventParent(event);
    const vaccines = await Vaccine.aggregate([
        { $match: { _id: { $in: vaccination.vaccines } } },
        {
            $lookup: {
                from: 'vaccinetypes',
                localField: 'type',
                foreignField: '_id',
                as: 'type',
            },
        },
    ]);
    event._doc.vaccines = vaccines;
    res.status(200).send(event);
}

async function getEventStudentsList(req, res) {
    const { user } = req;
    const { eventId } = req.params;
    await eventsAdapter.getEvent(eventId);
    const $appointmentMatch = {
        event: new ObjectID(eventId),
        bigId: user.bigId,
    };
    const $lookup = {
        from: 'users',
        localField: 'duoId',
        foreignField: 'duoId',
        as: 'studentEntity',
    };
    const $project = {
        duoId: 1,
        'studentEntity._id': 1,
        'studentEntity.duoId': 1,
        'studentEntity.firstName': 1,
        'studentEntity.lastName': 1,
    };
    const appointments = await Appointment.aggregate([
        { $match: $appointmentMatch },
        { $lookup },
        { $project },
    ]);
    const promises = [];

    appointments.forEach((a) => {
        // eslint-disable-next-line no-param-reassign
        [a.student] = a.studentEntity;
        if (!a.student) promises.push(DUOadapter.find(a.duoId));
    });
    const students = await Promise.all(promises);
    const duoIds = appointments.map(a => a.duoId);
    students.forEach((s) => {
        const index = duoIds.indexOf(`${s.duoId}`);
        appointments[index].student = {};
        appointments[index].student.duoId = s.duoId;
        appointments[index].student.firstName = s.firstName;
        appointments[index].student.lastName = s.lastName;
    });
    const result = appointments.map(a => ({
        ...a.student,
        appointmentId: a._id,
    }));
    res.status(200)
        .send(result);
}

async function getEventHCProvidersList(req, res) {
    const { eventId } = req.params;
    const $matchById = { 'steps._id': new ObjectID(eventId) };
    const $lookup = {
        from: 'users',
        localField: 'steps.bigIds',
        foreignField: 'bigId',
        as: 'hcproviders',
    };

    const $project = {
        'hcproviders._id': 1,
        'hcproviders.firstName': 1,
        'hcproviders.lastName': 1,
        'hcproviders.bigId': 1,
        'steps.bigIds': 1,
        'steps._id': 1,
    };
    const events = await Vaccination.aggregate([
        { $unwind: '$steps' },
        { $match: $matchById },
        { $lookup },
        { $project },
    ]);
    const event = events[0];
    if (!event) throw APIError.objectNotFoundError('event');
    const promises = event.hcproviders;
    event.steps.bigIds.forEach((big) => {
        if (!event.hcproviders.map(hcp => hcp.bigId)
            .includes(big)) {
            promises.push(BIGadapter.find(big));
        }
    });

    const hcps = await Promise.all(promises);
    res.status(200)
        .send(hcps);
}

async function getVaccinationStatistics(req, res) {
    const { vaccinationId } = req.params;

    const vaccination = await Vaccination.findOne({ _id: vaccinationId });
    if (!vaccination) throw APIError.objectNotFoundError('vaccination');
    const vaccines = await Vaccine.find({ _id: { $in: vaccination.vaccines.map(v => v._id) } });
    const vaccinationPrice = vaccines.reduce((sum, v) => sum + v.price, 0);
    const bloodTestPrice = vaccines.reduce((sum, v) => sum + v.bloodTestPrice, 0);
    const result = vaccination.steps.map((s) => {
        const price = s.type === EVENT_TYPES.VACCINATION ? vaccinationPrice : bloodTestPrice;
        return {
            type: s.type,
            initialCount: s.initialCount > 5 ? s.initialCount : 0,
            availableCount: s.availableCount > 5 ? s.availableCount : 0,
            finishedCount: s.finishedCount > 5 ? s.finishedCount : 0,
            initialAmount: this.initialCount * price,
            finishedAmount: this.finishedCount * price,
        };
    });
    res.status(200).send(result);
}

module.exports = {
    addVaccination,
    addBloodtest,
    getEvents,
    getEventDetails,
    getEventStudentsList,
    getEventHCProvidersList,
    getVaccination,
    getVaccinations,
    getVaccinationStatistics,
};
