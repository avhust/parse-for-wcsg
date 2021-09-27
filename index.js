const fs = require('fs');
const got = require('got');
const HTMLParser = require('node-html-parser');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// const fetch = require('node-fetch');
const fetch = require('node-fetch');

const preUrl = 'https://westcoastseaglass.com';

function readCSV(url) {
    let results = [];
    return new Promise((resolve) => {
        fs.createReadStream(url)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () =>
                resolve(results));

    });
}

function parseUrl(url) {
    return new Promise((resolve) => {
        got(url).then(response => {
            const root = HTMLParser.parse(response.body);
            let description = root.querySelector('.views-field-description .field-content');
            if (!description) {
                description = '';
            } else {
                description = description.innerHTML;
            }
            let image, image_url, image_name;
            if (!root.querySelector('.views-field-field-term-image img') || !root.querySelector('.views-field-field-term-image img').hasAttribute('src')) {
                resolve({ url, image_url: false, image_name: '', description })
            } else {
                image = root.querySelector('.views-field-field-term-image img').getAttribute('src');
                image = image.split('?')[0];
                image_url = image.replace('/styles/medium/public', '');
                image_name = image.split('/').pop();
                resolve({ url, image_url, image_name, description })
            }
        }).catch(err => {
            console.dir(err);
        });
    })
}

async function download(url, filename) {
    // if (url) {
    //     const response = await fetch(url);
    //     const buffer = await response.buffer();
    //     fs.writeFile(`./images/${filename}`, buffer, () =>
    //         console.log(filename));
    // }
}

async function main() {
    const categories = await readCSV('wcsg_categories_urls.csv');
    const csvWriter = createCsvWriter({
        path: 'output.csv',
        header: [
            { id: 'category', title: 'Category Name' },
            { id: 'image_name', title: 'Image name (in images folder)' },
            { id: 'description', title: 'Category Description' },
            { id: 'image_url', title: 'Image URL' },
            { id: 'url', title: 'Category URL' }
        ]
    });

    let output = [];
    let downloads = [];

    for (let i = 0; i < categories.length; i++) {
        let url = categories[i].url;
        let c;
        if (url) {
            let data = await parseUrl(`${preUrl}${url}`);
            downloads.push(download(data.image_url, data.image_name));
            c = { ...categories[i], ...data };
            output.push(c);

        }
    }

    await csvWriter.writeRecords(output);

    Promise.all(downloads).then(values => {
        // console.log(values);
        console.log('downloaded'); // [3, 1337, "foo"]
    });

    console.log('main');
    // console.log(output);



}

main();
