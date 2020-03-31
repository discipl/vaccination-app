async function find(bigId) {
    let user;
    if (bigId < 1000) {
        user = {
            firstName: `First name ${bigId}`,
            lastName: `Last name ${bigId}`,
            bigId,
        };
    }
    return user;
}

module.exports = {
    find,
};
