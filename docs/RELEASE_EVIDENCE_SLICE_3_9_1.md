# Release Evidence: Slice 3.9.1

## Automated Validation

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | pass |  |
| `npm run lint` | pass |  |
| `npm run test:unit` | pass |  |
| `npm run check:policy` | pass |  |
| `npm run build` | pass | Sandbox build hit Windows spawn EPERM; rerun outside sandbox passed. |

## Manual Validation

| Flow | Result | Notes |
|---|---|---|
| Revise reveal with mouse/touch | pending |  |
| Revise reveal with keyboard | pending |  |
| Review buttons 1-4 | pending |  |
| Keyboard guard inside text input | pending |  |
| Learning state Done count (after refresh) | pending |  |
| 375px mobile viewport | pending |  |
| Light theme | pending |  |
| Dark theme | pending |  |

## Known Limitations

- `todayReviews` counts unique mistakes reviewed today (via `Mistake.lastReviewedAt`), not every review button press.

## Status Recommendation

- `verified locally` (automated validation complete); manual evidence still pending.
