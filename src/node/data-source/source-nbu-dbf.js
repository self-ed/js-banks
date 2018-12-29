const _ = require('lodash');
const names = require('../names');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');
const arj = require('../arj');
const dbf = require('../dbf');

module.exports = {
    // Банківський нагляд -> Реєстрація та ліцензування -> Довідник банків -> Імпорт:
    // https://bank.gov.ua/control/uk/bankdict/search
    getBanks() {
        const banks = {};
        int.read('nbu/banks-dbf').forEach(bank => {
            bank.name = names.bankName(bank.names[0]);
            assert.false('Duplicate bank name', banks[bank.name], bank.name);
            banks[bank.name] = bank;
        });
        return banks;
    },

    saveBanks() {
        return ext.download('nbu/rcukru.arj', 'https://bank.gov.ua/files/RcuKru.arj')
            .then(arjContent => arj.unpack(arjContent))
            .then(dbfContent => dbf.parse(dbfContent))
            .then(records => {
                const header = records[0];
                const banks = records.slice(1).map(record => {
                    const map = {};
                    header.forEach((field, index) => map[field] = record[index]);
                    return map;
                }).filter(record => {
                    const isMainNum = record['GLB'] === record['PRKB'];
                    const isMainName = !!record['NLF'];
                    assert.equals('Different main indicator - ' + record['FULLNAME'], isMainNum, isMainName);
                    return isMainNum;
                }).filter(record => {
                    const isBankType = !!record['VID'];
                    const isBankReg = !!record['DATAR'];
                    const isBankGroup = !!record['GR1'];
                    // TODO: Приватне акцўонерне товариство "Укра∙нська фўнансова група"?
                    assert.equals('Different main indicator - ' + record['FULLNAME'], isBankType, isBankReg, isBankGroup);
                    return isBankType;
                }).map(record => {
                    assert.equals('Different date - ' + record['FULLNAME'], record['DATAR'], record['D_OPEN']);
                    return {
                        id: record['SID'],
                        names: _.uniq([
                            names.extractBankPureName(record['SHORTNAME']),
                            names.extractBankPureName(record['FULLNAME'])
                        ]),
                        start: dates.formatTimestamp(record['D_OPEN']),
                        active: record['REESTR'].toUpperCase() !== 'Л'
                    };
                });
                banks.sort(names.compareNames);
                int.write('nbu/banks-dbf', banks);
                return banks;
            });
    }
};