# Camp Settings — interaction flow

The visual layout follows `settings-layout-blockout.png` and the supplied display, sound and controls examples. The portrait sign is 680 design units wide, approximately 1280 high, and scales as one object to fit the window. It has exactly three tabs. The illustrated frame is a transparent asset; the live game remains behind it.

```mermaid
flowchart TD
    Open[Settings button or controller Start] --> Owner[Record opening keyboard or controller]
    Owner --> Display[Display tab / first control focused]
    Display <-->|LB / RB or tab click| Sound[Sound tab]
    Sound <-->|LB / RB or tab click| Controls[Controls tab]
    Controls <-->|Tabs wrap| Display
    Display --> Navigate[Up / Down: move focus through visible controls]
    Sound --> Navigate
    Controls --> Navigate
    Navigate --> Kind{Focused control}
    Kind -->|Toggle| Toggle[A / Space / click toggles; Left off, Right on]
    Kind -->|Selector| Select[Left / Right or arrow click cycles value]
    Kind -->|Slider| Slider[Left / Right or arrow click steps value; drag for precise value]
    Kind -->|Music picker| Music[A / click opens track list; preview or choose]
    Kind -->|Button bindings| Bindings[A / click expands editable bindings]
    Toggle --> Apply[Apply to game and persist immediately]
    Select --> Apply
    Slider --> Apply
    Music --> Apply
    Bindings --> Apply
    Apply --> Navigate
    Navigate -->|B / Escape| Back{Music picker open?}
    Back -->|Yes| PickerClose[Close picker and return focus]
    PickerClose --> Navigate
    Back -->|No| Close[Close settings and restore underlying menu]
    Navigate -->|Done / fresh Start| Close
    Owner --> Other[Other controller input is consumed]
    Close --> Release[Consume held input until release]
```

| Surface | Live behavior |
| --- | --- |
| Display | Fullscreen, cel shading, cast shadows, interface scale, board size and event message duration. |
| Sound | Sound enable, music/master/SFX/UI/ambient volume, track selection and preview, night mix, test sound. |
| Controls | Default/alternate/custom bindings, prompt family, analog response curve, radial aim dead zone, X/Y aim inversion, controller attack vibration. Advanced binding details retain all existing remapping. |
| Done | Closes settings. Choices have already applied and persisted. |

Arrow buttons remain clickable but do not become extra controller stops. The native selector or slider is the focus target, so one Up/Down press moves to the next setting. Every tab has its own scroll position reset on selection. The Done button remains outside scrolling content.
