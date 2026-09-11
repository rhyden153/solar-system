# Voyager 1 and 2 replay

`voyagers.json` contains NASA/JPL Horizons geometric state vectors, downloaded
2026-09-08 with `node scripts/fetch-voyager.mjs`. No runtime network requests are
needed. Columns are Julian date (TDB), X/Y/Z (AU), and VX/VY/VZ (AU/day), in the
heliocentric J2000 ecliptic frame. Planetary-system barycenters are used for the
giant planets. Five-day samples cover 1977-08-21 to 2026-09-08, with Voyager 1
starting 1977-09-06. Both spacecraft have hourly samples around their encounters:
Jupiter and Saturn for Voyager 1; Jupiter, Saturn, Uranus, and Neptune for
Voyager 2. Playback uses cubic Hermite
interpolation and projects X/Y onto the map. Inspector distance and speed retain
all three dimensions.

This is an ephemeris replay, not a new N-body reconstruction. Horizons describes
Voyager 1's 1977–1981 trajectory and Voyager 2's 1977–1989 trajectory as
approximate patched conics matched to mission events. Later trajectories use
2022 refits of tracking data ending in 1992, followed by predictions. The shared
timeline starts the day after Voyager 2's August 20 launch. Voyager 1 appears
the day after its September 5 launch; it is not extrapolated before departure.
Both spacecraft use the same mission date, with independent colored paths and
milestone rows. Milestone dates follow NASA's mission pages (including November
5, 2018 for Voyager 2's interstellar crossing).

Sources:
- https://ssd.jpl.nasa.gov/horizons/
- https://ssd-api.jpl.nasa.gov/doc/horizons.html
- https://science.nasa.gov/mission/voyager/voyager-1/
- https://science.nasa.gov/mission/voyager/voyager-1s-pale-blue-dot/
- https://science.nasa.gov/mission/voyager/voyager-2/
- https://voyager.gsfc.nasa.gov/mission.html

# Galileo journey and atmospheric probe replay

`galileo.json` contains NASA/JPL Horizons state vectors for the Galileo orbiter
(target -77), its atmospheric probe (target -344), Venus, Earth, asteroids
951 Gaspra and 243 Ida, and Jupiter. It was downloaded with
`node scripts/fetch-galileo.mjs`; no runtime network request is needed. The Sun
is the coordinate origin. Playback covers the post-launch trajectory from
1989-10-19 through the probe’s atmospheric entry on 1995-12-07. The probe first
appears at its July 13, 1995 release.

Columns are Julian date (UT), X/Y/Z (AU), and VX/VY/VZ (AU/day), in the
heliocentric J2000 ecliptic frame. The orbiter and probe have twelve-hour
samples, while the encounter bodies have daily samples. Five-minute samples
cover each planetary gravity assist, asteroid flyby, and Jupiter arrival.
Cubic Hermite interpolation uses the provided velocities. Milestone buttons
seek to the interpolated closest separation on each encounter date, to the
nearest minute. The canvas projects X/Y; inspector distances and speeds retain
all three dimensions.

The dashed guides plot the complete orbiter and probe routes; solid trails plot
the portions traveled by the selected date. The captured Horizons descriptions
in `galileo-horizons.txt` identify both routes as JPL Navigation Team
reconstructions. The atmospheric probe had no propulsion after release. Its
trajectory ends at atmospheric entry, while the displayed orbiter route ends
at Jupiter arrival rather than continuing through the eight-year orbital tour.

Sources:
- https://ssd.jpl.nasa.gov/horizons/
- https://ssd-api.jpl.nasa.gov/doc/horizons.html
- https://science.nasa.gov/mission/galileo/
- https://science.nasa.gov/mission/galileo-jupiter-atmospheric-probe/

Validate both replays and canvas controls with:

```sh
node scripts/test-voyager.mjs
node scripts/test-galileo.mjs
```

# Additional mission presets

`cassini.json`, `rosetta.json`, and `webb.json` are NASA/JPL Horizons geometric
state vectors downloaded with `node scripts/fetch-missions.mjs`. Requests use
UT dates and AU / AU-day units. Captured query headers and trajectory provenance
are in the corresponding `*-horizons.txt` files. No runtime network calls are
required. The common sampler preserves 3D distance and speed; display views
project positions separately, including every stored trail point.

- **Cassini: Grand Finale:** 2017-04-22 to 2017-09-15 10:31 UTC, centered on
  Saturn (699), using JPL's final mission reconstruction. Cassini is sampled
  every 30 minutes, Titan every three hours, and Enceladus hourly; the final
  descent is refined to one-minute samples. The replay stops at atmospheric
  entry, before loss of signal. The tilted view uses Saturn's approximate
  J2000 pole and an 18-degree ring opening. Planet/ring geometry is schematic,
  with physical radii; Saturn system and Ring dives use different map scales.
  The bright trail spans seven days. Twenty-two radial minima are validated.
- **Rosetta: Comet Rendezvous:** 2014-08-06 09:06 to 2016-09-30 10:39 UTC,
  using mission-consistent comet reference 1000012, as prescribed by JPL.
  These are ESA navigation solutions, not a modern generic comet orbit
  subtracted from spacecraft positions. Sampling is hourly, with one-minute
  samples for the final descent. The guide previews the next 30 days and the
  bright trail spans 14 days. Comet close-up and Full excursion cover the
  small orbits and excursions beyond 1,000 km. Philae's landing is a timeline
  milestone; its independent trajectory is not included. The nucleus is a
  schematic circle, not a shape model.
- **James Webb: Around L2:** 2021-12-26 to 2023-01-24 19:05 UTC, from departure
  to the first anniversary of halo-orbit insertion. Earth-relative spacecraft,
  Sun, and Moon vectors are sampled every six hours. The view rotates with the
  Sun–Earth direction, with a 30-degree tilt mixing transverse and vertical
  motion. Earth–L2 and Halo close-up use the same rotating axes. The marker at
  1.5 million km is an approximate L2 reference, not another gravitating body.
  Reported distance and speed remain Earth-relative inertial quantities.

Sources:
- https://ssd.jpl.nasa.gov/horizons/
- https://ssd-api.jpl.nasa.gov/doc/horizons.html
- https://science.nasa.gov/mission/cassini/grand-finale/grand-finale-orbit-guide/
- https://science.nasa.gov/missions/cassini/cassini-makes-its-goodbye-kiss-flyby-of-titan/
- https://blogs.esa.int/rosetta/2014/08/18/whats-up-with-rosetta/
- https://blogs.esa.int/rosetta/2016/12/23/rosettas-complete-journey-animation/
- https://science.nasa.gov/asset/webb/webbs-orbit-at-sun-earth-lagrange-point-2-l2/
- https://science.nasa.gov/blogs/webb/2022/01/24/orbital-insertion-burn-a-success-webb-arrives-at-l2/

## Apollo 11 reconstruction

`apollo11.json` is an **educational reconstruction** of Columbia, generated with
`node scripts/generate-apollo11.mjs`, rather than an as-flown ephemeris.
The input states are recorded in `apollo11-anchors.json` and come from NASA's
*Apollo 11 Mission Report* (MSC-00171), tables 7-II and 7-VII. The Moon's
Earth-centered ICRF positions are fetched from JPL Horizons for July 16–25, 1969.

Report nautical miles and feet/second are converted to kilometers and
kilometers/second. Earth-fixed positions use mean sidereal rotation and J2000
precession; lunar states use an approximate mean Earth-facing frame and pole.
Forward and backward Earth/Moon point-mass integrations use 30-second RK4 steps
and a quintic blend between anchors, matching their position and velocity.
Samples are dense near Earth and throughout lunar orbit, and approximately
five minutes apart on distant coasts. Stored units are Julian days, AU and AU/day.

Lunar orbit, libration, navigation corrections and finite burns are simplified.
Blended paths and inspector values are not precision flight measurements.
The spacecraft track follows Columbia, including while Eagle is on the surface.
Eagle landing, first steps and liftoff are contextual mission milestones, not
separate simulated descent/ascent trajectories.

The replay begins at the report's translunar injection state on July 16 at
16:22:13.2 UTC and ends at Earth entry on July 24 at 16:35:05.7 UTC.
Atmospheric descent and splashdown are excluded. Earth–Moon uses a fixed orbital
plane projection; Lunar orbit subtracts the Moon's position at each sample's
own timestamp, keeping the route and spacecraft in the same coordinate frame.

Sources:
- https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf
- https://www.nasa.gov/wp-content/uploads/static/ap11ann/ap11events.html
- https://ssd.jpl.nasa.gov/horizons/

## Orbital simulations

Binary Stars uses circular two-body initial conditions around the shared center
of mass. Relative mass sliders reseed both positions and velocities while
preserving the 0.65 AU separation. Figure Eight enables the Chenciner–Montgomery
three-equal-mass initial conditions already present in the application, with a
smaller timestep and enough trail history to show the complete pattern.

- https://arxiv.org/abs/math/0011268

Run `node scripts/test-presets.mjs` for mission frame/endpoint/drawing checks,
encounter geometry, binary conservation and mass ratios, and figure-eight
periodicity. Existing Voyager, Galileo, and panning checks remain in their
original scripts.
