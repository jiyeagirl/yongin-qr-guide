Sticky top bar for every screen.

```jsx
<AppBar tone="brand" title="용인 실증지원" actions={<IconButton name="notifications" label="알림" />} />
```

tone="brand" for tab-root screens; tone="plain" + back for depth. The title centres when `back` is set.
