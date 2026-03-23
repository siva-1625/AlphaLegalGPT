const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'server', 'data', 'ipc_dataset.json');

try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);
    console.log(`Loaded ${data.length} records.`);

    const search = (q) => {
        const terms = q.split(',').map(t => t.trim().toLowerCase());
        let results = data.filter(item => {
            const sec = (item.section || '').toLowerCase();
            return terms.some(t => sec.includes(t));
        });

        if (results.length === 0) {
            const nums = q.match(/\d+/g) || [];
            if (nums.length > 0) {
                results = data.filter(item => {
                    const numMatch = (item.section || '').match(/\d+/);
                    return numMatch && nums.includes(numMatch[0]);
                });
            }
        }
        return results.slice(0,3);
    };

    console.log('Testing "420":', search('420'));
    console.log('Testing "302":', search('302'));
    console.log('Testing "IPC 420":', search('IPC 420'));

} catch (e) {
    console.error(e);
}
