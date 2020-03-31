const { ROLES } = require('../config');

function fitUser(user) {
    const u = user;
    delete u.password;
    delete u.token;
    return u;
}

function fitVaccine(vaccine, role) {
    const v = vaccine;
    if (role !== ROLES.MINISTRY) {
        if (v._doc) {
            delete v._doc.price;
            delete v._doc.bloodTestPrice;
            delete v._doc.initialAmount;
            delete v._doc.finishedAmount;
        } else {
            delete v.price;
            delete v.bloodTestPrice;
            delete v.initialAmount;
            delete v.finishedAmount;
        }
    }
    return v;
}

function fitVaccination(vaccination, role) {
    const vac = vaccination;
    vac.steps.forEach((s) => {
        s.hcps = s.hcps.map(hcp => fitUser(hcp));
    });

    vac.vaccines.map(v => fitVaccine(v, role));
    return vac;
}

module.exports = { fitVaccination, fitUser, fitVaccine };
