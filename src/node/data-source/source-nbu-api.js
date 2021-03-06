import _ from 'lodash';
import names from '../names';
import convert from 'xml-js';
import cache from '../cache';
import dates from '../dates';

class SourceNbuAPI {
    constructor(audit) {
        this.audit = audit.branch('nbu-api', 1);
    }

    // Публічна інформація у формі відкритих даних -> API сторінки -> Структурні підрозділи банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=38441973#get_data_branch
    getBanks() {
        this.audit.start('banks');
        return cache.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0', 'cp1251').then(xml => {
            const json = convert.xml2js(xml, {compact: true});
            const banks = json['BANKBRANCH']['ROW']
                .map(row => _.forOwn(row, (value, key) => row[key] = value['_text'] || value['_cdata']))
                .map(record => ({
                    // id: parseInt(record['NKB']), // not used
                    // TODO: is there full name? if so - add it as well
                    names: [names.extractBankPureName(record['SHORTNAME'])],
                    start: dates.format(record['D_OPEN']),
                    problem: dates.format(record['D_STAN']) || undefined,
                    // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
                    active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
                }));
            banks.sort(names.compareNames);
            this.audit.end('banks');
            return cache.write('nbu/banks-api', banks);
        });
    }
}

export default SourceNbuAPI;