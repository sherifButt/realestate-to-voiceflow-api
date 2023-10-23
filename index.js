const express = require('express');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
const port = 3001;

// Middleware to parse JSON requests
app.use(bodyParser.json());

const doc = new GoogleSpreadsheet('YOUR_SPREADSHEET_ID');

async function accessSpreadsheet() {
    await doc.useServiceAccountAuth(require('./credentials.json'));
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Assuming you're using the first sheet
    return sheet;
}

app.get('/api', async (req, res) => {
    const storedKey = "YOUR_API_KEY";
    const incomingKey = req.headers['api_key'];

    if (incomingKey !== storedKey) {
        return res.status(401).send('Unauthorized');
    }

    const { type, budget, location, bedrooms, features } = req.query;

    try {
        const sheet = await accessSpreadsheet();
        const rows = await sheet.getRows();

        const filteredRows = rows.filter(row => {
            return row.type === type &&
                (!budget || row.budget <= budget) &&
                (!location || row.location === location) &&
                (!bedrooms || row.bedrooms === bedrooms) &&
                (!features || row.features.includes(features));
        });

        const response = {
            count: filteredRows.length,
            debug: {
                type,
                budget,
                location,
                bedrooms,
                features
            }
        };

        res.json(response);
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
