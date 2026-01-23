import type { SearchResult } from '../types';

// Helper function to convert date and time to ISO 8601 format
// date: YYYY-MM-DD format
// time: HH:MM format (24-hour)
// Returns ISO 8601 datetime string with timezone offset
const formatDateTimeISO = (date: string, time: string): string => {
  if (!date || !time || time === 'Any time') {
    return '';
  }
  
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create date object in local timezone
  const dateObj = new Date(year, month - 1, day, hours, minutes);
  
  // Get timezone offset in minutes
  const offsetMinutes = dateObj.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
  
  // Format as ISO 8601
  const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00${offsetString}`;
  
  return isoString;
};

// Generate Organization schema for City of Toronto
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'City of Toronto Parks, Forestry & Recreation',
    url: 'https://www.toronto.ca',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Recreation Services',
      areaServed: 'CA-ON',
      availableLanguage: 'en'
    },
    areaServed: {
      '@type': 'City',
      name: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA'
    }
  };
};

// Generate WebSite schema with search functionality
export const generateWebSiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Toronto Drop-in Recreation Finder',
    url: 'https://recfinderto.ca',
    description: 'Find drop-in recreation programs and activities across Toronto',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://recfinderto.ca/?program={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
};

// Generate Event schema for a single program/result
export const generateEventSchema = (
  result: SearchResult,
  locationCoords?: { lat: number; lng: number }
) => {
  const startDateTime = formatDateTimeISO(result.date, result.startTime);
  const endDateTime = formatDateTimeISO(result.date, result.endTime);
  
  if (!startDateTime || !endDateTime) {
    return null; // Skip if we can't format the datetime
  }
  
  const locationSchema: any = {
    '@type': 'Place',
    name: result.location
  };
  
  // Add address if available (from result.locationAddress)
  if (result.locationAddress) {
    locationSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: result.locationAddress,
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA'
    };
  }
  
  // Add coordinates if available
  if (locationCoords) {
    locationSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: locationCoords.lat,
      longitude: locationCoords.lng
    };
  }
  
  // Build description from available data
  const descriptionParts: string[] = [];
  descriptionParts.push(`Drop-in program: ${result.courseTitle}`);
  if (result.location) {
    descriptionParts.push(`at ${result.location}`);
  }
  if (result.category || result.subcategory) {
    const categoryInfo = [result.category, result.subcategory].filter(Boolean).join(' - ');
    if (categoryInfo) {
      descriptionParts.push(`(${categoryInfo})`);
    }
  }
  if (result.ageRange) {
    descriptionParts.push(`for ${result.ageRange}`);
  }
  const description = descriptionParts.join(' ');

  const eventSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: result.courseTitle,
    description: description,
    startDate: startDateTime,
    endDate: endDateTime,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: locationSchema,
    organizer: {
      '@type': 'Organization',
      name: 'City of Toronto Parks, Forestry & Recreation',
      url: 'https://www.toronto.ca'
    }
    // Removed: image (no relevant event images available)
    // Removed: performer (not applicable for drop-in recreation programs)
    // Removed: offers (pricing varies and not available in data)
  };
  
  // Add audience/age range if available
  if (result['Age Min'] || result['Age Max']) {
    const ageMin = result['Age Min'] ? parseInt(result['Age Min']) : undefined;
    const ageMax = result['Age Max'] ? parseInt(result['Age Max']) : undefined;
    
    if (ageMin !== undefined || ageMax !== undefined) {
      eventSchema.audience = {
        '@type': 'Audience',
        audienceType: result.ageRange || 'General',
        ...(ageMin !== undefined && { suggestedMinAge: ageMin }),
        ...(ageMax !== undefined && { suggestedMaxAge: ageMax })
      };
    }
  }
  
  return eventSchema;
};

// Generate LocalBusiness schema for a recreation facility
export const generateLocalBusinessSchema = (
  locationName: string,
  address?: string,
  coords?: { lat: number; lng: number },
  url?: string
) => {
  const businessSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: locationName,
    description: 'Recreation facility offering drop-in programs',
    parentOrganization: {
      '@type': 'Organization',
      name: 'City of Toronto Parks, Forestry & Recreation'
    }
  };
  
  // Add address if available
  if (address) {
    businessSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA'
    };
  }
  
  // Add coordinates if available
  if (coords) {
    businessSchema.geo = {
      '@type': 'GeoCoordinates',
      latitude: coords.lat,
      longitude: coords.lng
    };
  }
  
  // Add URL if available
  if (url) {
    businessSchema.url = url;
  }
  
  return businessSchema;
};
