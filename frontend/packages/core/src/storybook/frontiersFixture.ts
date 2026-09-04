import type { Activity } from '../types/Activity';
import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Thread } from '../types/Thread';
import type { EventPhase, TraceEvent } from '../types/TraceEvent';
import type { AppChartFixture } from './fixtureTrace';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const categories: Category[] = [
  { id: 1, name: 'question', color_background: '#efc360', color_text: '#000000' },
  { id: 2, name: 'evidence', color_background: '#60a5fa', color_text: '#000000' },
  { id: 3, name: 'principle', color_background: '#a78bfa', color_text: '#ffffff' },
  { id: 4, name: 'design', color_background: '#34d399', color_text: '#000000' },
];

function thread(id: EntityId, name: string, rank = 0): Thread {
  return { id, name, rank, collapsed: false };
}

function activity(
  owner: Thread,
  id: EntityId,
  name: string,
  options: {
    agentName?: string;
    agentProvider?: string;
    category?: EntityId;
    parentId?: EntityId;
  } = {},
): Activity {
  const slug = options.agentName?.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name,
    thread: owner,
    thread_id: owner.id,
    parent_id: options.parentId,
    categories: [options.category ?? 1],
    ...(options.agentName && slug
      ? {
          agent_id: options.agentProvider
            ? `${options.agentProvider}:${slug}`
            : slug,
          agent_name: options.agentName,
        }
      : {}),
  };
}

/**
 * How we got to the Moon, asked as one investigation.
 *
 * The gold bar on mission is the question that stays open. Everything else is
 * a chapter: finish the rabbit hole, then shift. Dead ends reject (J). The
 * path that survives resolves (V). Fixture "now" is evening, after the
 * mission question closes. Morning is ~22 hours back.
 *
 * Parents and children stay on the same thread. A new discipline is a new
 * thread, not a cross-thread nest.
 */
export function createFrontiersFixture(now = Date.now()): AppChartFixture {
  const ago = (hours: number, minutes = 0) => now - hours * HOUR - minutes * MINUTE;

  const mission = thread(1, 'mission 🚀', 0);
  const energy = thread(2, 'energy ⚡', 1);
  const fuels = thread(3, 'fuels 🔥', 2);
  const materials = thread(4, 'materials 🧱', 3);
  const navigation = thread(5, 'navigation 📡', 4);

  // --- mission ------------------------------------------------------------
  const moon = activity(mission, 100, 'How do we get to the Moon and back?');
  const straight = activity(mission, 110, 'Is the shortest path a straight line?', {
    category: 3,
    parentId: moon.id,
  });
  const cheaper = activity(mission, 111, 'Does less distance mean less fuel?', {
    category: 3,
    parentId: straight.id,
  });
  const hohmann = activity(mission, 112, 'Read Hohmann 1925', {
    agentName: 'Athena',
    agentProvider: 'cursor',
    category: 2,
    parentId: cheaper.id,
  });
  const pointBurn = activity(mission, 113, 'Could we just point at the Moon and burn?', {
    category: 3,
    parentId: straight.id,
  });
  const staging = activity(mission, 120, "Why isn't one big rocket enough?", {
    category: 3,
    parentId: moon.id,
  });
  const equation = activity(mission, 121, 'What does the rocket equation forbid?', {
    category: 3,
    parentId: staging.id,
  });
  const tsiolkovsky = activity(mission, 122, 'Read Tsiolkovsky 1903', {
    agentName: 'Kepler',
    agentProvider: 'claude',
    category: 2,
    parentId: equation.id,
  });
  const singleStage = activity(mission, 123, 'Can a single stage reach lunar orbit?', {
    category: 4,
    parentId: staging.id,
  });
  const land = activity(mission, 130, 'Does the whole ship have to land?', {
    category: 4,
    parentId: moon.id,
  });
  const direct = activity(mission, 131, 'Direct ascent: land the command ship?', {
    category: 4,
    parentId: land.id,
  });
  const eor = activity(mission, 132, 'Assemble two Saturns in Earth orbit instead?', {
    category: 4,
    parentId: land.id,
  });
  const houbolt = activity(mission, 133, "Read Houbolt's LOR papers", {
    agentName: 'Athena',
    agentProvider: 'cursor',
    category: 2,
    parentId: land.id,
  });
  const noAir = activity(mission, 134, 'How do you land with no atmosphere?', {
    category: 4,
    parentId: land.id,
  });
  const home = activity(mission, 140, 'How do we get home without burning up?', {
    category: 4,
    parentId: moon.id,
  });
  const corridor = activity(mission, 141, 'How narrow is the reentry corridor?', {
    category: 3,
    parentId: home.id,
  });

  // --- energy -------------------------------------------------------------
  const whatEnergy = activity(energy, 200, 'What is energy?');
  const caloric = activity(energy, 210, 'Is energy a fluid you pour into the tank?', {
    category: 3,
    parentId: whatEnergy.id,
  });
  const joule = activity(energy, 211, 'Read Joule on the mechanical equivalent of heat', {
    agentName: 'Maxwell',
    agentProvider: 'claude',
    category: 2,
    parentId: caloric.id,
  });
  const work = activity(energy, 212, 'Is it just force through a distance?', {
    category: 3,
    parentId: whatEnergy.id,
  });
  const gravityWell = activity(energy, 220, 'Why does leaving Earth cost so much?', {
    category: 3,
    parentId: whatEnergy.id,
  });
  const escapeSpeed = activity(energy, 221, 'Is escape velocity a speed you must hit at the pad?', {
    category: 3,
    parentId: gravityWell.id,
  });
  const potential = activity(energy, 222, 'What is gravitational potential energy?', {
    category: 3,
    parentId: gravityWell.id,
  });
  const tower = activity(energy, 223, 'Could we climb a tower instead of throwing?', {
    category: 4,
    parentId: gravityWell.id,
  });
  const chemicalEnough = activity(energy, 230, 'Is chemical energy even in the right league?', {
    category: 3,
    parentId: whatEnergy.id,
  });
  const bondVsOrbit = activity(energy, 231, 'eV per bond versus joules to reach orbit?', {
    category: 3,
    parentId: chemicalEnough.id,
  });
  const keplerBonds = activity(energy, 232, 'Map bond energies against orbital energy', {
    agentName: 'Kepler',
    agentProvider: 'claude',
    category: 2,
    parentId: bondVsOrbit.id,
  });
  const nerva = activity(energy, 233, 'Could nuclear thermal skip chemistry?', {
    category: 4,
    parentId: chemicalEnough.id,
  });

  // --- fuels --------------------------------------------------------------
  const howFuel = activity(fuels, 300, 'How do fuels actually store energy?');
  const whatBond = activity(fuels, 310, 'What is a chemical bond?', {
    category: 3,
    parentId: howFuel.id,
  });
  const whyExothermic = activity(fuels, 311, 'Why do some reactions release energy?', {
    category: 3,
    parentId: howFuel.id,
  });
  const whyOxygen = activity(fuels, 312, 'Why is oxygen the thing we pair with?', {
    category: 3,
    parentId: howFuel.id,
  });
  const gasoline = activity(fuels, 320, 'Why not just burn gasoline in air, like a plane?', {
    category: 4,
    parentId: howFuel.id,
  });
  const noAirToSteal = activity(fuels, 321, 'Is there air to steal oxidizer from?', {
    category: 3,
    parentId: gasoline.id,
  });
  const carryOx = activity(fuels, 322, 'So we have to carry the oxidizer?', {
    category: 4,
    parentId: gasoline.id,
  });
  const whichPair = activity(fuels, 330, 'Which fuel and oxidizer?', {
    category: 4,
    parentId: howFuel.id,
  });
  const rp1 = activity(fuels, 331, 'LOX and RP-1 for the first stage?', {
    category: 4,
    parentId: whichPair.id,
  });
  const notLh2First = activity(fuels, 332, 'Why not liquid hydrogen on the first stage?', {
    category: 4,
    parentId: whichPair.id,
  });
  const lh2Upper = activity(fuels, 333, 'LOX and LH2 on the upper stages?', {
    category: 4,
    parentId: whichPair.id,
  });
  const lightExhaust = activity(fuels, 334, 'Why does a light exhaust molecule raise Isp?', {
    category: 3,
    parentId: whichPair.id,
  });
  const hypergolics = activity(fuels, 335, 'Hypergolics for the lander and the service engine?', {
    category: 4,
    parentId: whichPair.id,
  });
  const isp = activity(fuels, 340, 'What is specific impulse, really?', {
    category: 3,
    parentId: howFuel.id,
  });
  const exhaustVel = activity(fuels, 341, 'Is Isp just exhaust velocity in costume?', {
    category: 3,
    parentId: isp.id,
  });
  const goddard = activity(fuels, 342, 'Read Goddard 1919 and Oberth', {
    agentName: 'Athena',
    agentProvider: 'cursor',
    category: 2,
    parentId: isp.id,
  });

  // --- materials ----------------------------------------------------------
  const survive = activity(materials, 400, 'What can we actually build this out of?');
  const steel = activity(materials, 410, 'Why not steel tanks?', {
    category: 4,
    parentId: survive.id,
  });
  const aluminum = activity(materials, 411, 'Aluminum 2219 for the tanks?', {
    category: 4,
    parentId: survive.id,
  });
  const holdLh2 = activity(materials, 420, 'How do you hold liquid hydrogen?', {
    category: 4,
    parentId: survive.id,
  });
  const insulation = activity(materials, 421, 'How do you keep 20 K from boiling away?', {
    category: 4,
    parentId: holdLh2.id,
  });
  const hugeTanks = activity(materials, 422, 'Why are the hydrogen tanks so huge?', {
    category: 3,
    parentId: holdLh2.id,
  });
  const engineMelt = activity(materials, 430, 'How does the engine not melt?', {
    category: 4,
    parentId: survive.id,
  });
  const regen = activity(materials, 431, 'Run the fuel through the bell first?', {
    category: 4,
    parentId: engineMelt.id,
  });
  const f1cooling = activity(materials, 432, 'Read how the F-1 was cooled', {
    agentName: 'Kepler',
    agentProvider: 'claude',
    category: 2,
    parentId: regen.id,
  });
  const reenter = activity(materials, 440, 'How do you reenter without burning up?', {
    category: 4,
    parentId: survive.id,
  });
  const plasma = activity(materials, 441, 'Where does the heat actually come from?', {
    category: 3,
    parentId: reenter.id,
  });
  const ablative = activity(materials, 442, 'Ablative AVCOAT, or a reusable metal shield?', {
    category: 4,
    parentId: reenter.id,
  });
  const lmFoil = activity(materials, 450, 'Why is the lander made of foil?', {
    category: 4,
    parentId: survive.id,
  });
  const noAero = activity(materials, 451, 'Does vacuum mean we can ignore aerodynamics?', {
    category: 3,
    parentId: lmFoil.id,
  });

  // --- navigation ---------------------------------------------------------
  const where = activity(navigation, 500, 'How do you know where you are?');
  const sextant = activity(navigation, 510, 'Can a sextant alone land you?', {
    category: 4,
    parentId: where.id,
  });
  const imu = activity(navigation, 520, 'Inertial measurement — integrate acceleration?', {
    category: 3,
    parentId: where.id,
  });
  const agc = activity(navigation, 530, 'What does the Apollo guidance computer actually do?', {
    category: 4,
    parentId: where.id,
  });
  const radar = activity(navigation, 540, 'How do you not hit a boulder on the way down?', {
    category: 4,
    parentId: where.id,
  });
  const alarms = activity(navigation, 550, 'Were the 1202 alarms a failure of the computer?', {
    category: 4,
    parentId: agc.id,
  });

  let eventId = 8000;
  const ev = (
    hours: number,
    phase: EventPhase,
    item: Activity,
    message?: string,
    minutes = 0,
  ): TraceEvent => {
    eventId += 1;
    return {
      id: eventId,
      timestamp: ago(hours, minutes),
      phase,
      activity: item,
      message,
    };
  };

  const events: TraceEvent[] = [
    // 1. The path. Finish the wrong picture before leaving the mission thread.
    ev(22, 'Q', moon, 'Kennedy asked. The physics has to answer.'),
    ev(21.8, 'Q', straight, 'Shortest looks obvious. Rockets do not pay in miles.'),
    ev(21.6, 'Q', cheaper, 'Does less distance mean less fuel?'),
    ev(21.5, 'B', hohmann),
    ev(21, 'E', hohmann, 'Two burns. Coast on an ellipse. The cheap path is an orbit.'),
    ev(20.8, 'J', cheaper, 'Less distance is not less energy. Fighting gravity the whole way is the expensive path.'),
    ev(20.6, 'Q', pointBurn, 'Could we just point at the Moon and burn?'),
    ev(20.3, 'J', pointBurn, 'A continuous burn never gets the free coast. Gravity losses eat the rocket.'),
    ev(20.1, 'J', straight, 'Not a line. An ellipse that meets the Moon. Fuel is Δv. Δv is energy. What is energy?'),

    // 2. Energy. What we are spending, and whether chemistry can pay.
    ev(20, 'Q', whatEnergy, 'If we are going to spend it, we should know what it is.'),
    ev(19.8, 'Q', caloric, 'The old picture: a fluid you pour. Caloric.'),
    ev(19.6, 'B', joule, 'Maxwell: Joule, 1840s, the paddle wheel'),
    ev(19.1, 'E', joule, 'Heat is work. The same quantity. Not a fluid.'),
    ev(18.9, 'J', caloric, 'Not a substance. A bookkeeping of work you can still do.'),
    ev(18.7, 'Q', work, 'Force through a distance. Then heat, then chemistry — same stuff, different clothes.'),
    ev(18.4, 'V', work, 'Yes as a definition of mechanical work. Incomplete as a theory of fuel.'),
    ev(18.2, 'Q', gravityWell, 'Most of the bill is not the Moon. It is climbing out of Earth.'),
    ev(18, 'Q', escapeSpeed, '11.2 km/s. Do we have to be going that fast at liftoff?'),
    ev(17.6, 'J', escapeSpeed, 'No. That is the energy equivalent, not a speed at the pad. You can go slower if you keep thrusting.'),
    ev(17.4, 'Q', potential, 'GMm / r. The well is deeper than it looks from the ground.'),
    ev(17, 'V', potential, 'Raising a kilogram from Earth radius to infinity is ~62 MJ. LEO is already most of that.'),
    ev(16.8, 'Q', tower, 'A space elevator. Climb instead of throw.'),
    ev(16.5, 'J', tower, 'No material in 1961 holds that tensile load. You throw.'),
    ev(16.3, 'V', gravityWell, 'You buy altitude and speed with energy. Chemistry has to supply it.'),
    ev(16.1, 'Q', chemicalEnough, 'A chemical bond is a few electron-volts. Orbit is brutal. Does this even work?'),
    ev(15.9, 'Q', bondVsOrbit),
    ev(15.8, 'B', keplerBonds, 'Kepler: eV per molecule times Avogadro, versus ½mv² in orbit'),
    ev(15.3, 'E', keplerBonds, 'Hydrocarbon + oxygen is ~10 MJ/kg of mixture. LEO kinetic is ~30 MJ/kg of payload. Tight. Staging exists because of this.'),
    ev(15.1, 'V', bondVsOrbit, 'The numbers only close if most of what you throw is fuel, and you drop the tanks.'),
    ev(14.9, 'Q', nerva, 'A nuclear reactor heating hydrogen. Higher exhaust velocity. Skip the bond.'),
    ev(14.5, 'J', nerva, 'NERVA was real. It did not fly under a stack by 1969. Chemistry had to do.'),
    ev(14.3, 'V', chemicalEnough, 'Chemical energy is enough, barely, if you spend almost all of the mass.'),
    ev(14.1, 'V', whatEnergy, 'Energy is the work still available. Gravity prices the trip. Chemistry, barely, pays it.'),

    // 3. Fuels. How chemistry stores that energy, then which molecules.
    ev(14, 'Q', howFuel, 'A tank is not energy. The arrangement of electrons is.'),
    ev(13.8, 'Q', whatBond, 'What is a chemical bond?'),
    ev(13.4, 'V', whatBond, 'A shared pair of electrons in a well. The release is forming a deeper well.'),
    ev(13.2, 'Q', whyExothermic, 'Why do CO₂ and water sit lower than kerosene and O₂?'),
    ev(12.8, 'V', whyExothermic, 'The new bonds are deeper. The difference leaves as kinetic energy of the products.'),
    ev(12.6, 'Q', whyOxygen, 'Fluorine is greedier. Why oxygen?'),
    ev(12.2, 'V', whyOxygen, 'Oxygen is greedy enough, liquid, and you can live around it. Fluorine will eat the plumbing.'),
    ev(12, 'Q', gasoline, 'Airplanes burn fuel in air. Why is a rocket different?'),
    ev(11.8, 'Q', noAirToSteal),
    ev(11.5, 'J', noAirToSteal, 'Above the atmosphere there is nothing to steal. Even in thick air a rocket is going too fast to breathe like a jet.'),
    ev(11.3, 'Q', carryOx, 'So we have to carry the oxidizer?'),
    ev(11, 'V', carryOx, 'Half the "fuel" is oxygen. The tank farm is a chemistry set, not a gas station.'),
    ev(10.8, 'J', gasoline, 'A jet engine is an oxidizer thief. A rocket is a closed reaction you carry.'),
    ev(10.6, 'Q', isp, 'What is specific impulse, really?'),
    ev(10.5, 'B', goddard),
    ev(10.2, 'E', goddard, 'Goddard already knew: the energy is in the exhaust velocity, not in a bang.'),
    ev(10.1, 'Q', exhaustVel, 'Is Isp just exhaust velocity in costume?'),
    ev(9.9, 'V', exhaustVel, 'Seconds of Isp are just ve / g0. A costume for a speed.'),
    ev(9.8, 'V', isp, 'How much momentum you buy per kilo of reaction mass.'),
    ev(9.6, 'Q', whichPair, 'The rocket equation only cares about exhaust velocity and mass ratio. Chemistry picks both.'),
    ev(9.4, 'Q', rp1, 'LOX / RP-1. Dense. Dirty. The F-1 burns it.'),
    ev(9.2, 'V', rp1, 'High density means small tanks at the bottom, where you fight air and you want stiffness.'),
    ev(9, 'Q', notLh2First, 'Hydrogen has the better Isp. Why not from the pad?'),
    ev(8.8, 'V', notLh2First, 'It is bulky. The tanks would be balloons. You would spend the Isp advantage on structure.'),
    ev(8.6, 'Q', lh2Upper, 'S-II and S-IVB burn LOX / LH2.'),
    ev(8.4, 'V', lh2Upper, 'Once you are above the air, volume is cheaper than mass. Now hydrogen wins.'),
    ev(8.2, 'Q', lightExhaust, 'Why does a light exhaust molecule raise Isp?'),
    ev(8, 'V', lightExhaust, 'Same thermal energy, lighter molecules, higher thermal speed. ve is a speed.'),
    ev(7.8, 'Q', hypergolics, 'The lander and the service engine: Aerozine 50 and N₂O₄.'),
    ev(7.6, 'V', hypergolics, 'They ignite on contact. They sit for days. Toxic. The vacuum does not care.'),
    ev(7.4, 'V', whichPair, 'Dense and dirty to leave the ground. Light and cold to leave Earth. Storable and vicious to land and come home.'),
    ev(7.3, 'V', howFuel, 'Fuels are arranged electrons. You carry both sides of the reaction.'),

    // 4. Staging. Now that ve is a real number, the rocket equation bites.
    ev(7.2, 'Q', staging, 'If the path is an orbit, why not one vehicle all the way?'),
    ev(7, 'Q', equation),
    ev(6.9, 'B', tsiolkovsky, 'Kepler: what the 1903 paper actually forbids'),
    ev(6.4, 'E', tsiolkovsky, 'Δv = ve ln(m0/mf). Chemical ve is ~3 km/s. Lunar Δv is ~15.'),
    ev(6.2, 'V', equation, 'Mass grows exponentially with Δv. Every kilo of empty tank is a kilo you still have to throw.'),
    ev(6, 'Q', singleStage, 'Can a single stage reach lunar orbit?'),
    ev(5.7, 'J', singleStage, 'The mass ratio would be absurd. The tanks would be the payload.'),
    ev(5.5, 'V', staging, 'Drop mass you have already used. Staging is the only chemical way.'),

    // 5. Materials. The mass ratio is honest only if the hardware is almost nothing.
    ev(5.4, 'Q', survive, 'The numbers only close if the tanks and bells are almost nothing.'),
    ev(5.2, 'Q', steel, 'Ships are steel. Why not this?'),
    ev(4.9, 'J', steel, 'Too heavy for the mass ratio. Steel is for bridges. This is a thrown tank.'),
    ev(4.7, 'Q', aluminum, 'Aluminum 2219 for the tanks?'),
    ev(4.4, 'V', aluminum, 'Strong enough per kilo. The tanks *are* the structure.'),
    ev(4.2, 'Q', holdLh2, 'How do you hold liquid hydrogen?'),
    ev(4.1, 'Q', insulation, 'How do you keep 20 K from boiling away?'),
    ev(3.8, 'V', insulation, 'Foam, helium purge, spray-on insulation. You fight boiloff, you do not win it.'),
    ev(3.6, 'Q', hugeTanks, 'Why are the hydrogen tanks so huge?'),
    ev(3.4, 'V', hugeTanks, 'Low density. The S-II is a flying thermos. That is the hydrogen penalty the first stage refused.'),
    ev(3.3, 'V', holdLh2, 'You hold it by insulating, venting, and using it before it leaves.'),
    ev(3.2, 'Q', engineMelt, 'How does the engine not melt?'),
    ev(3.1, 'Q', regen, 'Run the fuel through the bell first?'),
    ev(3, 'B', f1cooling),
    ev(2.7, 'E', f1cooling, 'Regenerative cooling plus film cooling. The fuel is the coolant. Then it is the fuel.'),
    ev(2.6, 'V', regen, 'The bell is a heat exchanger that also makes thrust.'),
    ev(2.5, 'V', engineMelt, 'You do not find a metal that likes that fire. You keep the metal from seeing it.'),

    // 6. Landing mode. A staged rocket still has to put something on the surface.
    ev(2.4, 'Q', land, 'A staged rocket still has to put something on the surface.'),
    ev(2.3, 'Q', direct, 'The first picture: one ship, down and up.'),
    ev(2.1, 'J', direct, 'Nova-class. Too heavy to build in time. The return ship is dead weight on the surface.'),
    ev(2, 'Q', eor, 'Assemble two Saturns in Earth orbit instead?'),
    ev(1.85, 'V', eor, 'Works. Two Saturns, dock in LEO. Operationally expensive. Not what they flew.'),
    ev(1.8, 'B', houbolt),
    ev(1.6, 'E', houbolt, 'Leave the mothership in lunar orbit. Only a light bug goes down.'),
    ev(1.5, 'Q', noAir, 'How do you land with no atmosphere?'),
    ev(1.35, 'V', noAir, 'Throttle a descent engine. Radar. Then the same bug jumps back to orbit.'),
    ev(1.3, 'V', land, 'Lunar orbit rendezvous. The principle is: do not land what you do not need.'),

    // 7. The bug is foil. Then find it. Then get home.
    ev(1.25, 'Q', lmFoil, 'Why is the lander made of foil?'),
    ev(1.2, 'Q', noAero, 'Does vacuum mean we can ignore aerodynamics?'),
    ev(1.1, 'V', noAero, 'Every kilo of skin is a kilo you landed for no lift. Foil is enough against vacuum.'),
    ev(1.05, 'V', lmFoil, 'Mass is the whole game. The lander is as thin as the pressure vessel allows.'),

    ev(1, 'Q', where, 'A perfect rocket that does not know where it is still misses the Moon.'),
    ev(0.95, 'Q', sextant, 'Can a sextant alone land you?'),
    ev(0.85, 'J', sextant, 'Fine for midcourse. Useless for a boulder field in the last minutes.'),
    ev(0.8, 'Q', imu, 'Inertial measurement — integrate acceleration?'),
    ev(0.7, 'V', imu, 'It drifts. You reset it with the sextant. The two together are the navigator.'),
    ev(0.65, 'Q', agc, 'What does the Apollo guidance computer actually do?'),
    ev(0.6, 'Q', alarms, '1201, 1202. Executive overflow. Abort?'),
    ev(0.52, 'J', alarms, 'No. The computer was throwing away work it did not need. Armstrong still had a flyable ship.'),
    ev(0.48, 'V', agc, 'Priority scheduling. The landing ran because the unimportant jobs lost.'),
    ev(0.45, 'Q', radar, 'How do you not hit a boulder on the way down?'),
    ev(0.38, 'V', radar, 'Landing radar, then the commander. The computer does not get a veto on a crater.'),
    ev(0.35, 'V', where, 'Stars to reset. Gyros to hold. Radar to land. A person to pick the field.'),

    ev(0.32, 'Q', home, 'How do we get home without burning up?'),
    ev(0.3, 'Q', corridor, 'How narrow is the reentry corridor?'),
    ev(0.24, 'V', corridor, 'A couple of degrees. Too steep: you bake. Too shallow: you skip off into space.'),
    ev(0.22, 'Q', reenter, 'How do you reenter without burning up?'),
    ev(0.2, 'Q', plasma, 'The heat shield glows. Is that combustion?'),
    ev(0.16, 'V', plasma, 'Kinetic energy, dumped into air. Compression and shock. The capsule is a blunt brake.'),
    ev(0.14, 'Q', ablative, 'A metal heat sink, or something that is allowed to burn?'),
    ev(0.1, 'V', ablative, 'AVCOAT chars and carries the heat away as gas. You bring a shield you are willing to destroy.'),
    ev(0.08, 'V', reenter, 'Turn speed into a sacrificial solid. That is the reentry.'),
    ev(0.06, 'V', home, 'Hit the corridor. Let the shield die so the crew does not.'),
    ev(0.04, 'V', survive, 'Light tanks, cooled bells, foil lander, ablative shield. Materials are how the mass ratio stays honest.'),
    ev(
      0.02,
      'V',
      moon,
      'Orbits, not lines. Staging, because mass ratios. Dense fire, then cold hydrogen, then a vicious pair that waits. A bug that lands, a ship that waits, a shield that is allowed to die. That is how.',
    ),
  ];

  return {
    attentionShifts: [
      { thread_id: mission.id, timestamp: ago(22) },
      { thread_id: energy.id, timestamp: ago(20) },
      { thread_id: fuels.id, timestamp: ago(14) },
      { thread_id: mission.id, timestamp: ago(7.2) },
      { thread_id: materials.id, timestamp: ago(5.4) },
      { thread_id: mission.id, timestamp: ago(2.4) },
      { thread_id: materials.id, timestamp: ago(1.25) },
      { thread_id: navigation.id, timestamp: ago(1) },
      { thread_id: mission.id, timestamp: ago(0.32) },
      { thread_id: materials.id, timestamp: ago(0.22) },
      { thread_id: mission.id, timestamp: ago(0.02) },
    ],
    categories,
    events,
    threads: [mission, energy, fuels, materials, navigation],
    traceId: 8001,
    traceName: 'How do we get to the Moon and back?',
  };
}
