const Localize = require('localize');

class Locale {
    static async setLocale(req, res, next) {
        try {
            Locale.appLocalize.setLocale(Locale.getLocaleFromRequest(req));
        } catch (err) {
            res.status(500).send(err);
        }
        next();
    }

    static getLocaleFromRequestSafe(req) {
        try {
            return Locale.getLocaleFromRequest(req);
        } catch (err) {
            // do nothing
        }
        return 'en_US';
    }

    static getLocaleFromRequest(req) {
        const locale = req.headers['accept-language'];
        if (locale && (locale === 'nl' || locale === 'nl_NL')) {
            return 'nl_NL';
        }
        return 'en_US';
    }
}

Locale.appLocalize = new Localize({
    Object: { nl_NL: 'Object' },
    Appointment: { nl_NL: 'Afspraak' },
    User: { nl_NL: 'Gebruiker' },
    Date: { nl_NL: 'Datum' },
    'not found': { nl_NL: 'niet gevonden' },
    Argument: { nl_NL: 'Argument' },
    'is not valid': { nl_NL: 'is niet geldig' },
    'Actions is not available': { nl_NL: 'Acties zijn niet beschikbaar' },
    'Incorrect number of students': { nl_NL: 'Onjuist aantal studenten' },
    'Your session has been expired': { nl_NL: 'Uw sessie is verlopen.' },
    'Login or password are incorrect': { nl_NL: 'Login of wachtwoord is onjuist' },
    'User already exists': { nl_NL: 'Gebruiker bestaat al' },
    'Vaccine already exists': { nl_NL: 'Vaccin bestaat al' },
    'Appointment already exists': { nl_NL: 'Afspraak bestaat al' },
    'Login is occupied': { nl_NL: 'Login is bezet' },
    'User is not confirmed': { nl_NL: 'Gebruiker is niet bevestigd' },
    'Healthcare provider does not has rights for vaccination': { nl_NL: 'Arts heeft geen recht op vaccinatie' },
    Forbidden: { nl_NL: 'Verboden' },
    Vaccine: { nl_NL: 'Vaccin' },
    Event: { nl_NL: 'Evenement' },
});

Locale.appLocalize.throwOnMissingTranslation(false);


module.exports = Locale;
