import { AutoDevMakeModelsReference } from '../validation/interfaces/IAutoDev';

/**
 * Maintenance notes (vPIC vs retail / Auto.dev-style picks):
 *
 * **Still noisy (not solved by make-drops alone)** — trim via {@link VPIC_EXCLUDED_MODELS_BY_MAKE} or
 * extra regexes scoped by make later:
 * - **Honda, BMW, Suzuki, Kawasaki…** — motorcycles/ATVs share the same make as cars in vPIC.
 * - **BYD, Mercedes-Benz, Ford, Chevrolet** — commercial SKUs (buses, cab codes) — substrings/regex help;
 *   some numeric codes need exact per-make lists.
 * - **Volvo** (passenger) vs **Volvo Truck** — we drop the truck make only; Volvo car list still mixes bus bodies.
 *
 * **May want to remove from {@link VPIC_EXCLUDED_MAKES}** if you list that inventory: BrightDrop, Nikola,
 * Lordstown, commercial-only startups — depends on product scope.
 *
 * **Stale names** — vPIC tracks regulatory names; marketing names (e.g. “Nissan Z”) can differ from Auto.dev.
 * Frontend matching is already case-insensitive; alias maps are a separate enhancement.
 */

/** Case- and punctuation-insensitive make key (matches frontend-style normalization). */
export function normalizeVpicMakeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Entire makes to drop from the reference map (vPIC `Make_Name` as returned by the API).
 * Add or remove entries here to tune what appears in marketplace make/model pickers (closer to Auto.dev retail).
 * Do **not** list normal passenger/light-truck brands you want to keep (e.g. Lucid, Polestar, Ram, smart).
 */
export const VPIC_EXCLUDED_MAKES: readonly string[] = [
  'Freightliner',
  'Peterbilt',
  'Mack',
  'Kenworth',
  'Volvo Truck',
  'International',
  'Western Star',
  'Sterling Truck',
  'Navistar',
  'Oshkosh',
  'Hino',
  'Caterpillar',
  'Blue Bird',
  'IC Bus',
  'Thomas Built',
  'Orion Bus',
  'Workhorse',
  'UD',
  'Mitsubishi Fuso',
  'Autocar',
  'Autocar Industries',
  'Capacity Trucks',
  'Kalmar Industries LLC',
  'National Oilwell Varco',
  'Diamond Heavy Vehicle Solutions',
  'Crane Carrier Company (CCC)',
  'BTL',
  'CCC',
  'McNeilus',
  'Jerr-Dan',
  'Pierce Manufacturing',
  'Spartan Motors',
  'Spartan Fire',
  'KME',
  'Smit',
  'Frontline',
  'London',
  'JLG',
  'Grumman',
  'American LaFrance',
  'E-One',
  'Coachworks',
  'Creative Coachworks',
  'Electric Mobile Cars',
  'EV Innovations',
  'Badger Equipment',
  'Elgin Sweeper Co',
  'Terex Advance Mixer',
  'TICO Manufacturing Division',
  'TransPower',
  'Total Electric Vehicles',
  'SMITH ELECTRIC VEHICLES',
  'Electric Vehicles International',
  'GreenPower',
  'Orange EV LLC',
  'Utilimaster Motor Corporation',
  'Collins',
  'Precedent',
  'LondonCoach Inc',
  'Carbodies',
  'Maxim Inc.',
  'S.T.I',
  'SAW',
  'Dennis',
  'Penske',
  'Gruppe B',
  'SIMON-DUPLEX',
  'Diamond Reo',
  'General Purpose Vehicles',
  'Truck Equipment Corporation(TEC)',
  'Indiana Phoenix Inc',
  'Rainier Truck and Chassis',
  'Service King Manufacturing',
  'Snowblast-Sicard, Inc.',
  'Terberg Taylor',
  'TERBERG BENSCHOP B.V.',
  'TENCO',
  'Rosenbauer',
  'SEAGRAVE',
  'SUTPHEN',
  'FWD',
  'Wheatridge',
  'White',
  'WHITEGMC',
  'Winnebago',
  'Wausau Equipment Company',
  'Vector Mixer',
  'SHAOLIN BUS',
  'Southfield Classics',
  'Windrose Technology',
  'ZZKNOWN',
  'Kovatch Mobile Equipment',
  'Kimble',
  'Kimble Chassis',
  'Superior Coaches',
  'Armbruster Stageway',
  'Creative Coachworks Inc.',
  'Federal Motors Inc',
  'Atlanta Fabricating & Equipment Co',
  'Daytona Coach Builders',
  'Mini Big Trucks',
  'M-B COMPANIES, INC.',
  'LODAL',
  'Brain Unlimited',
  'GLOBAL ENVIRONMENTAL PRODUCTS INC',
  'Envirotech Drive Systems Incorporated',
  'Efficient Drivetrains, Inc.',
  'ENVIROTECH DRIVE SYSTEMS INCORPORATED (EVT)',
  'Electric Car Company',
  'Crown Energy Technologies',
  'Boulder Electric Vehicle',
  'Azure Dynamics',
  'Azure Dynamic Inc.',
  'Allianz Sweeper Company',
  'Autokad',
  'Bakkura Mobility',
  'CAMI',
  'CONTEMPORARY CLASSIC CARS (CCC)',
  'C-R CHEETAH RACE CARS',
  'Coda',
  'Cobra Cars',
  'Bug Motors',
  'Excalibur Automobile Corporation',
  'Ives Motors Corporation (IMC)',
  'Marmon Motor Co',
  'Patriot Energy Services',
  'Rig Works',
  'Rocket Sled Motors',
  'Solectria',
  'Th!nk',
  'Tiger Truck',
  'World Transport Authority',
  'Yester Year Auto',
  'ZELIGSON',
  'AAS',
  'AMD',
  'AMERITECH CORPORATION',
  'AMPHI-RANGER',
  'AM General',
  'American Truck Company',
  'Autodelta USA Inc',
  'BBC',
  'Blackwater',
  'CALAVERAS MFG. INC.',
  'CLASSIC ROADSTERS',
  'Consulier',
  'Costin sports car',
  'CX Automotive',
  'DeSoto Motors',
  'Engine Connection',
  'Execucoach Inc',
  'Faw Jiaxing Happy Messenger',
  'Formula 1 Street Com',
  'FortuneSport VES',
  'GULLWING INTERNATIONAL MOTORS, LTD.',
  'Heritage',
  'HUNTER DESIGN GROUP, LLC',
  'HummingbirdEV',
  'Inzuro',
  'Jac 427',
  "Jasper's Hot Rods LLC",
  'KANDI',
  'KEYU',
  'JINMAYI',
  'Kubvan',
  'Lumen',
  'Making You Mobile',
  'MANA',
  'Matrix Motor Company',
  'mycar',
  'NJD Automotive LLC',
  'Ottawa Brimont Corporation',
  'PAS',
  'Phoenix Motorcars',
  'Phoenix Sports Cars, Inc.',
  'Protected Vehicles',
  'QuickLoadz',
  'RPM',
  'RS Spider',
  'Rally Sport',
  'Renaissance',
  'Revology',
  'Scammell',
  'Scuderia Cameron Glickenhaus (SCG)',
  'SF Motors Inc.',
  'Stanford Customs',
  'StoutBilt',
  'The Vehicle Production Group',
  'Trident Motor',
  'USA MOTOR CORPORATION',
  'USA MPV Co',
  'UCC',
  'Ukeycheyma',
  'Vector Aeromotive Corporation',
  'Vironex',
  'Vintage Auto',
  'Vision Industries',
  'Warhawk Performance',
  'Westfall Motors Corp.',
  'Xos',
  'Zoox',
  'Blue Arc',
  'CENNTRO',
  'Chanje',
  'Cruise',
  'ELMS',
  'EV PORTABLE',
  'iEV',
  'IEV CORPORATION / iEV',
  'LION ELECTRIC MANUFACTURING USA INC.',
  'NAFFCO',
  'NIKOLA',
  'Phoenix Cruiser',
  'Phoenix TRX',
  'RIDE',
  'T SERIES LLC',
  'VIA MOTORS, INC.',
  'VOLTZ',
  'ZM Trucks',
  '1955 Custom Belair',
  'ALLARD MOTOR WORKS',
  'A & O',
  'Armbruster Stageway',
  'Avera Motors',
  'Bison Motors',
  'Borah',
  'BrightDrop',
  'BREMACH',
  'Clenet',
  'CAMELOT',
  'Dennis Eagle',
  'Ecocar',
  'ELKINGTON',
  'FF',
  'Green Machines',
  'Hedley Studios',
  'HMC',
  'Humvee',
  'Iron Guru Customs',
  'KINDIG',
  'LAFORZA',
  'Lite Car',
  'Mayhem Autoworkz',
  'MK Sportscars',
  'Moke',
  'Mosler',
  'Osprey Custom 4x4',
  'Shay Reproduction',
  'Slate',
  'Supercar System',
  'TELO',
  'Tern',
  'Veolectra',
  'Sprinter (Dodge or Freightliner)',
];

function excludedMakeSet(): Set<string> {
  return new Set(VPIC_EXCLUDED_MAKES.map(normalizeVpicMakeKey));
}

/**
 * If a model name contains any of these (case-insensitive), drop it.
 * Phrases are chosen to avoid false positives (e.g. not bare "van" — would match "Caravan").
 */
export const VPIC_EXCLUDED_MODEL_SUBSTRINGS: readonly string[] = [
  'Chassis',
  'Incomplete',
  'Bus Chassis',
  'Motor Home',
  'School Bus',
  'Commercial Bus',
  'Terminal Tractor',
  'Glider Kit',
  'Fire Apparatus',
  'Truck Tractor',
  'Recreational Trailer',
  'Walk-in Van',
  'Cutaway Chassis',
  'Funeral Coach',
  'Hearse',
  'Ambulance',
  'Concrete',
  'Refuse',
  'Recovery',
  'Pumper',
  'Tanker',
  'Mixer',
  'Sweeper',
  'Drilling Rig',
  'Workover Rig',
];

/**
 * Drop model if it matches any of these (after trim). Mercedes/Freightliner-style commercial codes.
 * Do **not** use `/^M2\\s/i` here — it matches BMW "M2 Competition". Use `/^M2\\s\\d/` for cab series only.
 */
export const VPIC_EXCLUDED_MODEL_REGEXES: readonly RegExp[] = [
  /^L\d{4}$/i,
  /^LP\d{4}$/i,
  /^LPS\d+$/i,
  /^MB\s/i,
  /^MBC\s/i,
  /^MC\s/i,
  /^MD\d+/i,
  /^FB\s/i,
  /^FC\d/i,
  /^FL\d/i,
  /^FS\s/i,
  // M2 106-style commercial cabs; avoids matching BMW "M2 Competition"
  /^M2\s\d/i,
];

/**
 * Exact model names to remove for a given make (vPIC spelling). Keys must match vPIC `Make_Name`.
 * Example: vPIC sometimes misfiles a Bentley name under Rolls-Royce.
 */
export const VPIC_EXCLUDED_MODELS_BY_MAKE: Readonly<Record<string, readonly string[]>> = {
  'Rolls-Royce': ['Flying Spur'],
};

function excludedModelsExactForMake(make: string): Set<string> {
  const n = normalizeVpicMakeKey(make);
  for (const [k, list] of Object.entries(VPIC_EXCLUDED_MODELS_BY_MAKE)) {
    if (normalizeVpicMakeKey(k) === n) {
      return new Set(list.map((m) => m.trim().toLowerCase()).filter(Boolean));
    }
  }
  return new Set();
}

function shouldExcludeModel(model: string): boolean {
  const m = model.trim();
  if (!m) return true;
  const lower = m.toLowerCase();
  for (const sub of VPIC_EXCLUDED_MODEL_SUBSTRINGS) {
    if (lower.includes(sub.toLowerCase())) return true;
  }
  for (const re of VPIC_EXCLUDED_MODEL_REGEXES) {
    if (re.test(m)) return true;
  }
  return false;
}

/**
 * Apply configurable exclusions so the reference aligns better with retail/Auto.dev-style inventory.
 */
export function applyVpicReferenceExclusions(map: AutoDevMakeModelsReference): AutoDevMakeModelsReference {
  const dropMakes = excludedMakeSet();
  const out: AutoDevMakeModelsReference = {};

  for (const [make, models] of Object.entries(map)) {
    if (dropMakes.has(normalizeVpicMakeKey(make))) continue;
    const exactDrop = excludedModelsExactForMake(make);
    const kept: string[] = [];
    for (const model of models) {
      const t = model.trim();
      if (!t) continue;
      if (exactDrop.has(t.toLowerCase())) continue;
      if (shouldExcludeModel(t)) continue;
      kept.push(t);
    }
    if (kept.length > 0) {
      out[make] = [...new Set(kept)].sort((a, b) => a.localeCompare(b));
    }
  }

  return out;
}
