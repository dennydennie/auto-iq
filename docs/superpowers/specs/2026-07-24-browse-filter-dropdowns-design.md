# Browse Filter Dropdowns Design

## Goal

Replace the Browse tab's free-form vehicle/city search as the primary filter flow with dependent dropdowns. Buyers choose all desired filters and then explicitly tap Search to load matching listings.

## User experience

- Make is an optional dropdown showing all makes from reference data.
- Model is disabled until a make is selected and shows models for that make.
- Year is disabled until a model is selected and shows years from the current year down to 1990.
- Location is an independent optional dropdown populated from active reference locations, deduplicated by city.
- Existing Body type and Verified filters remain available.
- Search applies the selected make, model, year, location, body type, and Verified values together.
- Clear resets every dropdown, the Verified toggle, and the existing text search value.
- Changing Make clears Model and Year; changing Model clears Year.
- Changing dropdown values does not fetch listings until Search is tapped.

## Architecture and data flow

The Flutter Browse tab owns draft filter state separately from the applied filter state. The Browse screen passes the draft values to the filter controls and emits one applied filter event from Search. The buyer repository sends applied values to the existing catalogue endpoint using its supported make, model, yearMin, yearMax, and city query parameters. A selected year is represented as both yearMin and yearMax so the result matches that exact year.

Make and model options come from the existing authenticated reference-data response. Location options are derived from active viewing locations by unique city. No new database table or endpoint is required.

## Components and responsibilities

- `BuyerHomeScreen`: stores draft/applied filter values, resets dependent selections, and triggers Browse reloads.
- `_BrowseTab`: renders the dropdown controls, Search/Clear actions, and listing results.
- `BuyerRepository.browse`: accepts the applied filter values and serializes them into catalogue query parameters.
- `ListingFilterState` or equivalent focused value object: keeps the filter contract explicit and easy to test.

## Error handling and accessibility

Existing catalogue loading and retry states remain unchanged. Dropdowns use labels and disabled states that communicate dependencies. Search and Clear are keyboard/focus reachable through standard Flutter controls, and empty results continue to offer refresh and filter-reset paths.

## Testing

- Unit test filter serialization: make, model, exact year, and city become the expected catalogue query parameters.
- Widget test dependent dropdown behavior: selecting Make enables Model, selecting Make again clears Model and Year, and changing values alone does not reload listings.
- Widget test Search and Clear actions: Search applies the draft values; Clear restores the unfiltered state.
- Run Dart formatting, analyzer, and the focused Flutter tests, followed by the project-relevant build/check command available in the repository.

## Scope

This change is limited to the buyer Browse filter experience and its existing catalogue query. It does not add price, mileage, fuel, transmission, or new location-management functionality.
