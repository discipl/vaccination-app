async function find(duoId) {
    let user;
    if (duoId < 1000) {
        user = {
            firstName: `First name ${duoId}`,
            lastName: `Last name ${duoId}`,
            duoId,
        };
    }
    return user;
}

module.exports = {
    find,
};
