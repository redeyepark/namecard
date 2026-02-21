# SPEC-UI-001 Acceptance Criteria

| Field     | Value                              |
| --------- | ---------------------------------- |
| SPEC ID   | SPEC-UI-001                        |
| Title     | Namecard Editor Web Application    |
| Status    | Planned                            |
| Priority  | High                               |
| Format    | Given-When-Then (Gherkin)          |

---

## AC-001: Front Card Text Editing

**Feature: Front card display name real-time editing**

```gherkin
Scenario: Display name real-time update on front card
  Given the user has accessed the editor page
  And the front card editing mode is active
  When the user types "WONDER.CHOI" into the display name field
  Then the front card preview name text updates to "WONDER.CHOI" in real-time
  And the preview reflects each keystroke without page reload
```

**Verification Method:**
- Unit test: Zustand store state change verification on input event
- Integration test: Input field -> Preview component rendering sync verification
- Visual test: Display name text rendering position and style confirmation

---

## AC-002: Back Card Text Editing

**Feature: Back card information fields real-time editing**

```gherkin
Scenario: Back card full name input
  Given the user has selected back card editing mode
  When the user enters "Choi Wonder" in the full name field
  Then the back card preview displays "Choi Wonder" in the name area in real-time

Scenario: Back card job title input
  Given the user has selected back card editing mode
  When the user enters "Frontend Developer" in the job title field
  Then the back card preview displays "Frontend Developer" in the title area in real-time

Scenario: Back card hashtag input
  Given the user has selected back card editing mode
  When the user enters "#React #TypeScript #NextJS" in the hashtag field
  Then the back card preview displays the hashtags in the designated area in real-time
```

**Verification Method:**
- Unit test: Each input field state binding and store update verification
- Integration test: All back card fields simultaneous editing and preview sync confirmation
- Visual test: Text layout, line-height, font-size rendering confirmation

---

## AC-003: Image Upload

**Feature: Front card avatar image upload**

```gherkin
Scenario: Upload valid PNG image
  Given the user is in front card editing mode
  When the user uploads a PNG image file of 3MB size
  Then the avatar area on the front card preview displays the uploaded image
  And a success indicator is shown

Scenario: Upload valid JPG image
  Given the user is in front card editing mode
  When the user uploads a JPG image file of 2MB size
  Then the avatar area on the front card preview displays the uploaded image
  And a success indicator is shown
```

**Verification Method:**
- Unit test: File input change event handler and FileReader processing verification
- Integration test: Image upload -> preview area image rendering E2E verification
- Performance test: Image upload to preview display latency measurement (target: under 500ms)

---

## AC-004: Image Size Limit

**Feature: Upload rejection for images exceeding 5MB**

```gherkin
Scenario: Reject oversized image upload
  Given the user is attempting an image upload
  When the user uploads an image file exceeding 5MB
  Then an error message "Image size must be 5MB or less" is displayed
  And the image is not uploaded
  And the existing avatar image (if any) is preserved

Scenario: Accept image at exactly 5MB
  Given the user is attempting an image upload
  When the user uploads an image file of exactly 5MB
  Then the image is successfully uploaded
  And the avatar area displays the uploaded image
```

**Verification Method:**
- Unit test: File size validation logic unit test (boundary value: 5MB, 5MB+1byte)
- Integration test: Oversized file selection -> error message display -> existing state preservation verification
- UX test: Error message visibility, readability, and auto-dismiss timing confirmation

---

## AC-005: Background Color Change

**Feature: Card background color change via color picker**

```gherkin
Scenario: Change front card background color
  Given the user is in front card editing mode
  When the user selects color "#3B82F6" from the color picker
  Then the front card preview background color immediately changes to "#3B82F6"

Scenario: Change back card background color
  Given the user is in back card editing mode
  When the user selects color "#10B981" from the color picker
  Then the back card preview background color immediately changes to "#10B981"

Scenario: Real-time color change during picker drag
  Given the user is interacting with the color picker (react-colorful)
  When the user drags the color handle continuously
  Then the card background color updates in real-time following the handle movement
```

**Verification Method:**
- Unit test: react-colorful onChange callback -> Zustand store color state update verification
- Integration test: Color picker interaction -> preview component background style application confirmation
- Visual test: Various color values rendering accuracy confirmation

---

## AC-006: Front/Back Card Toggle

**Feature: Card face switching between front and back**

```gherkin
Scenario: Switch from front to back card
  Given the user is viewing the front card
  When the user clicks the back card toggle button
  Then the back card preview is displayed
  And the back card editing panel is shown
  And the front card editing panel is hidden

Scenario: Switch from back to front card
  Given the user is viewing the back card
  When the user clicks the front card toggle button
  Then the front card preview is displayed
  And the front card editing panel is shown
  And the back card editing panel is hidden

Scenario: Preserve data across toggle
  Given the user has entered data on the front card
  When the user switches to back card and then returns to front card
  Then all previously entered front card data is preserved
```

**Verification Method:**
- Unit test: Toggle state management and conditional rendering logic verification
- Integration test: Toggle click -> panel/preview switching -> data persistence E2E verification
- A11y test: Toggle button keyboard accessibility and ARIA state confirmation

---

## AC-007: PNG Image Export

**Feature: Export namecard as PNG image files**

```gherkin
Scenario: Export front and back cards as PNG
  Given the user has completed entering all namecard content
  When the user clicks the export button
  Then the front card is downloaded as a PNG file
  And the back card is downloaded as a PNG file
  And each file name contains identifiable information (e.g., namecard-front.png, namecard-back.png)

Scenario: Export with custom content
  Given the user has entered display name "WONDER.CHOI" and background color "#3B82F6"
  When the user clicks the export button
  Then the exported PNG accurately reflects the entered content and colors
```

**Verification Method:**
- Unit test: html-to-image library call parameter and return value verification
- Integration test: Export button click -> file download trigger -> file content validation
- Visual test: Exported PNG vs screen preview pixel-level comparison
- Performance test: Export completion time measurement (target: under 3 seconds)

---

## AC-008: Auto-Save Data

**Feature: Automatic data persistence via localStorage**

```gherkin
Scenario: Restore data after page refresh
  Given the user has entered namecard data (name, title, colors, etc.)
  When the user refreshes the page
  Then all previously entered data is restored
  And the preview displays the restored data correctly

Scenario: Persist data across browser sessions
  Given the user has entered namecard data
  When the user closes and reopens the browser
  Then all previously entered data is restored from localStorage

Scenario: Auto-save on data change
  Given the user is editing namecard data
  When any field value changes
  Then the data is automatically saved to localStorage
  And no manual save action is required
```

**Verification Method:**
- Unit test: Zustand persist middleware localStorage read/write verification
- Integration test: Data entry -> page reload -> data restoration E2E verification
- Edge case test: localStorage disabled environment graceful degradation confirmation

---

## AC-009: Responsive Layout

**Feature: Responsive display across various viewport sizes**

```gherkin
Scenario: Mobile viewport (320px)
  Given the user accesses from a device with 320px viewport width
  When the editor page loads
  Then the editor and preview are displayed in a single-column stacked layout
  And all interactive elements are usable

Scenario: Tablet viewport (768px)
  Given the user accesses from a device with 768px viewport width
  When the editor page loads
  Then the editor and preview are displayed appropriately
  And touch targets meet minimum 44px size

Scenario: Desktop viewport (1920px)
  Given the user accesses from a device with 1920px viewport width
  When the editor page loads
  Then the editor panel and preview panel are displayed side by side
  And content does not stretch excessively

Scenario: Viewport resize
  Given the user is using the editor
  When the browser window is resized from 1920px to 320px
  Then the layout transitions smoothly without content breakage
```

**Verification Method:**
- Visual test: Screenshot comparison at 320px, 768px, 1024px, 1920px breakpoints
- Integration test: Viewport resize -> layout reflow -> interactive element usability confirmation
- A11y test: Touch target size (minimum 44px) compliance at mobile breakpoints

---

## AC-010: Social Media Link Editing

**Feature: Back card social media link management**

```gherkin
Scenario: Add social media links
  Given the user is in back card editing mode
  When the user adds social media links:
    | platform  | value                              |
    | facebook  | https://facebook.com/wonder        |
    | instagram | @wonder.choi                       |
    | linkedin  | https://linkedin.com/in/wonder     |
    | email     | wonder@example.com                 |
  Then the back card preview footer displays the link list with corresponding icons

Scenario: Edit existing social media link
  Given the user has previously added an Instagram link
  When the user modifies the Instagram value to "@new.wonder"
  Then the back card preview updates the Instagram link in real-time

Scenario: Remove social media link
  Given the user has added multiple social media links
  When the user clears the Facebook link field
  Then the Facebook entry is removed from the back card preview
  And the remaining links are still displayed
```

**Verification Method:**
- Unit test: Social link array state management (add, update, remove) verification
- Integration test: Link input -> preview icon and text rendering sync confirmation
- Validation test: URL format and email format validation logic confirmation

---

## Edge Cases

### EC-001: Export with Empty Text Fields

```gherkin
Scenario: Export with all fields empty
  Given the user has not entered any text in any field
  When the user clicks the export button
  Then the export completes successfully
  And the exported PNG shows the default card layout without text
  And no error occurs
```

### EC-002: Very Long Text Input

```gherkin
Scenario: Input text exceeding display area
  Given the user is editing the display name field
  When the user enters a string longer than 50 characters
  Then the text is truncated or wrapped within the card boundary
  And no horizontal overflow occurs in the preview
  And the full text is preserved in the input field
```

### EC-003: Unsupported Image Format Upload

```gherkin
Scenario: Upload GIF image
  Given the user is attempting an image upload
  When the user uploads a GIF format file
  Then an error message "Only PNG and JPG formats are supported" is displayed
  And the file is not processed

Scenario: Upload BMP image
  Given the user is attempting an image upload
  When the user uploads a BMP format file
  Then an error message "Only PNG and JPG formats are supported" is displayed
  And the file is not processed
```

### EC-004: localStorage Disabled

```gherkin
Scenario: Browser with localStorage disabled
  Given the browser has localStorage disabled
  When the user accesses the editor page
  Then the editor functions normally without auto-save
  And no error is displayed to the user
  And a subtle notification indicates that data will not persist
```

---

## Performance Criteria

| Metric                                  | Target     | Measurement Method                         |
| --------------------------------------- | ---------- | ------------------------------------------ |
| Image upload to preview display         | < 500ms    | Performance.measure() API                  |
| Text edit to preview update             | < 100ms    | React Profiler rendering time              |
| PNG export completion                   | < 3 sec    | Export function execution time measurement |
| Initial page load (LCP)                 | < 2.5 sec  | Lighthouse LCP metric                      |
| Color picker interaction responsiveness | < 16ms     | requestAnimationFrame frame time           |
| localStorage save operation             | < 50ms     | Storage write operation timing             |

---

## Quality Gate Criteria

### Definition of Done

- [ ] All AC-001 through AC-010 scenarios pass
- [ ] All edge case scenarios (EC-001 through EC-004) are handled
- [ ] Performance criteria meet target values
- [ ] Responsive layout verified at 320px, 768px, 1024px, 1920px
- [ ] Keyboard navigation works for all interactive elements
- [ ] No TypeScript type errors (strict mode)
- [ ] No ESLint warnings
- [ ] Cross-browser testing: Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Image export output matches preview at pixel level

### Test Coverage Requirements

| Area                | Target Coverage | Test Type                      |
| ------------------- | --------------- | ------------------------------ |
| Zustand store logic | 90%+            | Unit test (Vitest)             |
| React components    | 85%+            | Component test (RTL)           |
| Image upload flow   | 85%+            | Integration test               |
| Export functionality | 80%+            | Integration test               |
| Responsive layout   | N/A             | Visual regression (Playwright) |
| E2E user flows      | N/A             | E2E test (Playwright)          |

---

## Traceability

| Acceptance Criteria | SPEC Requirement       | Test Scenario                   |
| ------------------- | ---------------------- | ------------------------------- |
| AC-001              | REQ-FRONT-TEXT         | Front card text real-time edit  |
| AC-002              | REQ-BACK-TEXT          | Back card text real-time edit   |
| AC-003              | REQ-IMAGE-UPLOAD       | Image upload and display        |
| AC-004              | REQ-IMAGE-VALIDATION   | Image size limit enforcement    |
| AC-005              | REQ-COLOR-PICKER       | Background color change         |
| AC-006              | REQ-CARD-TOGGLE        | Front/back card switching       |
| AC-007              | REQ-EXPORT-PNG         | PNG image export                |
| AC-008              | REQ-AUTO-SAVE          | localStorage auto-save          |
| AC-009              | REQ-RESPONSIVE         | Responsive layout               |
| AC-010              | REQ-SOCIAL-LINKS       | Social media link editing       |
| EC-001              | REQ-EXPORT-PNG         | Empty field export handling     |
| EC-002              | REQ-FRONT-TEXT         | Long text overflow handling     |
| EC-003              | REQ-IMAGE-VALIDATION   | Unsupported format rejection    |
| EC-004              | REQ-AUTO-SAVE          | localStorage disabled fallback  |
