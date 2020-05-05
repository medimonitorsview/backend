const nameMapping = {
    ivac: {
        'Medication Name': { coview: null },
        'Volume Left to Infuse': {},
        'Volume to Insert': {},
        'Infusion Rate': {},
    },
    respirator: {
        'Ventilation Mode': {},
        'Tidal Volume': {},
        'Expiratory Tidal Volume': {},
        'Rate': {},
        'Total Rate': {},
        'Peep': {},
        'Ppeak': { coview: 'PIP' },
        'FIO2': { coview: 'FiO2' },
        'I:E Ratio': {},
        'Inspiratory time': {},
        'MV': { coview: 'MV' }
    },
    monitor: {
        'HR': { coview: 'HR' },
        'SpO2': {},
        'RR': { coview: 'RR' },
        'IBP': { coview: 'IBP' },
        'NIBP': {},
        'IBP-Mean': {},
        'NIBP-Mean': { coview: 'NIBPMean' },
        'IBP-Systole': {},  // left blood pressure
        'IBP-Diastole': {},  // right blood pressure
        'NIBP-Systole': { coview: 'NIBPSystolic'},  // left blood pressure
        'NIBP-Diastole': { coview: 'NIBPDiastolic'},  // right blood pressure
        'Temp': { coview: 'BodyTemp'},
        'etCO2': { coview:'ETCO2'},
    }
}

module.exports = {
    nameMapping
}
