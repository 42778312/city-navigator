/**
 * Party Insider API service
 */

export interface EventCategory {
    id: number;
    name: string;
    slug: string;
}

export interface EventVenue {
    id: number;
    venue: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    phone: string;
    website: string;
    coordinates?: [number, number]; // [longitude, latitude]
}

export interface EventOrganizer {
    id: number;
    organizer: string;
    phone: string;
    website: string;
    email: string;
}

export interface PartyEvent {
    id: number;
    global_id: string;
    global_id_lineage: string[];
    author: string;
    status: string;
    date: string;
    date_utc: string;
    modified: string;
    modified_utc: string;
    url: string;
    rest_url: string;
    title: string;
    description: string;
    excerpt: string;
    slug: string;
    image: {
        url: string;
        width: number;
        height: number;
    };
    all_day: boolean;
    start_date: string;
    start_date_details: {
        year: string;
        month: string;
        day: string;
        hour: string;
        minutes: string;
        seconds: string;
    };
    end_date: string;
    end_date_details: {
        year: string;
        month: string;
        day: string;
        hour: string;
        minutes: string;
        seconds: string;
    };
    utc_start_date: string;
    utc_end_date: string;
    timezone: string;
    timezone_abbr: string;
    cost: string;
    cost_details: {
        currency_symbol: string;
        currency_position: string;
        values: string[];
    };
    website: string;
    show_map: boolean;
    show_map_link: boolean;
    hide_from_listings: boolean;
    sticky: boolean;
    featured: boolean;
    categories: EventCategory[];
    venue: EventVenue;
    organizers: EventOrganizer[];
}

interface EventsResponse {
    events: PartyEvent[];
    total: number;
    total_pages: number;
}

const BASE_URL = 'https://www.party-insider.com/wp-json';

/**
 * Fetch events from Party Insider API
 */
export async function fetchEvents(params: {
    page?: number;
    per_page?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
    featured?: boolean;
} = {}): Promise<PartyEvent[]> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.search) queryParams.append('search', params.search);
    if (params.featured) queryParams.append('featured', params.featured.toString());

    const url = `${BASE_URL}/tribe/events/v1/events?${queryParams.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Party API error: ${response.status}`);
        }
        const data: EventsResponse = await response.json();
        return data.events;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}
