const names = require('../names');
const assert = require('../assert');

class Source {
    getBanks() {
        return this.saveBanks().then(banks => {
            const bankMap = {};
            banks.forEach(bank => {
                bank.name = names.bankName(bank.name);
                assert.false('Duplicate bank name', banks[bank.name], bank.name);
                bankMap[bank.name] = bank;
            });
            return bankMap;
        });
    }

    saveBanks() {
        return Promise.resolve([]);
    }
}

module.exports = Source;