/**
 * Road Construction Materials Mapping
 * Defines standard materials required for each construction phase
 */

export const ROAD_MATERIALS_MAPPING = {
    'Ph 1': [
        { name: 'Diesel Fuel', unit: 'Liter', description: 'Fuel for clearing machinery' },
        { name: 'Grease / Lubricants', unit: 'kg', description: 'Machinery maintenance' }
    ],
    'Ph 2': [
        { name: 'Diesel Fuel', unit: 'Liter', description: 'Fuel for earthmoving' },
        { name: 'Water', unit: 'm3', description: 'Moisture control for subgrade' },
        { name: 'Gravel (G30)', unit: 'm3', description: 'Selected fill for subgrade' }
    ],
    'Ph 3': [
        { name: 'Crushed Stone (G80)', unit: 'ton', description: 'Base course material' },
        { name: 'Aggregate Base', unit: 'ton', description: 'Sub-base layer' },
        { name: 'Diesel Fuel', unit: 'Liter', description: 'Fuel for base construction' }
    ],
    'Ph 4': [
        { name: 'Bitumen (G-Grade)', unit: 'Drum', description: 'Surface dressing binder' },
        { name: 'Stone Chips (13.2mm)', unit: 'm3', description: 'First seal chips' },
        { name: 'Stone Chips (6.7mm)', unit: 'm3', description: 'Second seal chips' },
        { name: 'Emulsion Primer', unit: 'Liter', description: 'Base priming' }
    ],
    'Ph 5': [
        { name: 'Hot Mix Asphalt', unit: 'ton', description: 'Wearing course surfacing' },
        { name: 'Bitumen Tack Coat', unit: 'Liter', description: 'Bonding layer' },
        { name: 'Diesel Fuel', unit: 'Liter', description: 'Fuel for asphalt plant/paver' }
    ],
    'Ph 6': [
        { name: 'Cement (OPC 42.5R)', unit: 'Bag', description: 'Concrete slab casting' },
        { name: 'River Sand', unit: 'ton', description: 'Concrete mix' },
        { name: 'Aggregate (19mm)', unit: 'ton', description: 'Concrete mix' },
        { name: 'Steel Rebar (Y12/Y16)', unit: 'ton', description: 'Slab reinforcement' },
        { name: 'Curing Compound', unit: 'Liter', description: 'Concrete hydration control' }
    ],
    'Ph 7': [
        { name: 'Precast Culverts', unit: 'Unit', description: 'Drainage infrastructure' },
        { name: 'PVC Pipes', unit: 'Meter', description: 'Service conduits' },
        { name: 'Cement', unit: 'Bag', description: 'Masonry for drains' },
        { name: 'Kerb Stones', unit: 'Unit', description: 'Road edging' }
    ],
    'Ph 8': [
        { name: 'Thermoplastic Paint', unit: 'kg', description: 'Road markings' },
        { name: 'Glass Beads', unit: 'kg', description: 'Reflective markers' },
        { name: 'Road Signs', unit: 'Unit', description: 'Traffic control' },
        { name: 'Guardrails', unit: 'Meter', description: 'Safety barriers' }
    ]
};

export function getMaterialsForPhase(phaseCode) {
    return ROAD_MATERIALS_MAPPING[phaseCode] || [];
}
