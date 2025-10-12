# Toronto Drop-in Recreation Finder

A web application that allows users to search for drop-in recreation services in Toronto by date, time of day, and location. The app fetches real-time data from the City of Toronto's open data portal.

## Features

- **Program Search**: Filter by program categories, subcategories, and program name (e.g."Swimming and Aquatics", "Leisure Swim", "Leisure Swim: Family")
- **Date Picker**: Select a specific date to find programs running on that day
- **Time Picker**: Choose a time to find programs running at that time
- **Location Filter**: Search by specific recreation facilities
- **Real-time Data**: Fetches daily updates from Toronto's open data API
- **Save and Share Your Search**: Copy and bookmark a URL that will load your favourite filter combinations
- **Responsive Design**: Works on desktop and mobile devices

## Example Usage

To find lane swim programs open tomorrow at 5pm:
1. Select "Lane Swim" from the subcategories dropdown
2. Pick "Tomorrow" from the date picker
3. Select "5:00 PM" from the time picker

## Technical Details

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Data Source**: City of Toronto Open Data API
- **API Endpoint**: `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Data Structure

The application fetches data from two main resources:
- **Locations**: Recreation facility information
- **Drop-in Programs**: Schedule data including program names, age ranges, times, and locations

The data is updated monthly by the City of Toronto.