import _ from 'lodash';
import names from '../names';
import cache from '../cache';
import dates from '../dates';
import assert from '../assert';
import arj from '../arj';
import dbf from '../dbf';

class SourceNbuDBF {
    constructor(audit) {
        this.audit = audit.branch('nbu-dbf', 1);
    }

    // Банківський нагляд -> Реєстрація та ліцензування -> Довідник банків -> Імпорт:
    // https://bank.gov.ua/control/uk/bankdict/search
    getBanks() {
        this.audit.start('arj');
        return cache.download('nbu/rcukru.arj', 'https://bank.gov.ua/files/RcuKru.arj')
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
                        // id: record['SID'], // not used
                        names: _.uniq([
                            names.extractBankPureName(record['SHORTNAME']),
                            names.extractBankPureName(record['FULLNAME'])
                        ]),
                        start: dates.formatTimestamp(record['D_OPEN']),
                        active: record['REESTR'].toUpperCase() !== 'Л'
                    };
                });
                banks.sort(names.compareNames);
                this.audit.end('arj');
                return cache.write('nbu/banks-dbf', banks);
            });
    }
}

export default SourceNbuDBF;