const _ = require('lodash');
const names = require('../names');
const convert = require('xml-js');
const ext = require('../external');
const int = require('../internal');
const dates = require('../dates');
const assert = require('../assert');

module.exports = {
    // Публічна інформація у формі відкритих даних -> API сторінки -> Структурні підрозділи банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973#get_data_branch
    getBanks() {
        const banks = {};
        int.read('nbu/banks-api').forEach(record => {
            const name = names.bankName(names.extractBankPureName(record['SHORTNAME']));
            assert.false('Duplicate bank name', banks[name], name);
            banks[name] = {
                id: parseInt(record['NKB']),
                name: name,
                dateOpen: dates.format(record['D_OPEN']),
                dateIssue: dates.format(record['D_STAN']),
                // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
            };
        });
        return banks;
    },

    saveBanks() {
        const xml = ext.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251');
        const json = convert.xml2js(xml, {compact: true});
        const banks = json['BANKBRANCH']['ROW'].map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']));
        int.write('nbu/banks-api', banks);
    }
};
