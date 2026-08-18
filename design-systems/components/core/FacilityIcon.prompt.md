Glyph for the four public-facility types, with the emergency colour rule built in.

```jsx
<FacilityIcon type="aed" size={24} />
```

Types: aed → heart-pulse, toilet → toilet, rest → armchair, shelter → shield. AED and 대피소 come out `--pin-emergency`; pass `emphasis={false}` to neutralise. Change a glyph in FACILITY_ICONS, not at the call site.
