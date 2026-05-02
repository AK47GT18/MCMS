/**
 * Resource Mapping based on Road Type and Project Phase
 */

console.log('[ResourceMapping] Module loaded');

export const RESOURCE_MAPPING = {
    // RT-1
    'RT-1': {
        phases: {
            1: {
                name: 'Clearing & grubbing',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Push over trees, clear bush, remove topsoil' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Uproot stumps, dig out large roots' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load cleared debris into dump trucks' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul cleared material off site' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 400, notes: 'Bulldozer, chainsaws, basic clearing' }
                ]
            },
            2: {
                name: 'Earthworks / subgrade shaping',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Cut and fill earthworks, rough shaping' },
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Fine grade subgrade to design level' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact subgrade to required CBR' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Spot cuts, drain channels, soft spot removal' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul cut material or import fill' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture conditioning before compaction' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 800, notes: 'Grader, compactor; ×1.4 hilly terrain' },
                    { name: 'Lime (stabiliser)', unit: 'Tonne', qty: 8, notes: 'Weak subgrade stabilisation only' }
                ]
            },
            3: {
                name: 'Wearing surface (compacted earth/laterite)',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread and level laterite wearing layer' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact laterite to dense surface' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver laterite/selected fill to site' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Water for compaction moisture control' }
                ],
                materials: [
                    { name: 'Selected Fill / Laterite', unit: 'Tonne', qty: 900, notes: '100mm compacted layer, 7m wide' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 300, notes: 'Compaction passes' }
                ]
            },
            4: {
                name: 'Basic drainage',
                machinery: [
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Dig culvert pits, cut side drains' },
                    { type: 'Mixer', model: '350L drum mixer (portable)', role: 'Mix concrete for culvert headwalls' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver sand, stone, pipes to drain locations' }
                ],
                materials: [
                    { name: 'Cement OPC', unit: 'Bag 50kg', qty: 40, notes: 'Culvert headwalls' },
                    { name: 'River Sand', unit: 'Tonne', qty: 8, notes: 'Mortar mix' },
                    { name: 'PVC Pipes (300mm dia)', unit: 'Length 6m', qty: 8, notes: 'Small culverts / side drains' },
                    { name: 'Reinforcement Steel 12mm', unit: 'Length 12m', qty: 20, notes: 'Headwall slabs' }
                ]
            }
        }
    },
    // RT-2
    'RT-2': {
        phases: {
            1: {
                name: 'Clearing & grubbing',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Clear bush, trees, topsoil stripping' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Stump removal, large root extraction' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load cleared debris' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul spoil off site' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 500, notes: 'Bulldozer, clearing equipment' }
                ]
            },
            2: {
                name: 'Earthworks / subgrade',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Cut and fill, rough shaping' },
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Precise subgrade level and cross-fall' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact subgrade to design density' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Soft spot removal, drainage cuts' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul cut material, deliver fill' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture control for compaction' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 1200, notes: 'Grader, roller, compactor' },
                    { name: 'Lime (stabiliser)', unit: 'Tonne', qty: 10, notes: 'Poor subgrade only' },
                    { name: 'Geotextile Fabric', unit: 'Roll 50m²', qty: 20, notes: 'Soft/wet subgrade separation' }
                ]
            },
            3: {
                name: 'Gravel wearing course',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread and level gravel layer to thickness' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact gravel wearing course' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver gravel from quarry to site' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load gravel at quarry into trucks' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture before and during compaction' }
                ],
                materials: [
                    { name: 'Gravel / Crushed Stone', unit: 'Tonne', qty: 1800, notes: '150mm compacted layer, 7m wide' },
                    { name: 'Crushed Stone/Gravel (blended)', unit: 'Tonne', qty: 400, notes: 'Blended into gravel layer' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 600, notes: 'Spreading and compaction' }
                ]
            },
            4: {
                name: 'Drainage',
                machinery: [
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Excavate culvert pits and side drains' },
                    { type: 'Mixer', model: '350L drum mixer (portable)', role: 'Mix concrete for headwalls' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver drainage materials to locations' }
                ],
                materials: [
                    { name: 'Cement OPC', unit: 'Bag 50kg', qty: 60, notes: 'Culverts and headwalls' },
                    { name: 'River Sand', unit: 'Tonne', qty: 12, notes: 'Mortar mix' },
                    { name: 'PVC Pipes (450mm dia)', unit: 'Length 6m', qty: 12, notes: 'Roadside culverts' },
                    { name: 'Reinforcement Steel 12mm', unit: 'Length 12m', qty: 30, notes: 'Culvert slabs' }
                ]
            },
            5: {
                name: 'Road furniture (basic)',
                machinery: [
                    { type: 'Pickup', model: 'Toyota Hilux / Isuzu D-Max', role: 'Transport sign installation crew and materials' },
                    { type: 'Generator', model: '6.5 kVA diesel genset', role: 'Power tools for sign post installation' }
                ],
                materials: [
                    { name: 'Road Signs', unit: 'Unit', qty: 4, notes: 'Warning + km markers' },
                    { name: 'Delineator Posts', unit: 'Unit', qty: 30, notes: 'Edge marking, 33m spacing' }
                ]
            }
        }
    },
    // RT-3
    'RT-3': {
        phases: {
            1: {
                name: 'Clearing & grubbing',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Clear and strip site' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Root removal, spot excavation' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load spoil into trucks' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Remove cleared material' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 600, notes: 'Clearing + grubbing equipment' }
                ]
            },
            2: {
                name: 'Earthworks / subgrade',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Bulk earthworks, cut and fill' },
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Shape subgrade to design levels' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact subgrade layers' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Cut drains, remove soft spots' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul cut and fill material' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture conditioning' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 1500, notes: 'Grader, roller; ×1.3 hilly' },
                    { name: 'Lime (stabiliser)', unit: 'Tonne', qty: 12, notes: 'Weak subgrade treatment' },
                    { name: 'Geotextile Fabric', unit: 'Roll 50m²', qty: 25, notes: 'Separation/filtration layer' }
                ]
            },
            3: {
                name: 'Sub-base',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread and level sub-base material' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact sub-base to 98% MDD' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver gravel/crushed stone to site' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load crushed stone at source' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture control during compaction' }
                ],
                materials: [
                    { name: 'Gravel / Crushed Stone', unit: 'Tonne', qty: 1500, notes: '150mm layer, 7m wide' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 400, notes: 'Spreading, grading, compaction' }
                ]
            },
            4: {
                name: 'Base course',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread aggregate base to uniform thickness' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact base course to specification' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver aggregate base material' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load aggregate at source / stockpile' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture conditioning' }
                ],
                materials: [
                    { name: 'Aggregate Base', unit: 'Tonne', qty: 1800, notes: '175mm layer, 7m wide' },
                    { name: 'Crushed Stone', unit: 'Tonne', qty: 400, notes: 'Blended into base course' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 500, notes: 'Grader + vibratory roller' }
                ]
            },
            5: {
                name: 'Surface dressing',
                machinery: [
                    { type: 'Sprayer', model: 'Etnyre Bitumen Distributor / Crafco SS200', role: 'Spray emulsion primer and binder coat evenly' },
                    { type: 'Chipping spreader', model: 'Etnyre Chipper / Semco chip spreader', role: 'Spread stone chippings over binder coat' },
                    { type: 'Roller', model: 'Dynapac CP274 / Bomag BW24R', role: 'Embed chippings into binder coat' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver chippings to paving train' },
                    { type: 'Bitumen boiler', model: '1,000 L trailer-mounted boiler', role: 'Heat bitumen to spray temperature' }
                ],
                materials: [
                    { name: 'Bitumen G-Grade (binder)', unit: 'Drum 180kg', qty: 12, notes: 'Spray application binder coat' },
                    { name: 'Emulsion Primer', unit: 'Drum 200L', qty: 8, notes: 'Prime coat on base' },
                    { name: 'Crushed Stone (chippings 14mm)', unit: 'Tonne', qty: 350, notes: 'Single/double chip seal aggregate' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 700, notes: 'Bitumen sprayer + roller' }
                ]
            },
            6: {
                name: 'Drainage',
                machinery: [
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Dig culvert pits, channels, side drains' },
                    { type: 'Mixer', model: '350L drum mixer (portable)', role: 'Mix concrete for headwalls and channels' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver drainage materials' },
                    { type: 'Crane', model: 'Tadano GR-160N / Maeda MC305', role: 'Lower large culvert pipes into position' }
                ],
                materials: [
                    { name: 'Cement OPC', unit: 'Bag 50kg', qty: 80, notes: 'Culverts, headwalls, side drains' },
                    { name: 'River Sand', unit: 'Tonne', qty: 14, notes: 'Mortar' },
                    { name: 'PVC Pipes (600mm dia)', unit: 'Length 6m', qty: 16, notes: 'Culverts' },
                    { name: 'Reinforcement Steel 12mm', unit: 'Length 12m', qty: 40, notes: 'Culvert slabs + headwalls' },
                    { name: 'Steel Rebar', unit: 'Tonne', qty: 1.5, notes: 'Larger reinforced structures' }
                ]
            },
            7: {
                name: 'Road furniture',
                machinery: [
                    { type: 'Line marker', model: 'Graco Linelazer / Titan PowrLiner 3500', role: 'Paint centreline and edge lines' },
                    { type: 'Pickup', model: 'Toyota Hilux / Isuzu D-Max', role: 'Transport signage crew and materials' },
                    { type: 'Generator', model: '6.5 kVA diesel genset', role: 'Power tools for kerb cutting, sign posts' }
                ],
                materials: [
                    { name: 'Road Marking Paint', unit: 'Bucket 20L', qty: 5, notes: 'Centreline + edge lines' },
                    { name: 'Road Signs', unit: 'Unit', qty: 6, notes: 'Regulatory + km markers' },
                    { name: 'Delineator Posts', unit: 'Unit', qty: 40, notes: 'Edge delineation' },
                    { name: 'Kerb Stones', unit: 'Piece', qty: 200, notes: 'Footpath kerbing' },
                    { name: 'W-Beam Guardrail', unit: 'Panel 4m', qty: 20, notes: 'Embankment protection' }
                ]
            }
        }
    },
    // RT-4
    'RT-4': {
        phases: {
            1: {
                name: 'Clearing & grubbing',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Clear bush, push over trees, strip topsoil' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Stump removal, uproot large roots' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load debris into trucks' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul cleared spoil off site' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 800, notes: 'Bulldozers, chainsaws' }
                ]
            },
            2: {
                name: 'Earthworks / subgrade',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Bulk cut and fill earthworks' },
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Precise subgrade shaping and levels' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact subgrade to design CBR' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Spot excavation, drain channels' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Haul cut material and import fill' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture control for compaction' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 2500, notes: 'Grader, compactor; ×1.4 hilly terrain' },
                    { name: 'Geotextile Fabric', unit: 'Roll 50m²', qty: 30, notes: 'Soft/weak subgrade' },
                    { name: 'Lime (stabiliser)', unit: 'Tonne', qty: 15, notes: 'Subgrade stabilisation' }
                ]
            },
            3: {
                name: 'Sub-base',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread sub-base material to 150mm layer' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact sub-base to 98% MDD' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver gravel/crushed stone' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load material at quarry / stockpile' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture conditioning' }
                ],
                materials: [
                    { name: 'Gravel / Crushed Stone', unit: 'Tonne', qty: 1800, notes: '150mm layer, 7m wide' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 600, notes: 'Graders, compactors' }
                ]
            },
            4: {
                name: 'Base course',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread aggregate base to 200mm layer' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact base course to specification' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver aggregate base material' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load aggregate at stockpile' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture conditioning' }
                ],
                materials: [
                    { name: 'Aggregate Base', unit: 'Tonne', qty: 2100, notes: '200mm layer, 7m wide' },
                    { name: 'Crushed Stone', unit: 'Tonne', qty: 500, notes: 'Blended with aggregate' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 700, notes: 'Compaction equipment' }
                ]
            },
            5: {
                name: 'Asphalt surfacing',
                machinery: [
                    { type: 'Sprayer', model: 'Etnyre Bitumen Distributor / Crafco SS200', role: 'Apply tack coat and prime coat to base' },
                    { type: 'Paver', model: 'Volvo P6820D / Dynapac F1250CS', role: 'Lay hot-mix asphalt at consistent thickness' },
                    { type: 'Roller', model: 'Bomag BW120AD / Dynapac CC1200', role: 'Initial compaction of fresh asphalt mat' },
                    { type: 'Roller', model: 'Dynapac CP274 / Bomag BW24R', role: 'Intermediate compaction, knead surface' },
                    { type: 'Asphalt plant', model: 'Ammann ABP 160 / Parker 1000', role: 'Produce hot-mix asphalt at controlled temp' },
                    { type: 'Truck', model: 'FAW J6 (insulated tray) / Sino Howo', role: 'Transport hot-mix from plant to paver' },
                    { type: 'Bitumen boiler', model: '1,000 L trailer-mounted boiler', role: 'Keep bitumen at spray temperature' }
                ],
                materials: [
                    { name: 'Bitumen G-Grade', unit: 'Drum 180kg', qty: 55, notes: '50mm wearing course binder' },
                    { name: 'Emulsion Primer', unit: 'Drum 200L', qty: 18, notes: 'Prime coat before asphalt' },
                    { name: 'Tack Coat (SS-1)', unit: 'Drum 200L', qty: 10, notes: 'Bond between base and surface' },
                    { name: 'Crushed Stone (asphalt aggregate)', unit: 'Tonne', qty: 600, notes: 'Asphalt mix aggregate' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 1200, notes: 'Paver, rollers, bitumen sprayer' }
                ]
            },
            6: {
                name: 'Drainage',
                machinery: [
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Dig culvert pits and side drain channels' },
                    { type: 'Mixer', model: '350L drum mixer (portable)', role: 'Mix concrete for headwalls and aprons' },
                    { type: 'Crane', model: 'Tadano GR-160N / Maeda MC305', role: 'Lower heavy culvert pipes into position' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver drainage materials to site' }
                ],
                materials: [
                    { name: 'Cement OPC', unit: 'Bag 50kg', qty: 120, notes: 'Culvert headwalls' },
                    { name: 'River Sand', unit: 'Tonne', qty: 20, notes: 'Mortar mix' },
                    { name: 'Reinforcement Steel 12mm', unit: 'Length 12m', qty: 60, notes: 'Culvert slabs' },
                    { name: 'PVC Pipes (600mm dia)', unit: 'Length 6m', qty: 24, notes: 'Culverts' },
                    { name: 'Steel Rebar', unit: 'Tonne', qty: 2, notes: 'Larger reinforced drainage structures' }
                ]
            },
            7: {
                name: 'Road furniture & accessories',
                machinery: [
                    { type: 'Line marker', model: 'Graco Linelazer / Titan PowrLiner 3500', role: 'Paint centreline, edge lines, lane markings' },
                    { type: 'Pickup', model: 'Toyota Hilux / Isuzu D-Max', role: 'Transport sign / barrier installation teams' },
                    { type: 'Generator', model: '6.5 kVA diesel genset', role: 'Power drills, stud guns for cat eyes' },
                    { type: 'Crane / picker', model: 'Hiab 058 / Palfinger PK6500', role: 'Install heavy guardrail panels' }
                ],
                materials: [
                    { name: 'Road Marking Paint', unit: 'Bucket 20L', qty: 8, notes: 'Centreline + edge lines' },
                    { name: 'Kerb Stones', unit: 'Piece', qty: 400, notes: 'Both sides, 500mm spacing' },
                    { name: 'W-Beam Guardrail', unit: 'Panel 4m', qty: 30, notes: 'Hilly terrain embankments' },
                    { name: 'Road Signs', unit: 'Unit', qty: 8, notes: 'Warning + km markers' },
                    { name: 'Delineator Posts', unit: 'Unit', qty: 50, notes: 'Edge of carriageway' },
                    { name: 'Cat Eyes / Studs', unit: 'Unit', qty: 120, notes: 'Centreline, 8m spacing' }
                ]
            }
        }
    },
    // RT-5
    'RT-5': {
        phases: {
            1: {
                name: 'Clearing & grubbing',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Heavy clearing for concrete road corridor' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Stump removal, root excavation' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load cleared debris' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Remove all cleared material' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 900, notes: 'Heavy clearing for concrete road base' }
                ]
            },
            2: {
                name: 'Earthworks / subgrade',
                machinery: [
                    { type: 'Dozer', model: 'Caterpillar D6T / Komatsu D65', role: 'Extensive cut and fill (concrete needs stable base)' },
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Fine grade subgrade to tight tolerances' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact subgrade — critical for concrete slab' },
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Deep cut zones, soft spot removal' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Mass haul, fill delivery' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Subgrade moisture control' }
                ],
                materials: [
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 3000, notes: 'Extensive earthworks; ×1.5 hilly' },
                    { name: 'Geotextile Fabric', unit: 'Roll 50m²', qty: 40, notes: 'Separation layer under sub-base' },
                    { name: 'Lime (stabiliser)', unit: 'Tonne', qty: 20, notes: 'Subgrade stabilisation if required' }
                ]
            },
            3: {
                name: 'Sub-base',
                machinery: [
                    { type: 'Grader', model: 'CAT 140M / Volvo G940', role: 'Spread and level 200mm sub-base' },
                    { type: 'Roller', model: 'Dynapac CA250 / Bomag BW213', role: 'Compact sub-base — must be very firm under concrete' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver crushed stone sub-base material' },
                    { type: 'Loader', model: 'CAT 950 / Volvo L90', role: 'Load material at quarry' },
                    { type: 'Bowser', model: '10,000 L tanker truck', role: 'Moisture conditioning' }
                ],
                materials: [
                    { name: 'Gravel / Crushed Stone', unit: 'Tonne', qty: 2200, notes: '200mm compacted sub-base layer' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 700, notes: 'Spreading + compaction' }
                ]
            },
            4: {
                name: 'Lean concrete base',
                machinery: [
                    { type: 'Mixer', model: 'XCMG SY306C / Zoomlion 6m³ drum', role: 'Deliver and pour lean concrete blinding layer' },
                    { type: 'Mixer', model: 'ELKON 60 / Aimix HZS60', role: 'Batch lean concrete mix on site' },
                    { type: 'Vibrator', model: 'Wacker IREN 38 / Atlas Copco AME600', role: 'Consolidate lean concrete, remove voids' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver aggregate and sand to batching plant' }
                ],
                materials: [
                    { name: 'Portland Cement (50kg)', unit: 'Bag 50kg', qty: 280, notes: '75mm lean concrete blinding layer' },
                    { name: 'Crushed Stone/Gravel', unit: 'Tonne', qty: 500, notes: 'Lean concrete aggregate' },
                    { name: 'River Sand', unit: 'Tonne', qty: 180, notes: 'Lean mix fine aggregate' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 500, notes: 'Concrete mixer, placement' }
                ]
            },
            5: {
                name: 'Concrete pavement slab',
                machinery: [
                    { type: 'Batching plant', model: 'ELKON 60 / Aimix HZS60', role: 'Batch design-mix concrete for pavement slab' },
                    { type: 'Mixer', model: 'XCMG SY306C / Zoomlion 6m³', role: 'Transport concrete from plant to paving point' },
                    { type: 'Slip-form paver', model: 'Wirtgen SP 25i / GOMACO GT-3600', role: 'Lay, screed and finish 250mm concrete slab' },
                    { type: 'Vibrator', model: 'Wacker IREN 38 / Atlas Copco AME600', role: 'Consolidate concrete slab, eliminate voids' },
                    { type: 'Texture/curing machine', model: 'Wirtgen TCM 180 / custom drag mat', role: 'Apply surface texture and curing compound' },
                    { type: 'Saw cutter', model: 'Husqvarna FS 7000 D / Stihl GS461', role: 'Cut transverse and longitudinal joints' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Supply aggregate and materials to batching plant' }
                ],
                materials: [
                    { name: 'Cement OPC', unit: 'Bag 50kg', qty: 1400, notes: '250mm pavement slab, 7m wide' },
                    { name: 'Crushed Stone (20mm)', unit: 'Tonne', qty: 1400, notes: 'Coarse aggregate for slab mix' },
                    { name: 'River Sand', unit: 'Tonne', qty: 700, notes: 'Fine aggregate for slab mix' },
                    { name: 'Steel Rebar', unit: 'Tonne', qty: 18, notes: 'Dowel bars + slab reinforcement' },
                    { name: 'Reinforcement Steel 12mm', unit: 'Length 12m', qty: 200, notes: 'Tie bars at longitudinal joints' },
                    { name: 'Diesel Fuel', unit: 'Litre', qty: 2000, notes: 'Batching plant, paver, vibrators' }
                ]
            },
            6: {
                name: 'Joint sealing & curing',
                machinery: [
                    { type: 'Joint sealing machine', model: 'Crafco Supershot 125 / Cimline M1', role: 'Fill sawn joints with hot bitumen sealant' },
                    { type: 'Pickup', model: 'Toyota Hilux / Isuzu D-Max', role: 'Transport curing crew and equipment along slab' }
                ],
                materials: [
                    { name: 'Bitumen G-Grade (joint sealant)', unit: 'Drum 180kg', qty: 4, notes: 'Expansion/contraction joint sealing' },
                    { name: 'Emulsion Primer', unit: 'Drum 200L', qty: 3, notes: 'Curing compound application' }
                ]
            },
            7: {
                name: 'Drainage',
                machinery: [
                    { type: 'Excavator', model: 'CAT 320 / Komatsu PC200', role: 'Dig culverts, heavy drainage channels' },
                    { type: 'Mixer', model: 'XCMG SY306C / Zoomlion 6m³', role: 'Pour concrete for major drainage structures' },
                    { type: 'Crane', model: 'Tadano GR-160N / Maeda MC305', role: 'Place large culvert pipes and box culverts' },
                    { type: 'Truck', model: 'FAW J6 / Sino Howo 10T', role: 'Deliver drainage materials' },
                    { type: 'Vibrator', model: 'Wacker IREN 38 / Atlas Copco AME600', role: 'Consolidate concrete in drainage structures' }
                ],
                materials: [
                    { name: 'Cement OPC', unit: 'Bag 50kg', qty: 160, notes: 'Culverts, channels, headwalls' },
                    { name: 'River Sand', unit: 'Tonne', qty: 28, notes: 'Mortar for drainage structures' },
                    { name: 'Reinforcement Steel 12mm', unit: 'Length 12m', qty: 80, notes: 'Culvert + channel reinforcement' },
                    { name: 'PVC Pipes (600mm dia)', unit: 'Length 6m', qty: 30, notes: 'Cross-drainage culverts' },
                    { name: 'Steel Rebar', unit: 'Tonne', qty: 3, notes: 'Heavy drainage structures' }
                ]
            },
            8: {
                name: 'Road furniture & accessories',
                machinery: [
                    { type: 'Line marker', model: 'Graco Linelazer / Titan PowrLiner 3500', role: 'Paint full lane, edge and centreline markings' },
                    { type: 'Pickup', model: 'Toyota Hilux / Isuzu D-Max', role: 'Transport sign and kerb installation teams' },
                    { type: 'Generator', model: '6.5 kVA diesel genset', role: 'Power stud guns, drills, lighting' },
                    { type: 'Crane / picker', model: 'Hiab 058 / Palfinger PK6500', role: 'Install heavy guardrail panels and large signs' },
                    { type: 'Saw cutter', model: 'Husqvarna FS 7000 D', role: 'Cut kerb seating channels in concrete slab edge' }
                ],
                materials: [
                    { name: 'Road Marking Paint', unit: 'Bucket 20L', qty: 10, notes: 'Centreline + edge + lane markings' },
                    { name: 'Kerb Stones', unit: 'Piece', qty: 600, notes: 'Both sides full length' },
                    { name: 'W-Beam Guardrail', unit: 'Panel 4m', qty: 40, notes: 'Embankments + bridges' },
                    { name: 'Road Signs', unit: 'Unit', qty: 10, notes: 'Full regulatory + warning suite' },
                    { name: 'Delineator Posts', unit: 'Unit', qty: 60, notes: 'Both edges' },
                    { name: 'Cat Eyes / Studs', unit: 'Unit', qty: 150, notes: 'Lane + centreline, 8m spacing' }
                ]
            }
        }
    }
};

export function getRecommendedResources(roadType, phase) {
    // Normalize roadType from DB strings to internal RT codes
    let normalizedRT = roadType;
    if (roadType) {
        const type = roadType.toLowerCase();
        if (type.includes('bitumen') || type.includes('asphalt')) normalizedRT = 'RT-4';
        else if (type.includes('concrete')) normalizedRT = 'RT-5';
        else if (type.includes('gravel')) normalizedRT = 'RT-2';
        else if (type.includes('earth') || type.includes('laterite')) normalizedRT = 'RT-1';
        else if (type.includes('dressing')) normalizedRT = 'RT-3';
    }

    // Default to RT-5 if unknown to show some data for demo
    if (!RESOURCE_MAPPING[normalizedRT]) {
        console.warn(`[ResourceMapping] Unknown roadType "${roadType}", defaulting to RT-5`);
        normalizedRT = 'RT-5';
    }

    console.log('[ResourceMapping] Fetching for normalizedRT:', normalizedRT);

    const roadData = RESOURCE_MAPPING[normalizedRT];
    if (!roadData) {
        console.error('[ResourceMapping] Critical: RT-5 not found in mapping!');
        return { machinery: [], materials: [] };
    }

    const allMachinery = [];
    const allMaterials = [];
    const seenMac = new Set();
    const seenMat = new Set();

    console.log('[ResourceMapping] Phases available:', Object.keys(roadData.phases));

    // Collect resources from all phases to remove phase filtering constraint
    Object.values(roadData.phases).forEach(phaseData => {
        phaseData.machinery.forEach(m => {
            if (!seenMac.has(m.model)) {
                allMachinery.push(m);
                seenMac.add(m.model);
            }
        });
        phaseData.materials.forEach(m => {
            if (!seenMat.has(m.name)) {
                allMaterials.push(m);
                seenMat.add(m.name);
            }
        });
    });
    
    console.log(`[ResourceMapping] Found ${allMachinery.length} machines and ${allMaterials.length} materials`);
    
    return {
        machinery: allMachinery,
        materials: allMaterials
    };
}
