# Testing and Validation

This document summarizes the functional testing of the smart diaper insert and the companion web app. Three things were tested: strip longevity, insert placement and fluid absorption, and app pH accuracy. All results are qualitative and were used to drive design revisions.

The final insert tested here has three detection windows: pH, creatinine, and albumin.

## Success criteria

| Test | Criterion |
|------|-----------|
| Longevity | Sealed strip is still readable at 180 minutes, within 1 pH unit of its initial reading |
| Placement | At least 70% strip saturation with even color distribution, for both male and female simulations |
| App accuracy | App-reported pH within 1 unit of the reference value under controlled lighting |

## Materials

- Clinistix Kidney Health Test Kit urine test strips
- pH test strips (0 to 14 range)
- Creatinine powder, 2% milk, deionized water (surrogate urine solution)
- Vinegar and baking soda dilutions (acidic and basic reference solutions)
- Pampers Swaddlers diapers, size 0
- Size 3 football (stand-in for an infant when fitting the diaper)
- 1 mL disposable pipettes, 1.5 mL microcentrifuge tubes
- Plastic sandwich bag, analytical scale, ruler
- Laptop or phone running the current build of the web app

## Surrogate solution

1. Pipette 3 drops of milk into a microcentrifuge tube.
2. Add 0.01 g of creatinine.
3. Fill the rest of the tube with deionized water.
4. Cap and shake until the creatinine dissolves.

## Test 1: Strip longevity

**Why:** In the NICU, a diaper may stay on for around three hours after the insert first contacts urine, so the strip has to hold its color that long.

**Procedure**

1. Saturate one pH pad with 1 mL of surrogate solution and photograph it at t = 0. Leave it flat and uncovered.
2. Prepare a second strip the same way and seal it in a sandwich bag with as little air as possible.
3. Photograph both strips at 15, 30, 60, 120, and 180 minutes and compare each to the reference card.

**Results**

| Trial | Strip condition | 30 min | 60 min | 120 min | 180 min | Result |
|-------|-----------------|--------|--------|---------|---------|--------|
| 1 | Uncovered, open air | No | No | No | No | Fail |
| 2 | Sealed, plastic enclosure | Yes | Yes | Yes | Yes | Pass |

Columns show whether the color was retained at each time point.

**Takeaway:** Uncovered strips lost their color within minutes as they dried. Sealed strips held their color for the full 180 minutes. The sealed plastic enclosure of the insert is functionally required, not just structural.

## Test 2: Placement and fluid absorption

**Why:** The location of urine in the diaper differs between male and female infants, so the insert has to capture enough fluid in both cases.

**Procedure**

1. Slide the insert into a fresh diaper, starting 2 cm from the front waistband and moving 2 cm deeper on each trial.
2. Fit the diaper onto the football in the orientation it would sit on an infant.
3. Pipette 1 mL of surrogate solution onto the diaper: front-upper region for the male simulation, mid-crotch region for the female simulation.
4. Press lightly above the insert with the back of the hand for about 5 seconds to simulate the infant's weight.
5. After about 5 minutes, pull the insert out by its string.
6. Estimate the percent saturation of each strip and note how even the color is.

**Results**

- Inserts placed toward the front of the diaper gave uneven or insufficient saturation in the female simulation.
- The most consistent results (over 70% saturation with even color) came when the insert extended from the front of the diaper down through the crotch region.
- No single fixed position worked reliably for both anatomies.
- Removing the insert by hand was difficult and required touching soiled material.
- Strips shifted slightly inside the insert when pressure was applied.

## Test 3: App pH accuracy

**Why:** The app has to read strip colors accurately enough to be useful at the bedside.

**Procedure**

1. Prepare each reference solution in a labeled tube and record its pH.
2. Dip a fresh pH strip for about 2 seconds, tap off the excess, and lay it flat on a gray background.
3. Open the app's scan screen, align the strip with the on-screen guide, and capture.
4. Record the app-reported pH and compare it to the strip's packaging chart.

**Results (after software revisions)**

| pH from strip key | pH from app |
|-------------------|-------------|
| 6 | 6 |
| 7 | 7 |
| 5 | 6 |
| 6 | 7 |
| 3 | 3 |

All five readings were within 1 pH unit of the reference, and three of five matched exactly.

**Before revisions:** Readings had a consistent positive bias. A strip dipped in a pH 3 solution was reported as pH 6.

**Known limitation:** Results were collected under controlled indoor lighting. Readings were less consistent under variable lighting, so lighting normalization is the main software improvement still needed.

## Design revisions that came out of testing

**Insert**

- Added a pull string for clean, contact-free removal.
- Added two markings on the string showing insertion depth for male and female infants.
- Lengthened the insert so it covers the area from the front of the diaper through the crotch.
- Enlarged the window openings so the strips absorb more fluid.
- Fixed the strips in place with four melted plastic points so they stay aligned with the openings.

**Software**

- Removed the automatic white-balance correction, which was shifting pad colors and inflating pH readings.
- Replaced area-average sampling with fixed sampling points, and adjusted their positions so they land on the pads and not the background.
- Recalibrated the reference colors against the strip's reference card, especially for higher pH values.

## Source

Summarized from Chapter 4 and Appendix C of the team's final design report, *Smart Diaper: Diagnostics for Premature Babies* (UVA School of Engineering and Applied Science, 2026).
