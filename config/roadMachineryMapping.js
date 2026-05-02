/**
 * Road Construction Machinery Mapping
 * Standardizes machinery requirements for RT-1 through RT-5
 * Categorized by Construction Phase (Ph 1 to Ph 8)
 */

export const ROAD_MACHINERY_MAPPING = {
    RT_1: { label: 'Earth Road', phases: ['Ph 1', 'Ph 2', 'Ph 8'] },
    RT_2: { label: 'Gravel Road', phases: ['Ph 1', 'Ph 2', 'Ph 3', 'Ph 8'] },
    RT_3: { label: 'Surface Dressed', phases: ['Ph 1', 'Ph 2', 'Ph 3', 'Ph 4', 'Ph 7', 'Ph 8'] },
    RT_4: { label: 'Asphalt', phases: ['Ph 1', 'Ph 2', 'Ph 3', 'Ph 5', 'Ph 7', 'Ph 8'] },
    RT_5: { label: 'Concrete', phases: ['Ph 1', 'Ph 2', 'Ph 3', 'Ph 6', 'Ph 7', 'Ph 8'] }
};

export const PHASE_MACHINERY = {
    'Ph 1': {
        name: 'Clearing & grubbing',
        requirement: 'Always required',
        machines: [
            { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Heavy clearing for concrete road corridor' },
            { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Stump removal, root excavation' },
            { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load cleared debris' },
            { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Remove all cleared material' }
        ]
    },
    'Ph 2': {
        name: 'Earthworks / subgrade',
        requirement: 'Always required',
        machines: [
            { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Extensive cut and fill' },
            { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Fine grade subgrade to tight tolerances' },
            { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact subgrade' },
            { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Deep cut zones, soft spot removal' },
            { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Mass haul, fill delivery' },
            { type: 'Bowser', model: '10,000 L tanker truck', role: 'Subgrade moisture control' }
        ]
    },
    'Ph 3': {
        name: 'Sub-base & base course',
        requirement: 'Mandatory for RT-2 to RT-5',
        machines: [
            { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread base materials (G30/G80)' },
            { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'High-density compaction for base' },
            { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver crushed stone / gravel' },
            { type: 'Bowser', model: '10,000 L tanker truck', role: 'Optimum Moisture Content (OMC) control' }
        ]
    },
    'Ph 4': {
        name: 'Surface dressing (Chip seal)',
        requirement: 'RT-3 Specific',
        machines: [
            { type: 'Distributor', model: 'Bitumen Sprayer Truck', role: 'Apply prime coat and hot bitumen' },
            { type: 'Chip Spreader', model: 'Self-propelled spreader', role: 'Uniform application of stone chips' },
            { type: 'Roller', model: 'Pneumatic Tired Roller (PTR)', role: 'Knead chips into bitumen binder' },
            { type: 'Broom', model: 'Power broom / Sweeper', role: 'Clean base before spraying' }
        ]
    },
    'Ph 5': {
        name: 'Asphalt paving',
        requirement: 'RT-4 Specific',
        machines: [
            { type: 'Paver', model: 'Vogele Super 1800-3', role: 'Lay hot-mix asphalt (HMA) with precision' },
            { type: 'Roller (Steel)', model: 'Tandem vibratory roller', role: 'Breakdown and intermediate compaction' },
            { type: 'Roller (PTR)', model: 'Dynapac CP275', role: 'Finish rolling for surface sealing' },
            { type: 'Truck', model: 'Insulated Tipper', role: 'Transport hot asphalt from plant' }
        ]
    },
    'Ph 6': {
        name: 'Concrete slab construction',
        requirement: 'RT-5 Specific',
        machines: [
            { type: 'Slipform Paver', model: 'Wirtgen SP 64', role: 'Continuous concrete slab casting' },
            { type: 'Mixer Truck', model: 'Ready-mix 8m³ truck', role: 'Supply fresh concrete to site' },
            { type: 'Saw', model: 'Concrete joint cutter', role: 'Cut expansion/contraction joints' },
            { type: 'Curing Rig', model: 'Texture/Curing machine', role: 'Apply curing compound and texturing' }
        ]
    },
    'Ph 7': {
        name: 'Drainage & ancillary',
        requirement: 'Mandatory for RT-3 to RT-5',
        machines: [
            { type: 'Backhoe', model: 'JCB 3CX', role: 'Excavate V-drains and culvert trenches' },
            { type: 'Mixer', model: 'Portable 500L mixer', role: 'On-site concrete for kerbs/linings' },
            { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver precast culverts / kerbs' }
        ]
    },
    'Ph 8': {
        name: 'Final works / handover',
        requirement: 'All road types',
        machines: [
            { type: 'Truck', model: 'Flatbed with crane', role: 'Install road signs and guardrails' },
            { type: 'Marker', model: 'Road marking machine', role: 'Apply thermoplastic paint lines' },
            { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Final site cleanup and demobilization' }
        ]
    }
};

export function getMachinesForPhase(phaseCode) {
    return PHASE_MACHINERY[phaseCode]?.machines || [];
}

export function getPhasesForRoadType(roadTypeCode) {
    const code = roadTypeCode.replace('-', '_');
    return ROAD_MACHINERY_MAPPING[code]?.phases || [];
}
