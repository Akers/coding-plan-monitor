## 1. Adapter Behavior

- [x] 1.1 Update `src/providers/minimax.ts` so `addPlanMetrics` always appends a weekly quota metric for each recognized MiniMax text or image plan.
- [x] 1.2 Ensure weekly quota metrics default missing `current_weekly_usage_count` and `current_weekly_total_count` to 0, preserving percentage 0 when total is 0.
- [x] 1.3 Keep existing text/image model classification and MiniMax API request behavior unchanged.

## 2. Tests

- [x] 2.1 Update the MiniMax successful API test to assert the four displayed dimensions: text 5h, text weekly, image 5h, image weekly.
- [x] 2.2 Update the real MiniMax response test so weekly metrics are expected even when weekly totals are 0.
- [x] 2.3 Replace the existing “skip weekly metric when weekly total is zero” expectation with assertions that the zero-total weekly metric is generated with 0 values and 0 percentage.
- [x] 2.4 Add a MiniMax test covering missing weekly fields, asserting the weekly metric still exists with default 0 values.

## 3. Verification

- [x] 3.1 Run the MiniMax provider test file with Vitest and fix any failures.
- [x] 3.2 Run the project build/typecheck command to ensure the adapter change does not introduce TypeScript or bundle errors.
- [x] 3.3 Run OpenSpec validation/status checks for `add-minimaxi-weekly-quota-display` and confirm the change is apply-ready.
