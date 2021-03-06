import React, {Component} from 'react';
import './Bank.css';
import _ from 'lodash';
import classNames from 'classnames';
import ExternalLink from "./ExternalLink";

class Bank extends Component {
    // TODO: share link with code that fetches data
    // TODO: show status like Реорганізація and so on
    source = {
        nbu: {
            name: 'НБУ',
            link: (link) => 'https://bank.gov.ua' + (link || '')
        },
        api: {
            name: 'НБУ API',
            link: () => 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0'
        },
        pdf: {
            name: 'НБУ PDF',
            link: (link) => 'https://bank.gov.ua' + (link || '/control/uk/publish/article?art_id=52047')
        },
        fund: {
            name: 'ФГВФО',
            link: (link) => 'http://www.fg.gov.ua' + (link || '/uchasnyky-fondu')
        },
        minfin: {
            name: 'Міфін',
            link: (link) => 'https://minfin.com.ua' + (link || '')
        }
    };

    render() {
        const bank = this.props.data;
        return (
            <table className="bank">
                <tbody>
                <tr>
                    <td>Джерело</td>
                    <td>Початок</td>
                    <td>Подія</td>
                    <td>Сайт</td>
                </tr>
                {Object.keys(this.source).map(type => (
                    <tr key={type}>
                        <td><ExternalLink url={this.source[type].link(bank.internal.link[type])} title={this.source[type].name}/></td>
                        <td>{bank.dateOpen[type] || '-'}</td>
                        <td>{bank.dateIssue[type] || '-'}</td>
                        <td className={classNames({site: !_.isEmpty(bank.site[type])})}>{this.buildLinks(bank.site[type]) || '-'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }

    buildLinks(urls) {
        let links = urls && urls
            .filter(url => url)
            .map(url => <ExternalLink key={url} url={url}/>)
            .map((link, index) => index > 0 ? [<br key={index}/>, link] : link);
        return _.isEmpty(links) ? null : links;
    }
}

export default Bank;